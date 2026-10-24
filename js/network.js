/* ==========================================================
 *  MULTIPLAYER 2 ORANG via PeerJS (WebRTC peer-to-peer)
 *  - Tidak butuh server sendiri; PeerJS cloud hanya dipakai
 *    untuk "perkenalan" awal, lalu data langsung antar-browser.
 *  - Script PeerJS baru dimuat saat mode berdua dipilih
 *    (supaya mode sendiri tetap ringan).
 * ========================================================== */

const PREFIX = 'mkenangan-v1-';
const PEERJS_URL = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

let loading = null;
function loadPeerJS() {
  if (window.Peer) return Promise.resolve();
  return (loading ||= new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = PEERJS_URL;
    s.async = true;
    s.onload = () => res();
    s.onerror = () => {
      loading = null;
      rej(new Error('Gagal memuat modul multiplayer. Cek koneksi internet.'));
    };
    document.head.appendChild(s);
  }));
}

const genCode = () => Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');

function friendly(e) {
  const map = {
    'peer-unavailable': 'Room tidak ditemukan. Cek lagi kodenya ya.',
    network: 'Gagal terhubung ke server. Cek koneksi internet.',
    'server-error': 'Server sedang bermasalah, coba lagi sebentar.',
    'browser-incompatible': 'Browser ini tidak mendukung mode berdua (WebRTC).',
    'socket-error': 'Koneksi terputus. Coba lagi.',
  };
  const err = new Error(map[e?.type] || e?.message || 'Terjadi kesalahan koneksi.');
  err.type = e?.type;
  return err;
}

function openPeer(id) {
  return new Promise((res, rej) => {
    const p = id ? new window.Peer(id, { debug: 0 }) : new window.Peer({ debug: 0 });
    const onOpen = () => { p.off('error', onErr); res(p); };
    const onErr = (e) => { p.off('open', onOpen); p.destroy(); rej(e); };
    p.once('open', onOpen);
    p.once('error', onErr);
  });
}

export class Network {
  constructor() {
    this.peer = null;
    this.conn = null;
    this.code = null;
    this.isHost = false;
    this.handlers = {};
  }

  on(ev, fn) { this.handlers[ev] = fn; return this; }
  emit(ev, d) { this.handlers[ev]?.(d); }
  get active() { return !!this.peer; }
  get connected() { return !!(this.conn && this.conn.open); }

  async host() {
    await loadPeerJS();
    for (let i = 0; i < 4 && !this.peer; i++) {
      const code = genCode();
      try {
        this.peer = await openPeer(PREFIX + code);
        this.code = code;
      } catch (e) {
        if (e.type !== 'unavailable-id') throw friendly(e);
      }
    }
    if (!this.peer) throw new Error('Gagal membuat room, coba lagi.');
    this.isHost = true;
    this.peer.on('connection', (c) => this._incoming(c));
    this._watch();
    return this.code;
  }

  async join(code) {
    await loadPeerJS();
    code = code.trim().toUpperCase();
    try {
      this.peer = await openPeer(null);
    } catch (e) {
      throw friendly(e);
    }
    const conn = this.peer.connect(PREFIX + code, { reliable: true });
    try {
      await new Promise((res, rej) => {
        const timer = setTimeout(() => rej(new Error('Waktu habis. Pastikan kode benar & pasanganmu sudah membuat room.')), 15000);
        conn.once('open', () => { clearTimeout(timer); res(); });
        this.peer.once('error', (e) => { clearTimeout(timer); rej(friendly(e)); });
      });
    } catch (e) {
      this.destroy();
      throw e;
    }
    this.code = code;
    this._watch();
    this._bind(conn);
  }

  _incoming(c) {
    if (this.connected) {
      // Room hanya untuk 2 orang
      c.once('open', () => {
        c.send({ t: 'full' });
        setTimeout(() => c.close(), 300);
      });
      return;
    }
    c.once('open', () => this._bind(c));
  }

  _bind(c) {
    this.conn = c;
    c.on('data', (d) => this.emit('data', d));
    c.on('close', () => {
      if (this.conn === c) {
        this.conn = null;
        this.emit('leave');
      }
    });
    c.on('error', () => {});
    this.emit('join');
  }

  _watch() {
    this.peer.on('disconnected', () => {
      if (this.peer && !this.peer.destroyed) this.peer.reconnect();
    });
    this.peer.on('error', (e) => {
      if (e.type !== 'peer-unavailable') this.emit('error', friendly(e));
    });
  }

  send(d) {
    if (this.connected) this.conn.send(d);
  }

  destroy() {
    this.peer?.destroy();
    this.peer = null;
    this.conn = null;
  }
}

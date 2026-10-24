import * as THREE from 'three';
import { BIRTHDAY, ROOMS } from './data.js';
import { createCharacter } from './character.js';
import { Input } from './input.js';
import { Network } from './network.js';
import { buildWorld } from './world.js';
import { toTexture, heartCanvas } from './textures.js';

/* ==========================================================
 *  DETEKSI PERANGKAT & SETUP RENDERER RINGAN
 * ========================================================== */
const isTouch = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
const lowSpec = isTouch || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

const renderer = new THREE.WebGLRenderer({ antialias: !lowSpec, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, lowSpec ? 1.35 : 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0908);
scene.fog = new THREE.Fog(0x0b0908, 18, 52);

const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.15, 70);
const aniso = Math.min(renderer.capabilities.getMaxAnisotropy(), lowSpec ? 2 : 4);

/* ==========================================================
 *  DOM
 * ========================================================== */
const $ = (id) => document.getElementById(id);
const ui = {
  loading: $('loading'),
  menu: $('menu'),
  nameInput: $('nameInput'),
  codeInput: $('codeInput'),
  panelJoin: $('panelJoin'),
  panelHost: $('panelHost'),
  menuError: $('menuError'),
  startBtn: $('startBtn'),
  hud: $('hud'),
  roomLabel: $('roomLabel'),
  seenCount: $('seenCount'),
  totalCount: $('totalCount'),
  codePill: $('codePill'),
  roomCodeText: $('roomCodeText'),
  peerStatus: $('peerStatus'),
  heartBtn: $('heartBtn'),
  musicBtn: $('musicBtn'),
  fsBtn: $('fsBtn'),
  menuBtn: $('menuBtn'),
  roomBanner: $('roomBanner'),
  bannerYear: $('bannerYear'),
  bannerTitle: $('bannerTitle'),
  bannerSub: $('bannerSub'),
  toast: $('toast'),
  actionBtn: $('actionBtn'),
  actionText: $('actionText'),
  joyBase: $('joyBase'),
  joyKnob: $('joyKnob'),
  memoryModal: $('memoryModal'),
  memClose: $('memClose'),
  memImg: $('memImg'),
  memIndex: $('memIndex'),
  memTitle: $('memTitle'),
  memDate: $('memDate'),
  memDesc: $('memDesc'),
  prevBtn: $('prevBtn'),
  nextBtn: $('nextBtn'),
  memBack: $('memBack'),
  letterModal: $('letterModal'),
  letterClose: $('letterClose'),
  letterMemories: $('letterMemories'),
  slideImgA: $('slideImgA'),
  slideImgB: $('slideImgB'),
  slideYear: $('slideYear'),
  slideTitle: $('slideTitle'),
  slideDate: $('slideDate'),
  slideCounter: $('slideCounter'),
  filmstripTrack: $('filmstripTrack'),
  letterEyebrow: $('letterEyebrow'),
  letterTitle: $('letterTitle'),
  letterBody: $('letterBody'),
  letterBack: $('letterBack'),
};

try {
  await Promise.all([
    document.fonts.load('600 64px "Cormorant Garamond"'),
    document.fonts.load('italic 32px "Cormorant Garamond"'),
  ]);
} catch {}

/* ==========================================================
 *  DUNIA MUSEUM
 * ========================================================== */
const world = buildWorld(scene, {
  rooms: ROOMS,
  birthday: BIRTHDAY,
  aniso,
  lowSpec,
  handlers: {
    openMemory: (i) => openMemoryModal(i),
    openLetter: (kind) => openLetterModal(kind),
    cakeBlown: () => {
      net.send({ t: 'cake' });
      toast('🎉 Selamat Ulang Tahun! Klik kue lagi untuk membaca surat.');
      setTimeout(() => openLetterModal('birthday'), 2200);
    },
  },
});

ui.totalCount.textContent = world.artworks.length;

/* ==========================================================
 *  PEMAIN LOKAL & PASANGAN (REMOTE)
 * ========================================================== */
let myGender = 'cowo';
let myName = BIRTHDAY.fromName;
let player = createCharacter(myGender, myName);
player.root.position.copy(world.spawn);
player.root.rotation.y = Math.PI;
scene.add(player.root);

const playerState = {
  pos: player.root.position,
  yaw: Math.PI,
  speed: 0,
};

function rebuildLocalPlayer(gender, name) {
  const pos = player.root.position.clone();
  const rot = player.root.rotation.y;
  scene.remove(player.root);
  myGender = gender;
  myName = name;
  player = createCharacter(gender, name);
  player.root.position.copy(pos);
  player.root.rotation.y = rot;
  playerState.pos = player.root.position;
  scene.add(player.root);
}

// Pasangan (muncul saat terhubung)
let partner = null;
const partnerTarget = { x: 0, z: -3, yaw: Math.PI, speed: 0, gender: 'cewe', name: BIRTHDAY.herName };

function ensurePartner(gender, name) {
  if (partner && partner.gender !== gender) {
    scene.remove(partner.root);
    partner = null;
  }
  if (!partner) {
    partner = createCharacter(gender, name);
    partner.root.position.set(partnerTarget.x, 0, partnerTarget.z);
    scene.add(partner.root);
  } else {
    partner.setName(name);
  }
}

function removePartner() {
  if (!partner) return;
  scene.remove(partner.root);
  partner = null;
}

/* ==========================================================
 *  EMOT HATI MELAYANG ❤
 * ========================================================== */
const heartMat = new THREE.SpriteMaterial({ map: toTexture(heartCanvas(64)), transparent: true, depthWrite: false });
const floatingHearts = [];

function spawnHeartAbove(group) {
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Sprite(heartMat);
    s.position.set(
      group.position.x + (Math.random() - 0.5) * 0.5,
      1.85 + i * 0.15,
      group.position.z + (Math.random() - 0.5) * 0.5
    );
    s.scale.setScalar(0.28 + Math.random() * 0.12);
    scene.add(s);
    floatingHearts.push({ sprite: s, life: 0, vx: (Math.random() - 0.5) * 0.4 });
  }
}

function sendHeart() {
  spawnHeartAbove(player.root);
  net.send({ t: 'heart' });
}

/* ==========================================================
 *  INPUT & KAMERA ORANG KETIGA (THIRD-PERSON)
 * ========================================================== */
const input = new Input(renderer.domElement, ui.joyBase, ui.joyKnob);
let camYaw = 0;        // 0 = kamera di +Z melihat ke -Z
let camPitch = 0.25;
let camDist = isTouch ? 3.5 : 3.2;
const camTarget = new THREE.Vector3();
const camDesired = new THREE.Vector3();
const camRay = new THREE.Raycaster();

let activeInteractable = null;

input.onAction = (code) => {
  if (!playing) return;
  if (code === 'KeyE' || code === 'Space') activeInteractable?.action();
  if (code === 'KeyH') sendHeart();
  if (code === 'KeyM') toggleMusic();
  if (code === 'Escape') {
    if (!ui.memoryModal.classList.contains('hidden')) closeMemoryModal();
    else if (!ui.letterModal.classList.contains('hidden')) closeLetterModal();
    else openPauseMenu();
  }
  if (!ui.memoryModal.classList.contains('hidden')) {
    if (code === 'ArrowRight') showMemory(currentMem + 1);
    if (code === 'ArrowLeft') showMemory(currentMem - 1);
  }
};

const PLAYER_R = 0.34;
function blocked(x, z) {
  for (const c of world.colliders) {
    if (x > c.minX - PLAYER_R && x < c.maxX + PLAYER_R && z > c.minZ - PLAYER_R && z < c.maxZ + PLAYER_R) return true;
  }
  return false;
}

function angleDiff(a, b) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function updatePlayerAndCamera(dt) {
  const look = input.consumeLook();
  camYaw -= look.dx * 0.0055;
  camPitch = THREE.MathUtils.clamp(camPitch + look.dy * 0.0045, -0.05, 0.85);
  camDist = THREE.MathUtils.clamp(camDist + look.zoom * 0.35, 2.0, 5.0);

  const mv = input.read();
  const baseSpeed = mv.run ? 5.6 : 3.4;
  const speed = mv.mag * baseSpeed;
  playerState.speed = speed;

  if (mv.mag > 0.01) {
    // Arah gerak relatif terhadap arah pandang kamera
    const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw);
    const rx = Math.cos(camYaw), rz = -Math.sin(camYaw);
    const vx = rx * mv.x + fx * mv.y;
    const vz = rz * mv.x + fz * mv.y;

    const prevX = playerState.pos.x, prevZ = playerState.pos.z;
    let nx = THREE.MathUtils.clamp(prevX + vx * speed * dt, world.bounds.minX, world.bounds.maxX);
    let nz = THREE.MathUtils.clamp(prevZ + vz * speed * dt, world.bounds.minZ, world.bounds.maxZ);

    if (blocked(nx, nz)) {
      if (!blocked(prevX, nz)) nx = prevX;
      else if (!blocked(nx, prevZ)) nz = prevZ;
      else { nx = prevX; nz = prevZ; }
    }
    playerState.pos.x = nx;
    playerState.pos.z = nz;

    const targetYaw = Math.atan2(vx, vz);
    playerState.yaw += angleDiff(playerState.yaw, targetYaw) * (1 - Math.exp(-12 * dt));
    player.root.rotation.y = playerState.yaw;
  }

  player.update(dt, speed);

  // Target kamera di bahu/kepala karakter
  camTarget.set(playerState.pos.x, 1.32, playerState.pos.z);
  const horiz = Math.cos(camPitch) * camDist;
  camDesired.set(
    camTarget.x + Math.sin(camYaw) * horiz,
    camTarget.y + Math.sin(camPitch) * camDist,
    camTarget.z + Math.cos(camYaw) * horiz
  );

  // Cegah kamera menembus dinding
  const dir = camDesired.clone().sub(camTarget);
  const len = dir.length();
  dir.normalize();
  camRay.set(camTarget, dir);
  camRay.far = len;
  const hit = camRay.intersectObjects(world.walls, false)[0];
  const finalDist = hit ? Math.max(0.6, hit.distance - 0.22) : len;
  camera.position.copy(camTarget).addScaledVector(dir, finalDist);
  camera.lookAt(camTarget);
}

/* ==========================================================
 *  INTERAKSI DEKAT & INDIKATOR RUANGAN
 * ========================================================== */
let currentSegIndex = -1;
let bannerTimer = null;

function updateProximity() {
  const px = playerState.pos.x, pz = playerState.pos.z;

  // Cek ruangan saat ini
  const seg = world.segmentAt(pz);
  if (seg.index !== currentSegIndex) {
    currentSegIndex = seg.index;
    ui.roomLabel.textContent = seg.label;
    showRoomBanner(seg);
  }

  // Tandai kenangan sudah dilihat saat pemain berjalan mendekati bingkai di dinding
  for (const art of world.artworks) {
    if (!seen.has(art.index) && Math.abs(pz - art.z) < 2.2 && Math.abs(px - art.x) < 4.5) {
      seen.add(art.index);
      ui.seenCount.textContent = seen.size;
    }
  }

  // Cari objek interaktif terdekat (buku tamu & kue ulang tahun)
  let best = null, bestScore = Infinity;
  for (const it of world.interactables) {
    const sc = it.test(px, pz);
    if (sc < bestScore) { bestScore = sc; best = it; }
  }
  activeInteractable = best;
  if (best && input.enabled) {
    ui.actionText.textContent = best.label();
    ui.actionBtn.classList.remove('hidden');
  } else {
    ui.actionBtn.classList.add('hidden');
  }
}

function showRoomBanner(seg) {
  if (!playing) return;
  ui.bannerYear.textContent = seg.year ? `Ruang ${seg.year}` : 'Museum Kenangan';
  ui.bannerTitle.textContent = seg.title;
  ui.bannerSub.textContent = seg.subtitle || '';
  ui.roomBanner.classList.remove('hidden');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => ui.roomBanner.classList.add('hidden'), 3200);
}

let toastTimer = null;
function toast(msg) {
  ui.toast.textContent = msg;
  ui.toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ui.toast.classList.add('hidden'), 3600);
}

ui.actionBtn.addEventListener('click', () => activeInteractable?.action());
ui.heartBtn.addEventListener('click', () => sendHeart());

/* ==========================================================
 *  MODAL KENANGAN & MODAL SURAT
 * ========================================================== */
const seen = new Set();
let currentMem = 0;
let openedMem = 0;

function showMemory(idx) {
  const n = world.artworks.length;
  currentMem = ((idx % n) + n) % n;
  const art = world.artworks[currentMem];
  art.ensureLoaded();
  const { mem } = art;
  const fallback = (art.fallbackURL ||= art.canvas.toDataURL('image/jpeg', 0.88));
  ui.memImg.src = art.loadedURL || mem.image || fallback;
  ui.memImg.onerror = () => { ui.memImg.src = fallback; };
  ui.memImg.alt = '';
  seen.add(currentMem);
  ui.seenCount.textContent = seen.size;
}

function openMemoryModal(idx) {
  openedMem = idx;
  showMemory(idx);
  input.enabled = false;
  input.reset();
  ui.memoryModal.classList.remove('hidden');
  ui.actionBtn.classList.add('hidden');
}

function closeMemoryModal() {
  ui.memoryModal.classList.add('hidden');
  if (currentMem !== openedMem) {
    const art = world.artworks[currentMem];
    playerState.pos.set(art.front.x, 0, art.front.z);
    playerState.yaw = Math.atan2(-art.normal.x, -art.normal.z);
    player.root.rotation.y = playerState.yaw;
    camYaw = Math.atan2(art.normal.x, art.normal.z);
  }
  input.enabled = true;
}

ui.memClose.addEventListener('click', closeMemoryModal);
ui.memBack.addEventListener('click', closeMemoryModal);
ui.prevBtn.addEventListener('click', () => showMemory(currentMem - 1));
ui.nextBtn.addEventListener('click', () => showMemory(currentMem + 1));

/* ==========================================================
 *  SLIDESHOW & FILMSTRIP KENANGAN 2024–2026 DI ATAS UCAPAN ULANG TAHUN
 * ========================================================== */
let slideTimer = null;
let slideIdx = 0;
let activeSlideLayer = 0;
let filmstripBuilt = false;

function getArtworkImageSrc(art) {
  art.ensureLoaded();
  return art.loadedURL || (art.fallbackURL ||= art.canvas.toDataURL('image/jpeg', 0.88));
}

function buildFilmstripOnce() {
  if (filmstripBuilt) return;
  filmstripBuilt = true;
  ui.filmstripTrack.innerHTML = '';
  // Duplikasi 2x agar marquee CSS mengalir tanpa putus
  const list = [...world.artworks, ...world.artworks];
  list.forEach((art) => {
    const item = document.createElement('div');
    item.className = 'film-thumb';
    item.dataset.idx = art.index;
    const img = document.createElement('img');
    art.ensureLoaded();
    const fallback = (art.fallbackURL ||= art.canvas.toDataURL('image/jpeg', 0.85));
    img.src = art.loadedURL || art.mem.image || fallback;
    img.onerror = () => { img.src = fallback; };
    img.alt = art.mem.title;
    const badge = document.createElement('span');
    badge.textContent = art.seg.year;
    item.append(img, badge);
    item.addEventListener('click', () => {
      showBirthdaySlide(art.index);
      restartSlideTimer();
    });
    ui.filmstripTrack.appendChild(item);
  });
}

function showBirthdaySlide(idx) {
  const n = world.artworks.length;
  if (!n) return;
  slideIdx = ((idx % n) + n) % n;
  const art = world.artworks[slideIdx];
  const fallback = (art.fallbackURL ||= art.canvas.toDataURL('image/jpeg', 0.88));
  art.ensureLoaded();
  const src = art.loadedURL || art.mem.image || fallback;

  const nextImg = activeSlideLayer === 0 ? ui.slideImgB : ui.slideImgA;
  const prevImg = activeSlideLayer === 0 ? ui.slideImgA : ui.slideImgB;
  activeSlideLayer = 1 - activeSlideLayer;

  nextImg.onerror = () => { nextImg.src = fallback; };
  nextImg.src = src;
  nextImg.classList.add('active');
  prevImg.classList.remove('active');
}

function restartSlideTimer() {
  clearInterval(slideTimer);
  slideTimer = setInterval(() => showBirthdaySlide(slideIdx + 1), 2400);
}

function stopSlideTimer() {
  clearInterval(slideTimer);
  slideTimer = null;
}

function openLetterModal(kind) {
  const isBirthday = kind === 'birthday';
  const data = isBirthday ? BIRTHDAY.letter : BIRTHDAY.welcome;
  ui.letterEyebrow.textContent = isBirthday ? BIRTHDAY.date : 'Pesan Pembuka';
  ui.letterTitle.textContent = data.title;
  ui.letterBody.textContent = data.body;

  if (isBirthday) {
    buildFilmstripOnce();
    ui.letterMemories.classList.remove('hidden');
    showBirthdaySlide(0);
    restartSlideTimer();
  } else {
    ui.letterMemories.classList.add('hidden');
    stopSlideTimer();
  }

  input.enabled = false;
  input.reset();
  ui.letterModal.classList.remove('hidden');
  ui.actionBtn.classList.add('hidden');
}

function closeLetterModal() {
  stopSlideTimer();
  ui.letterModal.classList.add('hidden');
  input.enabled = true;
}

ui.letterClose.addEventListener('click', closeLetterModal);
ui.letterBack.addEventListener('click', closeLetterModal);

/* ==========================================================
 *  MUSIK (YouTube https://youtu.be/hDU4GB1PTxc / file lokal) & FULLSCREEN
 * ========================================================== */
let music = null;
let ytPlayer = null;
let ytReady = false;
let wantMusicPlay = false;
let musicOn = true;

if (BIRTHDAY.youtubeId) {
  window.onYouTubeIframeAPIReady = () => {
    ytPlayer = new window.YT.Player('ytPlayer', {
      width: '1',
      height: '1',
      videoId: BIRTHDAY.youtubeId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        loop: 1,
        playlist: BIRTHDAY.youtubeId,
        playsinline: 1,
        rel: 0,
      },
      events: {
        onReady: (e) => {
          ytReady = true;
          e.target.setVolume(45);
          if (wantMusicPlay && musicOn) {
            e.target.unMute();
            e.target.playVideo();
          }
        },
        onStateChange: (e) => {
          if (e.data === window.YT.PlayerState.ENDED && musicOn) {
            ytPlayer.seekTo(0);
            ytPlayer.playVideo();
          }
        },
      },
    });
  };
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  tag.async = true;
  document.head.appendChild(tag);
}

function playMusic() {
  wantMusicPlay = true;
  if (!musicOn) return;
  if (BIRTHDAY.youtubeId) {
    if (ytReady && ytPlayer?.playVideo) {
      try {
        ytPlayer.unMute();
        ytPlayer.playVideo();
      } catch {}
    }
    return;
  }
  if (!BIRTHDAY.music) return;
  if (!music) {
    music = new Audio(BIRTHDAY.music);
    music.loop = true;
    music.volume = 0.35;
    music.addEventListener('error', () => { music = null; musicOn = false; });
  }
  music.play().catch(() => {});
}

function pauseMusic() {
  if (ytReady && ytPlayer?.pauseVideo) {
    try { ytPlayer.pauseVideo(); } catch {}
  }
  music?.pause();
}

function toggleMusic() {
  musicOn = !musicOn;
  ui.musicBtn.style.opacity = musicOn ? '1' : '0.45';
  if (musicOn) playMusic();
  else pauseMusic();
}
ui.musicBtn.addEventListener('click', toggleMusic);

ui.fsBtn.addEventListener('click', async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.();
      await screen.orientation?.lock?.('landscape').catch(() => {});
    } else {
      await document.exitFullscreen?.();
    }
  } catch {}
});

/* ==========================================================
 *  MULTIPLAYER (PeerJS)
 * ========================================================== */
const net = new Network();
let syncTimer = 0;

net.on('join', () => {
  ui.peerStatus.textContent = 'Terhubung ❤';
  ui.peerStatus.classList.add('online');
  net.send({
    t: 'hello',
    gender: myGender,
    name: myName,
    x: playerState.pos.x,
    z: playerState.pos.z,
    yaw: playerState.yaw,
    cake: world.cake.blown,
  });
  toast('💞 Pasanganmu bergabung ke museum!');
});

net.on('leave', () => {
  ui.peerStatus.textContent = 'Terputus';
  ui.peerStatus.classList.remove('online');
  removePartner();
  toast('Koneksi pasangan terputus.');
});

net.on('error', (err) => toast(err.message));

net.on('data', (d) => {
  if (!d || typeof d !== 'object') return;
  if (d.t === 'hello') {
    partnerTarget.gender = d.gender || 'cewe';
    partnerTarget.name = d.name || 'Pasangan';
    partnerTarget.x = d.x ?? 0;
    partnerTarget.z = d.z ?? -3;
    partnerTarget.yaw = d.yaw ?? Math.PI;
    ensurePartner(partnerTarget.gender, partnerTarget.name);
    partner.root.position.set(partnerTarget.x, 0, partnerTarget.z);
    if (d.cake) world.cake.blow?.();
  } else if (d.t === 'move') {
    if (!partner) ensurePartner(d.g || partnerTarget.gender, d.n || partnerTarget.name);
    partnerTarget.x = d.x;
    partnerTarget.z = d.z;
    partnerTarget.yaw = d.y;
    partnerTarget.speed = d.s || 0;
  } else if (d.t === 'heart') {
    if (partner) spawnHeartAbove(partner.root);
  } else if (d.t === 'cake') {
    world.cake.blow?.();
    toast('🎂 Pasanganmu meniup lilin ulang tahun!');
  }
});

ui.codePill.addEventListener('click', () => {
  if (!net.code) return;
  const url = `${location.origin}${location.pathname}?room=${net.code}`;
  navigator.clipboard?.writeText(net.code).catch(() => {});
  toast(`Kode ${net.code} disalin! (Bisa juga bagikan link: ?room=${net.code})`);
});

/* ==========================================================
 *  MENU MULAI / PILIH KARAKTER & MODE
 * ========================================================== */
let selectedGender = 'cowo';
let selectedMode = 'solo';
let playing = false;

const charBtns = document.querySelectorAll('.char-btn');
const tabBtns = document.querySelectorAll('.tab-btn');

function selectGender(g) {
  selectedGender = g;
  charBtns.forEach((b) => b.classList.toggle('active', b.dataset.gender === g));
  if (!ui.nameInput.dataset.touched) {
    ui.nameInput.value = g === 'cewe' ? BIRTHDAY.herName : BIRTHDAY.fromName;
  }
}

function selectMode(m) {
  selectedMode = m;
  tabBtns.forEach((b) => b.classList.toggle('active', b.dataset.mode === m));
  ui.panelJoin.classList.toggle('hidden', m !== 'join');
  ui.panelHost.classList.toggle('hidden', m !== 'host');
  ui.menuError.classList.add('hidden');
}

charBtns.forEach((b) => b.addEventListener('click', () => selectGender(b.dataset.gender)));
tabBtns.forEach((b) => b.addEventListener('click', () => selectMode(b.dataset.mode)));
ui.nameInput.addEventListener('input', () => { ui.nameInput.dataset.touched = '1'; });

// Otomatis isi kode room jika dibuka dari link ?room=XXXXX
const urlRoom = new URLSearchParams(location.search).get('room');
selectGender(urlRoom ? 'cewe' : 'cowo');
if (urlRoom) {
  ui.codeInput.value = urlRoom.slice(0, 5).toUpperCase();
  selectMode('join');
}

function showMenuError(msg) {
  ui.menuError.textContent = msg;
  ui.menuError.classList.remove('hidden');
}

ui.startBtn.addEventListener('click', async () => {
  ui.menuError.classList.add('hidden');
  playMusic();
  const name = (ui.nameInput.value || '').trim() || (selectedGender === 'cewe' ? BIRTHDAY.herName : BIRTHDAY.fromName);
  rebuildLocalPlayer(selectedGender, name);

  if (selectedMode === 'host' && !net.active) {
    ui.startBtn.disabled = true;
    ui.startBtn.textContent = 'Membuat Room…';
    try {
      const code = await net.host();
      ui.roomCodeText.textContent = code;
      ui.codePill.classList.remove('hidden');
      // Geser sedikit supaya saat pasangan muncul tidak tumpang tindih
      playerState.pos.x = -0.55;
    } catch (e) {
      showMenuError(e.message);
      ui.startBtn.disabled = false;
      ui.startBtn.textContent = 'Masuk Museum';
      return;
    }
    ui.startBtn.disabled = false;
  } else if (selectedMode === 'join' && !net.active) {
    const code = ui.codeInput.value.trim().toUpperCase();
    if (code.length < 4) {
      showMenuError('Masukkan kode room 5 huruf dari pasanganmu.');
      return;
    }
    ui.startBtn.disabled = true;
    ui.startBtn.textContent = 'Menghubungkan…';
    try {
      playerState.pos.x = 0.55;
      await net.join(code);
      ui.roomCodeText.textContent = code;
      ui.codePill.classList.remove('hidden');
    } catch (e) {
      showMenuError(e.message);
      ui.startBtn.disabled = false;
      ui.startBtn.textContent = 'Masuk Museum';
      return;
    }
    ui.startBtn.disabled = false;
  } else if (net.connected) {
    net.send({ t: 'hello', gender: myGender, name: myName, x: playerState.pos.x, z: playerState.pos.z, yaw: playerState.yaw, cake: world.cake.blown });
  }

  // Di HP, coba kunci orientasi landscape saat mulai
  if (isTouch) {
    document.documentElement.requestFullscreen?.().catch(() => {});
    screen.orientation?.lock?.('landscape').catch(() => {});
  }

  ui.menu.classList.add('hidden');
  ui.hud.classList.remove('hidden');
  ui.startBtn.textContent = 'Lanjutkan';
  playing = true;
  input.enabled = true;
  playMusic();
  showRoomBanner(world.segmentAt(playerState.pos.z));
});

function openPauseMenu() {
  playing = false;
  input.enabled = false;
  input.reset();
  ui.menu.classList.remove('hidden');
}
ui.menuBtn.addEventListener('click', openPauseMenu);

/* ==========================================================
 *  LOOP UTAMA
 * ========================================================== */
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  if (playing) {
    updatePlayerAndCamera(dt);
    updateProximity();

    // Kirim posisi ke pasangan 15x per detik
    if (net.connected) {
      syncTimer += dt;
      if (syncTimer >= 0.066) {
        syncTimer = 0;
        net.send({
          t: 'move',
          x: +playerState.pos.x.toFixed(2),
          z: +playerState.pos.z.toFixed(2),
          y: +playerState.yaw.toFixed(2),
          s: +playerState.speed.toFixed(2),
        });
      }
    }
  } else {
    // Kamera berputar pelan saat di menu
    player.update(dt, 0);
    camera.position.set(Math.sin(t * 0.25) * 2.2, 1.8, -3 + Math.cos(t * 0.25) * 3.2);
    camera.lookAt(0, 1.2, -3);
  }

  // Interpolasi halus karakter pasangan
  if (partner) {
    const k = 1 - Math.exp(-12 * dt);
    partner.root.position.x += (partnerTarget.x - partner.root.position.x) * k;
    partner.root.position.z += (partnerTarget.z - partner.root.position.z) * k;
    partner.root.rotation.y += angleDiff(partner.root.rotation.y, partnerTarget.yaw) * k;
    partner.update(dt, partnerTarget.speed);
  }

  // Animasi emot hati
  for (let i = floatingHearts.length - 1; i >= 0; i--) {
    const h = floatingHearts[i];
    h.life += dt;
    h.sprite.position.y += dt * 0.9;
    h.sprite.position.x += Math.sin(h.life * 5) * dt * 0.25 + h.vx * dt;
    if (h.life > 1.8) {
      scene.remove(h.sprite);
      floatingHearts.splice(i, 1);
    }
  }

  world.update(dt, t, playerState.pos.z);
  renderer.render(scene, camera);
});

// Hapus file lama yang sudah digantikan data.js (jika ada)
renderer.compile(scene, camera);
ui.loading.classList.add('hidden');
ui.menu.classList.remove('hidden');

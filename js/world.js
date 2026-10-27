import * as THREE from 'three';
import * as TX from './textures.js';

/* ==========================================================
 *  DUNIA MUSEUM
 *  Lobi  →  Ruang 2024  →  Ruang 2025  →  Ruang 2026 (+ kue ulang tahun)
 *  Semua ruangan berjajar ke arah -Z, dipisah dinding berpintu.
 *
 *  Optimasi: tanpa SpotLight/shadow map. Cahaya sorot lukisan
 *  dipalsukan dengan "glow" additive, material Lambert/Basic,
 *  lampu plafon memakai InstancedMesh.
 * ========================================================== */

export const ROOM_W = 14;
export const ROOM_H = 5.5;
const HALF_W = ROOM_W / 2;
const DOOR_W = 3.2;
const DOOR_H = 3.6;
const WALL_T = 0.4;
const STEP = 2.75;      // jarak antar-bingkai (selang-seling kiri/kanan)
const ART_Y = 2.3;      // tinggi tengah bingkai
const LOBBY_L = 14;

export function buildWorld(scene, { rooms, birthday, aniso = 4, lowSpec = false, handlers = {} }) {
  const colliders = [];   // kotak AABB di bidang XZ
  const walls = [];       // mesh untuk tabrakan kamera
  const interactables = [];
  const artworks = [];
  const animated = [];    // fungsi update(dt,t) → false untuk dihapus
  const textureLoader = new THREE.TextureLoader();

  /* ---------- Susun segmen ruangan ---------- */
  const segs = [{
    kind: 'lobby', label: 'Lobi', title: 'Museum Kenangan',
    subtitle: `Selamat datang, ${birthday.herName} ❤`,
    theme: { wall: '#3b2f2a', rug: '#6b1f2e', accent: '#d8b26a' }, len: LOBBY_L,
  }];
  rooms.forEach((r, i) => {
    const last = i === rooms.length - 1;
    let len = Math.max(16, 10 + Math.max(0, r.memories.length - 1) * STEP);
    if (last) len += 9;
    segs.push({ kind: 'room', label: `Ruang ${r.year}`, year: r.year, title: r.title, subtitle: r.subtitle, theme: r.theme, len, room: r, last });
  });
  let cursor = 0;
  segs.forEach((s, i) => { s.index = i; s.z0 = cursor; s.z1 = cursor - s.len; cursor = s.z1; });
  const END_Z = cursor;
  const TOTAL_L = -cursor;

  /* ---------- Cahaya (hanya 2 lampu global) ---------- */
  scene.add(new THREE.HemisphereLight(0xfff4e6, 0x3a2a22, 1.5));
  const sun = new THREE.DirectionalLight(0xffe7c4, 0.9);
  sun.position.set(3, 10, 4);
  scene.add(sun);

  /* ---------- Lantai & plafon ---------- */
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_W, TOTAL_L),
    new THREE.MeshPhongMaterial({ map: TX.toTexture(TX.woodCanvas(512), ROOM_W / 3, TOTAL_L / 3, aniso), shininess: 25, specular: 0x222222 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -TOTAL_L / 2);
  scene.add(floor);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, TOTAL_L), new THREE.MeshLambertMaterial({ color: 0x1c1613 }));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, ROOM_H, -TOTAL_L / 2);
  scene.add(ceiling);

  // Lampu plafon (satu draw call)
  const lampCount = Math.floor(TOTAL_L / 6);
  const lamps = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.04, 20),
    new THREE.MeshBasicMaterial({ color: 0xfff1d6 }),
    lampCount
  );
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < lampCount; i++) {
    m4.makeTranslation(0, ROOM_H - 0.02, -3 - i * 6);
    lamps.setMatrixAt(i, m4);
  }
  scene.add(lamps);

  // List dinding sepanjang museum
  const trimDark = new THREE.MeshLambertMaterial({ color: 0x1c1410 });
  const trimGold = new THREE.MeshPhongMaterial({ color: 0xb48a42, specular: 0x886633, shininess: 50 });
  [[0.11, 0.22, 0.06, trimDark], [0.48, 0.04, 0.03, trimGold], [ROOM_H - 0.12, 0.24, 0.08, trimDark]].forEach(([y, h, d, m]) => {
    const g = new THREE.BoxGeometry(d, h, TOTAL_L);
    [-1, 1].forEach((sd) => {
      const t = new THREE.Mesh(g, m);
      t.position.set(sd * (HALF_W - d / 2), y, -TOTAL_L / 2);
      scene.add(t);
    });
  });

  /* ---------- Helper ---------- */
  function textPlane(lines, w, h, cw = 1024, ch = 256) {
    const tex = TX.toTexture(TX.textCanvas(lines, cw, ch), 1, 1, aniso);
    return new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
    );
  }
  function onSideWall(mesh, side, y, z, offset = 0.04) {
    mesh.position.set(side * (HALF_W - offset), y, z);
    mesh.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    scene.add(mesh);
    return mesh;
  }
  function addBoxCollider(x, z, hw, hd) {
    colliders.push({ minX: x - hw, maxX: x + hw, minZ: z - hd, maxZ: z + hd });
  }

  /* ---------- Material & geometri bersama untuk bingkai & kue ---------- */
  const frameMat = new THREE.MeshPhongMaterial({ color: 0xc29a4a, specular: 0x775522, shininess: 60 });
  const boardMat = new THREE.MeshLambertMaterial({ color: 0xf1ebdf });
  const glowMat = new THREE.MeshBasicMaterial({ map: TX.toTexture(TX.glowCanvas()), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const fixtureMat = new THREE.MeshLambertMaterial({ color: 0x151515 });
  const unitPlane = new THREE.PlaneGeometry(1, 1);
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const glowGeo = new THREE.PlaneGeometry(4.2, 4.6);
  const plaqueGeo = new THREE.PlaneGeometry(0.62, 0.24);
  const fixtureGeo = new THREE.CylinderGeometry(0.07, 0.11, 0.22, 10);
  const cake = { blown: false };

  /* ---------- Dinding tiap segmen ---------- */
  segs.forEach((s) => {
    const mat = new THREE.MeshLambertMaterial({ map: TX.toTexture(TX.plasterCanvas(s.theme.wall), s.len / 4, ROOM_H / 4, aniso) });
    const geo = new THREE.PlaneGeometry(s.len, ROOM_H);
    [-1, 1].forEach((sd) => {
      const w = new THREE.Mesh(geo, mat);
      onSideWall(w, sd, ROOM_H / 2, (s.z0 + s.z1) / 2, 0);
      walls.push(w);
    });

    const rug = new THREE.Mesh(
      new THREE.PlaneGeometry(3, s.len - 2),
      new THREE.MeshLambertMaterial({ color: s.theme.rug, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })
    );
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, 0.01, (s.z0 + s.z1) / 2);
    scene.add(rug);

    if (s.index > 0) buildDivider(s);
    if (s.kind === 'room') buildRoomContent(s);
    s.mat = mat;
  });

  // Dinding pintu masuk & dinding ujung
  const entrance = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_H), segs[0].mat);
  entrance.position.set(0, ROOM_H / 2, 0);
  entrance.rotation.y = Math.PI;
  scene.add(entrance);
  walls.push(entrance);

  const endWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_H), segs[segs.length - 1].mat);
  endWall.position.set(0, ROOM_H / 2, END_Z);
  scene.add(endWall);
  walls.push(endWall);

  /* ---------- Dinding pembatas berpintu ---------- */
  function buildDivider(s) {
    const z = s.z0;
    const mat = new THREE.MeshLambertMaterial({ color: s.theme.wall });
    const sideW = (ROOM_W - DOOR_W) / 2;
    const sideGeo = new THREE.BoxGeometry(sideW, ROOM_H, WALL_T);
    [-1, 1].forEach((sd) => {
      const m = new THREE.Mesh(sideGeo, mat);
      m.position.set(sd * (DOOR_W / 2 + sideW / 2), ROOM_H / 2, z);
      scene.add(m);
      walls.push(m);
      addBoxCollider(m.position.x, z, sideW / 2, WALL_T / 2);
    });
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W, ROOM_H - DOOR_H, WALL_T), mat);
    lintel.position.set(0, DOOR_H + (ROOM_H - DOOR_H) / 2, z);
    scene.add(lintel);
    walls.push(lintel);

    // Kusen emas
    const postGeo = new THREE.BoxGeometry(0.14, DOOR_H, WALL_T + 0.06);
    [-1, 1].forEach((sd) => {
      const p = new THREE.Mesh(postGeo, trimGold);
      p.position.set(sd * (DOOR_W / 2 + 0.07), DOOR_H / 2, z);
      scene.add(p);
    });
    const top = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W + 0.28, 0.14, WALL_T + 0.06), trimGold);
    top.position.set(0, DOOR_H + 0.07, z);
    scene.add(top);

    // Papan di atas pintu: Selamat Ulang Tahun Fitri
    const sign = textPlane([
      { text: 'Selamat Ulang Tahun', size: 88, weight: 600, color: s.theme.accent, y: 105 },
      { text: `${birthday.herName} ❤`, size: 74, italic: true, color: '#e9dcc4', y: 198 },
    ], 5.6, 1.4);
    sign.position.set(0, DOOR_H + (ROOM_H - DOOR_H) / 2, z + WALL_T / 2 + 0.01);
    scene.add(sign);
  }

  /* ---------- Bingkai kenangan ---------- */
  function addArtwork(mem, seg, localIdx, z, side) {
    const index = artworks.length;
    const x = side * (HALF_W - 0.02);
    const group = new THREE.Group();
    group.position.set(x, ART_Y, z);
    group.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    scene.add(group);

    const canvas = TX.paintingCanvas(mem, index);
    const paintMat = new THREE.MeshBasicMaterial({ map: TX.toTexture(canvas, 1, 1, aniso), color: 0xeeeeee });
    const painting = new THREE.Mesh(unitPlane, paintMat);
    const board = new THREE.Mesh(unitBox, boardMat);
    const bars = Array.from({ length: 4 }, () => new THREE.Mesh(unitBox, frameMat));
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.set(0, 0.35, 0.012);
    const plaque = new THREE.Mesh(plaqueGeo, new THREE.MeshBasicMaterial({
      map: TX.toTexture(TX.plaqueCanvas(mem, `${seg.year} · No. ${String(localIdx + 1).padStart(2, '0')}`), 1, 1, aniso),
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }));
    const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
    fixture.position.set(0, ROOM_H - ART_Y - 0.35, 0.6);
    fixture.rotation.x = -0.6;
    group.add(glow, board, painting, ...bars, plaque, fixture);

    const T = 0.11, D = 0.09, M = 0.16;
    function layout(w, h) {
      painting.scale.set(w, h, 1);
      painting.position.z = 0.056;
      const bw = w + M * 2, bh = h + M * 2;
      board.scale.set(bw, bh, 0.05);
      board.position.z = 0.028;
      bars[0].scale.set(bw + T * 2, T, D); bars[0].position.set(0, bh / 2 + T / 2, D / 2);
      bars[1].scale.set(bw + T * 2, T, D); bars[1].position.set(0, -bh / 2 - T / 2, D / 2);
      bars[2].scale.set(T, bh, D); bars[2].position.set(-bw / 2 - T / 2, 0, D / 2);
      bars[3].scale.set(T, bh, D); bars[3].position.set(bw / 2 + T / 2, 0, D / 2);
      plaque.position.set(0, -bh / 2 - T - 0.26, 0.035);
    }
    layout(2.2, 1.65);

    const art = {
      index, mem, seg, group, canvas, paintMat, x, z, requested: false, loadedURL: null,
      // Foto asli dimuat malas (lazy) hanya saat pemain dekat ruangannya
      ensureLoaded() {
        if (art.requested || !mem.image) return;
        art.requested = true;
        const url = `${mem.image}?v=20261028`;
        textureLoader.load(url, (t) => {
          if (t.image.width <= 2 && t.image.height <= 2) {
            t.dispose();
            return;
          }
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = aniso;
          paintMat.map.dispose();
          paintMat.map = t;
          paintMat.needsUpdate = true;
          art.loadedURL = url;
          const a = t.image.width / t.image.height;
          let w = 2.2, h = w / a;
          if (h > 1.9) { h = 1.9; w = h * a; }
          layout(w, h);
        }, undefined, () => {});
      },
      // Posisi berdiri di depan bingkai (untuk teleport)
      front: new THREE.Vector3(x - side * 2.6, 0, z),
      normal: new THREE.Vector3(-side, 0, 0),
    };
    artworks.push(art);
  }

  function buildRoomContent(s) {
    s.room.memories.forEach((mem, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      addArtwork(mem, s, i, s.z0 - 5 - i * STEP, side);
    });
    if (s.last) buildBirthdayCorner(s);
  }

  /* ---------- Lobi ---------- */
  (function buildLobby() {
    const s = segs[0];
    const mid = (s.z0 + s.z1) / 2;

    onSideWall(textPlane([
      { text: 'Happy Birthday', size: 120, weight: 600, color: '#ff8fab', y: 100 },
      { text: birthday.herName, size: 72, italic: true, color: '#f1e4cc', y: 205 },
    ], 7, 1.75), -1, 3.3, mid);

    onSideWall(textPlane([
      { text: 'Selamat Ulang Tahun', size: 104, weight: 600, color: '#d8b26a', y: 100 },
      { text: `${birthday.herName} ❤`, size: 72, italic: true, color: '#f1e4cc', y: 205 },
    ], 7, 1.75), 1, 3.3, mid);

    const quote = textPlane([
      { text: '“Kita tidak mengingat hari-hari,', size: 76, italic: true, color: '#d8c9ad', y: 85 },
      { text: 'kita mengingat momen-momen.”', size: 76, italic: true, color: '#d8c9ad', y: 175 },
    ], 7, 1.75);
    quote.position.set(0, 3.2, -0.03);
    quote.rotation.y = Math.PI;
    scene.add(quote);

    // Podium buku tamu (pesan sambutan)
    const pz = s.z0 - 7.5;
    const ped = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.6), new THREE.MeshLambertMaterial({ color: 0x2a1c14 }));
    ped.position.set(0, 0.5, pz);
    scene.add(ped);
    addBoxCollider(0, pz, 0.4, 0.3);
    const [bc, bctx] = TX.makeCanvas(256, 160);
    bctx.fillStyle = '#f3ead8'; bctx.fillRect(0, 0, 256, 160);
    bctx.fillStyle = '#c9b48f'; bctx.fillRect(126, 0, 4, 160);
    bctx.fillStyle = '#5a4128'; bctx.textAlign = 'center';
    bctx.font = 'italic 22px "Cormorant Garamond", Georgia, serif';
    bctx.fillText('Untuk', 64, 60); bctx.fillText('kamu', 64, 90);
    bctx.font = '40px sans-serif'; bctx.fillText('❤', 192, 85);
    const book = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.47), new THREE.MeshLambertMaterial({ map: TX.toTexture(bc) }));
    book.position.set(0, 1.04, pz + 0.02);
    book.rotation.x = -Math.PI / 2 + 0.35;
    scene.add(book);
    interactables.push({
      label: () => '📖 Baca pesan selamat datang',
      test: (px, pz2) => { const d = Math.hypot(px, pz2 - pz); return d < 2.0 ? d : Infinity; },
      action: () => handlers.openLetter?.('welcome'),
    });

    // Balon-balon (InstancedMesh = 1 draw call)
    const colors = ['#ff5c8a', '#ffd27f', '#7fd1c7', '#ffffff', '#c58bff'];
    const spots = [[-5.6, s.z0 - 1.6], [5.6, s.z0 - 1.6], [-5.6, s.z1 + 1.6], [5.6, s.z1 + 1.6]];
    const per = 4;
    const balloons = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.28, 14, 10).scale(1, 1.2, 1),
      new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444 }),
      spots.length * per
    );
    const base = [];
    const stringPts = [];
    let k = 0;
    spots.forEach(([bx, bz]) => {
      for (let i = 0; i < per; i++) {
        const p = new THREE.Vector3(bx + (Math.random() - 0.5) * 0.9, 2.6 + Math.random() * 1.0, bz + (Math.random() - 0.5) * 0.9);
        base.push(p);
        balloons.setColorAt(k, new THREE.Color(colors[k % colors.length]));
        stringPts.push(p.x, p.y - 0.34, p.z, bx, 1.1, bz);
        k++;
      }
    });
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(stringPts, 3));
    scene.add(new THREE.LineSegments(sg, new THREE.LineBasicMaterial({ color: 0xdddddd, transparent: true, opacity: 0.5 })));
    scene.add(balloons);
    animated.push((dt, t) => {
      base.forEach((p, i) => {
        m4.makeTranslation(p.x, p.y + Math.sin(t * 1.2 + i) * 0.05, p.z);
        balloons.setMatrixAt(i, m4);
      });
      balloons.instanceMatrix.needsUpdate = true;
    });
  })();

  /* ---------- Sudut ulang tahun (ruang terakhir) ---------- */
  function buildBirthdayCorner(s) {
    const cz = END_Z + 4.5;
    const endText = textPlane([
      { text: 'Selamat Ulang Tahun', size: 120, weight: 600, color: '#ffd27f', y: 95 },
      { text: `${birthday.herName} · ${birthday.date}`, size: 62, italic: true, color: '#f1e4cc', y: 205 },
    ], 8.2, 2.05);
    endText.position.set(0, 2.35, END_Z + 0.03);
    scene.add(endText);

    // Galeri layar kenangan 3D di atas ucapan "Selamat Ulang Tahun" (aktif setelah tiup lilin)
    const wallGallery = new THREE.Group();
    wallGallery.position.set(0, 4.05, END_Z + 0.05);
    wallGallery.visible = false;
    scene.add(wallGallery);

    const screenSlots = [-2.5, 0, 2.5].map((sx, idx) => {
      const slot = new THREE.Group();
      slot.position.set(sx, 0, 0);
      const border = new THREE.Mesh(new THREE.BoxGeometry(2.18, 1.66, 0.04), trimGold);
      const screenMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.5), screenMat);
      screen.position.z = 0.025;
      slot.add(border, screen);
      wallGallery.add(slot);
      return { slot, screenMat, offset: idx * 10 };
    });

    const g = new THREE.Group();
    g.position.set(0, 0, cz);
    scene.add(g);
    const table = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.9, 28), new THREE.MeshLambertMaterial({ color: 0xf5f0e8 }));
    table.position.y = 0.45;
    const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.32, 28), new THREE.MeshPhongMaterial({ color: 0xff8fb1, shininess: 30 }));
    t1.position.y = 1.06;
    const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.26, 28), new THREE.MeshPhongMaterial({ color: 0xfff4e0, shininess: 30 }));
    t2.position.y = 1.35;
    g.add(table, t1, t2);

    const flameMat = new THREE.SpriteMaterial({ map: TX.toTexture(TX.glowCanvas('255,190,90')), blending: THREE.AdditiveBlending, depthWrite: false });
    const flames = [];
    const n = Math.max(1, birthday.candles || 5);
    const candleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.16, 8);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const c = new THREE.Mesh(candleGeo, new THREE.MeshLambertMaterial({ color: ['#7fd1c7', '#ffd27f', '#c58bff', '#ff5c8a'][i % 4] }));
      c.position.set(Math.cos(a) * 0.22, 1.56, Math.sin(a) * 0.22);
      const f = new THREE.Sprite(flameMat);
      f.position.set(c.position.x, 1.7, c.position.z);
      f.scale.set(0.14, 0.22, 1);
      g.add(c, f);
      flames.push(f);
    }
    const candleLight = new THREE.PointLight(0xffb366, 6, 6, 2);
    candleLight.position.set(0, 2.0, 0);
    g.add(candleLight);

    // Kado
    [[-1.4, 0.3, '#ff5c8a'], [1.3, -0.4, '#7fd1c7'], [1.1, 0.7, '#ffd27f']].forEach(([gx, gz, col], i) => {
      const sz = 0.35 + i * 0.08;
      const box = new THREE.Mesh(new THREE.BoxGeometry(sz, sz, sz), new THREE.MeshLambertMaterial({ color: col }));
      box.position.set(gx, sz / 2, gz);
      box.rotation.y = i;
      const rib = new THREE.Mesh(new THREE.BoxGeometry(sz + 0.01, sz + 0.01, 0.06), new THREE.MeshLambertMaterial({ color: 0xffffff }));
      box.add(rib);
      g.add(box);
      addBoxCollider(gx, cz + gz, sz / 2, sz / 2);
    });
    addBoxCollider(0, cz, 0.95, 0.95);

    let slideStep = -1;
    animated.push((dt, t) => {
      if (!cake.blown) {
        flames.forEach((f, i) => { const k = 1 + Math.sin(t * 18 + i * 2) * 0.12; f.scale.set(0.14 * k, 0.22 * k, 1); });
        candleLight.intensity = 6 + Math.sin(t * 13) * 1.2;
      } else if (artworks.length > 0) {
        const step = Math.floor(t / 2.2);
        if (step !== slideStep) {
          slideStep = step;
          screenSlots.forEach((sl) => {
            const art = artworks[(step + sl.offset) % artworks.length];
            art.ensureLoaded();
            sl.screenMat.map = art.paintMat.map;
            sl.screenMat.needsUpdate = true;
          });
        }
        screenSlots.forEach((sl, i) => {
          sl.slot.position.y = Math.sin(t * 1.6 + i * 1.3) * 0.04;
        });
      }
    });

    cake.blow = () => {
      if (cake.blown) return;
      cake.blown = true;
      flames.forEach((f) => (f.visible = false));
      candleLight.intensity = 0;
      wallGallery.visible = true;
      spawnConfetti(0, 1.8, cz);
    };

    interactables.push({
      label: () => (cake.blown ? '💌 Baca surat ulang tahun' : '🎂 Tiup lilinnya!'),
      test: (px, pz) => { const d = Math.hypot(px, pz - cz); return d < 2.4 ? d : Infinity; },
      action: () => {
        if (!cake.blown) { cake.blow(); handlers.cakeBlown?.(); }
        else handlers.openLetter?.('birthday');
      },
    });
  }

  /* ---------- Konfeti ---------- */
  function spawnConfetti(x, y, z) {
    const n = lowSpec ? 160 : 320;
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), vel = [];
    const palette = ['#ff5c8a', '#ffd27f', '#7fd1c7', '#c58bff', '#ffffff'].map((c) => new THREE.Color(c));
    for (let i = 0; i < n; i++) {
      pos.set([x, y, z], i * 3);
      const c = palette[i % palette.length];
      col.set([c.r, c.g, c.b], i * 3);
      const a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 3;
      vel.push(Math.cos(a) * sp, 3 + Math.random() * 4, Math.sin(a) * sp);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.09, vertexColors: true }));
    scene.add(pts);
    let life = 0;
    animated.push((dt) => {
      life += dt;
      for (let i = 0; i < n; i++) {
        vel[i * 3 + 1] -= 6 * dt;
        vel[i * 3] *= 0.99; vel[i * 3 + 2] *= 0.99;
        pos[i * 3] += vel[i * 3] * dt;
        pos[i * 3 + 1] = Math.max(0.02, pos[i * 3 + 1] + vel[i * 3 + 1] * dt * (vel[i * 3 + 1] < 0 ? 0.35 : 1));
        pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      }
      geo.attributes.position.needsUpdate = true;
      if (life > 8) { scene.remove(pts); geo.dispose(); pts.material.dispose(); return false; }
    });
  }

  /* ---------- Debu melayang (desktop saja) ---------- */
  if (!lowSpec) {
    const n = 260;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) pos.set([(Math.random() - 0.5) * ROOM_W, Math.random() * ROOM_H, -Math.random() * TOTAL_L], i * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const dust = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.035, map: TX.toTexture(TX.glowCanvas('255,240,210', 32)), transparent: true, opacity: 0.6,
      depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    scene.add(dust);
    animated.push((dt) => {
      for (let i = 1; i < pos.length; i += 3) { pos[i] += dt * 0.05; if (pos[i] > ROOM_H) pos[i] = 0; }
      geo.attributes.position.needsUpdate = true;
    });
  }

  /* ---------- API ---------- */
  function segmentAt(z) {
    for (const s of segs) if (z <= s.z0 && z > s.z1) return s;
    return z > 0 ? segs[0] : segs[segs.length - 1];
  }

  // Muat semua foto dari awal (2024, 2025, 2026) agar langsung tampil tanpa cache lama
  artworks.forEach((a) => a.ensureLoaded());

  let lastSeg = -1;
  function update(dt, t, playerZ) {
    for (let i = animated.length - 1; i >= 0; i--) if (animated[i](dt, t) === false) animated.splice(i, 1);
    const s = segmentAt(playerZ);
    if (s.index !== lastSeg) {
      lastSeg = s.index;
      artworks.forEach((a) => { if (Math.abs(a.seg.index - s.index) <= 1) a.ensureLoaded(); });
    }
  }

  return {
    segs, colliders, walls, interactables, artworks, cake, update, segmentAt,
    spawn: new THREE.Vector3(0, 0, -3),
    bounds: { minX: -HALF_W + 0.45, maxX: HALF_W - 0.45, minZ: END_Z + 0.45, maxZ: -0.45 },
  };
}

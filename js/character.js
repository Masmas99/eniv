import * as THREE from 'three';
import { makeCanvas, toTexture, blobShadowCanvas, nameTagCanvas } from './textures.js';

/* ==========================================================
 *  KARAKTER 3D STYLIZED (COWO & CEWE) — VERSI DETAIL & IMUT
 *  - Wajah anime/chibi resolusi tinggi di <canvas> + kedip mata
 *  - Rambut berlayer penuh (poni, samping, belakang, ahoge/pita)
 *  - Baju berlapis (kerah, jaket/blouse, rok/celana, sepatu detail)
 * ========================================================== */

const geoCache = {};
const geo = (key, make) => (geoCache[key] ||= make());
const matCache = {};
const mat = (color, shininess = 18) => {
  const k = `${color}_${shininess}`;
  return (matCache[k] ||= new THREE.MeshPhongMaterial({
    color,
    shininess,
    specular: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.15).multiplyScalar(0.25),
  }));
};

let shadowMat = null;

export const STYLES = {
  cowo: {
    skin: '#f4c7a5',
    hair: '#231710',
    hairHi: '#38251a',
    eye: '#3b6fd8',
    jacket: '#3563b8',
    shirt: '#f7f9fc',
    collar: '#25478a',
    pants: '#283040',
    shoes: '#2d55a6',
    sole: '#f5f5f7',
    tag: '#6aa8ff',
  },
  cewe: {
    skin: '#f8d2b4',
    hair: '#3f2216',
    hairHi: '#593222',
    eye: '#8a4f38',
    top: '#ff7aa2',
    collar: '#fff6f8',
    ribbon: '#e63b6f',
    skirt: '#f25282',
    skirtTrim: '#fff5f8',
    shoes: '#5a2d38',
    socks: '#ffffff',
    tag: '#ff7aa2',
  },
};

/** Buat tekstur wajah anime (normal & berkedip) */
function createFaceTextures(style, isGirl) {
  function draw(blink) {
    const W = 256, H = 256;
    const [c, ctx] = makeCanvas(W, H);
    ctx.clearRect(0, 0, W, H);

    // Rona pipi (blush)
    [-1, 1].forEach((sd) => {
      const cx = 128 + sd * 62, cy = 152;
      const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 26);
      g.addColorStop(0, 'rgba(255, 120, 145, 0.55)');
      g.addColorStop(1, 'rgba(255, 120, 145, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.fill();
    });

    // Alis
    ctx.strokeStyle = style.hair;
    ctx.lineWidth = isGirl ? 4.5 : 6;
    ctx.lineCap = 'round';
    [-1, 1].forEach((sd) => {
      ctx.beginPath();
      const x0 = 128 + sd * 28, x1 = 128 + sd * 66;
      ctx.moveTo(x0, 92);
      ctx.quadraticCurveTo((x0 + x1) / 2, isGirl ? 83 : 86, x1, 93);
      ctx.stroke();
    });

    // Mata
    [-1, 1].forEach((sd) => {
      const ex = 128 + sd * 47, ey = 122;
      if (blink) {
        ctx.strokeStyle = '#1f1410';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(ex - 20, ey + 2);
        ctx.quadraticCurveTo(ex, ey + 12, ex + 20, ey + 2);
        ctx.stroke();
      } else {
        // Putih mata (sclera)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(ex, ey, 20, isGirl ? 22 : 19, 0, 0, Math.PI * 2);
        ctx.fill();

        // Iris gradasi
        const ig = ctx.createLinearGradient(ex, ey - 18, ex, ey + 18);
        ig.addColorStop(0, '#1c1210');
        ig.addColorStop(0.45, style.eye);
        ig.addColorStop(1, '#ffd6e6');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.ellipse(ex, ey + 1, 14.5, isGirl ? 17 : 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupil gelap
        ctx.fillStyle = '#160e0c';
        ctx.beginPath();
        ctx.arc(ex, ey + 2, 7.5, 0, Math.PI * 2);
        ctx.fill();

        // Kilau mata besar & kecil
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ex - 5, ey - 6, 5.2, 0, Math.PI * 2);
        ctx.arc(ex + 6, ey + 7, 2.6, 0, Math.PI * 2);
        ctx.fill();

        // Garis kelopak atas & bulu mata
        ctx.strokeStyle = '#1a100d';
        ctx.lineWidth = isGirl ? 5.5 : 4.8;
        ctx.beginPath();
        ctx.arc(ex, ey + 2, 19, Math.PI * 1.12, Math.PI * 1.88);
        ctx.stroke();

        if (isGirl) {
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(ex + sd * 17, ey - 8);
          ctx.lineTo(ex + sd * 24, ey - 14);
          ctx.stroke();
        }
      }
    });

    // Hidung titik lembut
    ctx.fillStyle = 'rgba(165, 105, 80, 0.55)';
    ctx.beginPath();
    ctx.arc(128, 146, 2.6, 0, Math.PI * 2);
    ctx.fill();

    // Mulut senyum manis
    ctx.strokeStyle = '#9e4444';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(114, 166);
    ctx.quadraticCurveTo(128, 177, 142, 166);
    ctx.stroke();

    return toTexture(c);
  }
  return { open: draw(false), blink: draw(true) };
}

export function createCharacter(gender = 'cowo', name = '') {
  const s = STYLES[gender] || STYLES.cowo;
  const isGirl = gender === 'cewe';

  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  /* ========================================================
   *  1. KAKI & SEPATU (pivot di pinggul y = 0.54)
   * ======================================================== */
  const upperLegGeo = geo('uLeg', () => new THREE.CapsuleGeometry(0.078, 0.22, 4, 10).translate(0, -0.16, 0));
  const sockGeo = geo('sock', () => new THREE.CylinderGeometry(0.072, 0.068, 0.14, 12).translate(0, -0.34, 0));
  const shoeGeo = geo('shoe2', () => {
    const g = new THREE.BoxGeometry(0.16, 0.1, 0.26, 2, 2, 2);
    g.translate(0, -0.44, 0.035);
    return g;
  });
  const soleGeo = geo('sole', () => new THREE.BoxGeometry(0.17, 0.035, 0.275).translate(0, -0.485, 0.035));

  const legs = [-1, 1].map((sd) => {
    const p = new THREE.Group();
    p.position.set(sd * 0.11, 0.54, 0);
    p.add(new THREE.Mesh(upperLegGeo, mat(isGirl ? s.skin : s.pants, 10)));
    p.add(new THREE.Mesh(sockGeo, mat(isGirl ? s.socks : s.pants, 10)));
    p.add(new THREE.Mesh(shoeGeo, mat(s.shoes, 30)));
    p.add(new THREE.Mesh(soleGeo, mat(isGirl ? '#2a181d' : s.sole, 15)));
    body.add(p);
    return p;
  });

  /* ========================================================
   *  2. BADAN, BAJU & KERAH
   * ======================================================== */
  const neck = new THREE.Mesh(geo('neck', () => new THREE.CylinderGeometry(0.075, 0.085, 0.14, 12)), mat(s.skin, 10));
  neck.position.y = 1.12;
  body.add(neck);

  if (isGirl) {
    // Blouse & pinggang
    const torso = new THREE.Mesh(geo('gTorso', () => new THREE.CylinderGeometry(0.17, 0.15, 0.36, 16)), mat(s.top, 20));
    torso.position.y = 0.91;
    body.add(torso);

    // Kerah putih bundar
    const collar = new THREE.Mesh(geo('gCollar', () => new THREE.TorusGeometry(0.135, 0.032, 8, 18)), mat(s.collar, 15));
    collar.position.set(0, 1.07, 0.01);
    collar.rotation.x = Math.PI / 2 + 0.15;
    body.add(collar);

    // Pita di dada
    const chestBowGeo = geo('cBow', () => new THREE.ConeGeometry(0.055, 0.09, 8).rotateZ(Math.PI / 2));
    [-1, 1].forEach((sd) => {
      const b = new THREE.Mesh(chestBowGeo, mat(s.ribbon, 30));
      b.position.set(sd * 0.04, 1.01, 0.165);
      b.rotation.y = -sd * 0.25;
      body.add(b);
    });
    const knot = new THREE.Mesh(geo('cKnot', () => new THREE.SphereGeometry(0.026, 8, 6)), mat(s.ribbon, 30));
    knot.position.set(0, 1.01, 0.175);
    body.add(knot);

    // Rok lipit 2 lapis
    const skirtTop = new THREE.Mesh(geo('skirt1', () => new THREE.CylinderGeometry(0.155, 0.31, 0.3, 20)), mat(s.skirt, 22));
    skirtTop.position.y = 0.62;
    body.add(skirtTop);
    const skirtHem = new THREE.Mesh(geo('skirt2', () => new THREE.CylinderGeometry(0.305, 0.335, 0.055, 20)), mat(s.skirtTrim, 20));
    skirtHem.position.y = 0.46;
    body.add(skirtHem);
  } else {
    // Jaket luar + kaos dalam putih
    const torso = new THREE.Mesh(geo('bTorso', () => new THREE.CylinderGeometry(0.195, 0.175, 0.44, 16)), mat(s.jacket, 22));
    torso.position.y = 0.86;
    body.add(torso);

    // Panel kaos putih di dada depan
    const innerShirt = new THREE.Mesh(geo('bInner', () => new THREE.BoxGeometry(0.13, 0.38, 0.04)), mat(s.shirt, 12));
    innerShirt.position.set(0, 0.87, 0.172);
    body.add(innerShirt);

    // Kerah jaket
    const collar = new THREE.Mesh(geo('bCollar', () => new THREE.TorusGeometry(0.145, 0.035, 8, 16, Math.PI * 1.35)), mat(s.collar, 20));
    collar.position.set(0, 1.07, -0.01);
    collar.rotation.x = Math.PI / 2;
    collar.rotation.z = Math.PI * 0.825;
    body.add(collar);

    // Pinggul / celana atas
    const hips = new THREE.Mesh(geo('bHips', () => new THREE.CylinderGeometry(0.178, 0.185, 0.14, 16)), mat(s.pants, 12));
    hips.position.y = 0.58;
    body.add(hips);
  }

  /* ========================================================
   *  3. LENGAN & TANGAN (pivot di bahu y = 1.03)
   * ======================================================== */
  const sleeveGeo = geo('sleeve', () => new THREE.CapsuleGeometry(0.068, 0.17, 4, 10).translate(0, -0.11, 0));
  const forearmGeo = geo('forearm', () => new THREE.CapsuleGeometry(0.054, 0.12, 4, 8).translate(0, -0.26, 0));
  const palmGeo = geo('palm', () => new THREE.SphereGeometry(0.062, 10, 8).scale(0.95, 1.1, 0.75).translate(0, -0.37, 0));

  const sleeveColor = isGirl ? s.top : s.jacket;
  const arms = [-1, 1].map((sd) => {
    const p = new THREE.Group();
    p.position.set(sd * (isGirl ? 0.21 : 0.235), 1.03, 0);
    p.rotation.z = sd * 0.11;
    p.add(new THREE.Mesh(sleeveGeo, mat(sleeveColor, 20)));
    p.add(new THREE.Mesh(forearmGeo, mat(isGirl ? s.skin : sleeveColor, 15)));
    p.add(new THREE.Mesh(palmGeo, mat(s.skin, 12)));
    body.add(p);
    return p;
  });

  /* ========================================================
   *  4. KEPALA, WAJAH KANVAS & TELINGA
   * ======================================================== */
  const head = new THREE.Group();
  head.position.y = 1.44;
  body.add(head);

  const headSphere = new THREE.Mesh(
    geo('head2', () => new THREE.SphereGeometry(0.29, 24, 20).scale(1, 0.97, 0.95)),
    mat(s.skin, 12)
  );
  head.add(headSphere);

  // Telinga kiri & kanan
  const earGeo = geo('ear', () => new THREE.SphereGeometry(0.055, 10, 8).scale(0.55, 1.0, 0.7));
  [-1, 1].forEach((sd) => {
    const ear = new THREE.Mesh(earGeo, mat(s.skin, 10));
    ear.position.set(sd * 0.285, -0.02, -0.01);
    head.add(ear);
  });

  // Lapisan wajah depan (ditempel di permukaan bola depan kepala +Z)
  const faces = createFaceTextures(s, isGirl);
  const faceMat = new THREE.MeshBasicMaterial({ map: faces.open, transparent: true, depthWrite: false });
  const faceMesh = new THREE.Mesh(
    geo('facePatch', () => {
      const g = new THREE.SphereGeometry(0.293, 24, 18, Math.PI * 0.18, Math.PI * 0.64, Math.PI * 0.24, Math.PI * 0.56);
      g.scale(1, 0.97, 0.95);
      return g;
    }),
    faceMat
  );
  head.add(faceMesh);

  /* ========================================================
   *  5. RAMBUT BERLAYER PENUH (DEPAN, SAMPING, BELAKANG)
   * ======================================================== */
  const hairMat = mat(s.hair, 32);
  const hairHiMat = mat(s.hairHi, 38);

  // Kubah rambut utama (menutup atas & seluruh belakang kepala sampai tengkuk)
  const hairDome = new THREE.Mesh(
    geo('hDome', () => new THREE.SphereGeometry(0.308, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.68).scale(1.02, 1.0, 1.03)),
    hairMat
  );
  hairDome.rotation.x = -0.38;
  head.add(hairDome);

  // Poni depan berhelai-helai (5 helai melengkung rapi di dahi)
  const bangGeo = geo('bang', () => new THREE.CapsuleGeometry(0.052, 0.11, 4, 8));
  [-0.15, -0.075, 0, 0.075, 0.15].forEach((bx, i) => {
    const b = new THREE.Mesh(bangGeo, i % 2 === 0 ? hairMat : hairHiMat);
    const arch = 1 - Math.abs(bx) * 2.2;
    b.position.set(bx, 0.11 + arch * 0.02, 0.248 + arch * 0.02);
    b.rotation.x = -0.22;
    b.rotation.z = -bx * 1.1 + (isGirl ? 0 : 0.08);
    head.add(b);
  });

  // Helai rambut samping telinga (sideburns)
  const sideLockGeo = geo('sLock', () => new THREE.CapsuleGeometry(0.055, isGirl ? 0.34 : 0.14, 4, 8));
  [-1, 1].forEach((sd) => {
    const l = new THREE.Mesh(sideLockGeo, hairMat);
    l.position.set(sd * 0.265, isGirl ? -0.14 : 0.0, 0.09);
    l.rotation.z = sd * 0.08;
    l.rotation.x = 0.1;
    head.add(l);
  });

  if (isGirl) {
    // Rambut panjang terurai penuh di belakang sampai punggung
    const longBack = new THREE.Mesh(
      geo('gLongBack', () => new THREE.CapsuleGeometry(0.24, 0.42, 6, 14).scale(1.12, 1.0, 0.65)),
      hairMat
    );
    longBack.position.set(0, -0.22, -0.15);
    longBack.rotation.x = 0.12;
    head.add(longBack);

    // Helai bergelombang kiri & kanan di belakang bahu
    const waveGeo = geo('gWave', () => new THREE.CapsuleGeometry(0.09, 0.38, 4, 10));
    [-1, 1].forEach((sd) => {
      const w = new THREE.Mesh(waveGeo, hairHiMat);
      w.position.set(sd * 0.2, -0.25, -0.12);
      w.rotation.z = -sd * 0.15;
      head.add(w);
    });

    // Pita kupu-kupu besar di sisi kepala
    const bowWingGeo = geo('gBowWing', () => new THREE.ConeGeometry(0.085, 0.14, 10).scale(1, 1, 0.55));
    const bowGroup = new THREE.Group();
    bowGroup.position.set(0.22, 0.22, -0.02);
    bowGroup.rotation.z = -0.45;
    bowGroup.rotation.y = 0.25;
    [-1, 1].forEach((sd) => {
      const wing = new THREE.Mesh(bowWingGeo, mat(s.ribbon, 35));
      wing.position.x = sd * 0.065;
      wing.rotation.z = sd * (Math.PI / 2);
      bowGroup.add(wing);
    });
    bowGroup.add(new THREE.Mesh(geo('gBowKnot', () => new THREE.SphereGeometry(0.035, 8, 6)), mat(s.ribbon, 35)));
    head.add(bowGroup);
  } else {
    // Lapisan rambut belakang cowo bertekstur (menutup tengkuk dengan rapi)
    const napeGeo = geo('bNape', () => new THREE.CapsuleGeometry(0.075, 0.14, 4, 8));
    [-0.16, -0.08, 0, 0.08, 0.16].forEach((nx, i) => {
      const n = new THREE.Mesh(napeGeo, i % 2 ? hairHiMat : hairMat);
      n.position.set(nx, -0.07, -0.255 + Math.abs(nx) * 0.18);
      n.rotation.x = 0.25;
      n.rotation.z = nx * 0.8;
      head.add(n);
    });

    // Ahoge / jambul keren di atas kepala
    const ahoge = new THREE.Mesh(
      geo('ahoge', () => new THREE.ConeGeometry(0.055, 0.18, 8).translate(0, 0.07, 0)),
      hairHiMat
    );
    ahoge.position.set(0.03, 0.28, 0.02);
    ahoge.rotation.z = -0.45;
    ahoge.rotation.x = -0.2;
    head.add(ahoge);
  }

  /* ========================================================
   *  6. BAYANGAN & PAPAN NAMA
   * ======================================================== */
  shadowMat ||= new THREE.MeshBasicMaterial({ map: toTexture(blobShadowCanvas()), transparent: true, depthWrite: false });
  const shadow = new THREE.Mesh(geo('shadow', () => new THREE.PlaneGeometry(0.95, 0.95).rotateX(-Math.PI / 2)), shadowMat);
  shadow.position.y = 0.012;
  root.add(shadow);

  let tag = null;
  function setName(n) {
    if (tag) {
      root.remove(tag);
      tag.material.map.dispose();
      tag.material.dispose();
    }
    if (!n) return;
    tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: toTexture(nameTagCanvas(n, s.tag)), transparent: true, depthWrite: false }));
    tag.scale.set(0.95, 0.24, 1);
    tag.position.y = 2.02;
    root.add(tag);
  }
  setName(name);

  /* ========================================================
   *  7. ANIMASI JALAN, IDLE & KEDIP MATA
   * ======================================================== */
  let phase = 0, amp = 0, idle = Math.random() * 10;
  let blinkTimer = 1.5 + Math.random() * 2.5;
  let isBlinking = false;

  function update(dt, speed) {
    const target = Math.min(speed / 2.6, 1);
    amp += (target - amp) * (1 - Math.exp(-10 * dt));
    phase += dt * (3.2 + speed * 2.3);
    idle += dt;

    const sw = Math.sin(phase) * 0.72 * amp;
    legs[0].rotation.x = sw;
    legs[1].rotation.x = -sw;
    arms[0].rotation.x = -sw * 0.85;
    arms[1].rotation.x = sw * 0.85;

    // Pantulan langkah & goyangan badan halus
    body.position.y = Math.abs(Math.sin(phase)) * 0.048 * amp;
    body.rotation.y = Math.sin(phase) * 0.06 * amp;

    // Napas & gerak kepala saat diam
    head.position.y = 1.44 + Math.sin(idle * 2.2) * 0.008 * (1 - amp);
    head.rotation.z = Math.sin(idle * 0.9) * 0.035 * (1 - amp) + Math.cos(phase) * 0.025 * amp;

    // Kedip mata otomatis
    blinkTimer -= dt;
    if (!isBlinking && blinkTimer <= 0) {
      isBlinking = true;
      faceMat.map = faces.blink;
      blinkTimer = 0.13;
    } else if (isBlinking && blinkTimer <= 0) {
      isBlinking = false;
      faceMat.map = faces.open;
      blinkTimer = 2.4 + Math.random() * 3.2;
    }
  }

  return { root, update, setName, gender };
}

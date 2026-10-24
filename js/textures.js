import * as THREE from 'three';

/* Helper tekstur prosedural berbasis <canvas> — tanpa file gambar eksternal */

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

export function toTexture(canvas, rx = 1, ry = 1, aniso = 1) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  if (rx !== 1 || ry !== 1) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
  }
  return t;
}

export function wrapText(ctx, text, maxWidth) {
  const words = String(text).split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

const SERIF = '"Cormorant Garamond", Georgia, serif';
const EMOJI = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';

export function woodCanvas(S = 512) {
  const rows = 6, ph = S / rows;
  const [c, ctx] = makeCanvas(S, S);
  for (let r = 0; r < rows; r++) {
    let x = -Math.random() * 200;
    while (x < S) {
      const len = 150 + Math.random() * 220;
      ctx.fillStyle = `hsl(${24 + Math.random() * 8}, ${35 + Math.random() * 15}%, ${22 + Math.random() * 9}%)`;
      ctx.fillRect(x, r * ph, len, ph);
      for (let g = 0; g < 18; g++) {
        ctx.strokeStyle = `rgba(0,0,0,${Math.random() * 0.12})`;
        ctx.lineWidth = Math.random() * 1.5;
        const y = r * ph + 3 + Math.random() * (ph - 6);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + len / 2, y + (Math.random() - 0.5) * 4, x + len, y);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(x, r * ph, 2, ph);
      x += len;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, r * ph, S, 2);
  }
  return c;
}

export function plasterCanvas(base, S = 256) {
  const [c, ctx] = makeCanvas(S, S);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  const img = ctx.getImageData(0, 0, S, S);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 12;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/** Lukisan otomatis untuk kenangan yang belum punya foto */
export function paintingCanvas(mem, seedIndex) {
  const W = 640, H = 480;
  const [c, ctx] = makeCanvas(W, H);
  const [a, b] = mem.palette || ['#f6d365', '#fda085'];
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  let seed = seedIndex * 7919 + 17;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 22; i++) {
    const x = rnd() * W, y = rnd() * H, r = 15 + rnd() * 90;
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, `rgba(255,255,255,${0.12 + rnd() * 0.25})`);
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (mem.icon) {
    ctx.font = `96px ${EMOJI}`;
    ctx.fillText(mem.icon, W / 2, H / 2 - 70);
  }
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#fff';
  ctx.font = `600 50px ${SERIF}`;
  const lines = wrapText(ctx, mem.title, W - 100);
  lines.forEach((l, i) => ctx.fillText(l, W / 2, H / 2 + 35 + i * 52));
  ctx.font = `italic 28px ${SERIF}`;
  ctx.fillText(mem.date, W / 2, H / 2 + 35 + lines.length * 52 + 6);
  ctx.shadowBlur = 0;

  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.7);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
  return c;
}

export function plaqueCanvas(mem, label) {
  const W = 384, H = 150;
  const [c, ctx] = makeCanvas(W, H);
  ctx.fillStyle = '#efe7d6';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#b08a4a';
  ctx.lineWidth = 5;
  ctx.strokeRect(7, 7, W - 14, H - 14);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#7a5b30';
  ctx.font = '500 18px Inter, sans-serif';
  ctx.fillText(label, W / 2, 54);
  ctx.fillStyle = '#2b2118';
  ctx.font = `600 32px ${SERIF}`;
  ctx.fillText(wrapText(ctx, mem.title, W - 40)[0], W / 2, 104);
  return c;
}

/** lines: [{ text, size, weight?, italic?, color, y, emoji? }] */
export function textCanvas(lines, W = 1024, H = 256) {
  const [c, ctx] = makeCanvas(W, H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const l of lines) {
    ctx.font = `${l.italic ? 'italic ' : ''}${l.weight || 400} ${l.size}px ${l.font || SERIF}`;
    ctx.fillStyle = l.color;
    ctx.fillText(l.text, W / 2, l.y);
  }
  return c;
}

export function glowCanvas(rgb = '255,214,160', S = 128) {
  const [c, ctx] = makeCanvas(S, S);
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, `rgba(${rgb},0.6)`);
  g.addColorStop(0.5, `rgba(${rgb},0.18)`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return c;
}

export function blobShadowCanvas(S = 64) {
  const [c, ctx] = makeCanvas(S, S);
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(0,0,0,0.5)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return c;
}

export function heartCanvas(S = 64, color = '#ff4d6d') {
  const [c, ctx] = makeCanvas(S, S);
  ctx.fillStyle = color;
  ctx.beginPath();
  const s = S / 64;
  ctx.moveTo(32 * s, 56 * s);
  ctx.bezierCurveTo(4 * s, 36 * s, 4 * s, 12 * s, 20 * s, 10 * s);
  ctx.bezierCurveTo(27 * s, 9 * s, 31 * s, 14 * s, 32 * s, 18 * s);
  ctx.bezierCurveTo(33 * s, 14 * s, 37 * s, 9 * s, 44 * s, 10 * s);
  ctx.bezierCurveTo(60 * s, 12 * s, 60 * s, 36 * s, 32 * s, 56 * s);
  ctx.fill();
  return c;
}

export function nameTagCanvas(name, color) {
  const W = 256, H = 64;
  const [c, ctx] = makeCanvas(W, H);
  ctx.font = '500 26px Inter, sans-serif';
  const tw = Math.min(ctx.measureText(name).width + 44, W - 4);
  const x = (W - tw) / 2;
  ctx.fillStyle = 'rgba(10,8,6,0.6)';
  ctx.beginPath();
  ctx.roundRect(x, 10, tw, 44, 22);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + 20, 32, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, x + 34, 33, tw - 44);
  return c;
}

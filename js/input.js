/* ==========================================================
 *  INPUT: keyboard + mouse (desktop) & joystick sentuh (mobile)
 *  - Layar kiri  : joystick virtual untuk berjalan
 *  - Layar kanan : geser untuk memutar kamera
 * ========================================================== */
export class Input {
  constructor(canvas, joyBase, joyKnob) {
    this.canvas = canvas;
    this.joyBase = joyBase;
    this.joyKnob = joyKnob;
    this.keys = Object.create(null);
    this.lookDX = 0;
    this.lookDY = 0;
    this.zoom = 0;
    this.enabled = true;
    this.onAction = null;
    this.R = 55;
    this.joy = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
    this.drag = { id: null, x: 0, y: 0, touch: false };

    addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      this.keys[e.code] = true;
      if (!e.repeat) this.onAction?.(e.code);
    });
    addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    addEventListener('blur', () => this.reset());

    canvas.addEventListener('pointerdown', (e) => this._down(e));
    addEventListener('pointermove', (e) => this._move(e));
    addEventListener('pointerup', (e) => this._up(e));
    addEventListener('pointercancel', (e) => this._up(e));
    canvas.addEventListener('wheel', (e) => { this.zoom += Math.sign(e.deltaY); }, { passive: true });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  _down(e) {
    if (!this.enabled) return;
    const j = this.joy;
    if (e.pointerType === 'touch' && e.clientX < innerWidth * 0.45 && j.id === null) {
      j.id = e.pointerId;
      j.ox = e.clientX;
      j.oy = e.clientY;
      j.x = j.y = 0;
      this.joyBase.style.left = `${j.ox}px`;
      this.joyBase.style.top = `${j.oy}px`;
      this.joyKnob.style.transform = 'translate(0px, 0px)';
      this.joyBase.classList.remove('hidden');
    } else if (this.drag.id === null) {
      this.drag.id = e.pointerId;
      this.drag.x = e.clientX;
      this.drag.y = e.clientY;
      this.drag.touch = e.pointerType === 'touch';
    }
  }

  _move(e) {
    const j = this.joy, d = this.drag;
    if (e.pointerId === j.id) {
      let dx = e.clientX - j.ox, dy = e.clientY - j.oy;
      const len = Math.hypot(dx, dy);
      if (len > this.R) { dx *= this.R / len; dy *= this.R / len; }
      this.joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
      j.x = dx / this.R;
      j.y = -dy / this.R;
    } else if (e.pointerId === d.id) {
      const k = d.touch ? 1.5 : 1;
      this.lookDX += (e.clientX - d.x) * k;
      this.lookDY += (e.clientY - d.y) * k;
      d.x = e.clientX;
      d.y = e.clientY;
    }
  }

  _up(e) {
    if (e.pointerId === this.joy.id) {
      this.joy.id = null;
      this.joy.x = this.joy.y = 0;
      this.joyBase.classList.add('hidden');
    }
    if (e.pointerId === this.drag.id) this.drag.id = null;
  }

  reset() {
    for (const k in this.keys) this.keys[k] = false;
    this.joy.id = null;
    this.joy.x = this.joy.y = 0;
    this.drag.id = null;
    this.lookDX = this.lookDY = this.zoom = 0;
    this.joyBase.classList.add('hidden');
  }

  /** @returns {{x:number,y:number,mag:number,run:boolean}} arah lokal (x kanan, y maju) */
  read() {
    if (!this.enabled) return { x: 0, y: 0, mag: 0, run: false };
    let x = 0, y = 0, mag = 0, run = false;
    if (this.joy.id !== null) {
      x = this.joy.x;
      y = this.joy.y;
      mag = Math.min(1, Math.hypot(x, y));
      if (mag < 0.15) mag = 0;
      run = mag > 0.92;
    } else {
      const k = this.keys;
      x = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
      y = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
      mag = x || y ? 1 : 0;
      run = !!(k.ShiftLeft || k.ShiftRight);
    }
    const len = Math.hypot(x, y) || 1;
    return { x: x / len, y: y / len, mag, run };
  }

  consumeLook() {
    const r = { dx: this.lookDX, dy: this.lookDY, zoom: this.zoom };
    this.lookDX = this.lookDY = this.zoom = 0;
    return r;
  }
}

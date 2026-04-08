/**
 * HolographicCard — vanilla JS, canvas-based compositing.
 *
 * Uses an offscreen canvas with source-atop compositing:
 *   1. Draw skull PNG (establishes alpha mask naturally)
 *   2. Set globalCompositeOperation = 'source-atop'
 *   3. Draw gradient layers — paint only where skull has pixels
 * Result: transparent background, holographic effect only on the skull.
 *
 * Usage:
 *   new HolographicCard(containerEl, { src, width, height })
 */

class HolographicCard {
  static #identityMatrix = '1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1';
  static #maxRotate = 0.3;
  static #minRotate = -0.3;
  static #maxScale  = 1;
  static #minScale  = 0.97;

  constructor(container, { src, width = 260, height = 260 } = {}) {
    this._container = container;
    this._src    = src;
    this._width  = width;
    this._height = height;

    this._mousePos     = { x: 0.5, y: 0.5 };
    this._isHovered    = false;
    this._hoverProgress = 0; // 0 = idle, 1 = fully hovered, lerped each frame
    this._matrix       = HolographicCard.#identityMatrix;
    this._isTimeoutFinished = false;
    this._enterTimeout = null;
    this._img          = null;
    this._isMobileAuto = false;
    this._autoPhase    = 0;

    this._build();
    this._loadImage();
  }

  _build() {
    const c = this._container;
    c.style.cssText = `
      position: relative;
      display: inline-block;
      cursor: pointer;
      user-select: none;
      width: ${this._width}px;
      height: ${this._height}px;
    `;

    this._tiltEl = document.createElement('div');
    this._tiltEl.style.cssText = `
      transform: perspective(600px) matrix3d(${HolographicCard.#identityMatrix});
      transform-origin: center center;
      transition: transform 200ms ease-out;
      width: 100%;
      height: 100%;
      position: relative;
    `;

    this._canvas = document.createElement('canvas');
    this._canvas.width  = this._width;
    this._canvas.height = this._height;
    this._canvas.style.cssText = `
      width: 100%;
      height: 100%;
      display: block;
      pointer-events: none;
    `;
    this._ctx = this._canvas.getContext('2d');

    // Offscreen canvas: gradients are drawn here then clipped to skull via destination-in.
    // This guarantees zero bleed onto transparent areas before multiply compositing.
    this._offscreen = document.createElement('canvas');
    this._offscreen.width  = this._width;
    this._offscreen.height = this._height;
    this._octx = this._offscreen.getContext('2d');

    this._tiltEl.appendChild(this._canvas);
    c.appendChild(this._tiltEl);
  }

  _loadImage() {
    const img = new Image();
    img.onload = () => {
      this._img = img;
      this._attachEvents();
      this._startIdleAnimation();
    };
    img.src = this._src;
  }

  _attachEvents() {
    if (this._isMobileAuto) return; // en modo auto, los eventos de mouse no interfieren
    const c = this._container;
    c.addEventListener('mouseenter', (e) => this._onMouseEnter(e));
    c.addEventListener('mousemove',  (e) => this._onMouseMove(e));
    c.addEventListener('mouseleave', (e) => this._onMouseLeave(e));
  }

  _getRect() { return this._container.getBoundingClientRect(); }

  _getMatrix(clientX, clientY) {
    const { left, right, top, bottom } = this._getRect();
    const R = HolographicCard.#maxRotate, r = HolographicCard.#minRotate;
    const S = HolographicCard.#maxScale,  s = HolographicCard.#minScale;
    const xC = (left + right) / 2, yC = (top + bottom) / 2;

    const scale = [
      S - (S-s) * Math.abs(xC - clientX) / (xC - left),
      S - (S-s) * Math.abs(yC - clientY) / (yC - top),
      S - (S-s) * (Math.abs(xC-clientX) + Math.abs(yC-clientY)) / (xC-left+yC-top),
    ];
    const rot = {
      x1:  0.25 * ((yC-clientY)/yC - (xC-clientX)/xC),
      x2:  R - (R-r) * Math.abs(right-clientX) / (right-left),
      y2:  R - (R-r) * (top-clientY) / (top-bottom),
      z0: -(R - (R-r) * Math.abs(right-clientX) / (right-left)),
      z1:  0.2 - 0.8 * (top-clientY) / (top-bottom),
    };
    return `${scale[0]},${rot.x1},${rot.z0},0, ${rot.x1},${scale[1]},${rot.z1},0, ${rot.x2},${rot.y2},${scale[2]},0, 0,0,0,1`;
  }

  _getOppositeMatrix(mat, clientY, onEnter = false) {
    const { top, bottom } = this._getRect();
    const R = HolographicCard.#maxRotate, r = HolographicCard.#minRotate;
    const oppositeY  = bottom - clientY + top;
    const weakening  = onEnter ? 0.7 : 4;
    const multiplier = onEnter ? -1 : 1;
    return mat.split(',').map((item, i) => {
      const v = parseFloat(item);
      if (i === 2 || i === 4 || i === 8)  return -v * multiplier / weakening;
      if (i === 0 || i === 5 || i === 10) return 1;
      if (i === 6) return  multiplier * (R-(R-r)*(top-oppositeY)/(top-bottom)) / weakening;
      if (i === 9) return (R-(R-r)*(top-oppositeY)/(top-bottom)) / weakening;
      return v;
    }).join(',');
  }

  _onMouseEnter(e) {
    this._isHovered = true;
    const m = this._getMatrix(e.clientX, e.clientY);
    this._matrix = this._getOppositeMatrix(m, e.clientY, true);
    this._applyMatrix(this._matrix);
    this._isTimeoutFinished = false;
    clearTimeout(this._enterTimeout);
    this._enterTimeout = setTimeout(() => { this._isTimeoutFinished = true; }, 200);
    this._updateMousePos(e);
  }

  _onMouseMove(e) {
    if (this._isTimeoutFinished) {
      const m = this._getMatrix(e.clientX, e.clientY);
      this._matrix = m;
      this._applyMatrix(m);
    }
    this._updateMousePos(e);
  }

  _onMouseLeave(e) {
    clearTimeout(this._enterTimeout);
    this._isHovered = false;
    const opposite = this._getOppositeMatrix(this._matrix, e.clientY);
    this._applyMatrix(opposite);
    setTimeout(() => this._applyMatrix(HolographicCard.#identityMatrix), 200);
    this._mousePos = { x: 0.5, y: 0.5 };
  }

  _updateMousePos(e) {
    const { left, right, top, bottom } = this._getRect();
    this._mousePos = {
      x: Math.max(0, Math.min(1, (e.clientX-left) / (right-left))),
      y: Math.max(0, Math.min(1, (e.clientY-top)  / (bottom-top))),
    };
  }

  _applyMatrix(mat) {
    this._tiltEl.style.transform = `perspective(600px) matrix3d(${mat})`;
  }

  _drawFrame() {
    const W = this._width, H = this._height;
    const ctx = this._ctx;
    const { x, y } = this._mousePos;

    // Exact alpha values from the working version
    const p  = this._hoverProgress;
    const a1 = 0.35 + p * 0.20; // idle 0.35 → hover 0.55
    const a2 = 0.15 + p * 0.15; // idle 0.15 → hover 0.30
    const a3 =        p * 0.35; // idle 0    → hover 0.35
    const a4 =        p * 0.20; // idle 0    → hover 0.20

    const hue  = x * 360;
    const hue2 = y * 360 + 120;
    const ang  = x * 180;
    const ang2 = ang + 90;
    const sx   = x * W;
    const sy   = y * H;

    // --- Offscreen: draw gradients then clip to skull with destination-in ---
    const oct = this._octx;
    oct.clearRect(0, 0, W, H);
    oct.globalCompositeOperation = 'source-over';
    oct.globalAlpha = 1;

    // Layer 1 — primary rainbow stripes
    const g1 = oct.createLinearGradient(
      Math.cos((ang * Math.PI) / 180) * W, Math.sin((ang * Math.PI) / 180) * H,
      -Math.cos((ang * Math.PI) / 180) * W, -Math.sin((ang * Math.PI) / 180) * H
    );
    for (let i = 0; i <= 8; i++) {
      g1.addColorStop(i / 8, `hsl(${hue + i * 45} 100% 57% / ${a1})`);
    }
    oct.fillStyle = g1;
    oct.fillRect(0, 0, W, H);

    // Layer 2 — perpendicular stripes
    const g2 = oct.createLinearGradient(
      Math.cos((ang2 * Math.PI) / 180) * W, Math.sin((ang2 * Math.PI) / 180) * H,
      -Math.cos((ang2 * Math.PI) / 180) * W, -Math.sin((ang2 * Math.PI) / 180) * H
    );
    for (let i = 0; i <= 6; i++) {
      g2.addColorStop(i / 6, `hsl(${hue2 + i * 60} 90% 50% / ${a2})`);
    }
    oct.fillStyle = g2;
    oct.fillRect(0, 0, W, H);

    // Layer 3 — specular highlight
    if (a3 > 0.01) {
      const g3 = oct.createRadialGradient(sx, sy, 0, sx, sy, W * 0.5);
      g3.addColorStop(0,    `rgba(255,255,255,${a3})`);
      g3.addColorStop(0.35, `rgba(255,255,255,${a3 * 0.45})`);
      g3.addColorStop(1,    'rgba(255,255,255,0)');
      oct.fillStyle = g3;
      oct.fillRect(0, 0, W, H);
    }

    // Layer 4 — conic shimmer
    if (a4 > 0.01) {
      const g4 = oct.createConicGradient(ang * Math.PI / 180, sx, sy);
      for (let i = 0; i <= 6; i++) {
        g4.addColorStop(i / 6, `hsl(${hue + i * 60} 100% 65% / ${a4})`);
      }
      oct.fillStyle = g4;
      oct.fillRect(0, 0, W, H);
    }

    // Clip offscreen to skull alpha — destination-in keeps only pixels where skull has alpha
    oct.globalCompositeOperation = 'destination-in';
    oct.drawImage(this._img, 0, 0, W, H);

    // --- Main canvas: skull + gradient layer composited with multiply ---
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.drawImage(this._img, 0, 0, W, H);          // draw skull

    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(this._offscreen, 0, 0);           // multiply clipped gradient onto skull
  }

  startMobileAnimation() {
    this._isMobileAuto = true;
    this._isHovered    = true;
  }

  _startIdleAnimation() {
    let tick = 0;
    const SPEED = 0.0018; // ~21s por vuelta completa en rombo
    const loop = () => {
      // Lerp hoverProgress toward target every frame → smooth fade in/out
      const target = this._isHovered ? 1 : 0;
      this._hoverProgress += (target - this._hoverProgress) * 0.06;

      if (this._isMobileAuto) {
        this._isHovered = true; // forzado cada frame, ningún evento puede sobreescribirlo

        // Rombo: loop continuo por las 4 esquinas (cuadrado girado 45°)
        this._autoPhase = (this._autoPhase + SPEED) % 1;

        const A = 0.5; // amplitud moderada
        const corners = [
          { x: 0.5,     y: 0.5 - A }, // arriba
          { x: 0.5 + A, y: 0.5     }, // derecha
          { x: 0.5,     y: 0.5 + A }, // abajo
          { x: 0.5 - A, y: 0.5     }, // izquierda
        ];
        const seg  = this._autoPhase * 4;
        const i    = Math.floor(seg) % 4;
        const t = seg - Math.floor(seg);
        const from = corners[i];
        const to   = corners[(i + 1) % 4];
        const nx   = from.x + (to.x - from.x) * t;
        const ny   = from.y + (to.y - from.y) * t;
        this._mousePos = { x: nx, y: ny };

        // Tilt 3D: mapea posición normalizada a coordenadas absolutas del rect
        const rect = this._getRect();
        const fakeX = rect.left + rect.width  * nx;
        const fakeY = rect.top  + rect.height * ny;
        this._applyMatrix(this._getMatrix(fakeX, fakeY));

      } else if (!this._isHovered) {
        tick += 0.003;
        this._mousePos = {
          x: (Math.sin(tick) + 1) / 2,
          y: (Math.cos(tick * 0.7) + 1) / 2,
        };
      }

      this._drawFrame();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

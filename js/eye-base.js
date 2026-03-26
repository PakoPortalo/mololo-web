// Eye — clase base
// Lógica compartida entre TrackerEye y AbsentEye

const CELLS = 8;
const CELL_SIZE = 200;
const FRAME_HEIGHT = 1600;
const IDLE_FRAMES = 3;
const WANDER_MS = 30;
const CLOSED_COL = 3;
const CLOSED_ROW = 7;
const STRIP_Y = 4800;
const STRIP_ANIM_COLS = [1, 2, 3];

class Eye {
  constructor(x, y) {
    // DOM
    this.el = document.createElement('div');
    this.el.className = 'eye';
    this.el.style.left = `${x}px`;
    this.el.style.top = `${y}px`;
    document.body.appendChild(this.el);

    // Posición en pantalla
    this.x = x;
    this.y = y;

    // Estado interno
    this.currentFrame = 0;
    this.currentCol = 4;
    this.currentRow = 4;
    this.inStrip = false;
    this.stripAnimFrame = 0;
    this.state = 'idle';
    this.travelInterval = null;
    this.closedAnimInterval = null;

    // Loop de animación idle (3 frames cada 100ms)
    this.idleInterval = setInterval(() => {
      if (this.state === 'idle') {
        this.currentFrame = (this.currentFrame + 1) % IDLE_FRAMES;
        this.applyIdle(this.currentCol, this.currentRow);
      }
    }, 100);

    // Posición inicial
    this.applyIdle(4, 4);
  }

  applyIdle(col, row) {
    this.currentCol = col;
    this.currentRow = row;
    this.inStrip = false;
    this.el.style.backgroundPosition =
      `-${col * CELL_SIZE}px -${this.currentFrame * FRAME_HEIGHT + row * CELL_SIZE}px`;
  }

  applyStrip(col) {
    this.inStrip = true;
    this.el.style.backgroundPosition = `-${col * CELL_SIZE}px -${STRIP_Y}px`;
  }

  travel(destCol, destRow, onArrival, stepMs = WANDER_MS) {
    if (this.travelInterval) clearInterval(this.travelInterval);
    this.travelInterval = setInterval(() => {
      if (this.currentCol === destCol && this.currentRow === destRow) {
        clearInterval(this.travelInterval);
        this.travelInterval = null;
        onArrival();
        return;
      }
      this.applyIdle(
        this.currentCol + Math.sign(destCol - this.currentCol),
        this.currentRow + Math.sign(destRow - this.currentRow)
      );
    }, stepMs);
  }

  startClosedAnim() {
    this.stripAnimFrame = 0;
    this.applyStrip(STRIP_ANIM_COLS[0]);
    this.closedAnimInterval = setInterval(() => {
      this.stripAnimFrame = (this.stripAnimFrame + 1) % STRIP_ANIM_COLS.length;
      this.applyStrip(STRIP_ANIM_COLS[this.stripAnimFrame]);
    }, 100);
  }

  stopClosedAnim() {
    if (this.closedAnimInterval) {
      clearInterval(this.closedAnimInterval);
      this.closedAnimInterval = null;
    }
  }

  // Cierra el ojo: viaja a (3,7) → strip col0 → col1 → closed
  startBlink(onComplete, stepMs = WANDER_MS) {
    if (this.state !== 'idle') {
      if (onComplete) onComplete();
      return;
    }
    this.state = 'closing';

    this.travel(CLOSED_COL, CLOSED_ROW, () => {
      this.applyStrip(0);
      this.travelInterval = setTimeout(() => {
        this.applyStrip(1);
        this.travelInterval = setTimeout(() => {
          this.state = 'closed';
          this.startClosedAnim();
          if (onComplete) onComplete();
        }, stepMs);
      }, stepMs);
    }, stepMs);
  }

  // Abre el ojo: strip → viaja a destCol, destRow
  endBlink(destCol, destRow, stepMs = WANDER_MS) {
    if (this.state !== 'closing' && this.state !== 'closed') return;

    this.stopClosedAnim();
    if (this.travelInterval) {
      clearInterval(this.travelInterval);
      clearTimeout(this.travelInterval);
      this.travelInterval = null;
    }

    if (this.inStrip) this.applyIdle(CLOSED_COL, CLOSED_ROW);

    this.state = 'opening';
    this.travel(destCol, destRow, () => {
      this.state = 'idle';
      this.onIdle();
    }, stepMs);
  }

  // Hook para subclases: se llama cada vez que el estado pasa a idle
  onIdle() {}

  destroy() {
    clearInterval(this.idleInterval);
    this.stopClosedAnim();
    if (this.travelInterval) {
      clearInterval(this.travelInterval);
      clearTimeout(this.travelInterval);
    }
    this.el.remove();
  }
}

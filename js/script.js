const CELLS = 8;
const CELL_SIZE = 200;       // tamaño display de cada celda (escala 2/3 del sprite original)
const FRAME_HEIGHT = 1600;   // 2400 * 2/3
const IDLE_FRAMES = 3;
const STEP_MS = 10;
const CLOSED_COL = 3;
const CLOSED_ROW = 7;
const STRIP_Y = 4800;        // 7200 * 2/3
const STRIP_ANIM_COLS = [1, 2, 3];
const EYE_GAP = 50;          // margen mínimo entre ojos
const MAX_EYES = 5;

let lastMouseEvent = null;
const activeEyes = [];
const fadingEyes = []; // ojos destruyéndose, aún visibles

class Eye {
  constructor(x, y) {
    this.el = document.createElement('div');
    this.el.className = 'eye';
    this.x = x;
    this.y = y;
    this.el.style.left = `${x}px`;
    this.el.style.top = `${y}px`;
    document.body.appendChild(this.el);

    this.currentFrame = 0;
    this.currentCol = 4;
    this.currentRow = 4;
    this.inStrip = false;
    this.stripAnimFrame = 0;
    this.state = 'closed';
    this.travelInterval = null;
    this.closedAnimInterval = null;
    this.autoBlinkTimeout = null;
    this.destroying = false;

    this.idleInterval = setInterval(() => {
      if (this.state === 'idle') {
        this.currentFrame = (this.currentFrame + 1) % IDLE_FRAMES;
        this.applyIdle(this.currentCol, this.currentRow);
      }
    }, 100);

    this.el.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      if (!this.destroying) this.startBlink(null);
    });

    // Nace desde la franja inferior con fade in inmediato
    const fadeDuration = 800;
    this.el.style.opacity = '0';
    this.el.style.transition = `opacity ${fadeDuration}ms`;
    setTimeout(() => this.el.style.opacity = '1', 20); // tick mínimo para que la transición arranque

    this.startClosedAnim();
    setTimeout(() => this.endBlink(100), 20);
  }

  applyIdle(col, row) {
    this.currentCol = col;
    this.currentRow = row;
    this.inStrip = false;
    this.el.style.backgroundPosition = `-${col * CELL_SIZE}px -${this.currentFrame * FRAME_HEIGHT + row * CELL_SIZE}px`;
  }

  applyStrip(col) {
    this.inStrip = true;
    this.el.style.backgroundPosition = `-${col * CELL_SIZE}px -${STRIP_Y}px`;
  }

  travel(destCol, destRow, onArrival, stepMs = STEP_MS) {
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

  startBlink(onComplete, stepMs = STEP_MS) {
    if (this.state !== 'idle') {
      if (onComplete) onComplete();
      return;
    }
    this.state = 'closing';
    clearTimeout(this.autoBlinkTimeout);

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

  endBlink(stepMs = STEP_MS) {
    if (this.state !== 'closing' && this.state !== 'closed') return;

    this.stopClosedAnim();
    if (this.travelInterval) {
      clearInterval(this.travelInterval);
      clearTimeout(this.travelInterval);
      this.travelInterval = null;
    }

    if (this.inStrip) this.applyIdle(CLOSED_COL, CLOSED_ROW);

    this.state = 'opening';
    const [destCol, destRow] = lastMouseEvent
      ? this.getCursorPosition(lastMouseEvent)
      : [4, 4];

    this.travel(destCol, destRow, () => {
      this.state = 'idle';
      if (!this.destroying) this.scheduleAutoBlink();
    }, stepMs);
  }

  scheduleAutoBlink() {
    clearTimeout(this.autoBlinkTimeout);
    const delay = 2000 + Math.random() * 3000;
    this.autoBlinkTimeout = setTimeout(() => {
      this.startBlink(() => setTimeout(() => this.endBlink(), 100));
    }, delay);
  }

  getCursorPosition(e) {
    const rect = this.el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    const nx = (dx / (window.innerWidth / 2) + 1) / 2;
    const ny = (dy / (window.innerHeight / 2) + 1) / 2;
    return [
      Math.min(CELLS - 1, Math.max(0, Math.floor(nx * CELLS))),
      Math.min(CELLS - 1, Math.max(0, Math.floor(ny * CELLS)))
    ];
  }

  updateFromCursor(e) {
    if (this.state !== 'idle') return;
    const [col, row] = this.getCursorPosition(e);
    this.applyIdle(col, row);
  }

  destroy(onRemoved) {
    this.destroying = true;
    clearTimeout(this.autoBlinkTimeout);

    const fadeDelay = 300;      // ms después del inicio del blink en que arranca el fade
    const fadeDuration = 800; // ms que dura el fade

    setTimeout(() => {
      this.el.style.transition = `opacity ${fadeDuration}ms`;
      this.el.style.opacity = '0';
      setTimeout(() => {
        clearInterval(this.idleInterval);
        this.stopClosedAnim();
        this.el.remove();
        if (onRemoved) onRemoved();
      }, fadeDuration);
    }, fadeDelay);

    // Blink corre en paralelo
    if (this.state === 'idle') {
      this.startBlink(null, 100);
    }
  }
}

function findPosition() {
  const margin = 50;
  const maxX = window.innerWidth - CELL_SIZE - margin;
  const maxY = window.innerHeight - CELL_SIZE - margin;
  const allEyes = [...activeEyes, ...fadingEyes];

  if (allEyes.length === 0) {
    return [margin + Math.random() * (maxX - margin),
            margin + Math.random() * (maxY - margin)];
  }

  // Muestrea 150 candidatos y elige el más alejado de todos los ojos
  let bestX = margin, bestY = margin, bestDist = -1;

  for (let i = 0; i < 150; i++) {
    const x = margin + Math.random() * (maxX - margin);
    const y = margin + Math.random() * (maxY - margin);

    const minDist = Math.min(...allEyes.map(eye =>
      Math.sqrt((x - eye.x) ** 2 + (y - eye.y) ** 2)
    ));

    if (minDist > bestDist) {
      bestDist = minDist;
      bestX = x;
      bestY = y;
    }
  }

  return [bestX, bestY];
}

function spawnEye() {
  const [x, y] = findPosition();
  const eye = new Eye(x, y);
  activeEyes.push(eye);

  if (activeEyes.length > MAX_EYES) {
    const oldest = activeEyes.shift();
    fadingEyes.push(oldest);
    oldest.destroy(() => {
      const idx = fadingEyes.indexOf(oldest);
      if (idx !== -1) fadingEyes.splice(idx, 1);
    });
  }
}

// Spawn inicial con ligero escalonado
for (let i = 0; i < MAX_EYES; i++) {
  setTimeout(() => spawnEye(), i * 300);
}

// Nuevo ojo cada 5 segundos
setInterval(spawnEye, 5000);

// Cursor global
document.addEventListener('mousemove', (e) => {
  lastMouseEvent = e;
  activeEyes.forEach(eye => eye.updateFromCursor(e));
});

// Mouseup global: abre cualquier ojo cerrado manualmente
document.addEventListener('mouseup', () => {
  activeEyes.forEach(eye => eye.endBlink());
});

const eye = document.getElementById('eye');
const debug = document.getElementById('debug');
const CELLS = 8;
const CELL_SIZE = 300;
const FRAME_HEIGHT = 2400;
const IDLE_FRAMES = 3;
const STEP_MS = 10;

// Posición destino en el grid idle (waypoint)
const CLOSED_COL = 3;
const CLOSED_ROW = 7;

// Franja inferior: fila especial fuera del grid idle
const STRIP_Y = 7200; // y absoluto en px de la franja inferior
const STRIP_ANIM_COLS = [1, 2, 3]; // cols que ciclan en el estado closed

let currentFrame = 0;
let currentCol = 0;
let currentRow = 0;

// Cuando inStrip=true, la posición se pinta en la franja inferior
let inStrip = false;
let stripCol = 0;
let stripAnimFrame = 0;

// Estados: 'idle', 'closing', 'closed', 'opening'
let state = 'idle';
let travelInterval = null;
let closedAnimInterval = null;
let lastMouseEvent = null;

eye.style.backgroundImage = "url('assets/sprite-draw.png')";
eye.style.backgroundSize = '2400px 7500px';

function applyIdle(col, row) {
  currentCol = col;
  currentRow = row;
  inStrip = false;
  const x = col * CELL_SIZE;
  const y = currentFrame * FRAME_HEIGHT + row * CELL_SIZE;
  eye.style.backgroundPosition = `-${x}px -${y}px`;
  debug.textContent = `col: ${col} · row: ${row} · frame: ${currentFrame} · ${state}`;
}

function applyStrip(col) {
  stripCol = col;
  inStrip = true;
  const x = col * CELL_SIZE;
  eye.style.backgroundPosition = `-${x}px -${STRIP_Y}px`;
  debug.textContent = `strip col: ${col} · ${state}`;
}

// Animación idle: corre en estado idle
setInterval(() => {
  if (state === 'idle') {
    currentFrame = (currentFrame + 1) % IDLE_FRAMES;
    applyIdle(currentCol, currentRow);
  }
}, 100);

function stepToward(col, row, destCol, destRow) {
  const nextCol = col + Math.sign(destCol - col);
  const nextRow = row + Math.sign(destRow - row);
  return [nextCol, nextRow];
}

function travel(destCol, destRow, onArrival) {
  if (travelInterval) clearInterval(travelInterval);
  travelInterval = setInterval(() => {
    if (currentCol === destCol && currentRow === destRow) {
      clearInterval(travelInterval);
      travelInterval = null;
      onArrival();
      return;
    }
    const [nextCol, nextRow] = stepToward(currentCol, currentRow, destCol, destRow);
    applyIdle(nextCol, nextRow);
  }, STEP_MS);
}

function startClosedAnim() {
  stripAnimFrame = 0;
  applyStrip(STRIP_ANIM_COLS[0]);
  closedAnimInterval = setInterval(() => {
    stripAnimFrame = (stripAnimFrame + 1) % STRIP_ANIM_COLS.length;
    applyStrip(STRIP_ANIM_COLS[stripAnimFrame]);
  }, 100);
}

function stopClosedAnim() {
  if (closedAnimInterval) {
    clearInterval(closedAnimInterval);
    closedAnimInterval = null;
  }
}

function getCursorPosition(e) {
  const rect = eye.getBoundingClientRect();
  const eyeCenterX = rect.left + rect.width / 2;
  const eyeCenterY = rect.top + rect.height / 2;
  const dx = e.clientX - eyeCenterX;
  const dy = e.clientY - eyeCenterY;
  const rangeX = window.innerWidth / 2;
  const rangeY = window.innerHeight / 2;
  const nx = (dx / rangeX + 1) / 2;
  const ny = (dy / rangeY + 1) / 2;
  const col = Math.min(CELLS - 1, Math.max(0, Math.floor(nx * CELLS)));
  const row = Math.min(CELLS - 1, Math.max(0, Math.floor(ny * CELLS)));
  return [col, row];
}

function updateEye(e) {
  if (state !== 'idle') return;
  const [col, row] = getCursorPosition(e);
  applyIdle(col, row);
}

document.addEventListener('mousemove', (e) => {
  lastMouseEvent = e;
  updateEye(e);
});

document.addEventListener('mousedown', () => {
  if (state !== 'idle') return;
  state = 'closing';

  // Fase 1: viaja a (3,7) en el grid idle
  travel(CLOSED_COL, CLOSED_ROW, () => {
    // Fase 2: salto directo a col0 de la franja, luego paso a col1
    applyStrip(0);
    travelInterval = setTimeout(() => {
      applyStrip(1);
      travelInterval = setTimeout(() => {
        // CLOSED: anima cols 1,2,3 en bucle
        state = 'closed';
        startClosedAnim();
      }, STEP_MS);
    }, STEP_MS);
  });
});

document.addEventListener('mouseup', () => {
  if (state === 'idle') return;

  stopClosedAnim();
  if (travelInterval) {
    clearInterval(travelInterval);
    clearTimeout(travelInterval);
    travelInterval = null;
  }

  // Si estaba en la franja, vuelve al grid idle desde (3,7)
  if (inStrip) {
    applyIdle(CLOSED_COL, CLOSED_ROW);
  }

  state = 'opening';
  const [destCol, destRow] = lastMouseEvent ? getCursorPosition(lastMouseEvent) : [currentCol, currentRow];

  travel(destCol, destRow, () => {
    state = 'idle';
  });
});

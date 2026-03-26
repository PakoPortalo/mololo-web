// AbsentEye extends Eye
// Ojo que se mueve independientemente del cursor

class AbsentEye extends Eye {
  constructor(x, y, parent = document.body) {
    super(x, y, parent);
    this.wanderTarget = { col: 4, row: 4 };
    this.wanderTimeout = null;
    this.autoBlinkTimeout = null;
    this.manualBlink = false;

    this.el.addEventListener('mousedown', () => {
      this.manualBlink = true;

      // Cancelar travel si está en curso
      if (this.state === 'traveling') {
        clearInterval(this.travelInterval);
        this.travelInterval = null;
        this.state = 'idle';
      }

      clearTimeout(this.autoBlinkTimeout);
      clearTimeout(this.wanderTimeout);

      this.startBlink(null, 10);
    });

    document.addEventListener('mouseup', () => {
      if (!this.manualBlink) return;
      this.manualBlink = false;
      this.endBlink(this.wanderTarget.col, this.wanderTarget.row, 20);
    });

    this.scheduleWander();
    this.scheduleAutoBlink();
  }

  scheduleWander() {
    clearTimeout(this.wanderTimeout);
    const delay = 700 + Math.random() * 1000;
    this.wanderTimeout = setTimeout(() => {
      this.wanderTarget = {
        col: Math.floor(Math.random() * 8),
        row: Math.floor(Math.random() * 8)
      };
      if (this.state === 'idle') this.executeWander();
      else this.scheduleWander();
    }, delay);
  }

  executeWander() {
    if (this.state !== 'idle') return;
    this.state = 'traveling';
    this.travel(this.wanderTarget.col, this.wanderTarget.row, () => {
      this.state = 'idle';
      this.onIdle();
    });
  }

  randomBlinkDelay() {
    const r = Math.random();
    return 1000 + Math.random() * 600;
  }

  scheduleAutoBlink() {
    clearTimeout(this.autoBlinkTimeout);
    this.autoBlinkTimeout = setTimeout(() => {
      if (this.state === 'idle') {
        const returnCol = this.currentCol;
        const returnRow = this.currentRow;
        this.startBlink(() => {
          this.endBlink(returnCol, returnRow, 40);
        }, 40);
      }
      // Si no está idle, onIdle() reagendará cuando llegue
    }, this.randomBlinkDelay());
  }

  onIdle() {
    this.scheduleWander();
    this.scheduleAutoBlink();
  }
}

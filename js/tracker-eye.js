// TrackerEye extends Eye
// Ojo que sigue el cursor

window.Mololo = window.Mololo || {};
Mololo.lastMouseEvent = null;

class TrackerEye extends Eye {
  constructor(x, y, parent = document.body) {
    super(x, y, parent);
    this.manualBlink = false;
    this.destroying = false;
    this.autoBlinkTimeout = null;

    // Fade in
    this.el.style.opacity = '0';
    this.el.style.transition = `opacity 800ms`;
    setTimeout(() => this.el.style.opacity = '1', 20);

    this.el.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      if (!this.destroying) {
        this.manualBlink = true;
        this.startBlink(null, 20);
      }
    });

    this._onMouseUp = () => {
      if (!this.manualBlink) return;
      this.manualBlink = false;
      const [col, row] = Mololo.lastMouseEvent
        ? this.getCursorPosition(Mololo.lastMouseEvent)
        : [4, 4];
      this.endBlink(col, row, 10);
    };
    document.addEventListener('mouseup', this._onMouseUp);

    // Nace cerrado, abre hacia el cursor
    this.state = 'closed';
    this.startClosedAnim();
    setTimeout(() => this.endBlink(4, 4), 20);
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

  scheduleAutoBlink() {
    clearTimeout(this.autoBlinkTimeout);
    const delay = 2000 + Math.random() * 3000;
    this.autoBlinkTimeout = setTimeout(() => {
      this.startBlink(() => {
        const [col, row] = Mololo.lastMouseEvent
          ? this.getCursorPosition(Mololo.lastMouseEvent)
          : [4, 4];
        setTimeout(() => this.endBlink(col, row), 100);
      });
    }, delay);
  }

  onIdle() {
    if (!this.destroying) this.scheduleAutoBlink();
  }

  destroy(onRemoved) {
    this.destroying = true;
    clearTimeout(this.autoBlinkTimeout);
    document.removeEventListener('mouseup', this._onMouseUp);

    setTimeout(() => {
      this.el.style.transition = `opacity 800ms`;
      this.el.style.opacity = '0';
      setTimeout(() => {
        clearInterval(this.idleInterval);
        this.stopClosedAnim();
        this.el.remove();
        if (onRemoved) onRemoved();
      }, 800);
    }, 300);

    if (this.state === 'idle') this.startBlink(null, 100);
  }
}

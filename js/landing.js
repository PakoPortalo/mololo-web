// ================================
// OJOS
// ================================

// Navbar: AbsentEye
new AbsentEye(0, 0, document.getElementById('nav-eye'));

// Newsletter: TrackerEye (Mololo.lastMouseEvent declarado en tracker-eye.js)
const eyeR = new TrackerEye(0, 0, document.getElementById('nl-eye-right'));

// Listener único de mousemove — los módulos desktop-only se registran aquí
const _mouseMoveCallbacks = [];
document.addEventListener('mousemove', (e) => {
  Mololo.lastMouseEvent = e;
  eyeR.updateFromCursor(e);
  _mouseMoveCallbacks.forEach(fn => fn(e));
});


// ================================
// HERO PARALLAX (solo desktop)
// ================================
if (!window.matchMedia('(max-width: 768px)').matches) {
  const heroImg = document.querySelector('.hero-right img');
  const strength = 25;
  let targetX = 0, targetY = 0, currentX = 0, currentY = 0;

  _mouseMoveCallbacks.push((e) => {
    targetX = ((e.clientX / window.innerWidth) - 0.5) * strength;
    targetY = ((e.clientY / window.innerHeight) - 0.5) * strength;
  });

  (function parallaxLoop() {
    currentX += (targetX - currentX) * 0.06;
    currentY += (targetY - currentY) * 0.06;
    heroImg.style.transform = `translate(${currentX}px, ${currentY}px)`;
    requestAnimationFrame(parallaxLoop);
  })();
}


// ================================
// TEXTURA PAPEL
// ================================
(function() {
  const size = 150;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const v = Math.random() * 255;
    imageData.data[i] = imageData.data[i+1] = imageData.data[i+2] = v;
    imageData.data[i+3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  const url = canvas.toDataURL();
  document.querySelectorAll('.papel').forEach(el => el.style.backgroundImage = `url(${url})`);
})();


// ================================
// BOTONES: alterna hover rosa / naranja
// ================================
['.btn-ver-mas', '#nl-submit', '.btn-tienda'].forEach(selector => {
  document.querySelectorAll(selector).forEach(el => {
    el.addEventListener('mouseenter', () => el.classList.toggle('hover-alt'));
  });
});


// ================================
// HOLOGRAPHIC CARD
// ================================
const holoCard = new HolographicCard(document.getElementById('artista-holo-card'), {
  src: 'assets/images/skull.png',
  width: 240,
  height: 240,
});



// ================================
// PALABRAS ILUMINADAS
// ================================
(function() {
  const N = '#ff8339', R = '#ff83ff';
  const IL_SEQ   = [N,R,R,N,N,R,N,R,N,N,R,R,N,R,N,R,R,N,R,N,N,R,N,R,N,R,R];
  const zoneIdx  = { a: 0, b: 0 };
  const MAX_ZONE = 3;
  const HOLD     = 4000;  // ms con el color en pico
  const FADE     = 5000;  // ms de transición (coincide con CSS)

  const zones = { a: [], b: [] };
  document.querySelectorAll('.il-candidate').forEach(el => {
    zones[el.dataset.zone].push(el);
  });

  function activeCount(zone) {
    return zones[zone].filter(el => el.classList.contains('il-on')).length;
  }

  function lightNext(zone) {
    if (activeCount(zone) >= MAX_ZONE) {
      setTimeout(() => lightNext(zone), 800);
      return;
    }
    const available = zones[zone].filter(el => !el.classList.contains('il-on'));
    if (!available.length) return;

    const el = available[Math.floor(Math.random() * available.length)];
    const color = IL_SEQ[zoneIdx[zone] % IL_SEQ.length];
    zoneIdx[zone]++;

    el.classList.add('il-on');
    el.style.color = color;

    setTimeout(() => {
      el.classList.remove('il-on');
      el.style.color = '';
      const pausa = 3000 + Math.random() * 2000;
      setTimeout(() => lightNext(zone), pausa + FADE);
    }, HOLD);

    const retardo = 3000 + Math.random() * 3000;
    setTimeout(() => lightNext(zone), retardo);
  }

  lightNext('a');
  setTimeout(() => lightNext('a'), 2000);
  setTimeout(() => lightNext('b'), 1000);
  setTimeout(() => lightNext('b'), 3500);
})();


// ================================
// GREETING: frases en el navbar, solo en el hero (desktop)
// ================================
(function() {
  const el = document.getElementById('nav-greeting');
  if (!el || window.matchMedia('(max-width: 768px)').matches) return;

  const phrases = ['Hola!', 'Hello!', '你好!', 'नमस्ते!', 'مرحبًا!', 'สวัสดี!'];
  let idx = 0;
  let inHero = true;
  let t = null;

  function showNext() {
    if (!inHero) { el.classList.remove('visible'); return; }
    el.textContent = phrases[idx];
    el.classList.add('visible');
    idx = (idx + 1) % phrases.length;
    t = setTimeout(() => {
      el.classList.remove('visible');
      t = setTimeout(showNext, 1800);
    }, 3500);
  }

  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      inHero = true;
      clearTimeout(t);
      el.classList.remove('visible');
      idx = 0;
      t = setTimeout(showNext, 400);
    } else {
      inHero = false; // la frase actual termina y para
    }
  }, { threshold: 0 }).observe(document.querySelector('.ticker'));

  showNext();
})();


// ================================
// LOGO NAVBAR: aparece al salir del hero
// ================================
const navLogo = document.querySelector('.nav-logo');
new IntersectionObserver(([entry]) => {
  navLogo.classList.toggle('visible', !entry.isIntersecting);
}, { threshold: 0 }).observe(document.querySelector('.ticker'));


// ================================
// SCROLL SUAVE DESDE NAVBAR
// ================================
['#artista', '#encargos'].forEach(selector => {
  document.querySelectorAll(`a[href="${selector}"]`).forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(selector);
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
});

// Tab stops de contenido: scroll síncrono al recibir foco
// (evita el desfase del scroll-into-view asíncrono del navegador)
(function () {
  const stops = document.querySelectorAll(
    '.artista-header-titulo h2[tabindex], .artista-body p[tabindex], ' +
    '.artista-pull-quote[tabindex], #artista-holo-card[tabindex], ' +
    '.encargos-titulo[tabindex]'
  );
  stops.forEach(el => {
    el.addEventListener('focus', () => {
      const rect = el.getBoundingClientRect();
      const targetY = window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2;
      window.scrollTo(0, Math.max(0, targetY));
    });
  });
})();

// Cuadro-marco: al recibir foco, scroll idéntico al botón ENCARGOS del navbar
const cuadroMarco = document.getElementById('cuadro-marco');
if (cuadroMarco) {
  cuadroMarco.addEventListener('focus', () => {
    const target = document.querySelector('#encargos');
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: 'smooth' });
  });
}


// ================================
// HAMBURGER MENU
// ================================
const hamburger = document.getElementById('nav-hamburger');
const mobileMenu = document.getElementById('nav-mobile-menu');
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});
mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
  });
});


// ================================
// OBRA: cursor local distortion (solo desktop)
// ================================
(function() {
  if (window.matchMedia('(max-width: 768px)').matches) return;
  const obraH2 = document.querySelector('.artista-header-titulo h2');
  const cursorMap = document.getElementById('obra-cursor-map');
  const cursorDisp = document.getElementById('obra-cursor-disp');
  const RADIUS = 150;
  const INTENSITY = 40;
  let currentScale = 0;
  let targetScale = 0;

  (function animate() {
    currentScale += (targetScale - currentScale) * 0.08;
    cursorDisp.setAttribute('scale', currentScale.toFixed(2));
    requestAnimationFrame(animate);
  })();

  _mouseMoveCallbacks.push((e) => {
    const rect = obraH2.getBoundingClientRect();
    cursorMap.setAttribute('x', e.clientX - rect.left - RADIUS);
    cursorMap.setAttribute('y', e.clientY - rect.top - RADIUS);
    cursorMap.setAttribute('width', RADIUS * 2);
    cursorMap.setAttribute('height', RADIUS * 2);

    const over = e.clientX >= rect.left && e.clientX <= rect.right &&
                 e.clientY >= rect.top  && e.clientY <= rect.bottom;
    targetScale = over ? INTENSITY : 0;
  });
})();


// ================================
// ARTISTA HEADER PARALLAX
// ================================
(function() {
  const artistaImg = document.querySelector('.artista-header img');
  const artistaSection = document.querySelector('.artista-header');

  function updateArtistaParallax() {
    const rect = artistaSection.getBoundingClientRect();
    const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
    const translateY = -progress * 18;
    artistaImg.style.transform = `translateY(${translateY}%)`;
  }

  updateArtistaParallax();
  window.addEventListener('scroll', updateArtistaParallax, { passive: true });
})();


// ================================
// PULL QUOTE: se activa por scroll en móvil y desktop
// ================================
(function() {
  const pullQuote = document.querySelector('.artista-pull-quote');
  if (window.matchMedia('(max-width: 768px)').matches) {
    // Mobile: activar una vez permanentemente
    new IntersectionObserver(([entry], obs) => {
      if (entry.isIntersecting) {
        pullQuote.style.filter = 'grayscale(0) brightness(1)';
        obs.unobserve(pullQuote);
      }
    }, { rootMargin: '0px 0px -50% 0px', threshold: 0 }).observe(pullQuote);
  } else {
    // Desktop: toggle al cruzar la mitad de pantalla
    new IntersectionObserver(([entry]) => {
      pullQuote.classList.toggle('scroll-active', entry.isIntersecting);
    }, { rootMargin: '0px 0px -50% 0px', threshold: 0 }).observe(pullQuote);
  }
})();


// ================================
// MÓDULO 4: LUPA
// ================================
(function () {
  const img    = document.getElementById('cuadro-img');
  const canvas = document.getElementById('cuadro-lens-canvas');
  const marco  = document.getElementById('cuadro-marco');
  if (!img || !canvas || !marco) return;

  const ctx = canvas.getContext('2d');

  // Imagen sin filtros CSS para que el canvas siempre dibuje nítido
  const lensImg = new Image();
  lensImg.src = img.src;
  const isMobile = window.matchMedia('(hover: none)').matches;
  if (isMobile) return;

  let cursor      = null;
  let currentR    = 0;
  let targetR     = 0;
  let autoPhase   = 0;
  let touchActive = false;
  let rafId       = null;
  let lastPt      = null;

  const LENS_R  = 120;
  const ZOOM    = 2;
  const LERP_SP = 0.14;

  let cssW = 0, cssH = 0;

  function resizeLens() {
    const dpr = window.devicePixelRatio || 1;
    cssW = window.innerWidth;
    cssH = window.innerHeight;
    canvas.width  = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.width  = cssW + 'px';
    canvas.style.height = cssH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function drawLens(x, y, r) {
    if (r < 1) return;

    const imgRect = img.getBoundingClientRect();
    const imgX = x - imgRect.left;
    const imgY = y - imgRect.top;
    const lensD  = r * 2;
    const scaleX = img.naturalWidth  / imgRect.width;
    const scaleY = img.naturalHeight / imgRect.height;
    const srcW = (lensD / ZOOM) * scaleX;
    const srcH = (lensD / ZOOM) * scaleY;
    const srcX = Math.max(0, Math.min(imgX * scaleX - srcW / 2, img.naturalWidth  - srcW));
    const srcY = Math.max(0, Math.min(imgY * scaleY - srcH / 2, img.naturalHeight - srcH));

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(lensImg, srcX, srcY, srcW, srcH, x - r, y - r, lensD, lensD);

    // Viñeta interior
    const vig = ctx.createRadialGradient(x, y, r * 0.52, x, y, r);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.13)');
    ctx.fillStyle = vig;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Destello
    const glare = ctx.createRadialGradient(x - r * 0.28, y - r * 0.28, 0, x - r * 0.1, y - r * 0.1, r * 0.65);
    glare.addColorStop(0, 'rgba(255,255,255,0.14)');
    glare.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glare;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Sombra exterior
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r + 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Aro dorado
    ctx.save();
    const rim = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    rim.addColorStop(0.00, '#d4a843');
    rim.addColorStop(0.30, '#ffe9a8');
    rim.addColorStop(0.60, '#c89830');
    rim.addColorStop(1.00, '#7a5510');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = rim;
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.restore();
  }

  function getAutoPoint() {
    const imgRect = img.getBoundingClientRect();
    const margin = LENS_R + 28;
    const cx = imgRect.left + imgRect.width  / 2;
    const cy = imgRect.top  + imgRect.height / 2;
    const rx = imgRect.width  / 2 - margin;
    const ry = imgRect.height / 2 - margin;
    const corners = [
      [cx,      cy - ry],
      [cx + rx, cy],
      [cx,      cy + ry],
      [cx - rx, cy],
    ];
    const t   = (autoPhase % 1) * 4;
    const seg = Math.floor(t) % 4;
    const f   = t - Math.floor(t);
    const fr  = corners[seg];
    const to  = corners[(seg + 1) % 4];
    return { x: fr[0] + (to[0] - fr[0]) * f, y: fr[1] + (to[1] - fr[1]) * f };
  }

  function frameLens() {
    ctx.clearRect(0, 0, cssW, cssH);
    let pt;
    if (isMobile && !touchActive) {
      autoPhase += 0.001;
      pt = getAutoPoint();
      targetR = LENS_R;
    } else if (cursor) {
      pt = cursor;
      targetR = LENS_R;
    } else {
      targetR = 0;
      pt = lastPt;
    }
    if (pt) lastPt = pt;
    currentR = lerp(currentR, targetR, LERP_SP);
    if (pt && currentR > 1) drawLens(pt.x, pt.y, currentR);
    rafId = requestAnimationFrame(frameLens);
  }

  marco.addEventListener('mousemove', e => { cursor = { x: e.clientX, y: e.clientY }; });
  marco.addEventListener('mouseleave', () => { cursor = null; });
  marco.addEventListener('touchstart', e => {
    touchActive = true;
    cursor = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  marco.addEventListener('touchmove', e => {
    e.preventDefault();
    cursor = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: false });
  marco.addEventListener('touchend', () => { touchActive = false; cursor = null; });

  window.addEventListener('resize', resizeLens);

  function initLens() {
    resizeLens();
    if (isMobile) targetR = LENS_R;
    if (rafId) cancelAnimationFrame(rafId);
    frameLens();
  }

  if (img.complete && img.naturalWidth) {
    initLens();
  } else {
    img.addEventListener('load', initLens);
  }
})();


// ================================
// NEWSLETTER: suscripción Mailchimp sin salir de la página
// ================================
(function () {
  const form = document.getElementById('nl-form');
  const ok   = document.getElementById('nl-ok');
  if (!form || !ok) return;

  let sending = false;

  function subscribe() {
    if (sending) return;
    const email = form.querySelector('[name="EMAIL"]').value.trim();
    if (!email) return;
    sending = true;
    btn.disabled = true;
    btn.innerHTML = '<span class="nl-spinner"></span>';

    const base = 'https://gmail.us8.list-manage.com/subscribe/post-json';
    const params = new URLSearchParams({
      u: '276dfd967b8cc6a77df406b2b',
      id: 'a4e99d727c',
      f_id: '008d11e1f0',
      EMAIL: email,
      'b_276dfd967b8cc6a77df406b2b_a4e99d727c': '',
    });
    const cbName = 'mc_cb_' + Date.now();
    params.set('c', cbName);

    window[cbName] = function (data) {
      delete window[cbName];
      document.head.removeChild(script);

      const fadeEls = [form, document.getElementById('nl-sub'), document.querySelector('.newsletter-titulo')];
      const msg = (data.msg && (data.msg.includes('already') || data.msg.includes('ya')))
        ? '¡Ya estás en la lista!'
        : '¡Gracias, ya eres parte de mololo!';

      fadeEls.forEach(el => el && (el.style.opacity = '0'));
      setTimeout(() => {
        fadeEls.forEach(el => el && (el.style.display = 'none'));
        ok.textContent = msg;
        ok.style.display = 'block';
        requestAnimationFrame(() => requestAnimationFrame(() => { ok.style.opacity = '1'; }));
      }, 500);
    };

    const script = document.createElement('script');
    script.src = base + '?' + params.toString();
    document.head.appendChild(script);
  }

  const btn = form.querySelector('#nl-submit');

  btn.addEventListener('click', function () {
    const emailInput = form.querySelector('[name="EMAIL"]');
    if (!emailInput.value.trim() || !emailInput.checkValidity()) {
      emailInput.reportValidity();
      return;
    }
    subscribe();
  });
})();

// ================================
// OJOS
// ================================

// Navbar: AbsentEye
new AbsentEye(0, 0, document.getElementById('nav-eye'));

// Newsletter: TrackerEye (lastMouseEvent declarado en tracker-eye.js)
const eyeR = new TrackerEye(0, 0, document.getElementById('nl-eye-right'));

document.addEventListener('mousemove', (e) => {
  lastMouseEvent = e;
  eyeR.updateFromCursor(e);
});


// ================================
// HERO PARALLAX (solo desktop)
// ================================
if (!window.matchMedia('(max-width: 768px)').matches) {
  const heroImg = document.querySelector('.hero-right img');
  const strength = 10;
  let targetX = 0, targetY = 0, currentX = 0, currentY = 0;

  document.addEventListener('mousemove', (e) => {
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
  const el = document.querySelector(selector);
  if (el) el.addEventListener('mouseenter', () => el.classList.toggle('hover-alt'));
});


// ================================
// HOLOGRAPHIC CARD
// ================================
const holoCard = new HolographicCard(document.getElementById('artista-holo-card'), {
  src: 'assets/images/skull.png',
  width: 240,
  height: 240,
});
if (window.matchMedia('(max-width: 768px)').matches) {
  holoCard.startMobileAnimation();
}


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
// LOGO NAVBAR: aparece al salir del hero
// ================================
const navLogo = document.querySelector('.nav-logo');
const heroSection = document.querySelector('.hero');
new IntersectionObserver(([entry]) => {
  navLogo.classList.toggle('visible', !entry.isIntersecting);
}, { threshold: 0 }).observe(heroSection);


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

  document.addEventListener('mousemove', (e) => {
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
// PULL QUOTE: en móvil se activa por scroll
// ================================
if (window.matchMedia('(max-width: 768px)').matches) {
  const pullQuote = document.querySelector('.artista-pull-quote');
  new IntersectionObserver(([entry], obs) => {
    if (entry.isIntersecting) {
      pullQuote.style.filter = 'grayscale(0) brightness(1)';
      obs.unobserve(pullQuote);
    }
  }, { rootMargin: '0px 0px -50% 0px', threshold: 0 }).observe(pullQuote);
}

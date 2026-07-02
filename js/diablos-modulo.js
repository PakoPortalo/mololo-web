/* ══════════════════════════════════════════════════════════════════════════
   Módulo "Cada cual con sus diablos"
   - 3 columnas de diablos en cinta infinita (loop de 6 por columna).
   - Scroll 1:1 directo (sin latencia) + deriva automática con rampa suave
     cuando no se scrollea (traspaso sin parones).
   - Logo central: revelado por scroll + tilt 3D siguiendo el ratón.
   - Imán sutil: los diablos de las columnas laterales se dejan arrastrar
     unos píxeles hacia el cursor y vuelven con muelle.
   Requiere el markup: #diablosModulo > .diablos-pin > #colLeft/#colCenter/
   #colRight + #diablosLogo > #diablosLogoImg  (ver css/diablos-modulo.css)
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var section = document.getElementById("diablosModulo");
  if (!section) return; // página sin módulo

  var ICONS_PER_COL = 6;  // 6 por columna → 18 diablos, todos en UN sprite sheet
  var TOTAL_ROWS = 18;    // filas del sheet (diablos únicos)

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function shuffle(arr) {
    for (var j = arr.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var t = arr[j]; arr[j] = arr[k]; arr[k] = t;
    }
    return arr;
  }

  // crea un diablo: un div con su propio archivo (dNN.webp, 3 fotogramas de
  // boil apilados). row = qué diablo (0..17). El boil (background-position-y)
  // lo lleva la clase .boil — horneado y baratísimo, así que hierven TODOS.
  function makeDiablo(row) {
    var d = document.createElement("div");
    d.className = "diablo-icon";
    d.style.backgroundImage =
      "url(assets/diablos-import/diablos/d" + String(row + 1).padStart(2, "0") + ".webp)";
    var rot = (Math.random() * 14 - 7).toFixed(1);
    var scale = (0.96 + Math.random() * 0.08).toFixed(2); // variación mínima: todos ~igual de grandes
    d.style.transform = "rotate(" + rot + "deg) scale(" + scale + ")";
    if (!prefersReducedMotion) {
      d.classList.add("boil");
      d.style.animationDelay = (-Math.random() * 0.45).toFixed(2) + "s"; // desincroniza el hervor
    }
    return d;
  }

  function fillColumn(col, rows) {
    col.base = rows.map(makeDiablo);
  }

  var GAP = 22; // debe coincidir con el gap del CSS .diablos-track

  // ── columnas: cinta infinita, movida por el scroll (1:1) + deriva automática.
  //    factor = parallax (signo = sentido) ──────────────────────────────────
  var cols = [
    { el: document.getElementById("colLeft"),   factor: -0.15, pos: 0, H: 1, base: null },
    { el: document.getElementById("colCenter"), factor:  0.36, pos: 0, H: 1, base: null },
    { el: document.getElementById("colRight"),  factor: -0.15, pos: 0, H: 1, base: null },
  ];
  var colLeft = cols[0].el, colCenter = cols[1].el;

  // reparte los 18 diablos: 6 por columna (la creación real ocurre en boot(),
  // en diferido, para no descargar ni una imagen hasta acercarse al módulo)
  var allRows = [];
  for (var r = 0; r < TOTAL_ROWS; r++) allRows.push(r);
  shuffle(allRows);

  var logoEl = document.getElementById("diablosLogo");
  var markEl = document.getElementById("diablosLogoImg");
  var btnEl = logoEl.querySelector(".diablos-btn");
  var navEl = document.querySelector("nav"); // navbar de la página (si existe)
  var NAV_H = 60;

  var sectionTop = 0;
  var sectionBottom = 0;
  var scrollRange = 1;

  var CENTER_START = 0.25; // el logo se revela pronto y se queda centrado mucho más scroll
  var CENTER_END = 0.40;
  var BTN_START = 0.60;    // el temporizador del botón arranca cuando el logo va por este % de opacidad
  var BTN_DELAY_MS = 550; // y el botón aparece este tiempo después
  var logoHover = false;   // hover sobre el LOGO (no el botón): zoom del logo
  var btnShownAt = null;   // instante en que arrancó el temporizador del botón

  // ── ratón: alimenta el tilt 3D del logo y el imán de los diablos laterales ─
  var mouseX = null, mouseY = null;
  window.addEventListener("mousemove", function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  document.documentElement.addEventListener("mouseleave", function () {
    mouseX = null;
    mouseY = null;
  });

  // imán: radio de influencia y tirón máximo (sutil: se queda "pegado" unos
  // píxeles al cursor y vuelve solo con muelle al alejarse)
  var MAGNET_R = 200;
  var MAGNET_PULL = 0.18;
  var MAGNET_EASE = 0.12;

  var rawP = 0;
  var smoothedP = 0;
  var EASE = prefersReducedMotion ? 1 : 0.12;

  // ── movimiento ──────────────────────────────────────────────────────────
  // El scroll mueve las columnas 1:1 (delta directo × factor → cero latencia).
  // El automático es una capa aparte que entra con rampa suave al soltar y se
  // apaga rápido al volver a scrollear: las velocidades se solapan con la
  // inercia nativa del trackpad y no hay parón ni salto.
  var AUTO_SCROLLVEL = 0.28;  // "px de scroll equivalente" por ms del automático
  var AUTO_RAMP_IN = 0.045;   // qué tan suave entra el auto al soltar el scroll
  var AUTO_RAMP_OUT = 0.25;   // qué tan rápido se apaga al volver a scrollear
  var INPUT_WINDOW_MS = 140;  // margen para considerar que sigues scrolleando
  var autoStrength = 0;
  var lastScrollY = null;
  var lastInputTime = -1e9;
  var lastTickTime = performance.now();

  // ── diablos del centro bajo el logo: se atenúan para dar presencia al título ─
  var FADE_RADIUS_FACTOR = 0.24;
  var FADE_MAX_DIM = 0.72;

  function clamp01(v) { return Math.min(1, Math.max(0, v)); }

  function smoothstep(edge0, edge1, x) {
    var t = clamp01((x - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
  }

  // (re)construye el loop de una columna: mide la altura de un set de 6 y
  // clona los diablos las veces necesarias para cubrir el viewport + 1 set
  function buildLoop(col) {
    if (!col.base) return;
    // columna oculta por el CSS responsive (laterales en móvil): no construir
    col.hidden = col.el.offsetParent === null;
    if (col.hidden) {
      while (col.el.firstChild) col.el.removeChild(col.el.firstChild);
      col.metas = null;
      return;
    }
    var vh = window.innerHeight;
    while (col.el.firstChild) col.el.removeChild(col.el.firstChild);
    col.base.forEach(function (n) { col.el.appendChild(n); });
    // periodo = alto del set de 6 + 1 gap (para que el salto del loop sea invisible)
    col.H = col.el.scrollHeight + GAP;
    var copies = Math.max(2, Math.ceil(vh / col.H) + 1);
    for (var c = 1; c < copies; c++) {
      col.base.forEach(function (n) { col.el.appendChild(n.cloneNode(true)); });
    }
    // pre-mide los centros de los diablos (evita leer layout en cada frame):
    // en el centro se usan para el fade bajo el logo; en las laterales para
    // el efecto imán del cursor
    col.cx = col.el.getBoundingClientRect().left + col.el.offsetWidth / 2;
    col.metas = Array.prototype.map.call(col.el.children, function (c2) {
      return {
        el: c2,
        cy: c2.offsetTop + c2.offsetHeight / 2,
        base: c2.style.transform,
        ox: 0, oy: 0,          // offset actual del imán (con muelle)
        lastOp: "", lastTr: ""
      };
    });
  }

  function recomputeLayout() {
    sectionTop = section.offsetTop;
    sectionBottom = sectionTop + section.offsetHeight;
    scrollRange = Math.max(1, section.offsetHeight - window.innerHeight);
    cols.forEach(buildLoop);
  }

  function tick() {
    var now = performance.now();
    var dt = Math.min(64, now - lastTickTime); // clamp para pestañas en 2º plano
    lastTickTime = now;

    // ── delta de scroll (px, con signo) ──
    var scrollY = window.scrollY || window.pageYOffset;
    if (lastScrollY === null) lastScrollY = scrollY;
    var delta = scrollY - lastScrollY;
    lastScrollY = scrollY;
    if (Math.abs(delta) > 0.01) lastInputTime = now;
    var scrolling = (now - lastInputTime) < INPUT_WINDOW_MS;

    // ── navbar en modo diablos mientras el módulo está bajo él ──
    if (navEl) {
      var navInModule = (scrollY + NAV_H) >= sectionTop && (scrollY + NAV_H) < sectionBottom;
      navEl.classList.toggle("nav-diablos", navInModule);
    }

    // ── logo: revelado según el scroll real por la sección ──
    // (el -26px sube el conjunto para que logo+botón queden centrados como unidad)
    rawP = clamp01((scrollY - sectionTop) / scrollRange);
    smoothedP += (rawP - smoothedP) * EASE;
    if (Math.abs(smoothedP - rawP) < 0.0005) smoothedP = rawP;
    var logoT = smoothstep(CENTER_START, CENTER_END, smoothedP);
    logoEl.style.opacity = logoT;
    logoEl.style.transform = "translate(-50%, calc(-50% - 26px)) scale(" + (0.82 + logoT * 0.18) + ")";
    logoEl.classList.toggle("is-visible", logoT > 0.98);

    // ── botón "saber más": el temporizador arranca cuando el logo va por
    //    BTN_START (75%) de su fade-in; el botón aparece BTN_DELAY_MS después ──
    if (btnEl) {
      if (logoT > BTN_START) {
        if (btnShownAt === null) btnShownAt = now;
        btnEl.classList.toggle("is-on", now - btnShownAt > BTN_DELAY_MS);
      } else {
        btnShownAt = null;
        btnEl.classList.remove("is-on");
      }
    }

    // ── tilt 3D: el logo se inclina siguiendo el ratón ──
    if (!prefersReducedMotion) {
      var nx = 0, ny = 0;
      if (mouseX !== null) {
        nx = (mouseX / window.innerWidth - 0.5) * 2;
        ny = (mouseY / window.innerHeight - 0.5) * 2;
      }
      markEl.style.transform =
        "perspective(700px)" +
        " rotateY(" + (nx * 10 * logoT).toFixed(2) + "deg)" +
        " rotateX(" + (-ny * 8 * logoT).toFixed(2) + "deg)" +
        (logoHover ? " scale(1.12)" : "");
    }

    // ── rampa del automático (el hover del logo NO lo detiene) ──
    var autoTarget = (scrolling || prefersReducedMotion) ? 0 : 1;
    autoStrength += (autoTarget - autoStrength) * (autoTarget === 0 ? AUTO_RAMP_OUT : AUTO_RAMP_IN);

    // ── columnas: scroll directo 1:1 + capa automática + loop ──
    var vh = window.innerHeight;
    var viewportCenter = vh / 2;
    var fadeRadius = vh * FADE_RADIUS_FACTOR;

    for (var i = 0; i < cols.length; i++) {
      var col = cols[i];
      if (col.hidden) continue; // laterales ocultas en móvil
      col.pos += delta * col.factor;                              // 1:1 con el scroll
      col.pos += AUTO_SCROLLVEL * autoStrength * col.factor * dt; // deriva automática

      var wrapped = ((col.pos % col.H) + col.H) % col.H;
      var ty = -wrapped;
      col.el.style.transform = "translateY(" + ty + "px)";

      if (!col.metas) continue;
      var isCenter = col.el === colCenter;

      for (var k = 0; k < col.metas.length; k++) {
        var m = col.metas[k];
        var screenY = m.cy + ty;

        if (isCenter) {
          // fade bajo el logo para darle presencia al título
          var proximity = 1 - clamp01(Math.abs(screenY - viewportCenter) / fadeRadius);
          var op = (0.9 - proximity * logoT * FADE_MAX_DIM).toFixed(2);
          if (op !== m.lastOp) { m.el.style.opacity = op; m.lastOp = op; }
        } else if (!prefersReducedMotion) {
          // imán sutil: el diablo se deja arrastrar unos píxeles hacia el
          // cursor y vuelve a su sitio con muelle cuando este se aleja
          var tx = 0, tyM = 0;
          if (mouseX !== null) {
            var dx = mouseX - col.cx;
            var dy = mouseY - screenY;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < MAGNET_R) {
              var pull = (1 - dist / MAGNET_R) * MAGNET_PULL;
              tx = dx * pull;
              tyM = dy * pull;
            }
          }
          m.ox += (tx - m.ox) * MAGNET_EASE;
          m.oy += (tyM - m.oy) * MAGNET_EASE;
          if (Math.abs(m.ox) > 0.05 || Math.abs(m.oy) > 0.05) {
            var tr = "translate(" + m.ox.toFixed(1) + "px," + m.oy.toFixed(1) + "px) " + m.base;
            if (tr !== m.lastTr) { m.el.style.transform = tr; m.lastTr = tr; }
          } else if (m.lastTr !== m.base) {
            m.el.style.transform = m.base;
            m.lastTr = m.base;
          }
        }
      }
    }

    requestAnimationFrame(tick);
  }

  // ── arranque en diferido: nada del módulo (18 diablos + logo, ~1.8MB) se
  //    descarga ni se construye hasta que el scroll se acerca a la sección ──
  var booted = false;
  function boot() {
    if (booted) return;
    booted = true;

    fillColumn(cols[0], allRows.slice(0, ICONS_PER_COL));
    fillColumn(cols[1], allRows.slice(ICONS_PER_COL, ICONS_PER_COL * 2));
    fillColumn(cols[2], allRows.slice(ICONS_PER_COL * 2, ICONS_PER_COL * 3));
    markEl.style.backgroundImage = "url(assets/diablos-import/logo-boil-sheet.webp)";

    window.addEventListener("resize", recomputeLayout);
    if (window.ResizeObserver) {
      new ResizeObserver(recomputeLayout).observe(colLeft);
    }
    recomputeLayout();
    // arranca cada columna en una fase distinta para que no coincidan
    cols.forEach(function (col) { col.pos = Math.random() * col.H; });
    requestAnimationFrame(tick);
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) { io.disconnect(); boot(); return; }
      }
    }, { rootMargin: "200% 0px" }); // dispara ~2 pantallas antes de llegar
    io.observe(section);
  } else {
    boot();
  }

  // ── hover del LOGO (no del botón): zoom del logo vía el tilt del tick ──
  markEl.addEventListener("mouseenter", function () { logoHover = true; });
  markEl.addEventListener("mouseleave", function () { logoHover = false; });

  // ── click en el logo: comportamiento a definir ──────────────────────────
  logoEl.addEventListener("click", function () {
    console.log("[diablos-logo] click — comportamiento pendiente de definir");
  });
})();

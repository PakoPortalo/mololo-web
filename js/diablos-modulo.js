/* ══════════════════════════════════════════════════════════════════════════
   Módulo "Cada cual con sus diablos"
   - 5 columnas (desktop) de diablos en cinta infinita (loop de 6 por
     columna). Solo hay 18 diablos horneados, así que con 30 huecos (5×6)
     se reparten con repetición controlada (ver buildIconPool más abajo).
   - Scroll 1:1 directo (sin latencia) + deriva automática con rampa suave
     cuando no se scrollea (traspaso sin parones).
   - Logo central: revelado por scroll + tilt 3D siguiendo el ratón.
   - Imán sutil: los diablos de las columnas no-centrales se dejan arrastrar
     unos píxeles hacia el cursor y vuelven con muelle.
   Requiere el markup: #diablosModulo > .diablos-pin > #colOuterLeft/
   #colLeft/#colCenter/#colRight/#colOuterRight + #diablosLogo >
   #diablosLogoImg  (ver css/diablos-modulo.css)
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var section = document.getElementById("diablosModulo");
  if (!section) return; // página sin módulo

  var ICONS_PER_COL = 6;  // 6 por columna
  var TOTAL_ROWS = 18;    // diablos horneados únicos (assets/diablos-import/diablos/d01..d18.webp)

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
  //    factor = parallax (signo = sentido, alterna entre columnas contiguas) ──
  var cols = [
    { el: document.getElementById("colOuterLeft"),  factor: -0.15, pos: 0, H: 1, base: null },
    { el: document.getElementById("colLeft"),       factor:  0.20, pos: 0, H: 1, base: null },
    { el: document.getElementById("colCenter"),     factor: -0.36, pos: 0, H: 1, base: null },
    { el: document.getElementById("colRight"),      factor:  0.20, pos: 0, H: 1, base: null },
    { el: document.getElementById("colOuterRight"), factor: -0.15, pos: 0, H: 1, base: null },
  ];
  var colCenter = cols[2].el;

  // reparte ICONS_PER_COL * cols.length diablos entre las columnas. Solo hay
  // TOTAL_ROWS (18) diablos horneados para 30 huecos, así que 12 se repiten
  // por fuerza — pero: (a) ningún diablo se repite más de 2 veces, y
  // (b) las dos copias de un mismo diablo nunca caen en la misma columna ni
  // en columnas contiguas (mínimo 2 de distancia), así que casi no se notan.
  var TOTAL_ICONS = ICONS_PER_COL * cols.length;
  var iconPool = buildIconPool(TOTAL_ICONS, TOTAL_ROWS, ICONS_PER_COL, cols.length);

  // baraja TOTAL_ROWS diablos únicos, añade los repetidos necesarios (máx.
  // 1 repetición cada uno) y reparte en columnas: nunca deja dos copias del
  // mismo diablo en la MISMA columna (regla dura), y prueba varias veces a
  // que tampoco caigan en columnas contiguas (se queda con el mejor intento).
  function buildIconPool(totalIcons, uniqueCount, perColumn, numCols) {
    var extraNeeded = totalIcons - uniqueCount; // cuántos huecos sobran sobre los únicos

    function attempt() {
      var pool = [];
      for (var r = 0; r < uniqueCount; r++) pool.push(r);
      shuffle(pool);
      var extras = shuffle(pool.slice(0, Math.max(0, extraNeeded))); // se repiten, máx. 1 vez cada uno
      var pending = shuffle(pool.concat(extras));

      var columns = [];
      for (var c = 0; c < numCols; c++) columns.push([]);

      for (var col = 0; col < numCols; col++) {
        while (columns[col].length < perColumn && pending.length) {
          var bestIdx = -1, bestScore = -1;
          for (var i = 0; i < pending.length; i++) {
            if (columns[col].indexOf(pending[i]) !== -1) continue; // misma columna: nunca
            var adjacent = false;
            for (var c2 = 0; c2 < numCols; c2++) {
              if (Math.abs(c2 - col) === 1 && columns[c2].indexOf(pending[i]) !== -1) { adjacent = true; break; }
            }
            var score = adjacent ? 0 : 1;
            if (score > bestScore) { bestScore = score; bestIdx = i; if (score === 1) break; }
          }
          if (bestIdx === -1) bestIdx = 0; // caso extremo: acepta lo que quede (nunca debería pasar aquí)
          columns[col].push(pending.splice(bestIdx, 1)[0]);
        }
      }
      return columns;
    }

    function countAdjacentViolations(columns) {
      var n = 0;
      for (var col = 0; col < columns.length - 1; col++) {
        columns[col].forEach(function (id) {
          if (columns[col + 1].indexOf(id) !== -1) n++;
        });
      }
      return n;
    }

    var best = null, bestViolations = Infinity;
    for (var t = 0; t < 40 && bestViolations > 0; t++) {
      var candidate = attempt();
      var violations = countAdjacentViolations(candidate);
      if (violations < bestViolations) { bestViolations = violations; best = candidate; }
    }
    return best;
  }

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
  // en móvil el módulo es más corto (ver el media query del CSS) y además el
  // logo se revela mucho antes: si no, hay que arrastrar demasiado scroll
  // para que aparezca y otro tanto para salir del módulo.
  var MOBILE_CENTER_START = 0.08;
  var MOBILE_CENTER_END = 0.26;
  // desplazamiento vertical del bloque logo+botón (negativo = hacia arriba).
  // En desktop basta con unos px para compensar el aire del frame y que
  // logo+botón queden centrados como unidad. En tablet se quiere claramente
  // por encima del centro, así que va en fracción del alto de pantalla: en
  // px fijos (80px sobre ~1180px de alto) no se notaba.
  var LOGO_OFFSET_PX = -26;
  var MOBILE_LOGO_OFFSET_PX = -78;
  var TABLET_LOGO_OFFSET_VH = -0.14; // -14% del alto del viewport
  // el botón entra A LA VEZ que el logo: se enciende en cuanto arranca el
  // revelado y el fade lo hereda de la opacidad del contenedor (logoEl)
  var BTN_START = 0;
  var BTN_DELAY_MS = 0;
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

  // SOLO en móvil el scroll NO mueve las columnas (se sentía rarísimo: bajas
  // y los diablos suben) — se mueven solo con su deriva automática, a ritmo
  // constante y lento. En tablet sí se mueven con el scroll, como en desktop.
  var MOBILE_BREAKPOINT = 768;
  var TOUCH_BREAKPOINT = 1024;  // móvil + tablet (solo para colocar el logo)
  var MOBILE_AUTO_SCROLLVEL = 0.09;
  function isMobile() { return window.innerWidth <= MOBILE_BREAKPOINT; }
  function isTouchLayout() { return window.innerWidth <= TOUCH_BREAKPOINT; }
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
    var mobile = isMobile();
    var touch = isTouchLayout(); // móvil + tablet: sube el bloque logo+botón

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
    // (LOGO_OFFSET_PX sube el conjunto para que logo+botón queden centrados
    //  como unidad; en móvil se revela antes y sube algo más)
    rawP = clamp01((scrollY - sectionTop) / scrollRange);
    smoothedP += (rawP - smoothedP) * EASE;
    if (Math.abs(smoothedP - rawP) < 0.0005) smoothedP = rawP;
    var logoT = smoothstep(
      mobile ? MOBILE_CENTER_START : CENTER_START,
      mobile ? MOBILE_CENTER_END : CENTER_END,
      smoothedP
    );
    var logoOffset = mobile ? MOBILE_LOGO_OFFSET_PX
                   : touch  ? Math.round(TABLET_LOGO_OFFSET_VH * window.innerHeight)
                   : LOGO_OFFSET_PX;
    // el signo se compone a mano: "calc(-50% + -80px)" es sintaxis inválida y
    // Safari tira el transform entero (el logo se quedaba centrado del todo)
    var offsetCss = logoOffset < 0
      ? "- " + Math.abs(logoOffset) + "px"
      : "+ " + logoOffset + "px";
    logoEl.style.opacity = logoT;
    logoEl.style.transform =
      "translate(-50%, calc(-50% " + offsetCss + ")) scale(" + (0.82 + logoT * 0.18) + ")";
    logoEl.classList.toggle("is-visible", logoT > 0.98);

    // ── botón "saber más": el temporizador arranca cuando el logo va por
    //    BTN_START de su fade-in; el botón aparece BTN_DELAY_MS después ──
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

    // ── columnas: scroll directo 1:1 + capa automática + loop (desktop) /
    //    solo deriva automática constante, sin scroll (móvil y tablet) ──
    var vh = window.innerHeight;
    var viewportCenter = vh / 2;
    var fadeRadius = vh * FADE_RADIUS_FACTOR;

    for (var i = 0; i < cols.length; i++) {
      var col = cols[i];
      if (col.hidden) continue; // exteriores ocultas en móvil/tablet
      if (mobile) {
        col.pos += MOBILE_AUTO_SCROLLVEL * col.factor * dt; // deriva automática, el scroll no influye
      } else {
        col.pos += delta * col.factor;                              // 1:1 con el scroll
        col.pos += AUTO_SCROLLVEL * autoStrength * col.factor * dt; // deriva automática
      }

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

    cols.forEach(function (col, i) {
      fillColumn(col, iconPool[i]);
    });
    markEl.style.backgroundImage = "url(assets/diablos-import/logo-boil-sheet.webp)";

    window.addEventListener("resize", recomputeLayout);
    if (window.ResizeObserver) {
      new ResizeObserver(recomputeLayout).observe(cols[0].el);
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

/* ══════════════════════════════════════════════════════════════════════════
   PRUEBA — pop-up del diablo de recepción
   Inyecta el pop-up entero (markup incluido), así que en el index solo hacen
   falta el <link> del CSS y este <script>. Para quitar el experimento, borra
   esas dos líneas.

   ESTADO: DORMIDO en producción. Solo se activa si la URL lleva ?diablo=1,
   que es a donde manda /test-popup/ (ver test-popup/index.html). Un visitante
   normal de mololo.es no lo ve nunca; solo carga los ~5 KB de CSS+JS.

   Para dejarlo vivo de verdad: quita el "return" de la comprobación de abajo
   y decide cada cuánto sale (lo típico, una vez por sesión con
   sessionStorage).

   Estilos en css/diablo-popup.css. Los diablos son los mismos archivos
   horneados del módulo (3 fotogramas de hervor apilados).
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var TIENDA = "https://shop.mololo.es/products/cada-cual-con-sus-diablos";
  // diablos entre los que se elige el de recepción (archivos dNN.webp).
  // Corresponden a los SVG de origen 7, 85 y 50:
  //   007.svg → d02   085.svg → d15   050.svg → d19
  var FILAS = [2, 15, 19];

  // texto del bocadillo, por trozos: los marcados en rojo van en <b>
  var SEGMENTOS = [
    { t: "¿Vienes por los ", rojo: false },
    { t: "diablillos",       rojo: true  },
    { t: "?",                rojo: false },
    { t: "\n",               rojo: false },
    { t: "¡Pínchame!",       rojo: true  }
  ];

  var MS_POR_LETRA = 30;      // velocidad de escritura
  var RETRASO_ESCRITURA = 350; // empieza a escribir con el bocadillo ya puesto

  // interruptor: sin ?diablo=1 en la URL, esto no hace absolutamente nada
  if (!/[?&]diablo=1\b/.test(window.location.search)) return;

  // ── markup ──────────────────────────────────────────────────────────────
  var popup = document.createElement("div");
  popup.className = "dpop";
  popup.hidden = true;
  popup.setAttribute("role", "dialog");
  popup.setAttribute("aria-modal", "true");
  popup.setAttribute("aria-label", "Cada cual con sus diablos");
  popup.innerHTML =
    '<button class="dpop-cerrar" aria-label="Cerrar">&times;</button>' +
    '<div class="dpop-bocadillo">' +
      '<span class="dpop-texto">' +
        '<span class="dpop-medida" aria-hidden="true"></span>' +
        '<span class="dpop-escrito"></span>' +
      '</span>' +
    '</div>' +
    '<div class="dpop-pop">' +
      '<button class="dpop-btn" aria-label="Ver Cada cual con sus diablos en la tienda">' +
        '<span class="dpop-diablo"></span>' +
      '</button>' +
    '</div>';
  document.body.appendChild(popup);

  var cerrar = popup.querySelector(".dpop-cerrar");
  var medida = popup.querySelector(".dpop-medida");
  var escrito = popup.querySelector(".dpop-escrito");
  var diabloBtn = popup.querySelector(".dpop-btn");

  var fila = FILAS[Math.floor(Math.random() * FILAS.length)];
  popup.querySelector(".dpop-diablo").style.backgroundImage =
    "url(assets/diablos-import/diablos/d" + String(fila).padStart(2, "0") + ".webp)";

  // ── máquina de escribir ─────────────────────────────────────────────────
  function nodoDe(seg) {
    return seg.rojo ? document.createElement("b") : document.createElement("span");
  }

  // copia oculta con el texto completo: reserva el hueco del bocadillo
  SEGMENTOS.forEach(function (seg) {
    if (seg.t === "\n") { medida.appendChild(document.createElement("br")); return; }
    var n = nodoDe(seg);
    n.textContent = seg.t;
    medida.appendChild(n);
  });

  var temporizador = null;

  function escribir() {
    clearTimeout(temporizador);
    escrito.textContent = "";

    var cursor = document.createElement("span");
    cursor.className = "dpop-cursor";

    // lista plana de letras, cada una con el nodo al que pertenece
    var pasos = [];
    SEGMENTOS.forEach(function (seg) {
      if (seg.t === "\n") { pasos.push({ salto: true }); return; }
      var destino = nodoDe(seg);
      seg.t.split("").forEach(function (c, i) {
        pasos.push({ letra: c, destino: destino, primera: i === 0 });
      });
    });

    escrito.appendChild(cursor);
    var i = 0;

    (function siguiente() {
      if (i >= pasos.length) { cursor.classList.add("off"); return; }
      var p = pasos[i++];
      if (p.salto) {
        escrito.insertBefore(document.createElement("br"), cursor);
      } else {
        if (p.primera) escrito.insertBefore(p.destino, cursor);
        p.destino.textContent += p.letra;
      }
      temporizador = setTimeout(siguiente, MS_POR_LETRA);
    })();
  }

  // ── abrir / cerrar ──────────────────────────────────────────────────────
  var scrollBloqueado = "";

  function abrir() {
    popup.hidden = false;
    scrollBloqueado = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cerrar.focus();
    temporizador = setTimeout(escribir, RETRASO_ESCRITURA);
  }

  function ocultar() {
    clearTimeout(temporizador); // corta la escritura si se cierra a media frase
    popup.hidden = true;
    document.body.style.overflow = scrollBloqueado;
  }

  cerrar.addEventListener("click", ocultar);

  // clic fuera del diablo y del bocadillo: también cierra
  popup.addEventListener("click", function (e) {
    if (e.target === popup) ocultar();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !popup.hidden) ocultar();
  });

  diabloBtn.addEventListener("click", function () {
    window.open(TIENDA, "_blank", "noopener");
  });

  abrir(); // sale a la vez que carga la página, sin espera
})();

# Hoja de ruta — Mololo Web

Cambios pendientes para dejar la página fina. Se abordan uno por uno en orden.

---

## Tareas pendientes

- [ ] **6. Footer — revisión y mejora visual**
  Darle una vuelta al footer: estructura, tipografía, espaciados, jerarquía. Dejarlo a la altura del resto de la página. Incluye modales para textos legales (Aviso legal, Política de privacidad) generados con Iubenda. Quitar "Política de cookies" (no aplica con Umami).

---

## Auditoría técnica — pendiente

Resultados del análisis profundo del código. Por orden de impacto:

### SEO
- [x] **S1. `meta name="description"`** — Añadido en `index.html` y `contacto.html`.
- [x] **S2. `<h1>` en index.html** — Añadido visually-hidden en el hero. También añadida clase `.visually-hidden` en `landing.css`.
- [x] **S3. `<link rel="canonical">`** — Añadido en ambas páginas apuntando a `mololo.es`.
- [x] **S4. `og:url` correcto** — Actualizado a `https://mololo.es/`.
- [x] **S5. Structured data JSON-LD** — Añadido en `index.html`. Tipo `Person` con nombre, descripción, Instagram y tienda.

### Imágenes
- [x] **I1. Renombrar y comprimir `cuadro2.jpg` → `cuadro-sapien.jpg`** — De 4MB a 737KB (82% menos). 2000px ancho, 85% calidad.
- [x] **I2. `cuadro-2-resized.png`** — Eliminado, no se usaba.
- [x] **I3. Lazy loading** — Añadido en todas las imágenes below-fold de `index.html` y `contacto.html`.

### CSS / HTML
- [x] **C1. CSS de contacto inline → `landing.css`** — Movido. `contacto.html` ya no tiene bloque `<style>`.
- [x] **C2. `width: 100vw` en body** — Corregido a `width: 100%` en `landing.css`.

### JavaScript
- [x] **J1. Consolidar listeners `mousemove`** — Unificados en un único listener en `landing.js`. Los módulos desktop-only se registran via `_mouseMoveCallbacks.push()`.
- [x] **J2. `defer` en scripts** — Añadido `defer` a los 5 scripts locales de `index.html`.
- [x] **J3. Variable global `lastMouseEvent`** — Movida a `window.Mololo.lastMouseEvent` (namespace en `tracker-eye.js`). Todas las referencias actualizadas.

### Accesibilidad
- [x] **A1. `:focus-visible`** — Añadidos estilos de foco por zona en `landing.css`. Naranja: navbar, productos, encargos, footer legal, contacto. Rosa: hero, newsletter, footer social.

---

*Última actualización: 2026-04-11*

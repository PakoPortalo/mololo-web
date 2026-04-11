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
- [ ] **I1. Comprimir `cuadro2.jpg`** — Pesa 4MB y se carga dos veces en memoria (DOM + canvas). Mayor lastre de rendimiento.
- [ ] **I2. `cuadro-2-resized.png` → WebP/JPEG** — PNG de fotografía pesa 2.5MB innecesariamente.
- [ ] **I3. Lazy loading** — Ninguna imagen tiene `loading="lazy"`. Las imágenes below-fold se cargan al inicio.

### CSS / HTML
- [ ] **C1. CSS de contacto inline → `landing.css`** — 192 líneas de `<style>` dentro de `contacto.html`. Mover a la hoja de estilos.
- [ ] **C2. `width: 100vw` en body** — Causa overflow horizontal oculto con `overflow-x: hidden`. Cambiar a `width: 100%`.

### JavaScript
- [ ] **J1. Consolidar listeners `mousemove`** — Hay 3 listeners independientes en `landing.js` (líneas 11, 25, 233). Unificarlos.
- [ ] **J2. `defer` en scripts** — Los scripts de `index.html` están al final del body pero sin `defer`.
- [ ] **J3. Variable global `lastMouseEvent`** — Declarada en `tracker-eye.js` sin namespace. Riesgo de colisión.

### Accesibilidad
- [ ] **A1. `:focus-visible`** — Sin estilos de foco para navegación con teclado en `landing.css`.

---

*Última actualización: 2026-04-11*

# Hoja de ruta — Mololo Web

Cambios pendientes por orden de prioridad.

---

## 🔴 Crítico — Legal / RGPD

- [x] **L1. Newsletter sin consentimiento explícito** — Checkbox de aceptación con link a política de privacidad. Validación custom en JS, mensaje de error en rojo.
- [ ] **L2. Formulario de contacto sin aviso de tratamiento de datos** — Indicar cómo se tratan los datos recogidos por Formspree.
- [ ] **L3. Footer inconsistente entre páginas** — `index.html` tiene 6 links legales, `contacto.html` solo 3. Todos apuntan a `#`. Unificar y enlazar las políticas reales de Iubenda.
- [ ] **L4. Quitar "Política de cookies"** — Umami cloud es cookieless. El link sobra y puede confundir.
- [ ] **L5. `tienda.mololo.es` vs `shop.mololo.es`** — El footer social apunta a `tienda.mololo.es`, el navbar a `shop.mololo.es`. Unificar al dominio correcto. *(Decidir cuál es el bueno antes de tocar Iubenda.)*

---

## 🟠 Importante — Rendimiento y SEO

- [ ] **P1. Convertir imágenes a WebP** — `hoodie-mololo.png` (1.3MB) y `calaveritas.jpg` (1.1MB) son los más urgentes. WebP supone ~60-70% menos peso. Afecta directamente a Core Web Vitals.
- [ ] **P2. `og:image` apunta al dominio viejo** — Corregir `pakoportalo.github.io/mololo-web/...` → `https://mololo.es/...`. Afecta a la previsualización al compartir en WhatsApp y redes.
- [ ] **P3. Google Fonts sin `preconnect`** — Añadir `<link rel="preconnect" href="https://fonts.googleapis.com">` en ambas páginas.
- [ ] **P4. Sin `apple-touch-icon` ni `manifest.json`** — Si alguien guarda la web en el home screen del móvil no tiene icono. Fácil de añadir.

---

## 🟡 Menor — Calidad de código

- [ ] **C1. `contacto.html` sin `defer` en sus scripts** — Inconsistente con `index.html`. Menor impacto pero fácil de corregir.
- [ ] **C2. Links `+ info` de productos apuntan a `#`** — Los 6 botones no van a ningún sitio. Enlazar a la tienda o eliminar el botón. *(Decisión de contenido primero.)*
- [ ] **C3. `contacto.html` sin Open Graph ni JSON-LD** — Al compartir el link de contacto no aparece imagen ni título correcto.

---

## Pendiente mayor — Footer + Iubenda

- [ ] **6. Footer — revisión visual y legal** — Estructura, tipografía, espaciados. Incluye integrar los documentos generados con Iubenda (Aviso legal, Política de privacidad). Depende de resolver L1–L5 primero.

---

*Última actualización: 2026-04-11*

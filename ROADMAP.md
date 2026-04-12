# Hoja de ruta — Mololo Web

Cambios pendientes por orden de prioridad.

---

## 🔴 Crítico — Legal / RGPD

- [x] **L1. Newsletter sin consentimiento explícito** — Checkbox de aceptación con link a política de privacidad. Validación custom en JS, mensaje de error en rojo.
- [x] **L2. Formulario de contacto sin aviso de tratamiento de datos** — Indicar cómo se tratan los datos recogidos por Formspree.
- [x] **L3. Footer inconsistente entre páginas** — Unificado en los tres archivos: © · Política de privacidad · Contacto / Instagram · Tienda.
- [x] **L4. Quitar "Política de cookies"** — Eliminado del footer. Umami cloud es cookieless.
- [x] **L5. `tienda.mololo.es` vs `shop.mololo.es`** — Unificado a `shop.mololo.es` en todos los footers.

---

## 🟠 Importante — Rendimiento y SEO

- [x] **P1. Convertir imágenes a WebP** — `hoodie-mololo.png` (1.3MB → 64KB, −95%) y `calaveritas.jpg` (1.1MB → 150KB, −86%).
- [x] **P2. `og:image` apunta al dominio viejo** — Corregido a `https://mololo.es/...`.
- [x] **P3. Google Fonts sin `preconnect`** — Añadido en index.html, contacto.html y politica-privacidad.html.
- [x] **P4. Sin `apple-touch-icon` ni `manifest.json`** — Añadidos con el skull como icono (180px, 192px, 512px).

---

## 🟡 Menor — Calidad de código

- [x] **C1. `contacto.html` sin `defer` en sus scripts** — Añadido `defer` a eye-base.js y absent-eye.js.
- [x] **C2. Links `+ info` de productos apuntan a `#`** — Los 6 botones apuntan a shop.mololo.es mientras se publican los productos.
- [x] **C3. `contacto.html` sin Open Graph ni JSON-LD** — Añadidas etiquetas og: y JSON-LD (ContactPage + Person).

---

## Pendiente mayor — Footer + Iubenda

- [ ] **6. Footer — revisión visual y legal** — Estructura, tipografía, espaciados. Incluye integrar los documentos generados con Iubenda (Aviso legal, Política de privacidad). Depende de resolver L1–L5 primero.

---

*Última actualización: 2026-04-12*

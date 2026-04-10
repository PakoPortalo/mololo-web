# Hoja de ruta — Mololo Web

Cambios pendientes para dejar la página fina. Se abordan uno por uno en orden.

---

## Tareas

- [x] **1. Navbar — fade in/out más lento del saludo**
  Hacer más lento el ciclo de transición de "hola, hello…" en el navbar (actualmente demasiado rápido).

- [x] **2. Hero parallax — sombra interior en la imagen**
  La imagen de la derecha en el hero se mueve con el cursor (parallax). Añadirle una sombra en sus bordes, apuntando hacia el centro, para enfatizar que está "detrás" de los demás elementos.

- [x] **3. Sección "Encargos" — texto + botón + enlace navbar**
  - Después del módulo Sapien sobre sapien (cuadro-lupa) y antes del newsletter, añadir una sección con texto tipo "se pueden encargar cuadros de este tipo, podemos hablar un poco el concepto".
  - Añadir un botón estilo los existentes que diga "más información" y apunte a `shop.mololo.es`.
  - Añadir un enlace en el navbar que scrollee hasta esta sección.

- [x] **4. Subpágina `/contacto` con formulario**
  Crear una página `/contacto` (nuevo HTML) enlazada desde el botón "CONTACTO" del navbar. Formulario sencillo que genere un correo (nombre, email, mensaje). Sin dependencias externas si es posible.

- [ ] **5. Calaveritas animadas — líquido burbujeante**
  Las 3 calaveritas al final del newsletter tienen una parte roja en los ojos. Animar esa parte roja para que parezca un líquido que sube y acaba en pompitas (animación CSS/canvas).

- [ ] **6. Footer — revisión y mejora visual**
  Darle una vuelta al footer: estructura, tipografía, espaciados, jerarquía. Dejarlo a la altura del resto de la página.

- [ ] **7. Analytics**
  Investigar opciones (Google Analytics, Plausible, Umami…) y elegir la que mejor encaje. Integrar en la página.

---

- [x] **8. Holographic card — desactivar interacción táctil en móvil**
  En móvil el toque movía la calavera. Ahora en dispositivos táctiles no se adjuntan eventos de ratón y la tarjeta hace su animación autónoma (`startMobileAnimation`).

---

*Última actualización: 2026-04-10*

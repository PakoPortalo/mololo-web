# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Normas de trabajo

- **Nunca hacer `git push` sin permiso explícito del usuario.** Commitear está bien; pushear, nunca sin que lo pidan.
- **Nunca añadir `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`** ni ninguna línea Co-Authored-By en los mensajes de commit.

## Project overview

Static website for **Mololo by Pako Portalo** — arte original y ediciones limitadas. Single-page landing with vanilla JS, no build system. Deployed to GitHub Pages at `pakoportalo.github.io/mololo-web/`.

Open directly in a browser or a local server (`python3 -m http.server`). No npm, no bundler, no dependencies.

## Architecture

All logic lives in a single `index.html` (styles inline in `<style>`, scripts inline at the bottom) plus four JS files:

| File | Purpose |
|---|---|
| `js/eye-base.js` | `Eye` base class — sprite-sheet animation (8×8 grid, 200px cells), travel/blink state machine |
| `js/tracker-eye.js` | `TrackerEye extends Eye` — follows cursor, auto-blinks on a random timer, click-to-hold-blink |
| `js/absent-eye.js` | `AbsentEye extends Eye` — autonomous wandering eye, no cursor tracking |
| `js/holographic-card.js` | `HolographicCard` — canvas compositing: skull PNG + layered gradients (multiply blend), 3D tilt via `matrix3d` |

`css/style.css` contains the `eye` sprite class (background-image sprite sheet). `css/index.css` is mostly empty/legacy.

## Sections (in order)

1. **Navbar** — fixed, eye in logo area, hamburger on mobile
2. **Hero** — split layout (black left / hero photo right), ticker strip below
3. **Productos** — 3-column grid of artwork cards
4. **Artista** — text + `HolographicCard` (skull, module 3)
5. **Diablo** — full-bleed section (placeholder)
6. **Newsletter** — email form

## HolographicCard key details

- Instantiated on `#artista-holo-card` via `new HolographicCard(el, { src, width, height })`
- On desktop: responds to mouse hover/move with `matrix3d` tilt + rainbow gradient shift
- On mobile (`startMobileAnimation()`): autonomous loop — `_isMobileAuto = true`, uses `_autoPhase` to drive both gradient position (`_mousePos`) and 3D tilt
- Auto-animation path: diamond (rombo) loop — 4 corners interpolated linearly, continuous `% 1` phase (no ping-pong)
- Canvas compositing: offscreen canvas draws gradient layers → `destination-in` clips to skull alpha → composited onto main canvas with `multiply`

## Eye sprite sheet

- Sprite sheet: `assets/sprite.png` (8 columns × 8 rows × 3 animation frames per cell = 3 stacked frames of 1600px height)
- Strip row at Y=4800px: closing/closed animation frames (columns 0–3)
- `CELLS = 8`, `CELL_SIZE = 200px` — position maps to gaze direction

# AGENTS.md

Static HTML/CSS/JS physics simulation. No build step — open `index.html` in a browser to test.

## Stack
- External deps loaded via CDN: KaTeX 0.16.9, Chart.js, Google Fonts (Inter)
- No package manager, no test runner, no linter

## Experiments
- **Lei de Coulomb** — nav: `coulomb`, canvas: `coulombCanvas`, graph: `forceGraph`
- **Capacitância** — nav: `capacitance`, canvas: `capacitanceCanvas`, graph: `capacitanceGraph`
- **Lei de Ohm** — nav: `ohm`, canvas: `ohmCanvas`, graph: `ohmGraph`
- **Resistividade** — nav: `resistivity`, graph: `resistivityGraph`, table: `resistivityTable`

## Conventions
- Content is Portuguese (pt-BR)
- Canvas-based simulations live in `script.js`; audio logic in `audio.js`
- Each experiment follows the same pattern: nav button → simulation-section → controls-panel + results-panel + info-panel
- Chart.js graphs are stored in module-level variables and destroyed/recreated on update

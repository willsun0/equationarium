# Equationarium

Equationarium is a browser-based mathematical creature laboratory. Players generate animated organisms from equations, name and bond with them, perform habitat experiments, install mathematical upgrades, preserve and breed bloodlines, complete research contracts, and battle adaptive rivals on the way to Ascension.

## Final release features

- Twenty-three live mathematical morphologies: circle, ellipse, triangle, square, pentagon, hexagon, star polygon, sine, cosine, rose, Archimedean spiral, Gielis superformula, cardioid, lemniscate, Lissajous, hypotrochoid, epitrochoid, Fourier bloom, golden phyllotaxis, Möbius membrane, Gaussian colony, butterfly curve, and Mandelbrot edge.
- A Mathematical Field Guide for every morphology with a coordinate plot, live equation, parameter key, historical fact, and explanation of how the function becomes the creature.
- Individual information controls for all ten genome sliders explaining both the mathematics and the visible/gameplay result.
- Ten continuous genome controls affecting appearance, motion, rarity, Math Luck, and combat strength.
- Five sequence reactors based on Fibonacci numbers, primes, Pascal's triangle, Collatz iteration, and the harmonic series.
- Eight theorem upgrades across calculus, algebra, number theory, geometry, dynamics, and fractals, each with three levels.
- Interactive habitat experiments that build bond and train vitality, power, defense, or speed.
- Persistent companion names, development, archive, research, battle record, Genome Pass, and cosmetic auras.
- Genetic breeding with parent selection, compatibility analysis, inherited equations, sequence DNA, training, and theorem levels.
- Turn-based Genome Arena with family abilities, guarded recovery, random variance, deterministic Math Luck, critical resonance, streaks, and a ten-tier reward pass.
- Field contracts, taxonomic Codex, nineteen research objectives, ranks, Quantum Energy economy, and a six-part Ascension Protocol.
- A complete first-run introduction plus an eleven-step spotlight tutorial pointing to the actual controls.
- Responsive keyboard-, mouse-, and touch-friendly interface.

## Run locally

Requirements: Node.js 22.13 or later and npm.

```bash
npm install
npm run dev
```

Open the local address printed by Vite.

## Production build

```bash
npm run lint
npm test
```

The build output is generated in `dist/`. The included Cloudflare/Vinext configuration is used by the hosted release.

## Host on GitHub

1. Create an empty GitHub repository.
2. Upload every file in this project, including dotfiles such as `.gitignore` and the `.openai` directory.
3. Commit the files to the repository's default branch.
4. For source hosting only, no further setup is needed.
5. For a public web deployment, connect the repository to a Node/Cloudflare-compatible host and use `npm run build` as the build command.

The application stores player progress in browser `localStorage`, so it does not require a database or API key.

## Project structure

- `app/page.tsx` — game state, mathematical renderers, progression, battle, breeding, research, and tutorial.
- `app/globals.css` — visual system and responsive layouts.
- `tests/` — rendered-output verification.
- `scripts/` — deterministic install, build, and artifact checks.
- `vite.config.ts` — Vinext/Vite development and production configuration.

## Credits

Designed and developed as an AI-assisted creative coding project. The creatures are rendered procedurally on HTML Canvas; no external image assets are required.

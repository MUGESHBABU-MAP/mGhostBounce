# Flappy Kiro 👻

A retro-styled, browser-based endless scroller game. Guide Ghosty through the pipes — tap, click, or press Space to jump!

**Play it:** open `index.html` directly in any modern browser, or host it on GitHub Pages / any static host.

## How to Play

- **Start**: Press Space, click, or tap to begin
- **Jump**: Press Space / click / tap to make Ghosty flap upward
- **Goal**: Fly through as many pipe gaps as possible without hitting a pipe, cloud, or boundary
- **Score**: Each pipe pair you pass scores +1. Your high score is saved automatically.

## Features

- 🎮 Works on desktop (keyboard + mouse) and mobile (touch)
- 👻 Ghosty tilts with velocity for a natural flight feel
- ✨ "+1" score popups and tap ripple feedback
- 🎵 Jump and game-over sound effects
- 💾 High score persisted in localStorage
- 📐 Fully responsive — fills any screen size
- 🖌️ Hand-drawn / sketchy visual style

## Project Structure

```
index.html          ← the entire game (no build step needed)
assets/
  ghosty.png        ← player sprite
  jump.wav          ← jump sound effect
  game_over.wav     ← game over sound effect
tests/              ← property-based + unit tests (Node.js, vitest + fast-check)
```

## Running Tests

```bash
cd tests
npm install
npm test
```

All 21 tests (13 property-based + 8 unit) should pass.

## Deployment

Drop `index.html` and the `assets/` folder onto any static host:

- **GitHub Pages**: push to a repo, enable Pages from the root of `main`
- **Custom domain**: point your domain at the Pages site in repo Settings → Pages

No build step, no server, no dependencies at runtime.

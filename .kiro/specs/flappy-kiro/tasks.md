# Implementation Plan: Flappy Kiro

## Overview

This plan implements Flappy Kiro as a single `index.html` file with embedded JavaScript and CSS. Tasks are ordered so each builds on the previous: project scaffolding → pure logic modules → game loop integration → rendering → audio → testing.

All property-based tests use **fast-check** and are co-located in a `tests/` directory alongside a `package.json` that installs fast-check and a test runner (vitest) as dev dependencies. The game itself has no build step and runs directly in the browser.

---

## Tasks

- [x] 1. Project scaffolding and test infrastructure
  - Create the root `index.html` with the HTML5 Canvas element, embedded CSS (full-viewport, no overflow), and placeholder `<script>` sections for each component.
  - Create `tests/package.json` with `fast-check` and `vitest` as dev dependencies and a `test` script.
  - Create `tests/vitest.config.js` (or equivalent) so tests run in a Node.js environment (no browser DOM required for pure logic tests).
  - Verify the canvas fills the viewport with no scrollbars by opening `index.html` in a browser.
  - **Acceptance**: `index.html` opens without errors; `npm test` in `tests/` exits cleanly (no test files yet, zero failures).

- [x] 2. Constants and GameState definition
  - Define all game constants inside `index.html`'s script block: `PIPE_SPEED`, `PIPE_INTERVAL`, `PIPE_WIDTH`, `GAP_MIN_RATIO`, `GAP_MAX_RATIO`, `CLOUD_SPEED_MIN`, `CLOUD_SPEED_MAX`, `CLOUD_INTERVAL_MIN`, `CLOUD_INTERVAL_MAX`, `GRAVITY`, `JUMP_VELOCITY`.
  - Define the `GameState` object factory/initializer that returns a fresh state with fields: `phase`, `ghosty` (GhostyState), `pipes`, `clouds`, `score`, `highScore`, `canvas`, `ctx`, `lastTimestamp`, `nextPipeX`, `nextCloudX`.
  - Define the `GhostyState`, `PipePair`, and `Cloud` data shapes as documented in the design.
  - **Acceptance**: All constants and state shapes are accessible in the browser console; no runtime errors on page load.

- [x] 3. Physics_Engine implementation
  - Implement `PhysicsEngine` with constants `GRAVITY = 1200`, `JUMP_VELOCITY = -500`, and `MAX_FALL_SPEED` derived from canvas height.
  - Implement `update(ghosty, delta)`: adds `GRAVITY * delta` to `ghosty.vy`, clamps `vy` to `[JUMP_VELOCITY, MAX_FALL_SPEED]`, then sets `ghosty.y += ghosty.vy * delta`.
  - Implement `applyJump(ghosty)`: sets `ghosty.vy = JUMP_VELOCITY` unconditionally.
  - Export the pure functions from `tests/physics.js` (or inline them in a way that can be imported by tests) so they can be tested without a DOM.
  - **Acceptance**: Calling `applyJump` then `update` in the browser console produces expected position/velocity changes.

- [x] 4. Property-based tests — Physics_Engine (Properties 1, 2, 3)
  - Create `tests/physics.test.js`.
  - **Property 1** (`// Feature: flappy-kiro, Property 1: Ghosty velocity is always clamped within bounds`): Use `fc.array(fc.oneof(fc.record({type: fc.constant('gravity'), dt: fc.float({min: 0.001, max: 0.1})}), fc.record({type: fc.constant('jump')})), {minLength: 1, maxLength: 50})` to generate action sequences; assert `vy` stays in `[JUMP_VELOCITY, MAX_FALL_SPEED]` after every step. **Validates: Requirements 2.5, 2.6**
  - **Property 2** (`// Feature: flappy-kiro, Property 2: Physics update formula holds for any delta time`): Use `fc.record({y: fc.float({min: 0, max: 600}), vy: fc.float({min: -500, max: 600}), dt: fc.float({min: 0.001, max: 0.1})})` to generate inputs; assert new position and velocity match the formula exactly. **Validates: Requirements 2.1, 2.4**
  - **Property 3** (`// Feature: flappy-kiro, Property 3: Jump impulse always replaces velocity`): Use `fc.float({min: -2000, max: 2000})` for arbitrary `vy`; assert `applyJump` sets `vy` to exactly `JUMP_VELOCITY`. **Validates: Requirements 2.2, 2.6**
  - Run `npm test` in `tests/`; all three properties must pass with `numRuns: 100`.

- [x] 5. Score_Manager implementation
  - Implement `ScoreManager` with `STORAGE_KEY = 'flappyKiroHighScore'`.
  - Implement `loadHighScore()`: wraps `localStorage.getItem` in try/catch; parses as integer; returns `0` if missing, non-numeric, negative, or if `localStorage` throws.
  - Implement `saveHighScore(score)`: wraps `localStorage.setItem` in try/catch; logs `console.warn` on failure.
  - Implement `checkAndUpdateHighScore(score, highScore)`: returns `Math.max(score, highScore)`.
  - Export pure functions to `tests/score.js` for test isolation.
  - **Acceptance**: `loadHighScore()` returns `0` on a fresh page; after `saveHighScore(42)`, `loadHighScore()` returns `42`.

- [x] 6. Property-based tests — Score_Manager (Properties 9, 10, 11, 12)
  - Create `tests/score.test.js`.
  - **Property 9** (`// Feature: flappy-kiro, Property 9: Score equals the count of pipes passed`): Use `fc.array(fc.boolean(), {minLength: 0, maxLength: 30})` to generate `scored` flag arrays; assert score equals `array.filter(Boolean).length` and each flag transitions `false → true` at most once. **Validates: Requirements 6.1**
  - **Property 10** (`// Feature: flappy-kiro, Property 10: High score update is the maximum of score and prior high score`): Use `fc.tuple(fc.integer({min: 0, max: 10000}), fc.integer({min: 0, max: 10000}))` for `(score, highScore)` pairs; assert result equals `Math.max(score, highScore)`. **Validates: Requirements 6.3**
  - **Property 11** (`// Feature: flappy-kiro, Property 11: High score localStorage round-trip preserves value`): Use `fc.integer({min: 0, max: 999999})` for valid values and `fc.oneof(fc.string(), fc.constant(null), fc.constant(undefined))` for invalid values; assert round-trip returns the same integer and invalid inputs return `0`. **Validates: Requirements 6.4, 6.5**
  - **Property 12** (`// Feature: flappy-kiro, Property 12: High score is preserved across restarts`): Use `fc.integer({min: 0, max: 999999})` for high score values; simulate a restart (reset score to 0, reload high score from storage); assert high score is unchanged. **Validates: Requirements 7.2**
  - Run `npm test`; all four properties must pass with `numRuns: 100`.

- [x] 7. Pipe and Cloud spawning logic
  - Implement `spawnPipe(canvasWidth, canvasHeight, ghostyHeight)` in the game script: generates a `PipePair` with `x = canvasWidth`, randomized `gapCenterY` in `[GAP_MIN_RATIO * canvasHeight, GAP_MAX_RATIO * canvasHeight]`, and `gapHeight = Math.max(2 * ghostyHeight, someMinimum)`.
  - Implement `spawnCloud(canvasWidth, canvasHeight)`: generates a `Cloud` with randomized `y` in `[0.20 * canvasHeight, 0.80 * canvasHeight]`, randomized `width` (80–140px), `height` (40–70px), and `speed` in `[CLOUD_SPEED_MIN * PIPE_SPEED, CLOUD_SPEED_MAX * PIPE_SPEED]`.
  - Implement `scrollAndCull(entities, delta)`: moves each entity left by `entity.speed * delta` (or `PIPE_SPEED * delta` for pipes) and removes any whose `x + width < 0`.
  - Export pure spawn and cull functions to `tests/spawning.js`.
  - **Acceptance**: Spawned pipes and clouds have valid positions when logged in the browser console.

- [x] 8. Property-based tests — Spawning and Scrolling (Properties 4, 5, 6)
  - Create `tests/spawning.test.js`.
  - **Property 4** (`// Feature: flappy-kiro, Property 4: Pipe spawn invariants hold for any canvas size`): Use `fc.record({canvasHeight: fc.integer({min: 200, max: 1200}), ghostyHeight: fc.integer({min: 20, max: 80})})` to generate inputs; assert `gapCenterY` is in `[0.20 * h, 0.80 * h]` and `gapHeight >= 2 * ghostyHeight`. **Validates: Requirements 3.3, 3.4**
  - **Property 5** (`// Feature: flappy-kiro, Property 5: Off-screen entities are always removed from the active set`): Use `fc.array(fc.record({x: fc.integer({min: -500, max: 800}), width: fc.integer({min: 40, max: 120}), speed: fc.integer({min: 60, max: 200})}), {minLength: 0, maxLength: 20})` and `fc.integer({min: 1, max: 100})` for scroll steps; assert no entity with `x + width < 0` remains after culling. **Validates: Requirements 3.5, 4.4**
  - **Property 6** (`// Feature: flappy-kiro, Property 6: Cloud spawn invariants hold for any canvas size`): Use `fc.integer({min: 200, max: 1200})` for canvas height; assert `cloud.y` is in `[0.20 * h, 0.80 * h]` and `cloud.speed` is in `[0.40 * PIPE_SPEED, 0.60 * PIPE_SPEED]`. **Validates: Requirements 4.2, 4.3**
  - Run `npm test`; all three properties must pass with `numRuns: 100`.

- [x] 9. Collision_Detector implementation
  - Implement `CollisionDetector.check(ghosty, pipes, clouds, canvasHeight)` returning `{ collided: boolean, reason: 'pipe' | 'cloud' | 'top' | 'bottom' | null }`.
  - AABB overlap helper: two rectangles overlap if `ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by`.
  - Check top boundary: `ghosty.y <= 0` → `{ collided: true, reason: 'top' }`.
  - Check bottom boundary: `ghosty.y + ghosty.height >= canvasHeight` → `{ collided: true, reason: 'bottom' }`.
  - Check each pipe pair: top pipe `(pipe.x, 0, pipe.width, gapTop)` and bottom pipe `(pipe.x, gapBottom, pipe.width, canvasHeight - gapBottom)`.
  - Check each cloud bounding box.
  - Export pure collision functions to `tests/collision.js`.
  - **Acceptance**: Manually constructed overlapping boxes return `collided: true`; non-overlapping boxes return `collided: false`.

- [x] 10. Property-based tests — Collision_Detector (Properties 7, 8)
  - Create `tests/collision.test.js`.
  - **Property 7** (`// Feature: flappy-kiro, Property 7: Any obstacle overlap triggers game over`): Use `fc.record({ax: fc.integer(), ay: fc.integer(), aw: fc.integer({min: 1, max: 100}), ah: fc.integer({min: 1, max: 100})})` for Ghosty and obstacle boxes; generate overlapping pairs by construction (e.g., obstacle starts inside Ghosty's bounds); assert `check` returns `collided: true`. **Validates: Requirements 5.1, 5.2**
  - **Property 8** (`// Feature: flappy-kiro, Property 8: Any boundary violation triggers game over`): Use `fc.oneof(fc.integer({min: -500, max: 0}), fc.integer({min: 580, max: 1200}))` for boundary-violating `y` values (relative to canvas height); assert `check` returns `collided: true` with reason `'top'` or `'bottom'`. **Validates: Requirements 5.3, 5.4**
  - Run `npm test`; both properties must pass with `numRuns: 100`.

- [x] 11. Audio_Manager implementation
  - Implement `AudioManager` with `sounds = { jump: null, gameOver: null }` and `ready = false`.
  - Implement `preload()`: creates `new Audio('assets/jump.wav')` and `new Audio('assets/game_over.wav')`; attaches `onerror` handlers that call `console.warn` and set the slot to `null`.
  - Implement `playJump()` and `playGameOver()`: if the sound is non-null, set `currentTime = 0` then call `.play()`; catch any rejected Promise silently.
  - Defer `preload()` until the first user interaction to satisfy autoplay policies.
  - Export a testable `createAudioManager(audioFactory)` factory to `tests/audio.js` that accepts an injectable `Audio` constructor for testing.
  - **Acceptance**: Jump sound plays on first Space press; missing file logs a warning but does not throw.

- [x] 12. Property-based test — Audio_Manager (Property 13)
  - Create `tests/audio.test.js`.
  - **Property 13** (`// Feature: flappy-kiro, Property 13: Sound re-trigger always resets playback to the beginning`): Use `fc.float({min: 0, max: 300})` for arbitrary `currentTime` values; create a mock `Audio` object with a `currentTime` property and a `play()` stub; assert that after calling `playJump()` or `playGameOver()`, `currentTime === 0` before `play()` is invoked. **Validates: Requirements 8.4**
  - Run `npm test`; property must pass with `numRuns: 100`.

- [x] 13. Input_Handler implementation
  - Implement `InputHandler` with an `onJump` callback slot.
  - Implement `attach(canvas)`: adds `keydown` listener on `document` (fires on Space key), `mousedown` listener on `canvas`, and `touchstart` listener on `canvas` (calls `e.preventDefault()` to suppress scroll).
  - Implement `detach()`: removes all three listeners.
  - Wire `onJump` to call `PhysicsEngine.applyJump(gameState.ghosty)` and `AudioManager.playJump()` when `gameState.phase === 'PLAYING'`; on `START` or `GAME_OVER`, trigger the appropriate state transition instead.
  - **Acceptance**: Pressing Space on the start screen starts the game; pressing Space during play makes Ghosty jump; pressing Space on game over restarts.

- [x] 14. Renderer implementation
  - Implement `Renderer` with all draw methods operating on `ctx` and `canvas`.
  - `drawBackground(ctx, canvas)`: fills with light blue (`#b0e0ff`) then draws a few horizontal sketchy stroke lines for texture.
  - `drawGhosty(ctx, ghosty, image)`: draws `image` at `(ghosty.x, ghosty.y, ghosty.width, ghosty.height)`; falls back to `ctx.strokeRect` if image is null.
  - `drawPipes(ctx, pipes)`: for each pipe, compute `gapTop` and `gapBottom`; draw top pipe as `ctx.strokeRect(pipe.x, 0, pipe.width, gapTop)` and bottom pipe as `ctx.strokeRect(pipe.x, gapBottom, pipe.width, canvasHeight - gapBottom)` with green stroke and jitter for sketchy style.
  - `drawClouds(ctx, clouds)`: draw each cloud as `ctx.strokeRect` with white/grey stroke and jitter.
  - `drawScoreBar(ctx, score, highScore, canvas)`: draw a semi-transparent bar at the bottom; render `"Score: X | High: X"` in a retro font.
  - `drawStartScreen(ctx, canvas, ghosty, image)`: draw title text, Ghosty centered, and "Press Space / Click / Tap to Start" prompt.
  - `drawGameOverScreen(ctx, canvas, score, highScore)`: draw semi-transparent overlay, "GAME OVER" heading, final score, high score, and restart prompt.
  - **Acceptance**: Each draw method produces visible output on the canvas when called manually in the browser console.

- [x] 15. GameLoop and state machine integration
  - Implement the `GameLoop` that drives the `requestAnimationFrame` cycle.
  - On each tick: compute `delta = (timestamp - lastTimestamp) / 1000`; clamp delta to `0.05` max to prevent spiral-of-death on tab switch.
  - In `PLAYING` phase: call `PhysicsEngine.update`, `scrollAndCull` for pipes and clouds, `spawnPipe`/`spawnCloud` when `nextPipeX`/`nextCloudX` thresholds are reached, `ScoreManager` pipe-passing check, `CollisionDetector.check`; on collision, transition to `GAME_OVER`.
  - In `GAME_OVER` phase: call `ScoreManager.checkAndUpdateHighScore`, `ScoreManager.saveHighScore`, `AudioManager.playGameOver`.
  - Call `Renderer.render(gameState)` every tick regardless of phase.
  - Implement `startGame()` and `restartGame()` functions that reset `GameState` and resume the loop.
  - Wire `InputHandler.onJump` to the correct action per phase.
  - **Acceptance**: Full game loop runs end-to-end: start screen → gameplay → game over → restart.

- [x] 16. Responsive canvas and viewport resize handling
  - On page load, set `canvas.width = window.innerWidth` and `canvas.height = window.innerHeight`.
  - Add a `window.resize` event listener that updates canvas dimensions and clamps `ghosty.y` to `[0, canvas.height - ghosty.height]`.
  - Update `PhysicsEngine.MAX_FALL_SPEED` to `canvas.height` after each resize.
  - **Acceptance**: Resizing the browser window during gameplay does not crash the game or leave Ghosty out of bounds.

- [x] 17. Asset loading and error handling
  - Load `ghosty.png` via `new Image()`; set `img.src = 'assets/ghosty.png'`; attach `onerror` to set `ghostyImage = null` (fallback to `strokeRect`).
  - Wrap `getContext('2d')` in a null check; if null, display a static error message in the HTML body and do not start the game loop.
  - Ensure `AudioManager.preload()` is called only after the first user interaction.
  - **Acceptance**: Renaming `ghosty.png` temporarily causes the fallback rectangle to render; the game remains playable.

- [ ] 18. Example-based unit tests
  - Create `tests/unit.test.js` covering:
    - **Start screen state**: `GameState` initialized with `phase = 'START'`, `score = 0`, `pipes = []`, `clouds = []`, Ghosty at vertical center.
    - **Game over screen**: After `CollisionDetector.check` returns `collided: true`, `phase` transitions to `'GAME_OVER'`.
    - **Restart**: After `restartGame()`, `score = 0`, `pipes = []`, `clouds = []`, Ghosty at starting position, `highScore` unchanged.
    - **Audio graceful degradation**: `AudioManager.playJump()` with `sounds.jump = null` does not throw.
    - **localStorage invalid data**: `ScoreManager.loadHighScore()` returns `0` when storage contains `"abc"`, `"-5"`, or is empty.
    - **Boundary collision**: `CollisionDetector.check` with `ghosty.y = 0` returns `reason: 'top'`; with `ghosty.y + ghosty.height = canvasHeight` returns `reason: 'bottom'`.
    - **Pipe removal**: After `scrollAndCull` moves a pipe to `x + width < 0`, it is absent from the returned array.
    - **Score increment**: `scored` flag transitions from `false` to `true` exactly once when Ghosty passes a pipe midpoint.
  - Run `npm test`; all example-based tests must pass.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": [1] },
    { "wave": 2, "tasks": [2] },
    { "wave": 3, "tasks": [3, 5, 7, 9, 11, 13, 14] },
    { "wave": 4, "tasks": [4, 6, 8, 10, 12] },
    { "wave": 5, "tasks": [15] },
    { "wave": 6, "tasks": [16, 17, 18] },
    { "wave": 7, "tasks": [19] }
  ]
}
```

## Notes

- All property-based tests live in `tests/` and run with `npm test` (vitest + fast-check). The game itself has no build step.
- Pure logic functions (physics, scoring, spawning, collision) must be importable by Node.js test files without a browser DOM. Keep them as plain ES modules or CommonJS exports in `tests/` helper files.
- Each property test must include the tag comment `// Feature: flappy-kiro, Property N: <property_text>` and run with `numRuns: 100`.
- The 13 correctness properties from the design document map 1-to-1 to tasks 4, 6, 8, 10, and 12. No property may be skipped.
- Rendering and audio components are browser-only; test them with lightweight stubs/mocks in unit tests (task 18) rather than property tests.
- Task 19 is a manual browser smoke-test checklist; it does not produce automated test output but must be completed before the spec is considered done.

- [~] 19. Final integration verification
  - Open `index.html` in a modern browser (Chrome/Firefox/Safari) and verify:
    - Start screen displays correctly with Ghosty centered.
    - Gameplay starts on Space/click/tap.
    - Ghosty responds to jump input with sound.
    - Pipes and clouds scroll and are culled correctly.
    - Collision triggers game over screen with correct score display.
    - High score persists across page reloads (check `localStorage` in DevTools).
    - Resizing the window mid-game does not crash.
    - Missing audio files log a warning but do not break gameplay.
  - Run `npm test` one final time to confirm all property-based and unit tests pass.
  - **Acceptance**: All manual checks pass; `npm test` exits with zero failures.

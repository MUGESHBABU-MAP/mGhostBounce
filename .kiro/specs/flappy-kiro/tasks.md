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
  - _Requirements: 9.1, 9.5_

- [x] 2. Constants and GameState definition
  - Define all game constants inside `index.html`'s script block: `PIPE_SPEED`, `PIPE_INTERVAL`, `PIPE_WIDTH`, `GAP_MIN_RATIO`, `GAP_MAX_RATIO`, `CLOUD_SPEED_MIN`, `CLOUD_SPEED_MAX`, `CLOUD_INTERVAL_MIN`, `CLOUD_INTERVAL_MAX`, `GRAVITY`, `JUMP_VELOCITY`.
  - Define the `GameState` object factory/initializer that returns a fresh state with fields: `phase`, `ghosty` (GhostyState), `pipes`, `clouds`, `score`, `highScore`, `canvas`, `ctx`, `lastTimestamp`, `nextPipeX`, `nextCloudX`.
  - Define the `GhostyState`, `PipePair`, and `Cloud` data shapes as documented in the design.
  - _Requirements: 1.3, 2.1, 3.1, 6.5_

- [x] 3. Physics_Engine implementation
  - Implement `PhysicsEngine` with constants `GRAVITY = 1200`, `JUMP_VELOCITY = -500`, and `MAX_FALL_SPEED` derived from canvas height.
  - Implement `update(ghosty, delta)`: adds `GRAVITY * delta` to `ghosty.vy`, clamps `vy` to `[JUMP_VELOCITY, MAX_FALL_SPEED]`, then sets `ghosty.y += ghosty.vy * delta`.
  - Implement `applyJump(ghosty)`: sets `ghosty.vy = JUMP_VELOCITY` unconditionally.
  - Export the pure functions from `tests/physics.js` so they can be imported by tests without a DOM.
  - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6_

- [x] 4. Property-based tests — Physics_Engine (Properties 1, 2, 3)
  - Create `tests/physics.test.js`.
  - [x]\* 4.1 Write property test for Physics_Engine velocity clamping
    - **Property 1: Ghosty velocity is always clamped within bounds**
    - Use `fc.array(fc.oneof(...), {minLength: 1, maxLength: 50})` to generate action sequences; assert `vy` stays in `[JUMP_VELOCITY, MAX_FALL_SPEED]` after every step.
    - **Validates: Requirements 2.5, 2.6**
  - [x]\* 4.2 Write property test for Physics_Engine update formula
    - **Property 2: Physics update formula holds for any delta time**
    - Use `fc.record({y, vy, dt})` to generate inputs; assert new position and velocity match the formula exactly.
    - **Validates: Requirements 2.1, 2.4**
  - [x]\* 4.3 Write property test for jump impulse replacement
    - **Property 3: Jump impulse always replaces velocity**
    - Use `fc.float({min: -2000, max: 2000})` for arbitrary `vy`; assert `applyJump` sets `vy` to exactly `JUMP_VELOCITY`.
    - **Validates: Requirements 2.2, 2.6**

- [x] 5. Score_Manager implementation
  - Implement `ScoreManager` with `STORAGE_KEY = 'flappyKiroHighScore'`.
  - Implement `loadHighScore()`: wraps `localStorage.getItem` in try/catch; parses as integer; returns `0` if missing, non-numeric, negative, or if `localStorage` throws.
  - Implement `saveHighScore(score)`: wraps `localStorage.setItem` in try/catch; logs `console.warn` on failure.
  - Implement `checkAndUpdateHighScore(score, highScore)`: returns `Math.max(score, highScore)`.
  - Export pure functions to `tests/score.js` for test isolation.
  - _Requirements: 6.1, 6.3, 6.4, 6.5_

- [x] 6. Property-based tests — Score_Manager (Properties 9, 10, 11, 12)
  - Create `tests/score.test.js`.
  - [x]\* 6.1 Write property test for score counting
    - **Property 9: Score equals the count of pipes passed**
    - Use `fc.array(fc.boolean(), {minLength: 0, maxLength: 30})` to generate `scored` flag arrays; assert score equals `array.filter(Boolean).length` and each flag transitions `false → true` at most once.
    - **Validates: Requirements 6.1**
  - [x]\* 6.2 Write property test for high score update
    - **Property 10: High score update is the maximum of score and prior high score**
    - Use `fc.tuple(fc.integer({min: 0, max: 10000}), fc.integer({min: 0, max: 10000}))` for `(score, highScore)` pairs; assert result equals `Math.max(score, highScore)`.
    - **Validates: Requirements 6.3**
  - [x]\* 6.3 Write property test for localStorage round-trip
    - **Property 11: High score localStorage round-trip preserves value**
    - Use `fc.integer({min: 0, max: 999999})` for valid values and `fc.oneof(fc.string(), fc.constant(null))` for invalid values; assert round-trip returns the same integer and invalid inputs return `0`.
    - **Validates: Requirements 6.4, 6.5**
  - [x]\* 6.4 Write property test for high score preservation across restarts
    - **Property 12: High score is preserved across restarts**
    - Use `fc.integer({min: 0, max: 999999})` for high score values; simulate a restart; assert high score is unchanged.
    - **Validates: Requirements 7.2**

- [x] 7. Pipe and Cloud spawning logic
  - Implement `spawnPipe(canvasWidth, canvasHeight, ghostyHeight)`: generates a `PipePair` with randomized `gapCenterY` in `[GAP_MIN_RATIO * canvasHeight, GAP_MAX_RATIO * canvasHeight]` and `gapHeight = Math.max(2 * ghostyHeight, GAP_MINIMUM_PX)`.
  - Implement `spawnCloud(canvasWidth, canvasHeight)`: generates a `Cloud` with randomized `y` in `[0.20 * canvasHeight, 0.80 * canvasHeight]`, randomized `width` (80–140px), `height` (40–70px), and `speed` in `[CLOUD_SPEED_MIN * PIPE_SPEED, CLOUD_SPEED_MAX * PIPE_SPEED]`.
  - Implement `scrollAndCull(entities, delta)`: moves each entity left by `entity.speed * delta` (or `PIPE_SPEED * delta` for pipes) and removes any whose `x + width < 0`.
  - Export pure spawn and cull functions to `tests/spawning.js`.
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.2, 4.3, 4.4_

- [x] 8. Property-based tests — Spawning and Scrolling (Properties 4, 5, 6)
  - Create `tests/spawning.test.js`.
  - [x]\* 8.1 Write property test for pipe spawn invariants
    - **Property 4: Pipe spawn invariants hold for any canvas size**
    - Use `fc.record({canvasHeight: fc.integer({min: 200, max: 1200}), ghostyHeight: fc.integer({min: 20, max: 80})})` to generate inputs; assert `gapCenterY` is in `[0.20 * h, 0.80 * h]` and `gapHeight >= 2 * ghostyHeight`.
    - **Validates: Requirements 3.3, 3.4**
  - [x]\* 8.2 Write property test for off-screen entity removal
    - **Property 5: Off-screen entities are always removed from the active set**
    - Generate entity arrays and scroll steps; assert no entity with `x + width < 0` remains after culling.
    - **Validates: Requirements 3.5, 4.4**
  - [x]\* 8.3 Write property test for cloud spawn invariants
    - **Property 6: Cloud spawn invariants hold for any canvas size**
    - Use `fc.integer({min: 200, max: 1200})` for canvas height; assert `cloud.y` is in `[0.20 * h, 0.80 * h]` and `cloud.speed` is in `[0.40 * PIPE_SPEED, 0.60 * PIPE_SPEED]`.
    - **Validates: Requirements 4.2, 4.3**

- [x] 9. Collision_Detector implementation
  - Implement `CollisionDetector.check(ghosty, pipes, clouds, canvasHeight)` returning `{ collided: boolean, reason: 'pipe' | 'cloud' | 'top' | 'bottom' | null }`.
  - AABB overlap helper: two rectangles overlap if `ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by`.
  - Check top boundary: `ghosty.y <= 0` → `{ collided: true, reason: 'top' }`.
  - Check bottom boundary: `ghosty.y + ghosty.height >= canvasHeight` → `{ collided: true, reason: 'bottom' }`.
  - Check each pipe pair: top pipe `(pipe.x, 0, pipe.width, gapTop)` and bottom pipe `(pipe.x, gapBottom, pipe.width, canvasHeight - gapBottom)`.
  - Check each cloud bounding box.
  - Export pure collision functions to `tests/collision.js`.
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 10. Property-based tests — Collision_Detector (Properties 7, 8)
  - Create `tests/collision.test.js`.
  - [x]\* 10.1 Write property test for obstacle overlap triggering game over
    - **Property 7: Any obstacle overlap triggers game over**
    - Generate overlapping Ghosty/obstacle bounding box pairs by construction; assert `check` returns `collided: true`.
    - **Validates: Requirements 5.1, 5.2**
  - [x]\* 10.2 Write property test for boundary violation triggering game over
    - **Property 8: Any boundary violation triggers game over**
    - Use boundary-violating `y` values; assert `check` returns `collided: true` with reason `'top'` or `'bottom'`.
    - **Validates: Requirements 5.3, 5.4**

- [x] 11. Audio_Manager implementation
  - Implement `AudioManager` with `sounds = { jump: null, gameOver: null }` and `ready = false`.
  - Implement `preload()`: creates `new Audio('assets/jump.wav')` and `new Audio('assets/game_over.wav')`; attaches `onerror` handlers that call `console.warn` and set the slot to `null`.
  - Implement `playJump()` and `playGameOver()`: if the sound is non-null, set `currentTime = 0` then call `.play()`; catch any rejected Promise silently.
  - Defer `preload()` until the first user interaction to satisfy autoplay policies.
  - Export a testable `createAudioManager(audioFactory)` factory to `tests/audio.js` that accepts an injectable `Audio` constructor for testing.
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 12. Property-based test — Audio_Manager (Property 13)
  - Create `tests/audio.test.js`.
  - [x]\* 12.1 Write property test for sound re-trigger resetting playback
    - **Property 13: Sound re-trigger always resets playback to the beginning**
    - Use `fc.float({min: 0, max: 300})` for arbitrary `currentTime` values; create a mock `Audio` object; assert that after calling `playJump()` or `playGameOver()`, `currentTime === 0` before `play()` is invoked.
    - **Validates: Requirements 8.4**

- [x] 13. Input_Handler implementation
  - Implement `InputHandler` with an `onJump` callback slot.
  - Implement `attach(canvas)`: adds `keydown` listener on `document` (fires on Space key), `mousedown` listener on `canvas`, and `touchstart` listener on `canvas` (calls `e.preventDefault()` to suppress scroll).
  - Implement `detach()`: removes all three listeners.
  - Wire `onJump` to call `PhysicsEngine.applyJump(gameState.ghosty)` and `AudioManager.playJump()` when `gameState.phase === 'PLAYING'`; on `START` or `GAME_OVER`, trigger the appropriate state transition instead.
  - _Requirements: 2.2, 2.3, 9.3_

- [x] 14. Renderer implementation
  - Implement `Renderer` with all draw methods operating on `ctx` and `canvas`.
  - `drawBackground(ctx, canvas)`: fills with light blue (`#b0e0ff`) then draws a few horizontal sketchy stroke lines for texture.
  - `drawGhosty(ctx, ghosty, image)`: draws `image` at `(ghosty.x, ghosty.y, ghosty.width, ghosty.height)`; falls back to `ctx.strokeRect` if image is null.
  - `drawPipes(ctx, pipes)`: for each pipe, compute `gapTop` and `gapBottom`; draw top and bottom pipes with green stroke and jitter for sketchy style.
  - `drawClouds(ctx, clouds)`: draw each cloud as `ctx.strokeRect` with white/grey stroke and jitter.
  - `drawScoreBar(ctx, score, highScore, canvas)`: draw a semi-transparent bar at the bottom; render `"Score: X | High: X"` in a retro font.
  - `drawStartScreen(ctx, canvas, ghosty, image)`: draw title text, Ghosty centered, and "Press Space / Click / Tap to Start" prompt.
  - `drawGameOverScreen(ctx, canvas, score, highScore)`: draw semi-transparent overlay, "GAME OVER" heading, final score, high score, and restart prompt.
  - _Requirements: 1.1, 1.2, 2.4, 3.2, 4.1, 4.5, 5.7, 6.2_

- [x] 15. GameLoop and state machine integration
  - Implement the `GameLoop` that drives the `requestAnimationFrame` cycle.
  - On each tick: compute `delta = (timestamp - lastTimestamp) / 1000`; clamp delta to `0.05` max to prevent spiral-of-death on tab switch.
  - In `PLAYING` phase: call `PhysicsEngine.update`, `scrollAndCull` for pipes and clouds, `spawnPipe`/`spawnCloud` when `nextPipeX`/`nextCloudX` thresholds are reached, `ScoreManager` pipe-passing check, `CollisionDetector.check`; on collision, transition to `GAME_OVER`.
  - In `GAME_OVER` phase: call `ScoreManager.checkAndUpdateHighScore`, `ScoreManager.saveHighScore`, `AudioManager.playGameOver`.
  - Call `Renderer.render(gameState)` every tick regardless of phase.
  - Implement `startGame()` and `restartGame()` functions that reset `GameState` and resume the loop.
  - Wire `InputHandler.onJump` to the correct action per phase.
  - _Requirements: 1.3, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.3, 7.1, 7.2, 7.3, 9.4_

- [x] 16. Responsive canvas and viewport resize handling
  - On page load, set `canvas.width = window.innerWidth` and `canvas.height = window.innerHeight`.
  - Add a `window.resize` event listener that updates canvas dimensions and clamps `ghosty.y` to `[0, canvas.height - ghosty.height]`.
  - Update `PhysicsEngine.MAX_FALL_SPEED` to `canvas.height` after each resize.
  - _Requirements: 9.1, 9.2_

- [x] 17. Asset loading and error handling
  - Load `ghosty.png` via `new Image()`; set `img.src = 'assets/ghosty.png'`; attach `onerror` to set `ghostyImage = null` (fallback to `strokeRect`).
  - Wrap `getContext('2d')` in a null check; if null, display a static error message in the HTML body and do not start the game loop.
  - Ensure `AudioManager.preload()` is called only after the first user interaction.
  - _Requirements: 2.3, 8.1, 8.5_

- [x] 18. Example-based unit tests
  - Create `tests/unit.test.js` covering:
    - **Start screen state**: `GameState` initialized with `phase = 'START'`, `score = 0`, `pipes = []`, `clouds = []`, Ghosty at vertical center.
    - **Game over screen**: After `CollisionDetector.check` returns `collided: true`, `phase` transitions to `'GAME_OVER'`.
    - **Restart**: After `restartGame()`, `score = 0`, `pipes = []`, `clouds = []`, Ghosty at starting position, `highScore` unchanged.
    - **Audio graceful degradation**: `AudioManager.playJump()` with `sounds.jump = null` does not throw.
    - **localStorage invalid data**: `ScoreManager.loadHighScore()` returns `0` when storage contains `"abc"`, `"-5"`, or is empty.
    - **Boundary collision**: `CollisionDetector.check` with `ghosty.y = 0` returns `reason: 'top'`; with `ghosty.y + ghosty.height = canvasHeight` returns `reason: 'bottom'`.
    - **Pipe removal**: After `scrollAndCull` moves a pipe to `x + width < 0`, it is absent from the returned array.
    - **Score increment**: `scored` flag transitions from `false` to `true` exactly once when Ghosty passes a pipe midpoint.
  - _Requirements: 1.1, 1.3, 5.3, 5.4, 6.1, 7.1, 7.2, 8.1, 8.2_

- [x] 19. Checkpoint — Ensure all automated tests pass
  - Run `npm test` in `tests/` to confirm all property-based tests (Properties 1–13) and all example-based unit tests pass with zero failures.
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Final integration verification
  - Open `index.html` in a modern browser (Chrome/Firefox/Safari) and verify:
    - Start screen displays correctly with Ghosty centered.
    - Gameplay starts on Space/click/tap.
    - Ghosty responds to jump input with sound.
    - Pipes and clouds scroll and are culled correctly.
    - Collision triggers game over screen with correct score display.
    - High score persists across page reloads (check `localStorage` in DevTools).
    - Resizing the window mid-game does not crash.
    - Missing audio files log a warning but do not break gameplay.
  - **Acceptance**: All manual checks pass; `npm test` exits with zero failures.
  - _Requirements: 1.1, 1.2, 2.2, 2.3, 3.2, 4.1, 5.1, 6.2, 6.4, 7.1, 8.1, 9.1, 9.2_

## Notes

- All property-based tests live in `tests/` and run with `npm test` (vitest + fast-check). The game itself has no build step.
- Pure logic functions (physics, scoring, spawning, collision) must be importable by Node.js test files without a browser DOM. Keep them as plain ES modules in `tests/` helper files.
- Each property test must include the tag comment `// Feature: flappy-kiro, Property N: <property_text>` and run with `numRuns: 100`.
- The 13 correctness properties from the design document map 1-to-1 to tasks 4, 6, 8, 10, and 12. No property may be skipped.
- Rendering and audio components are browser-only; test them with lightweight stubs/mocks in unit tests (task 18) rather than property tests.
- Tasks marked with `*` are optional and can be skipped for faster MVP.
- Task 20 is a manual browser smoke-test checklist; it does not produce automated test output but must be completed before the spec is considered done.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2"] },
    { "id": 2, "tasks": ["3", "5", "7", "9", "11", "13", "14"] },
    {
      "id": 3,
      "tasks": [
        "4.1",
        "4.2",
        "4.3",
        "6.1",
        "6.2",
        "6.3",
        "6.4",
        "8.1",
        "8.2",
        "8.3",
        "10.1",
        "10.2",
        "12.1"
      ]
    },
    { "id": 4, "tasks": ["15"] },
    { "id": 5, "tasks": ["16", "17", "18"] },
    { "id": 6, "tasks": ["19"] },
    { "id": 7, "tasks": ["20"] }
  ]
}
```

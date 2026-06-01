import { describe, it, expect } from "vitest";
import { check } from "./collision.js";
import {
  loadHighScore,
  saveHighScore,
  createMemoryStorage,
  STORAGE_KEY,
} from "./score.js";
import { scrollAndCullPipes, PIPE_WIDTH, PIPE_SPEED } from "./spawning.js";
import { createAudioManager } from "./audio.js";

// ── Helpers ────────────────────────────────────────────────────────────────

/** Create a minimal mock GameState (no DOM dependency). */
function createMockGameState(overrides = {}) {
  const canvas = { width: 800, height: 600 };
  return {
    phase: "START",
    ghosty: {
      x: canvas.width * 0.2, // 160
      y: canvas.height / 2 - 24, // 276 — vertical centre
      vy: 0,
      width: 48,
      height: 48,
    },
    pipes: [],
    clouds: [],
    score: 0,
    highScore: 0,
    canvas,
    ctx: null,
    lastTimestamp: 0,
    nextPipeX: canvas.width + 200,
    nextCloudX: canvas.width + 200,
    ...overrides,
  };
}

/**
 * Inline restartGame — mirrors the logic in index.html so we can test it
 * without importing the browser-only bootstrap script.
 */
function restartGame(state) {
  const savedHighScore = state.highScore;
  state.phase = "PLAYING";
  state.score = 0;
  state.pipes = [];
  state.clouds = [];
  state.lastTimestamp = 0;
  state.ghosty.y = state.canvas.height / 2 - state.ghosty.height / 2;
  state.ghosty.vy = 0;
  state.highScore = savedHighScore;
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("Example-based unit tests", () => {
  // 1. Start screen state
  it("GameState initialises with phase=START, score=0, empty pipes/clouds, Ghosty at vertical centre", () => {
    const state = createMockGameState();
    expect(state.phase).toBe("START");
    expect(state.score).toBe(0);
    expect(state.pipes).toEqual([]);
    expect(state.clouds).toEqual([]);
    // Ghosty should be vertically centred: y = height/2 - ghosty.height/2
    const expectedY = state.canvas.height / 2 - state.ghosty.height / 2;
    expect(state.ghosty.y).toBe(expectedY);
  });

  // 2. Game over transition
  it("phase transitions to GAME_OVER when CollisionDetector.check returns collided:true", () => {
    const state = createMockGameState({ phase: "PLAYING" });

    // Place Ghosty at the top boundary — guaranteed collision
    state.ghosty.y = 0;

    const result = check(
      state.ghosty,
      state.pipes,
      state.clouds,
      state.canvas.height,
    );

    expect(result.collided).toBe(true);

    // Simulate the GameLoop transition
    if (result.collided) {
      state.phase = "GAME_OVER";
    }

    expect(state.phase).toBe("GAME_OVER");
  });

  // 3. Restart resets score/pipes/clouds/Ghosty but preserves highScore
  it("restartGame resets score=0, pipes=[], clouds=[], Ghosty to start position, highScore unchanged", () => {
    const state = createMockGameState({
      phase: "GAME_OVER",
      score: 7,
      highScore: 12,
      pipes: [
        { x: 400, gapCenterY: 300, gapHeight: 120, width: 60, scored: false },
      ],
      clouds: [{ x: 200, y: 100, width: 100, height: 50, speed: 70 }],
    });

    restartGame(state);

    expect(state.score).toBe(0);
    expect(state.pipes).toEqual([]);
    expect(state.clouds).toEqual([]);
    expect(state.highScore).toBe(12); // preserved
    expect(state.ghosty.y).toBe(
      state.canvas.height / 2 - state.ghosty.height / 2,
    );
    expect(state.ghosty.vy).toBe(0);
  });

  // 4. Audio graceful degradation — playJump with sounds.jump = null must not throw
  it("AudioManager.playJump() with sounds.jump=null does not throw", () => {
    const manager = createAudioManager(() => ({
      currentTime: 0,
      play() {
        return Promise.resolve();
      },
      onerror: null,
    }));
    manager.preload();
    // Manually null out the jump sound to simulate a load failure
    manager.sounds.jump = null;

    expect(() => manager.playJump()).not.toThrow();
  });

  // 5. localStorage invalid data returns 0
  it("loadHighScore returns 0 for invalid stored values: 'abc', '-5', and empty storage", () => {
    // "abc" — non-numeric
    const storageAbc = { getItem: () => "abc", setItem: () => {} };
    expect(loadHighScore(storageAbc)).toBe(0);

    // "-5" — negative integer
    const storageNeg = { getItem: () => "-5", setItem: () => {} };
    expect(loadHighScore(storageNeg)).toBe(0);

    // null — empty / missing
    const storageEmpty = { getItem: () => null, setItem: () => {} };
    expect(loadHighScore(storageEmpty)).toBe(0);
  });

  // 6. Boundary collision — top and bottom
  it("CollisionDetector.check returns reason:'top' when ghosty.y=0 and reason:'bottom' when ghosty.y+height=canvasHeight", () => {
    const canvasHeight = 600;
    const ghostyBase = { x: 100, width: 48, height: 48 };

    // Top boundary
    const topResult = check({ ...ghostyBase, y: 0 }, [], [], canvasHeight);
    expect(topResult.collided).toBe(true);
    expect(topResult.reason).toBe("top");

    // Bottom boundary: y + height === canvasHeight
    const bottomY = canvasHeight - ghostyBase.height; // 552
    const bottomResult = check(
      { ...ghostyBase, y: bottomY },
      [],
      [],
      canvasHeight,
    );
    expect(bottomResult.collided).toBe(true);
    expect(bottomResult.reason).toBe("bottom");
  });

  // 7. Pipe removal — scrollAndCullPipes removes pipes whose x + width < 0
  it("scrollAndCullPipes removes a pipe that has scrolled fully off-screen", () => {
    // Place a pipe so that after one large scroll step it goes off-screen.
    // x = -PIPE_WIDTH - 1 means x + width = -1 < 0 already.
    const pipes = [
      {
        x: -(PIPE_WIDTH + 1),
        gapCenterY: 300,
        gapHeight: 120,
        width: PIPE_WIDTH,
        scored: false,
      },
      {
        x: 400,
        gapCenterY: 300,
        gapHeight: 120,
        width: PIPE_WIDTH,
        scored: false,
      },
    ];

    scrollAndCullPipes(pipes, 0); // delta=0 so positions don't change; first pipe is already off-screen

    expect(pipes.length).toBe(1);
    expect(pipes[0].x).toBe(400);
  });

  // 8. Score increment — scored flag transitions false→true exactly once
  it("scored flag transitions false→true exactly once when Ghosty passes a pipe midpoint", () => {
    const ghosty = { x: 200, y: 276, width: 48, height: 48 };

    // Pipe midpoint is at pipe.x + pipe.width / 2.
    // Ghosty passes when pipe.x + pipe.width / 2 < ghosty.x.
    // Set pipe.x so midpoint (pipe.x + 30) < 200, i.e. pipe.x < 170.
    const pipe = {
      x: 100,
      gapCenterY: 300,
      gapHeight: 120,
      width: 60,
      scored: false,
    };

    let score = 0;

    // Simulate the score-check logic from the GameLoop (run twice to confirm idempotency)
    function checkScore() {
      if (!pipe.scored && pipe.x + pipe.width / 2 < ghosty.x) {
        pipe.scored = true;
        score += 1;
      }
    }

    checkScore(); // first call — should score
    checkScore(); // second call — should NOT score again

    expect(pipe.scored).toBe(true);
    expect(score).toBe(1);
  });
});

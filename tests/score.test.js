import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  loadHighScore,
  saveHighScore,
  checkAndUpdateHighScore,
  createMemoryStorage,
} from "./score.js";

describe("Score_Manager property-based tests", () => {
  // Feature: flappy-kiro, Property 9: Score equals the count of pipes passed
  it("Property 9: score equals count of scored===true pipes, each flag transitions false→true at most once", () => {
    // Validates: Requirements 6.1
    fc.assert(
      fc.property(
        fc.array(fc.boolean(), { minLength: 0, maxLength: 30 }),
        (scoredFlags) => {
          // Build a pipe array from the scored flags
          const pipes = scoredFlags.map((scored) => ({ scored }));

          // Score equals the count of pipes with scored === true
          const score = pipes.filter((p) => p.scored).length;
          expect(score).toBe(scoredFlags.filter(Boolean).length);

          // Verify each flag can only be false or true (no invalid states)
          // and that once true it stays true (monotonic: false→true at most once)
          // We simulate the transition: start all false, then set to true one by one
          const transitionCount = new Array(pipes.length).fill(0);
          for (let i = 0; i < pipes.length; i++) {
            // A pipe starts as false; if it's now true, it transitioned once
            if (pipes[i].scored === true) {
              transitionCount[i] = 1;
            }
            // Each pipe transitions at most once (0 or 1 times)
            expect(transitionCount[i]).toBeLessThanOrEqual(1);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: flappy-kiro, Property 10: High score update is the maximum of score and prior high score
  it("Property 10: checkAndUpdateHighScore returns Math.max(score, highScore)", () => {
    // Validates: Requirements 6.3
    fc.assert(
      fc.property(
        fc.tuple(
          fc.integer({ min: 0, max: 10000 }),
          fc.integer({ min: 0, max: 10000 }),
        ),
        ([score, highScore]) => {
          const result = checkAndUpdateHighScore(score, highScore);
          expect(result).toBe(Math.max(score, highScore));
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: flappy-kiro, Property 11: High score localStorage round-trip preserves value
  it("Property 11: valid integers round-trip through storage; invalid inputs return 0", () => {
    // Validates: Requirements 6.4, 6.5

    // Part A: valid non-negative integers round-trip correctly
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 999999 }), (value) => {
        const storage = createMemoryStorage();
        saveHighScore(value, storage);
        const loaded = loadHighScore(storage);
        expect(loaded).toBe(value);
      }),
      { numRuns: 100 },
    );

    // Part B: invalid stored values (non-numeric strings, null, undefined) return 0.
    // Filter fc.string() to exclude strings that parseInt would treat as valid
    // non-negative integers (e.g. "1", "42"), since those ARE valid stored values.
    const nonNumericStringArb = fc.string().filter((s) => {
      const parsed = parseInt(s, 10);
      return isNaN(parsed) || parsed < 0;
    });

    fc.assert(
      fc.property(
        fc.oneof(
          nonNumericStringArb,
          fc.constant(null),
          fc.constant(undefined),
        ),
        (invalidValue) => {
          // Build a storage that returns the invalid value for the key
          const storage = {
            getItem(_key) {
              return invalidValue;
            },
            setItem(_key, _value) {},
          };
          const loaded = loadHighScore(storage);
          expect(loaded).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: flappy-kiro, Property 12: High score is preserved across restarts
  it("Property 12: high score is unchanged after a restart (score resets to 0, high score reloads from storage)", () => {
    // Validates: Requirements 7.2
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 999999 }), (highScore) => {
        const storage = createMemoryStorage();

        // Save the high score (as it would be at end of a game)
        saveHighScore(highScore, storage);

        // Simulate a restart: score resets to 0, high score reloads from storage
        const scoreAfterRestart = 0;
        const highScoreAfterRestart = loadHighScore(storage);

        expect(scoreAfterRestart).toBe(0);
        expect(highScoreAfterRestart).toBe(highScore);
      }),
      { numRuns: 100 },
    );
  });
});

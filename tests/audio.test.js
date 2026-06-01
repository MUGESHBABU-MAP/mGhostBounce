import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { createAudioManager } from "./audio.js";

describe("Audio_Manager property-based tests", () => {
  // Feature: flappy-ghost, Property 13: Sound re-trigger always resets playback to the beginning
  it("Property 13: playJump() and playGameOver() always reset currentTime to 0 before play() is invoked", () => {
    // Validates: Requirements 8.4
    fc.assert(
      fc.property(fc.float({ min: 0, max: 300 }), (initialCurrentTime) => {
        // Track the currentTime recorded at the moment play() is called
        const playCallTimes = [];

        // Mock Audio factory — returns an object with currentTime and play()
        const mockAudioFactory = (_src) => ({
          currentTime: initialCurrentTime,
          play() {
            // Record currentTime at the moment play() is invoked
            playCallTimes.push(this.currentTime);
            return Promise.resolve();
          },
          onerror: null,
        });

        const manager = createAudioManager(mockAudioFactory);
        manager.preload();

        // Reset tracking array before each assertion
        playCallTimes.length = 0;

        // Test playJump(): currentTime must be 0 when play() is called
        manager.playJump();
        expect(playCallTimes.length).toBe(1);
        expect(playCallTimes[0]).toBe(0);

        // Reset tracking array
        playCallTimes.length = 0;

        // Test playGameOver(): currentTime must be 0 when play() is called
        manager.playGameOver();
        expect(playCallTimes.length).toBe(1);
        expect(playCallTimes[0]).toBe(0);
      }),
      { numRuns: 100 },
    );
  });
});

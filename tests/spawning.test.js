import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  spawnPipe,
  spawnCloud,
  scrollAndCullClouds,
  PIPE_SPEED,
  GAP_MIN_RATIO,
  GAP_MAX_RATIO,
  CLOUD_SPEED_MIN,
  CLOUD_SPEED_MAX,
} from "./spawning.js";

describe("Spawning and Scrolling property-based tests", () => {
  // Feature: flappy-ghost, Property 4: Pipe spawn invariants hold for any canvas size
  it("Property 4: spawned pipe satisfies gap center bounds and minimum gap height", () => {
    // Validates: Requirements 3.3, 3.4
    fc.assert(
      fc.property(
        fc.record({
          canvasHeight: fc.integer({ min: 200, max: 1200 }),
          ghostyHeight: fc.integer({ min: 20, max: 80 }),
        }),
        ({ canvasHeight, ghostyHeight }) => {
          const pipe = spawnPipe(800, canvasHeight, ghostyHeight);

          const minCenter = GAP_MIN_RATIO * canvasHeight;
          const maxCenter = GAP_MAX_RATIO * canvasHeight;

          expect(pipe.gapCenterY).toBeGreaterThanOrEqual(minCenter);
          expect(pipe.gapCenterY).toBeLessThanOrEqual(maxCenter);
          expect(pipe.gapHeight).toBeGreaterThanOrEqual(2 * ghostyHeight);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: flappy-ghost, Property 5: Off-screen entities are always removed from the active set
  it("Property 5: no entity with x + width < 0 remains after culling", () => {
    // Validates: Requirements 3.5, 4.4
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            x: fc.integer({ min: -500, max: 800 }),
            width: fc.integer({ min: 40, max: 120 }),
            speed: fc.integer({ min: 60, max: 200 }),
          }),
          { minLength: 0, maxLength: 20 },
        ),
        fc.integer({ min: 1, max: 100 }),
        (entities, scrollSteps) => {
          // Use a fixed delta per step (1 second) so entities scroll by their speed each step
          const delta = 1;
          // scrollAndCullClouds works on any entity with x, width, and speed properties
          const active = entities.map((e) => ({ ...e }));

          for (let i = 0; i < scrollSteps; i++) {
            scrollAndCullClouds(active, delta);
          }

          // After culling, no entity whose right edge is off-screen should remain
          for (const entity of active) {
            expect(entity.x + entity.width).toBeGreaterThanOrEqual(0);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: flappy-ghost, Property 6: Cloud spawn invariants hold for any canvas size
  it("Property 6: spawned cloud satisfies y-position bounds and speed bounds", () => {
    // Validates: Requirements 4.2, 4.3
    fc.assert(
      fc.property(fc.integer({ min: 200, max: 1200 }), (canvasHeight) => {
        const cloud = spawnCloud(800, canvasHeight);

        const minY = 0.2 * canvasHeight;
        const maxY = 0.8 * canvasHeight;
        const minSpeed = CLOUD_SPEED_MIN * PIPE_SPEED;
        const maxSpeed = CLOUD_SPEED_MAX * PIPE_SPEED;

        expect(cloud.y).toBeGreaterThanOrEqual(minY);
        expect(cloud.y).toBeLessThanOrEqual(maxY);
        expect(cloud.speed).toBeGreaterThanOrEqual(minSpeed);
        expect(cloud.speed).toBeLessThanOrEqual(maxSpeed);
      }),
      { numRuns: 100 },
    );
  });
});

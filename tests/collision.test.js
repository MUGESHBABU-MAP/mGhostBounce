import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { check } from "./collision.js";

describe("Collision_Detector property-based tests", () => {
  // Feature: flappy-kiro, Property 7: Any obstacle overlap triggers game over
  it("Property 7: any obstacle overlap triggers game over", () => {
    // Validates: Requirements 5.1, 5.2
    fc.assert(
      fc.property(
        // Ghosty bounding box
        fc.record({
          ax: fc.integer({ min: 10, max: 700 }),
          ay: fc.integer({ min: 10, max: 500 }),
          aw: fc.integer({ min: 1, max: 100 }),
          ah: fc.integer({ min: 1, max: 100 }),
        }),
        // Offsets to place obstacle inside Ghosty's bounds (guarantees overlap)
        fc.record({
          ox: fc.integer({ min: 0, max: 50 }),
          oy: fc.integer({ min: 0, max: 50 }),
          ow: fc.integer({ min: 1, max: 100 }),
          oh: fc.integer({ min: 1, max: 100 }),
        }),
        ({ ax, ay, aw, ah }, { ox, oy, ow, oh }) => {
          // Place obstacle so its top-left is inside Ghosty's bounds — guarantees AABB overlap
          const obstacleX = ax + (ox % aw);
          const obstacleY = ay + (oy % ah);

          const ghosty = { x: ax, y: ay, width: aw, height: ah };

          // Use a cloud as the overlapping obstacle (simplest path through check())
          const cloud = {
            x: obstacleX,
            y: obstacleY,
            width: ow,
            height: oh,
          };

          // canvasHeight large enough that boundary checks don't fire for our ghosty
          const canvasHeight = ay + ah + 100;

          const result = check(ghosty, [], [cloud], canvasHeight);

          expect(result.collided).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: flappy-kiro, Property 8: Any boundary violation triggers game over
  it("Property 8: any boundary violation triggers game over", () => {
    // Validates: Requirements 5.3, 5.4
    const GHOSTY_HEIGHT = 48;
    const CANVAS_HEIGHT = 600;

    fc.assert(
      fc.property(
        // Generate either a top-boundary-violating y (y <= 0) or bottom-boundary-violating y (y + 48 >= 600)
        fc.oneof(
          // Top boundary: y <= 0
          fc.integer({ min: -500, max: 0 }),
          // Bottom boundary: y + 48 >= 600, i.e. y >= 552
          fc.integer({ min: 552, max: 1200 }),
        ),
        fc.integer({ min: 10, max: 200 }), // ghosty width
        (y, width) => {
          const ghosty = {
            x: 100,
            y,
            width,
            height: GHOSTY_HEIGHT,
          };

          const result = check(ghosty, [], [], CANVAS_HEIGHT);

          expect(result.collided).toBe(true);
          expect(["top", "bottom"]).toContain(result.reason);
        },
      ),
      { numRuns: 100 },
    );
  });
});

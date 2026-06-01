import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { check } from "./collision.js";

describe("Collision_Detector property-based tests", () => {
  // Feature: flappy-ghost, Property 7: Any pipe overlap triggers game over (clouds are decorative)
  it("Property 7: any pipe overlap triggers game over", () => {
    // Validates: Requirements 5.1
    // Note: clouds are decorative only and do NOT trigger game over (Requirement 5.2 updated)
    fc.assert(
      fc.property(
        // Ghosty bounding box — keep y well above 0 and below canvasHeight so boundary checks don't fire
        fc.record({
          ax: fc.integer({ min: 10, max: 700 }),
          ay: fc.integer({ min: 10, max: 400 }),
          aw: fc.integer({ min: 1, max: 100 }),
          ah: fc.integer({ min: 1, max: 100 }),
        }),
        // Offsets to place pipe inside Ghosty's bounds (guarantees overlap)
        fc.record({
          ox: fc.integer({ min: 0, max: 50 }),
          oy: fc.integer({ min: 0, max: 50 }),
          ow: fc.integer({ min: 1, max: 100 }),
        }),
        ({ ax, ay, aw, ah }, { ox, oy, ow }) => {
          // Place pipe so its top-left is inside Ghosty's bounds — guarantees AABB overlap
          const pipeX = ax + (ox % aw);
          const pipeY = ay + (oy % ah);

          const ghosty = { x: ax, y: ay, width: aw, height: ah };

          // Construct a pipe whose top section overlaps Ghosty.
          // gapTop = pipeY (top pipe height), so top pipe covers (pipeX, 0) to (pipeX+ow, pipeY).
          // Ghosty's top-left (ax, ay) is inside that rectangle.
          const pipe = {
            x: pipeX,
            gapCenterY: pipeY + 300, // gap is far below — top pipe definitely overlaps
            gapHeight: 10, // tiny gap so gapTop ≈ pipeY + 295
            width: ow,
          };

          // canvasHeight large enough that boundary checks don't fire
          const canvasHeight = ay + ah + 200;

          const result = check(ghosty, [pipe], [], canvasHeight);

          expect(result.collided).toBe(true);
          expect(result.reason).toBe("pipe");
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: flappy-ghost, Property 7b: Clouds do NOT trigger game over (decorative only)
  it("Property 7b: cloud overlap does NOT trigger game over", () => {
    fc.assert(
      fc.property(
        fc.record({
          ax: fc.integer({ min: 10, max: 700 }),
          ay: fc.integer({ min: 10, max: 400 }),
          aw: fc.integer({ min: 1, max: 100 }),
          ah: fc.integer({ min: 1, max: 100 }),
        }),
        ({ ax, ay, aw, ah }) => {
          const ghosty = { x: ax, y: ay, width: aw, height: ah };
          // Cloud placed directly on top of Ghosty
          const cloud = { x: ax, y: ay, width: aw, height: ah };
          const canvasHeight = ay + ah + 200;

          const result = check(ghosty, [], [cloud], canvasHeight);

          // Clouds are decorative — should NOT collide
          expect(result.collided).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: flappy-ghost, Property 8: Any boundary violation triggers game over
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

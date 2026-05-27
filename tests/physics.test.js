import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  update,
  applyJump,
  GRAVITY,
  JUMP_VELOCITY,
  DEFAULT_MAX_FALL_SPEED,
} from "./physics.js";

const MAX_FALL_SPEED = DEFAULT_MAX_FALL_SPEED;

describe("Physics_Engine property-based tests", () => {
  // Feature: flappy-kiro, Property 1: Ghosty velocity is always clamped within bounds
  it("Property 1: vy stays in [JUMP_VELOCITY, MAX_FALL_SPEED] after any action sequence", () => {
    // Validates: Requirements 2.5, 2.6
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            fc.record({
              type: fc.constant("gravity"),
              dt: fc.float({
                min: Math.fround(0.001),
                max: Math.fround(0.1),
                noNaN: true,
              }),
            }),
            fc.record({ type: fc.constant("jump") }),
          ),
          { minLength: 1, maxLength: 50 },
        ),
        (actions) => {
          const ghosty = { y: 300, vy: 0 };
          for (const action of actions) {
            if (action.type === "gravity") {
              update(ghosty, action.dt, MAX_FALL_SPEED);
            } else {
              applyJump(ghosty);
            }
            expect(ghosty.vy).toBeGreaterThanOrEqual(JUMP_VELOCITY);
            expect(ghosty.vy).toBeLessThanOrEqual(MAX_FALL_SPEED);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: flappy-kiro, Property 2: Physics update formula holds for any delta time
  it("Property 2: position and velocity match the formula after one update", () => {
    // Validates: Requirements 2.1, 2.4
    fc.assert(
      fc.property(
        fc.record({
          y: fc.float({
            min: Math.fround(0),
            max: Math.fround(600),
            noNaN: true,
          }),
          vy: fc.float({
            min: Math.fround(-500),
            max: Math.fround(600),
            noNaN: true,
          }),
          dt: fc.float({
            min: Math.fround(0.001),
            max: Math.fround(0.1),
            noNaN: true,
          }),
        }),
        ({ y, vy, dt }) => {
          const ghosty = { y, vy };

          // Compute expected values using the formula
          const expectedVy = Math.min(
            Math.max(vy + GRAVITY * dt, JUMP_VELOCITY),
            MAX_FALL_SPEED,
          );
          const expectedY = y + expectedVy * dt;

          update(ghosty, dt, MAX_FALL_SPEED);

          expect(ghosty.vy).toBeCloseTo(expectedVy, 5);
          expect(ghosty.y).toBeCloseTo(expectedY, 5);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: flappy-kiro, Property 3: Jump impulse always replaces velocity
  it("Property 3: applyJump always sets vy to exactly JUMP_VELOCITY", () => {
    // Validates: Requirements 2.2, 2.6
    fc.assert(
      fc.property(
        fc.float({
          min: Math.fround(-2000),
          max: Math.fround(2000),
          noNaN: true,
        }),
        (initialVy) => {
          const ghosty = { y: 300, vy: initialVy };
          applyJump(ghosty);
          expect(ghosty.vy).toBe(JUMP_VELOCITY);
        },
      ),
      { numRuns: 100 },
    );
  });
});

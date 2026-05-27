/**
 * physics.js — Pure physics functions for Flappy Kiro.
 *
 * This module has NO DOM dependency and can be imported directly by Node.js
 * test files. It mirrors the PhysicsEngine object in index.html.
 */

export const GRAVITY = 1200; // px/s²
export const JUMP_VELOCITY = -500; // px/s (upward)

/**
 * Default MAX_FALL_SPEED used when no canvas height is available.
 * In the browser this is set to canvas.height; tests use this default.
 */
export const DEFAULT_MAX_FALL_SPEED = 600; // px/s

/**
 * Apply gravity and update Ghosty's position for one frame.
 *
 * @param {{ y: number, vy: number }} ghosty
 * @param {number} delta           Elapsed time in seconds
 * @param {number} [maxFallSpeed]  Maximum downward velocity (default 600)
 */
export function update(ghosty, delta, maxFallSpeed = DEFAULT_MAX_FALL_SPEED) {
  // Accelerate downward by gravity
  ghosty.vy += GRAVITY * delta;
  // Clamp velocity to [JUMP_VELOCITY, maxFallSpeed]
  if (ghosty.vy < JUMP_VELOCITY) ghosty.vy = JUMP_VELOCITY;
  if (ghosty.vy > maxFallSpeed) ghosty.vy = maxFallSpeed;
  // Integrate position
  ghosty.y += ghosty.vy * delta;
}

/**
 * Apply an instantaneous upward jump impulse.
 * Replaces current velocity — no stacking.
 *
 * @param {{ vy: number }} ghosty
 */
export function applyJump(ghosty) {
  ghosty.vy = JUMP_VELOCITY;
}

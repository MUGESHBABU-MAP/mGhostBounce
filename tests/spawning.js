/**
 * spawning.js — Pure pipe and cloud spawning/culling functions for Flappy Kiro.
 *
 * This module has NO DOM dependency and can be imported directly by Node.js
 * test files. It mirrors the Spawning section in index.html.
 */

// ── Constants ──────────────────────────────────────────────────────────────
export const PIPE_SPEED = 150; // px/s
export const PIPE_WIDTH = 60; // px
export const GAP_MIN_RATIO = 0.2; // gap center min: 20% of canvas height
export const GAP_MAX_RATIO = 0.8; // gap center max: 80% of canvas height
export const CLOUD_SPEED_MIN = 0.4; // fraction of PIPE_SPEED
export const CLOUD_SPEED_MAX = 0.6; // fraction of PIPE_SPEED

/** Minimum gap height in pixels (independent of ghosty size). */
const GAP_MINIMUM_PX = 80;

/**
 * Spawn a new PipePair at the right edge of the canvas.
 *
 * @param {number} canvasWidth   Current canvas width in pixels
 * @param {number} canvasHeight  Current canvas height in pixels
 * @param {number} ghostyHeight  Ghosty's bounding-box height in pixels
 * @returns {PipePair}
 */
export function spawnPipe(canvasWidth, canvasHeight, ghostyHeight) {
  const minCenter = GAP_MIN_RATIO * canvasHeight;
  const maxCenter = GAP_MAX_RATIO * canvasHeight;
  const gapCenterY = minCenter + Math.random() * (maxCenter - minCenter);
  const gapHeight = Math.max(2 * ghostyHeight, GAP_MINIMUM_PX);

  return {
    x: canvasWidth,
    gapCenterY,
    gapHeight,
    width: PIPE_WIDTH,
    scored: false,
  };
}

/**
 * Spawn a new Cloud at the right edge of the canvas.
 *
 * @param {number} canvasWidth   Current canvas width in pixels
 * @param {number} canvasHeight  Current canvas height in pixels
 * @returns {Cloud}
 */
export function spawnCloud(canvasWidth, canvasHeight) {
  const minY = 0.2 * canvasHeight;
  const maxY = 0.8 * canvasHeight;
  const y = minY + Math.random() * (maxY - minY);

  const width = 80 + Math.random() * 60; // 80–140 px
  const height = 40 + Math.random() * 30; // 40–70 px
  const speed =
    CLOUD_SPEED_MIN * PIPE_SPEED +
    Math.random() * (CLOUD_SPEED_MAX - CLOUD_SPEED_MIN) * PIPE_SPEED;

  return {
    x: canvasWidth,
    y,
    width,
    height,
    speed,
  };
}

/**
 * Scroll all pipes left by `PIPE_SPEED * delta` and remove any that have
 * scrolled fully off the left edge (`x + width < 0`).
 *
 * Pipes do not carry their own `speed` property; the global PIPE_SPEED is
 * used instead.
 *
 * @param {PipePair[]} pipes  Array of active pipe pairs (mutated in place)
 * @param {number}     delta  Elapsed time in seconds
 * @returns {PipePair[]}      The filtered array (same reference)
 */
export function scrollAndCullPipes(pipes, delta) {
  for (const pipe of pipes) {
    pipe.x -= PIPE_SPEED * delta;
  }
  // Remove pipes that have scrolled fully off-screen
  const keep = pipes.filter((pipe) => pipe.x + pipe.width >= 0);
  pipes.length = 0;
  for (const pipe of keep) pipes.push(pipe);
  return pipes;
}

/**
 * Scroll all clouds left by `cloud.speed * delta` and remove any that have
 * scrolled fully off the left edge (`x + width < 0`).
 *
 * @param {Cloud[]} clouds  Array of active clouds (mutated in place)
 * @param {number}  delta   Elapsed time in seconds
 * @returns {Cloud[]}       The filtered array (same reference)
 */
export function scrollAndCullClouds(clouds, delta) {
  for (const cloud of clouds) {
    cloud.x -= cloud.speed * delta;
  }
  // Remove clouds that have scrolled fully off-screen
  const keep = clouds.filter((cloud) => cloud.x + cloud.width >= 0);
  clouds.length = 0;
  for (const cloud of keep) clouds.push(cloud);
  return clouds;
}

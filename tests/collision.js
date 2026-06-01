/**
 * collision.js — Pure collision-detection functions for Flappy Kiro.
 *
 * This module has NO DOM dependency and can be imported directly by Node.js
 * test files. It mirrors the Collision_Detector section in index.html.
 */

/**
 * AABB overlap test.
 * Returns true if rectangle A overlaps rectangle B.
 *
 * @param {number} ax  A left edge
 * @param {number} ay  A top edge
 * @param {number} aw  A width
 * @param {number} ah  A height
 * @param {number} bx  B left edge
 * @param {number} by  B top edge
 * @param {number} bw  B width
 * @param {number} bh  B height
 * @returns {boolean}
 */
export function aabbOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

/**
 * Check whether Ghosty has collided with any boundary, pipe, or cloud.
 *
 * @param {{ x: number, y: number, width: number, height: number }} ghosty
 * @param {Array<{ x: number, gapCenterY: number, gapHeight: number, width: number }>} pipes
 * @param {Array<{ x: number, y: number, width: number, height: number }>} clouds
 * @param {number} canvasHeight
 * @returns {{ collided: boolean, reason: 'pipe' | 'cloud' | 'top' | 'bottom' | null }}
 */
export function check(ghosty, pipes, clouds, canvasHeight) {
  // ── Boundary checks ────────────────────────────────────────────────────────
  if (ghosty.y <= 0) {
    return { collided: true, reason: "top" };
  }
  if (ghosty.y + ghosty.height >= canvasHeight) {
    return { collided: true, reason: "bottom" };
  }

  // ── Pipe collision ─────────────────────────────────────────────────────────
  for (const pipe of pipes) {
    const gapTop = pipe.gapCenterY - pipe.gapHeight / 2;
    const gapBottom = pipe.gapCenterY + pipe.gapHeight / 2;

    // Top pipe bounding box: (pipe.x, 0, pipe.width, gapTop)
    if (
      aabbOverlap(
        ghosty.x,
        ghosty.y,
        ghosty.width,
        ghosty.height,
        pipe.x,
        0,
        pipe.width,
        gapTop,
      )
    ) {
      return { collided: true, reason: "pipe" };
    }

    // Bottom pipe bounding box: (pipe.x, gapBottom, pipe.width, canvasHeight - gapBottom)
    if (
      aabbOverlap(
        ghosty.x,
        ghosty.y,
        ghosty.width,
        ghosty.height,
        pipe.x,
        gapBottom,
        pipe.width,
        canvasHeight - gapBottom,
      )
    ) {
      return { collided: true, reason: "pipe" };
    }
  }

  // Clouds are decorative only — no collision with clouds.

  return { collided: false, reason: null };
}

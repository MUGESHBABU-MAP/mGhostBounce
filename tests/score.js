/**
 * score.js — Pure score/high-score functions for Flappy Kiro.
 *
 * This module has NO DOM dependency and can be imported directly by Node.js
 * test files. It mirrors the ScoreManager object in index.html.
 *
 * All functions accept an optional `storage` parameter that defaults to a
 * simple in-memory Map, making them fully testable without a real
 * localStorage.
 */

export const STORAGE_KEY = "flappyKiroHighScore";

/**
 * Create a simple in-memory storage object that matches the
 * localStorage API surface used by these functions.
 * @returns {{ getItem(key: string): string|null, setItem(key: string, value: string): void }}
 */
export function createMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
  };
}

/** Default in-memory storage used when no storage is provided. */
const defaultStorage = createMemoryStorage();

/**
 * Load the persisted high score from storage.
 * Returns 0 if the value is missing, non-numeric, negative, or if
 * storage throws (e.g. private-browsing with storage disabled).
 *
 * @param {object} [storage]  Storage object (defaults to in-memory store)
 * @returns {number}
 */
export function loadHighScore(storage = defaultStorage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null || raw === undefined) return 0;
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed) || parsed < 0) return 0;
    return parsed;
  } catch (e) {
    return 0;
  }
}

/**
 * Persist the high score to storage.
 * Logs a console.warn on failure; the game continues with an in-memory value.
 *
 * @param {number} score
 * @param {object} [storage]  Storage object (defaults to in-memory store)
 */
export function saveHighScore(score, storage = defaultStorage) {
  try {
    storage.setItem(STORAGE_KEY, String(score));
  } catch (e) {
    console.warn("ScoreManager: failed to save high score to storage", e);
  }
}

/**
 * Return the new high score, which is the maximum of the current score
 * and the prior high score.
 *
 * @param {number} score
 * @param {number} highScore
 * @returns {number}
 */
export function checkAndUpdateHighScore(score, highScore) {
  return Math.max(score, highScore);
}

/**
 * audio.js — Testable AudioManager factory for Flappy Ghost.
 *
 * This module has NO DOM dependency and can be imported directly by Node.js
 * test files. It mirrors the AudioManager object in index.html but accepts
 * an injectable `audioFactory` so tests can supply mock Audio objects.
 *
 * Usage in browser (singleton):
 *   import { createAudioManager } from './tests/audio.js';
 *   const AudioManager = createAudioManager();
 *
 * Usage in tests (with mock factory):
 *   const AudioManager = createAudioManager((src) => new MockAudio(src));
 */

/**
 * Default audio factory — creates a real HTMLAudioElement.
 * Replaced by a mock in tests.
 *
 * @param {string} src  URL of the audio asset
 * @returns {HTMLAudioElement}
 */
function defaultAudioFactory(src) {
  return new Audio(src);
}

/**
 * Create an AudioManager instance with an injectable audio factory.
 *
 * @param {(src: string) => { currentTime: number, play(): Promise<void>, onerror: Function|null }} [audioFactory]
 *   A function that accepts a source URL and returns an Audio-like object.
 *   Defaults to `(src) => new Audio(src)` when running in a browser.
 *
 * @returns {{
 *   sounds: { jump: object|null, gameOver: object|null },
 *   ready: boolean,
 *   preload(): void,
 *   playJump(): void,
 *   playGameOver(): void,
 * }}
 */
export function createAudioManager(audioFactory = defaultAudioFactory) {
  const manager = {
    sounds: { jump: null, gameOver: null },
    ready: false,

    /**
     * Load both sound assets. Attaches onerror handlers that log a warning
     * and set the slot to null so play calls degrade gracefully.
     * Should only be called once, on the first user interaction.
     */
    preload() {
      if (this.ready) return;
      this.ready = true;

      const jumpAudio = audioFactory("assets/jump.wav");
      jumpAudio.onerror = () => {
        console.warn("AudioManager: failed to load assets/jump.wav");
        this.sounds.jump = null;
      };
      this.sounds.jump = jumpAudio;

      const gameOverAudio = audioFactory("assets/game_over.wav");
      gameOverAudio.onerror = () => {
        console.warn("AudioManager: failed to load assets/game_over.wav");
        this.sounds.gameOver = null;
      };
      this.sounds.gameOver = gameOverAudio;
    },

    /**
     * Play the jump sound from the beginning.
     * Silently ignores autoplay-policy rejections.
     */
    playJump() {
      const snd = this.sounds.jump;
      if (snd !== null) {
        snd.currentTime = 0;
        snd.play().catch(() => {});
      }
    },

    /**
     * Play the game-over sound from the beginning.
     * Silently ignores autoplay-policy rejections.
     */
    playGameOver() {
      const snd = this.sounds.gameOver;
      if (snd !== null) {
        snd.currentTime = 0;
        snd.play().catch(() => {});
      }
    },
  };

  return manager;
}

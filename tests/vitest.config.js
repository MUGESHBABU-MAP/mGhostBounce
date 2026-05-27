import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Run in Node.js — no browser DOM required for pure logic tests
    environment: "node",
    // Glob for test files inside this directory
    include: ["**/*.test.js"],
    // Exit cleanly when no test files exist yet
    passWithNoTests: true,
  },
});

/**
 * Jest configuration for the Reading Companion backend.
 *
 * Key choices:
 *   - CommonJS (no transform needed — backend uses require/module.exports)
 *   - testEnvironment: "node" — no browser globals
 *   - --runInBand (set via npm script) — run tests serially so
 *     mongodb-memory-server doesn't conflict across suites
 *   - testEnvironmentOptions.NODE_ENV: "test" — prevents JWT_SECRET crash
 *     in config.js (which only throws in "production")
 *   - Glob covers both unit (tests/controllers/) and integration (tests/routes/)
 */

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  // Runs before any test module is imported — sets env vars that config.js
  // reads at require-time (JWT_SECRET, NODE_ENV)
  setupFiles: ["./tests/setup.js"],
  // Clear mock state between tests automatically
  clearMocks: true,
  // Coverage report when run with --coverage
  collectCoverageFrom: [
    "controllers/**/*.js",
    "middlewares/auth.js",
    "middlewares/errorHandler.js",
    "utils/errors/**/*.js",
    "utils/errors.js",
  ],
  coverageThresholds: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },
};

module.exports = config;

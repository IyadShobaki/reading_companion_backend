/**
 * Jest configuration for the Reading Companion backend.
 *
 * Key choices:
 * - CommonJS backend modules need no transform.
 * - The npm script runs tests serially so mongodb-memory-server instances do
 *   not conflict across suites.
 * - setupFiles inject NODE_ENV and JWT_SECRET before app/config modules load.
 */

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  setupFiles: ["./tests/setup.js"],
  clearMocks: true,
  collectCoverageFrom: [
    "controllers/**/*.js",
    "middlewares/auth.js",
    "middlewares/errorHandler.js",
    "repositories/**/*.js",
    "services/**/*.js",
    "utils/errors/**/*.js",
    "utils/errors.js",
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 60,
      functions: 80,
      lines: 80,
    },
  },
};

module.exports = config;

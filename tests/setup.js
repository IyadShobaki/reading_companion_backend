/**
 * Jest global setup — runs before any test file is loaded.
 *
 * Sets the environment variables that config.js reads at require-time.
 * Must run before any module that imports ../utils/config is loaded.
 */
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key-for-jest";

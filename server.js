/**
 * server.js — Entry point for the production server.
 *
 * Imports `app` and `main` from app.js then starts the server.
 * Separating the app definition from the startup call allows Supertest
 * to import the Express app without triggering a real MongoDB connection.
 */

const { main } = require("./app");
const { logger } = require("./middlewares/logger");

main().catch((err) => {
  logger.error("Failed to start server:", err);
  process.exit(1);
});

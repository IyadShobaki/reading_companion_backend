const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const cors = require("cors");
require("dotenv").config();
const { errors } = require("celebrate");
const router = require("./routes/index");
const errorHandler = require("./middlewares/errorHandler");
const { requestLogger, errorLogger, logger } = require("./middlewares/logger");
const { PORT, MONGODB_URI, CLIENT_ORIGIN } = require("./utils/config");
const limiter = require("./middlewares/rateLimiter");

const app = express();

// Security headers
app.use(helmet());
// Allow requests only from the configured client origin
app.use(cors({ origin: CLIENT_ORIGIN }));
// Apply rate limiting globally before any route handling
app.use(limiter);
// Parse JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger - must be before routes
app.use(requestLogger);

// Crash-test route for verifying error handling in non-production environments
if (process.env.NODE_ENV !== "production") {
  app.get("/crash-test", () => {
    setTimeout(() => {
      throw new Error("Server will crash now");
    }, 0);
  });
}

app.use("/api", router);

// Error logger - must be after routes, before error handlers
app.use(errorLogger);

// Celebrate/Joi validation error handler (must be after routes, before error handler)
app.use(errors());

// Centralised error handling middleware
app.use(errorHandler);

// Connect to MongoDB first, then start listening.
// Prevents the server from accepting requests before the database is ready.
async function main() {
  await mongoose.connect(MONGODB_URI);
  logger.info("Connected to DB");
  app.listen(PORT, () => {
    logger.info(`Listening on port ${PORT}`);
  });
}

module.exports = { app, main };

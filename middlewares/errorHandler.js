const { INTERNAL_SERVER_ERROR_CODE } = require("../utils/errors");
const { logger } = require("./logger");

// Centralised Express error-handling middleware.
// Distinguishes operational errors (those thrown with an explicit statusCode)
// from unexpected crashes, hiding internal details from the client in the latter case.
const errorHandler = (err, req, res, next) => {
  logger.error(err);

  const statusCode = err.statusCode || INTERNAL_SERVER_ERROR_CODE;

  // Only expose the error message for operational errors (those with an explicit statusCode).
  // For unexpected crashes (statusCode undefined), hide internals from the client.
  const isOperational = err.statusCode !== undefined;
  const message = isOperational
    ? err.message
    : "An error has occurred on the server.";

  res.status(statusCode).send({ message });
};

module.exports = errorHandler;

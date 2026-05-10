/**
 * BadRequestError — operational error for malformed or invalid request data.
 *
 * HTTP status: 400 Bad Request.
 * Thrown when Mongoose validation fails or when the controller receives
 * unexpected input that passes Celebrate validation but is still invalid.
 *
 * @extends Error
 */
const { BAD_REQUEST_ERROR_CODE, errorMessages } = require("../errors");

class BadRequestError extends Error {
  constructor(message = errorMessages.BAD_REQUEST) {
    super(message);
    this.statusCode = BAD_REQUEST_ERROR_CODE;
    this.name = "BadRequestError";
  }
}

module.exports = BadRequestError;

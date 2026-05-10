/**
 * UnauthorizedError — operational error for missing or invalid authentication.
 *
 * HTTP status: 401 Unauthorized.
 * Thrown when a JWT is absent, expired, or tampered with, or when email/password
 * credentials do not match.
 *
 * @extends Error
 */
const { UNAUTHORIZED_ERROR_CODE, errorMessages } = require("../errors");

class UnauthorizedError extends Error {
  constructor(message = errorMessages.UNAUTHORIZED) {
    super(message);
    this.statusCode = UNAUTHORIZED_ERROR_CODE;
    this.name = "UnauthorizedError";
  }
}

module.exports = UnauthorizedError;

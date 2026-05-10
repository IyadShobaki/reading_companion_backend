/**
 * ForbiddenError — operational error for authenticated but unauthorised actions.
 *
 * HTTP status: 403 Forbidden.
 * Thrown when a user attempts to modify a resource they do not own,
 * e.g. editing another user's note or book.
 *
 * @extends Error
 */
const { FORBIDDEN_ERROR_CODE, errorMessages } = require("../errors");

class ForbiddenError extends Error {
  constructor(message = errorMessages.FORBIDDEN) {
    super(message);
    this.statusCode = FORBIDDEN_ERROR_CODE;
    this.name = "ForbiddenError";
  }
}

module.exports = ForbiddenError;

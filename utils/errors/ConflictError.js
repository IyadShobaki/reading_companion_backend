/**
 * ConflictError — operational error for duplicate resource conflicts.
 *
 * HTTP status: 409 Conflict.
 * Thrown when a unique constraint is violated, e.g. a user tries to register
 * with an email that already exists, or saves a book they have already saved.
 *
 * @extends Error
 */
const { CONFLICT_ERROR_CODE, errorMessages } = require("../errors");

class ConflictError extends Error {
  constructor(message = errorMessages.CONFLICT) {
    super(message);
    this.statusCode = CONFLICT_ERROR_CODE;
    this.name = "ConflictError";
  }
}

module.exports = ConflictError;

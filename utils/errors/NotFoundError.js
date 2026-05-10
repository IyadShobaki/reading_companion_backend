/**
 * NotFoundError — operational error for missing resources.
 *
 * HTTP status: 404 Not Found.
 * Thrown when a requested document does not exist in the database,
 * e.g. fetching a user or note by an ID that has no matching record.
 *
 * @extends Error
 */
const { NOT_FOUND_ERROR_CODE, errorMessages } = require("../errors");

class NotFoundError extends Error {
  constructor(message = errorMessages.NOT_FOUND) {
    super(message);
    this.statusCode = NOT_FOUND_ERROR_CODE;
    this.name = "NotFoundError";
  }
}

module.exports = NotFoundError;

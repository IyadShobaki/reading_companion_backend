// Operational error for missing resources (HTTP 404)
const { NOT_FOUND_ERROR_CODE, errorMessages } = require("../errors");

class NotFoundError extends Error {
  constructor(message = errorMessages.NOT_FOUND) {
    super(message);
    this.statusCode = NOT_FOUND_ERROR_CODE;
    this.name = "NotFoundError";
  }
}

module.exports = NotFoundError;

// Operational error for invalid request data (HTTP 400)
const { BAD_REQUEST_ERROR_CODE, errorMessages } = require("../errors");

class BadRequestError extends Error {
  constructor(message = errorMessages.BAD_REQUEST) {
    super(message);
    this.statusCode = BAD_REQUEST_ERROR_CODE;
    this.name = "BadRequestError";
  }
}

module.exports = BadRequestError;

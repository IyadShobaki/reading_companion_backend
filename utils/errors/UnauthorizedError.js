// Operational error for missing or invalid authentication credentials (HTTP 401)
const { UNAUTHORIZED_ERROR_CODE, errorMessages } = require("../errors");

class UnauthorizedError extends Error {
  constructor(message = errorMessages.UNAUTHORIZED) {
    super(message);
    this.statusCode = UNAUTHORIZED_ERROR_CODE;
    this.name = "UnauthorizedError";
  }
}

module.exports = UnauthorizedError;

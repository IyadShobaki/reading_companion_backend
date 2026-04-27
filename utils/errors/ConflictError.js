// Operational error for duplicate resource conflicts (HTTP 409)
const { CONFLICT_ERROR_CODE, errorMessages } = require("../errors");

class ConflictError extends Error {
  constructor(message = errorMessages.CONFLICT) {
    super(message);
    this.statusCode = CONFLICT_ERROR_CODE;
    this.name = "ConflictError";
  }
}

module.exports = ConflictError;

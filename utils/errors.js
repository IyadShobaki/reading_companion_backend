// HTTP status codes used across controllers and error classes
const OK_CODE = 200;
const CREATED_CODE = 201;
const BAD_REQUEST_ERROR_CODE = 400;
const NOT_FOUND_ERROR_CODE = 404;
const INTERNAL_SERVER_ERROR_CODE = 500;
const FORBIDDEN_ERROR_CODE = 403;
const UNAUTHORIZED_ERROR_CODE = 401;
const CONFLICT_ERROR_CODE = 409;

// Mongoose error code for duplicate key violations (e.g. duplicate email)
const DUPLICATE_KEY_ERROR_CODE = 11000;

// Default user-facing messages for each error type.
// Controllers and error classes use these to keep messages consistent.
const errorMessages = {
  // BAD_REQUEST_ERROR_CODE (400)
  BAD_REQUEST: "Invalid data passed with the request.",

  // NOT_FOUND_ERROR_CODE (404)
  NOT_FOUND: "Requested resource not found.",

  // INTERNAL_SERVER_ERROR_CODE (500)
  INTERNAL_SERVER_ERROR: "An error has occurred on the server.",

  // FORBIDDEN_ERROR_CODE (403)
  FORBIDDEN: "You do not have permission to perform this action.",

  // UNAUTHORIZED_ERROR_CODE (401)
  UNAUTHORIZED: "Invalid credentials.",

  // CONFLICT_ERROR_CODE (409)
  CONFLICT: "Email already in use.",
};

module.exports = {
  OK_CODE,
  CREATED_CODE,
  BAD_REQUEST_ERROR_CODE,
  NOT_FOUND_ERROR_CODE,
  INTERNAL_SERVER_ERROR_CODE,
  FORBIDDEN_ERROR_CODE,
  UNAUTHORIZED_ERROR_CODE,
  CONFLICT_ERROR_CODE,
  DUPLICATE_KEY_ERROR_CODE,
  errorMessages,
};

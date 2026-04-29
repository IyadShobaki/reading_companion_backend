/**
 * errorHandler.test.js — Unit tests for the centralised error handler.
 *
 * The middleware is called directly with fabricated err/req/res/next objects.
 * We verify:
 *   1. Operational errors (those with statusCode) → correct status + message
 *   2. Unknown errors (no statusCode) → 500 + generic message (no leak)
 */

const { describe, test, expect } = require("@jest/globals");
const errorHandler = require("../../middlewares/errorHandler");
const BadRequestError = require("../../utils/errors/BadRequestError");
const NotFoundError = require("../../utils/errors/NotFoundError");
const UnauthorizedError = require("../../utils/errors/UnauthorizedError");
const ForbiddenError = require("../../utils/errors/ForbiddenError");
const ConflictError = require("../../utils/errors/ConflictError");

/** Build a minimal mock res with chainable status().send() */
const makeRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
};

const req = {};
const next = jest.fn();

describe("errorHandler middleware", () => {
  // ── Operational errors ───────────────────────────────────────────────────

  test.each([
    ["BadRequestError", new BadRequestError(), 400],
    ["NotFoundError", new NotFoundError(), 404],
    ["UnauthorizedError", new UnauthorizedError(), 401],
    ["ForbiddenError", new ForbiddenError(), 403],
    ["ConflictError", new ConflictError(), 409],
  ])("%s sends the correct HTTP status code", (_name, err, expectedStatus) => {
    const res = makeRes();
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(expectedStatus);
  });

  test("sends the error message for operational errors", () => {
    const res = makeRes();
    const err = new NotFoundError("Book not found");
    errorHandler(err, req, res, next);
    expect(res.send).toHaveBeenCalledWith({ message: "Book not found" });
  });

  // ── Non-operational (unexpected) errors ──────────────────────────────────

  test("sends 500 for errors without a statusCode", () => {
    const res = makeRes();
    errorHandler(new Error("database exploded"), req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("hides internal error details for non-operational errors", () => {
    const res = makeRes();
    errorHandler(new Error("database exploded"), req, res, next);
    const body = res.send.mock.calls[0][0];
    // The raw error message must not be forwarded to the client
    expect(body.message).not.toContain("database exploded");
    expect(body.message).toBe("An error has occurred on the server.");
  });
});

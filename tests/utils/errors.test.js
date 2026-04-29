/**
 * errors.test.js — Unit tests for all typed error classes and the errors module.
 *
 * Each error class is tested for:
 *   - Correct HTTP statusCode
 *   - Default message matches the errorMessages constant
 *   - Custom message override
 *   - Correct name property (used for instanceof checks in controllers)
 */

const { describe, test, expect } = require("@jest/globals");
const {
  BAD_REQUEST_ERROR_CODE,
  NOT_FOUND_ERROR_CODE,
  FORBIDDEN_ERROR_CODE,
  UNAUTHORIZED_ERROR_CODE,
  CONFLICT_ERROR_CODE,
  errorMessages,
} = require("../../utils/errors");
const BadRequestError = require("../../utils/errors/BadRequestError");
const NotFoundError = require("../../utils/errors/NotFoundError");
const ForbiddenError = require("../../utils/errors/ForbiddenError");
const UnauthorizedError = require("../../utils/errors/UnauthorizedError");
const ConflictError = require("../../utils/errors/ConflictError");

describe("Error classes", () => {
  // ── BadRequestError (400) ────────────────────────────────────────────────

  describe("BadRequestError", () => {
    test("has statusCode 400", () => {
      expect(new BadRequestError().statusCode).toBe(BAD_REQUEST_ERROR_CODE);
    });

    test("uses the default BAD_REQUEST message", () => {
      expect(new BadRequestError().message).toBe(errorMessages.BAD_REQUEST);
    });

    test("accepts a custom message", () => {
      expect(new BadRequestError("custom").message).toBe("custom");
    });

    test("is an instance of Error", () => {
      expect(new BadRequestError()).toBeInstanceOf(Error);
    });

    test("has name BadRequestError", () => {
      expect(new BadRequestError().name).toBe("BadRequestError");
    });
  });

  // ── NotFoundError (404) ──────────────────────────────────────────────────

  describe("NotFoundError", () => {
    test("has statusCode 404", () => {
      expect(new NotFoundError().statusCode).toBe(NOT_FOUND_ERROR_CODE);
    });

    test("uses the default NOT_FOUND message", () => {
      expect(new NotFoundError().message).toBe(errorMessages.NOT_FOUND);
    });

    test("accepts a custom message", () => {
      expect(new NotFoundError("not here").message).toBe("not here");
    });
  });

  // ── ForbiddenError (403) ─────────────────────────────────────────────────

  describe("ForbiddenError", () => {
    test("has statusCode 403", () => {
      expect(new ForbiddenError().statusCode).toBe(FORBIDDEN_ERROR_CODE);
    });

    test("uses the default FORBIDDEN message", () => {
      expect(new ForbiddenError().message).toBe(errorMessages.FORBIDDEN);
    });
  });

  // ── UnauthorizedError (401) ──────────────────────────────────────────────

  describe("UnauthorizedError", () => {
    test("has statusCode 401", () => {
      expect(new UnauthorizedError().statusCode).toBe(UNAUTHORIZED_ERROR_CODE);
    });

    test("uses the default UNAUTHORIZED message", () => {
      expect(new UnauthorizedError().message).toBe(errorMessages.UNAUTHORIZED);
    });
  });

  // ── ConflictError (409) ──────────────────────────────────────────────────

  describe("ConflictError", () => {
    test("has statusCode 409", () => {
      expect(new ConflictError().statusCode).toBe(CONFLICT_ERROR_CODE);
    });

    test("uses the default CONFLICT message", () => {
      expect(new ConflictError().message).toBe(errorMessages.CONFLICT);
    });

    test("accepts a custom message (e.g. 'Book already saved.')", () => {
      expect(new ConflictError("Book already saved.").message).toBe(
        "Book already saved.",
      );
    });
  });
});

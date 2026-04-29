/**
 * auth.test.js — Unit tests for the JWT authentication middleware.
 *
 * The middleware is tested in isolation — no HTTP server, no database.
 * We fabricate req/res/next objects and call the middleware directly.
 *
 * Cases covered:
 *   1. Missing Authorization header → 401
 *   2. Header present but not "Bearer …" → 401
 *   3. Malformed / invalid token → 401
 *   4. Expired token → 401
 *   5. Valid token → req.user set, next() called
 */

const { describe, test, expect } = require("@jest/globals");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../../middlewares/auth");
const UnauthorizedError = require("../../utils/errors/UnauthorizedError");

// Use the same secret as tests/setup.js injects into process.env
const SECRET = process.env.JWT_SECRET;

/**
 * Build a minimal mock req/res/next triple.
 * @param {object} headers - Request headers to include.
 */
const makeReqResNext = (headers = {}) => {
  const req = { headers };
  const res = {};
  const next = jest.fn();
  return { req, res, next };
};

/** Sign a token that expires in 1 hour. */
const signToken = (payload = { _id: "user123" }) =>
  jwt.sign(payload, SECRET, { expiresIn: "1h" });

/** Sign a token that is already expired. */
const signExpired = (payload = { _id: "user123" }) =>
  jwt.sign(payload, SECRET, { expiresIn: "-1s" });

describe("auth middleware", () => {
  test("calls next with UnauthorizedError when Authorization header is missing", () => {
    const { req, res, next } = makeReqResNext();
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  test("calls next with UnauthorizedError when header does not start with 'Bearer '", () => {
    const { req, res, next } = makeReqResNext({ authorization: "Token abc" });
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  test("calls next with UnauthorizedError for a malformed token", () => {
    const { req, res, next } = makeReqResNext({
      authorization: "Bearer not-a-real-jwt",
    });
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  test("calls next with UnauthorizedError for a token signed with a different secret", () => {
    const foreignToken = jwt.sign({ _id: "x" }, "wrong-secret");
    const { req, res, next } = makeReqResNext({
      authorization: `Bearer ${foreignToken}`,
    });
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  test("calls next with UnauthorizedError for an expired token", () => {
    const { req, res, next } = makeReqResNext({
      authorization: `Bearer ${signExpired()}`,
    });
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  test("attaches the JWT payload to req.user and calls next() with no error for a valid token", () => {
    const { req, res, next } = makeReqResNext({
      authorization: `Bearer ${signToken({ _id: "abc" })}`,
    });
    authMiddleware(req, res, next);
    // next() should have been called with no arguments
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toMatchObject({ _id: "abc" });
  });
});

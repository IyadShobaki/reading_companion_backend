/**
 * users.test.js — Unit tests for the users controller.
 *
 * Mongoose models and bcrypt are mocked so these tests are pure logic tests
 * — no database, no real hashing.  We verify that each controller function:
 *   - Calls the right model method with the right args
 *   - Sends the correct HTTP status and response shape on success
 *   - Passes the right error type to next() on failure
 */

const { describe, test, expect } = require("@jest/globals");
const jwt = require("jsonwebtoken");

// ── Mock Mongoose User model ─────────────────────────────────────────────────
jest.mock("../../models/user");
const User = require("../../models/user");

// ── Import controller after mocks are registered ─────────────────────────────
const {
  createUser,
  login,
  getCurrentUser,
  updateUserProfile,
} = require("../../controllers/users");

const BadRequestError = require("../../utils/errors/BadRequestError");
const NotFoundError = require("../../utils/errors/NotFoundError");
const ConflictError = require("../../utils/errors/ConflictError");

/**
 * Build a minimal mock req/res/next triple.
 * @param {object} [body] - Request body
 * @param {object} [user] - Simulated req.user (JWT payload)
 */
const make = ({ body = {}, user = {} } = {}) => {
  const req = { body, user };
  const res = {};
  res.status = jest.fn(() => res);
  res.send = jest.fn(() => res);
  const next = jest.fn();
  return { req, res, next };
};

// ── createUser ────────────────────────────────────────────────────────────────

describe("createUser", () => {
  const mockUserDoc = {
    _id: "uid1",
    email: "a@b.com",
    name: "Alice",
    avatar: "",
  };

  test("hashes the password and calls User.create with the correct fields", async () => {
    User.create.mockResolvedValue(mockUserDoc);
    const { req, res, next } = make({
      body: { email: "a@b.com", password: "secret", name: "Alice" },
    });

    await createUser(req, res, next);

    const createArg = User.create.mock.calls[0][0];
    // Password must be hashed — not stored as plain text
    expect(createArg.password).not.toBe("secret");
    expect(createArg.email).toBe("a@b.com");
    expect(next).not.toHaveBeenCalled();
  });

  test("responds with 201 and the public user fields (no password)", async () => {
    User.create.mockResolvedValue(mockUserDoc);
    const { req, res, next } = make({
      body: { email: "a@b.com", password: "secret", name: "Alice" },
    });

    await createUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    const body = res.send.mock.calls[0][0];
    expect(body).not.toHaveProperty("password");
    expect(body.email).toBe("a@b.com");
  });

  test("calls next(BadRequestError) when User.create throws ValidationError", async () => {
    const err = new Error("v");
    err.name = "ValidationError";
    User.create.mockRejectedValue(err);
    const { req, res, next } = make({
      body: { email: "a@b.com", password: "secret", name: "Alice" },
    });

    await createUser(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
  });

  test("calls next(ConflictError) on MongoDB duplicate key error (11000)", async () => {
    const err = new Error("dup");
    err.code = 11000;
    User.create.mockRejectedValue(err);
    const { req, res, next } = make({
      body: { email: "a@b.com", password: "secret", name: "Alice" },
    });

    await createUser(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(ConflictError));
  });
});

// ── login ─────────────────────────────────────────────────────────────────────

describe("login", () => {
  const mockUser = {
    _id: "uid1",
    name: "Alice",
    email: "a@b.com",
    avatar: "",
  };

  test("returns a token and public user data on valid credentials", async () => {
    User.findUserByCredentials = jest.fn().mockResolvedValue(mockUser);
    const { req, res, next } = make({
      body: { email: "a@b.com", password: "secret" },
    });

    await login(req, res, next);

    const body = res.send.mock.calls[0][0];
    expect(body.token).toBeDefined();
    expect(body.data).toMatchObject({ email: "a@b.com", name: "Alice" });
    expect(body.data).not.toHaveProperty("password");
    // The token must be a valid JWT
    const decoded = jwt.decode(body.token);
    expect(decoded._id).toBe("uid1");
  });

  test("forwards errors from findUserByCredentials directly to next()", async () => {
    const err = new Error("unauthorized");
    User.findUserByCredentials = jest.fn().mockRejectedValue(err);
    const { req, res, next } = make({
      body: { email: "a@b.com", password: "wrong" },
    });

    await login(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});

// ── getCurrentUser ────────────────────────────────────────────────────────────

describe("getCurrentUser", () => {
  const mockUser = { _id: "uid1", name: "Alice", email: "a@b.com", avatar: "" };

  test("responds with 200 and wrapped user data", async () => {
    // findById().orFail() chain
    const query = { orFail: jest.fn().mockResolvedValue(mockUser) };
    User.findById = jest.fn().mockReturnValue(query);

    const { req, res, next } = make({ user: { _id: "uid1" } });
    await getCurrentUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.send.mock.calls[0][0];
    expect(body.data).toMatchObject({ email: "a@b.com" });
  });

  test("calls next(NotFoundError) when orFail throws DocumentNotFoundError", async () => {
    const err = new Error("nf");
    err.name = "DocumentNotFoundError";
    const query = { orFail: jest.fn().mockRejectedValue(err) };
    User.findById = jest.fn().mockReturnValue(query);

    const { req, res, next } = make({ user: { _id: "uid1" } });
    await getCurrentUser(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });
});

// ── updateUserProfile ─────────────────────────────────────────────────────────

describe("updateUserProfile", () => {
  const mockUser = { _id: "uid1", name: "Bob", email: "a@b.com", avatar: "" };

  test("responds with 200 and the updated user", async () => {
    const query = { orFail: jest.fn().mockResolvedValue(mockUser) };
    User.findByIdAndUpdate = jest.fn().mockReturnValue(query);

    const { req, res, next } = make({
      body: { name: "Bob" },
      user: { _id: "uid1" },
    });
    await updateUserProfile(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send.mock.calls[0][0].data.name).toBe("Bob");
  });

  test("calls next(NotFoundError) when orFail throws DocumentNotFoundError", async () => {
    const err = new Error("nf");
    err.name = "DocumentNotFoundError";
    const query = { orFail: jest.fn().mockRejectedValue(err) };
    User.findByIdAndUpdate = jest.fn().mockReturnValue(query);

    const { req, res, next } = make({
      body: { name: "Bob" },
      user: { _id: "uid1" },
    });
    await updateUserProfile(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });
});

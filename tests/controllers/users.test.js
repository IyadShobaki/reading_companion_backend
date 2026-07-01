const { describe, test, expect, beforeEach } = require("@jest/globals");
const jwt = require("jsonwebtoken");

jest.mock("../../repositories/user.repository");
jest.mock("../../services/auth.service");

const userRepository = require("../../repositories/user.repository");
const authService = require("../../services/auth.service");
const {
  createUser,
  login,
  getCurrentUser,
  updateUserProfile,
} = require("../../controllers/users");
const BadRequestError = require("../../utils/errors/BadRequestError");
const NotFoundError = require("../../utils/errors/NotFoundError");
const ConflictError = require("../../utils/errors/ConflictError");
const UnauthorizedError = require("../../utils/errors/UnauthorizedError");

const publicUser = { _id: "uid1", email: "a@b.com", name: "Alice", avatar: "" };
const userDoc = { ...publicUser, password: "hashed" };

/** Build a minimal mock req/res/next triple. */
const make = ({ body = {}, user = {} } = {}) => {
  const req = { body, user };
  const res = {};
  res.status = jest.fn(() => res);
  res.send = jest.fn(() => res);
  const next = jest.fn();
  return { req, res, next };
};

beforeEach(() => {
  jest.clearAllMocks();
  authService.toPublicUser.mockImplementation((user) => ({
    _id: user._id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
  }));
});

describe("createUser", () => {
  test("hashes the password and creates a user through the repository", async () => {
    authService.hashPassword.mockResolvedValue("hashed");
    userRepository.create.mockResolvedValue(userDoc);
    const { req, res, next } = make({
      body: { email: "a@b.com", password: "secret1", name: "Alice" },
    });

    await createUser(req, res, next);

    expect(userRepository.create).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "hashed",
      name: "Alice",
      avatar: undefined,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({ data: publicUser });
    expect(next).not.toHaveBeenCalled();
  });

  test("maps repository validation errors to BadRequestError", async () => {
    const err = new Error("invalid");
    err.name = "ValidationError";
    authService.hashPassword.mockResolvedValue("hashed");
    userRepository.create.mockRejectedValue(err);

    const { req, res, next } = make({
      body: { email: "a@b.com", password: "secret1", name: "Alice" },
    });
    await createUser(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    expect(res.send).not.toHaveBeenCalled();
  });

  test("maps duplicate email errors to ConflictError", async () => {
    const err = new Error("duplicate");
    err.code = 11000;
    authService.hashPassword.mockResolvedValue("hashed");
    userRepository.create.mockRejectedValue(err);

    const { req, next } = make({
      body: { email: "a@b.com", password: "secret1", name: "Alice" },
    });
    await createUser(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(ConflictError));
  });
});

describe("login", () => {
  test("returns a token and public user data on valid credentials", async () => {
    userRepository.findByEmailWithPassword.mockResolvedValue(userDoc);
    authService.verifyPassword.mockResolvedValue();
    authService.signToken.mockImplementation((userId) =>
      jwt.sign({ _id: userId }, process.env.JWT_SECRET),
    );
    const { req, res, next } = make({
      body: { email: "a@b.com", password: "secret1" },
    });

    await login(req, res, next);

    expect(userRepository.findByEmailWithPassword).toHaveBeenCalledWith(
      "a@b.com",
    );
    expect(authService.verifyPassword).toHaveBeenCalledWith(
      "secret1",
      "hashed",
    );
    const body = res.send.mock.calls[0][0];
    expect(body.data).toEqual(publicUser);
    expect(jwt.decode(body.token)._id).toBe("uid1");
  });

  test("returns UnauthorizedError when no user is found", async () => {
    userRepository.findByEmailWithPassword.mockResolvedValue(null);
    const { req, next } = make({
      body: { email: "missing@b.com", password: "secret1" },
    });

    await login(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  test("forwards password verification errors", async () => {
    const err = new UnauthorizedError();
    userRepository.findByEmailWithPassword.mockResolvedValue(userDoc);
    authService.verifyPassword.mockRejectedValue(err);
    const { req, next } = make({
      body: { email: "a@b.com", password: "wrong" },
    });

    await login(req, {}, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});

describe("getCurrentUser", () => {
  test("responds with wrapped user data", async () => {
    userRepository.findById.mockResolvedValue(userDoc);
    const { req, res, next } = make({ user: { _id: "uid1" } });

    await getCurrentUser(req, res, next);

    expect(userRepository.findById).toHaveBeenCalledWith("uid1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ data: publicUser });
  });

  test("maps missing users to NotFoundError", async () => {
    const err = new Error("missing");
    err.name = "DocumentNotFoundError";
    userRepository.findById.mockRejectedValue(err);
    const { req, next } = make({ user: { _id: "uid1" } });

    await getCurrentUser(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });
});

describe("updateUserProfile", () => {
  test("builds updates from provided fields only", async () => {
    const updated = { ...userDoc, name: "Bob" };
    userRepository.updateProfile.mockResolvedValue(updated);
    const { req, res } = make({
      body: { name: "Bob" },
      user: { _id: "uid1" },
    });

    await updateUserProfile(req, res, jest.fn());

    expect(userRepository.updateProfile).toHaveBeenCalledWith("uid1", {
      name: "Bob",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send.mock.calls[0][0].data.name).toBe("Bob");
  });

  test("maps missing users to NotFoundError", async () => {
    const err = new Error("missing");
    err.name = "DocumentNotFoundError";
    userRepository.updateProfile.mockRejectedValue(err);
    const { req, next } = make({
      body: { name: "Bob" },
      user: { _id: "uid1" },
    });

    await updateUserProfile(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });
});

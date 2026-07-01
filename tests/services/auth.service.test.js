const { describe, test, expect } = require("@jest/globals");
const jwt = require("jsonwebtoken");
const authService = require("../../services/auth.service");
const UnauthorizedError = require("../../utils/errors/UnauthorizedError");

describe("authService", () => {
  test("hashPassword and verifyPassword accept a matching password", async () => {
    const hash = await authService.hashPassword("Password1!");

    await expect(
      authService.verifyPassword("Password1!", hash),
    ).resolves.toBeUndefined();
  });

  test("verifyPassword rejects mismatched passwords with UnauthorizedError", async () => {
    const hash = await authService.hashPassword("Password1!");

    await expect(authService.verifyPassword("Wrong1!", hash)).rejects.toThrow(
      UnauthorizedError,
    );
  });

  test("signToken signs only the user id payload", () => {
    const token = authService.signToken("uid1");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    expect(decoded._id).toBe("uid1");
    expect(decoded.password).toBeUndefined();
  });

  test("toPublicUser removes private fields", () => {
    const publicUser = authService.toPublicUser({
      _id: "uid1",
      email: "a@b.com",
      name: "Alice",
      avatar: "",
      password: "hash",
    });

    expect(publicUser).toEqual({
      _id: "uid1",
      email: "a@b.com",
      name: "Alice",
      avatar: "",
    });
  });
});

/**
 * auth.routes.test.js — Integration tests for /signup and /signin.
 *
 * Uses mongodb-memory-server (via dbHelper) so no real database is involved.
 * Supertest sends real HTTP requests through the full Express middleware stack.
 */

const {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  afterEach,
} = require("@jest/globals");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const { app } = require("../../app");
const { connectDB, clearDB, disconnectDB } = require("../helpers/dbHelper");

beforeAll(connectDB);
afterEach(clearDB);
afterAll(disconnectDB);

const validUser = {
  email: "alice@example.com",
  password: "Password1!",
  name: "Alice",
  avatar: "https://example.com/avatar.jpg",
};

// ── POST /signup ──────────────────────────────────────────────────────────────

describe("POST /signup", () => {
  test("creates a user and returns 201 with public user data (no password)", async () => {
    const res = await request(app).post("/signup").send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe(validUser.email);
    expect(res.body.data.name).toBe(validUser.name);
    expect(res.body.data).not.toHaveProperty("password");
  });

  test("trims and lowercases email before creating a user", async () => {
    const res = await request(app)
      .post("/signup")
      .send({ ...validUser, email: " Alice@Example.COM " });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe("alice@example.com");
  });

  test("returns 409 when the same email is registered twice", async () => {
    await request(app).post("/signup").send(validUser);
    const res = await request(app).post("/signup").send(validUser);
    expect(res.status).toBe(409);
  });

  test("returns 400 for missing required fields", async () => {
    const res = await request(app).post("/signup").send({ email: "a@b.com" });
    expect(res.status).toBe(400);
  });

  test("returns 400 for short passwords", async () => {
    const res = await request(app)
      .post("/signup")
      .send({ ...validUser, password: "12345" });
    expect(res.status).toBe(400);
  });

  test("returns 400 for unknown fields", async () => {
    const res = await request(app)
      .post("/signup")
      .send({ ...validUser, role: "admin" });
    expect(res.status).toBe(400);
  });
});

// ── POST /signin ──────────────────────────────────────────────────────────────

describe("POST /signin", () => {
  beforeAll(async () => {
    // Pre-create the user so signin tests can authenticate
    await request(app).post("/signup").send(validUser);
  });

  test("returns a valid JWT and public user data on correct credentials", async () => {
    const res = await request(app)
      .post("/signin")
      .send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.data).toMatchObject({ email: validUser.email });
    const decoded = jwt.decode(res.body.token);
    expect(decoded._id).toBeDefined();
  });

  test("returns 401 for wrong password", async () => {
    const res = await request(app)
      .post("/signin")
      .send({ email: validUser.email, password: "WrongPass1!" });
    expect(res.status).toBe(401);
  });

  test("returns 401 for unknown email", async () => {
    const res = await request(app)
      .post("/signin")
      .send({ email: "unknown@example.com", password: "Password1!" });
    expect(res.status).toBe(401);
  });
});

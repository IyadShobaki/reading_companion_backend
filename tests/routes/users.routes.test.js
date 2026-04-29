/**
 * users.routes.test.js — Integration tests for /users/me (GET + PATCH).
 *
 * Both endpoints require a valid JWT. Tests verify:
 *   - Authenticated requests return the expected data
 *   - Unauthenticated requests are rejected with 401
 *   - Profile updates are persisted and returned
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
const { app } = require("../../app");
const { connectDB, clearDB, disconnectDB } = require("../helpers/dbHelper");

beforeAll(connectDB);
afterEach(clearDB);
afterAll(disconnectDB);

const validUser = {
  email: "bob@example.com",
  password: "Password1!",
  name: "Bob",
  avatar: "https://example.com/bob.jpg",
};

/** Helper: register a user and return their auth token. */
const registerAndLogin = async () => {
  await request(app).post("/signup").send(validUser);
  const signinRes = await request(app)
    .post("/signin")
    .send({ email: validUser.email, password: validUser.password });
  return signinRes.body.token;
};

// ── GET /users/me ─────────────────────────────────────────────────────────────

describe("GET /users/me", () => {
  test("returns 200 and the current user's data for authenticated requests", async () => {
    const token = await registerAndLogin();
    const res = await request(app)
      .get("/users/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      name: "Bob",
      email: validUser.email,
    });
    expect(res.body.data).not.toHaveProperty("password");
  });

  test("returns 401 when no Authorization header is provided", async () => {
    const res = await request(app).get("/users/me");
    expect(res.status).toBe(401);
  });
});

// ── PATCH /users/me ───────────────────────────────────────────────────────────

describe("PATCH /users/me", () => {
  test("updates name/avatar and returns 200 with the updated user", async () => {
    const token = await registerAndLogin();
    const res = await request(app)
      .patch("/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Robert" });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Robert");
  });

  test("returns 400 when neither name nor avatar is provided", async () => {
    const token = await registerAndLogin();
    const res = await request(app)
      .patch("/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  test("returns 401 for unauthenticated requests", async () => {
    const res = await request(app).patch("/users/me").send({ name: "X" });
    expect(res.status).toBe(401);
  });
});

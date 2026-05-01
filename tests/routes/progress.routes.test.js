/**
 * progress.routes.test.js — Integration tests for /progress/:googleBookId.
 *
 * Tests: GET (404 if not found), POST (upsert / returns 200 with data).
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

const testUser = {
  email: "progress_user@example.com",
  password: "Password1!",
  name: "ProgressUser",
  avatar: "https://example.com/p.jpg",
};

const BOOK_ID = "progress-book-1";

const registerAndGetToken = async (user) => {
  await request(app).post("/signup").send(user);
  const res = await request(app)
    .post("/signin")
    .send({ email: user.email, password: user.password });
  return res.body.token;
};

// ── GET /progress/:googleBookId ───────────────────────────────────────────────

describe("GET /progress/:googleBookId", () => {
  test("returns 404 when no progress record exists for the book", async () => {
    const token = await registerAndGetToken(testUser);
    const res = await request(app)
      .get(`/progress/${BOOK_ID}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test("returns 200 and progress data after a record has been saved", async () => {
    const token = await registerAndGetToken(testUser);

    await request(app)
      .put(`/progress/${BOOK_ID}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ pageNumber: 10 });

    const res = await request(app)
      .get(`/progress/${BOOK_ID}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.pageNumber).toBe(10);
  });

  test("returns 401 when unauthenticated", async () => {
    const res = await request(app).get(`/progress/${BOOK_ID}`);
    expect(res.status).toBe(401);
  });
});

// ── PUT /progress/:googleBookId ───────────────────────────────────────────────

describe("PUT /progress/:googleBookId", () => {
  test("creates progress and returns 200 with the data", async () => {
    const token = await registerAndGetToken(testUser);
    const res = await request(app)
      .put(`/progress/${BOOK_ID}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ pageNumber: 5 });

    expect(res.status).toBe(200);
    expect(res.body.data.pageNumber).toBe(5);
    expect(res.body.data.googleBookId).toBe(BOOK_ID);
  });

  test("updates existing progress when called again (upsert)", async () => {
    const token = await registerAndGetToken(testUser);
    await request(app)
      .put(`/progress/${BOOK_ID}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ pageNumber: 5 });

    const res = await request(app)
      .put(`/progress/${BOOK_ID}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ pageNumber: 20 });

    expect(res.status).toBe(200);
    expect(res.body.data.pageNumber).toBe(20);
  });

  test("returns 400 when pageNumber is missing", async () => {
    const token = await registerAndGetToken(testUser);
    const res = await request(app)
      .put(`/progress/${BOOK_ID}`)
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  test("returns 401 when unauthenticated", async () => {
    const res = await request(app)
      .put(`/progress/${BOOK_ID}`)
      .send({ pageNumber: 1 });
    expect(res.status).toBe(401);
  });

  test("returns 400 for unknown fields", async () => {
    const token = await registerAndGetToken(testUser);
    const res = await request(app)
      .put(`/progress/${BOOK_ID}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ pageNumber: 5, userId: "other" });

    expect(res.status).toBe(400);
  });

  test("returns 400 for oversized googleBookId route params", async () => {
    const token = await registerAndGetToken(testUser);
    const longId = "p".repeat(201);
    const res = await request(app)
      .put(`/progress/${longId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ pageNumber: 1 });

    expect(res.status).toBe(400);
  });
});

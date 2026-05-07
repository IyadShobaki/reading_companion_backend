/**
 * library.routes.test.js — Integration tests for /library.
 *
 * Tests: GET (own library), POST (save book), DELETE (remove book).
 * Ownership: one user cannot remove another user's book.
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

const userA = {
  email: "user_a@example.com",
  password: "Password1!",
  name: "UserA",
  avatar: "https://example.com/a.jpg",
};

const userB = {
  email: "user_b@example.com",
  password: "Password1!",
  name: "UserB",
  avatar: "https://example.com/b.jpg",
};

/** Minimal valid book payload */
const bookPayload = {
  googleBookId: "gbook1",
  title: "Test Book",
  authors: "Test Author",
  thumbnail: "https://example.com/thumb.jpg",
  description: "A description",
  categories: "Fiction",
  language: "en",
  publishedDate: "2020",
  embeddable: true,
  viewability: "PARTIAL",
  publicDomain: false,
  webReaderLink: "https://play.google.com/books/reader?id=gbook1",
};

/** Register a user and return their token */
const registerAndGetToken = async (user) => {
  await request(app).post("/api/signup").send(user);
  const res = await request(app)
    .post("/api/signin")
    .send({ email: user.email, password: user.password });
  return res.body.token;
};

// ── GET /library ──────────────────────────────────────────────────────────────

describe("GET /library", () => {
  test("returns 200 and an empty array when library is empty", async () => {
    const token = await registerAndGetToken(userA);
    const res = await request(app)
      .get("/api/library")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test("returns 401 when unauthenticated", async () => {
    const res = await request(app).get("/api/library");
    expect(res.status).toBe(401);
  });
});

// ── POST /library ─────────────────────────────────────────────────────────────

describe("POST /library", () => {
  test("saves a book and returns 201 with the document", async () => {
    const token = await registerAndGetToken(userA);
    const res = await request(app)
      .post("/api/library")
      .set("Authorization", `Bearer ${token}`)
      .send(bookPayload);

    expect(res.status).toBe(201);
    expect(res.body.data.googleBookId).toBe("gbook1");
  });

  test("returns 409 when saving the same book twice", async () => {
    const token = await registerAndGetToken(userA);
    await request(app)
      .post("/api/library")
      .set("Authorization", `Bearer ${token}`)
      .send(bookPayload);
    const res = await request(app)
      .post("/api/library")
      .set("Authorization", `Bearer ${token}`)
      .send(bookPayload);

    expect(res.status).toBe(409);
  });

  test("returns 401 when unauthenticated", async () => {
    const res = await request(app).post("/api/library").send(bookPayload);
    expect(res.status).toBe(401);
  });

  test("returns 400 for unknown book fields", async () => {
    const token = await registerAndGetToken(userA);
    const res = await request(app)
      .post("/api/library")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...bookPayload, adminOnly: true });

    expect(res.status).toBe(400);
  });

  test("trims book metadata before saving", async () => {
    const token = await registerAndGetToken(userA);
    const res = await request(app)
      .post("/api/library")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...bookPayload, googleBookId: " gbook1 ", title: " Test Book " });

    expect(res.status).toBe(201);
    expect(res.body.data.googleBookId).toBe("gbook1");
    expect(res.body.data.title).toBe("Test Book");
  });
});

// ── DELETE /library/:googleBookId ─────────────────────────────────────────────

describe("DELETE /library/:googleBookId", () => {
  test("removes the book and returns 204 for the owner", async () => {
    const token = await registerAndGetToken(userA);
    await request(app)
      .post("/api/library")
      .set("Authorization", `Bearer ${token}`)
      .send(bookPayload);

    const res = await request(app)
      .delete(`/api/library/${bookPayload.googleBookId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });

  test("returns 404 when a different user tries to remove another user's book", async () => {
    const tokenA = await registerAndGetToken(userA);
    const tokenB = await registerAndGetToken(userB);

    await request(app)
      .post("/api/library")
      .set("Authorization", `Bearer ${tokenA}`)
      .send(bookPayload);

    // userB doesn't have this book — findOne filters by userId, so it returns null → 404
    const res = await request(app)
      .delete(`/api/library/${bookPayload.googleBookId}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
  });

  test("returns 404 when book does not exist", async () => {
    const token = await registerAndGetToken(userA);
    const res = await request(app)
      .delete("/api/library/nonexistent-book-id")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  test("returns 400 for oversized googleBookId route params", async () => {
    const token = await registerAndGetToken(userA);
    const longId = "a".repeat(201);

    const res = await request(app)
      .delete(`/api/library/${longId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

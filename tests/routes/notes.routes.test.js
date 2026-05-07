/**
 * notes.routes.test.js — Integration tests for /notes.
 *
 * Covers: GET by book, POST create, PATCH update, DELETE.
 * Ownership enforcement is tested for PATCH and DELETE.
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
  email: "notes_a@example.com",
  password: "Password1!",
  name: "NotesUserA",
  avatar: "https://example.com/na.jpg",
};

const userB = {
  email: "notes_b@example.com",
  password: "Password1!",
  name: "NotesUserB",
  avatar: "https://example.com/nb.jpg",
};

const BOOK_ID = "notes-book-1";

/** Register a user and return their auth token. */
const registerAndGetToken = async (user) => {
  await request(app).post("/signup").send(user);
  const res = await request(app)
    .post("/signin")
    .send({ email: user.email, password: user.password });
  return res.body.token;
};

/** Minimal valid note payload */
const notePayload = {
  googleBookId: BOOK_ID,
  pageNumber: 7,
  content: "An interesting thought on this page.",
  title: "Chapter 2",
};

// ── GET /notes — all notes for the authenticated user ────────────────────────

describe("GET /notes", () => {
  test("returns 200 and an empty array when the user has no notes", async () => {
    const token = await registerAndGetToken(userA);
    const res = await request(app)
      .get("/notes")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test("returns all notes for the authenticated user across all books", async () => {
    const token = await registerAndGetToken(userA);

    // Create notes for two different books
    await request(app)
      .post("/notes")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...notePayload, googleBookId: "book-1" });
    await request(app)
      .post("/notes")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...notePayload, googleBookId: "book-2" });

    const res = await request(app)
      .get("/notes")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    const bookIds = res.body.data.map((n) => n.googleBookId);
    expect(bookIds).toContain("book-1");
    expect(bookIds).toContain("book-2");
  });

  test("does not return notes belonging to another user", async () => {
    const tokenA = await registerAndGetToken(userA);
    const tokenB = await registerAndGetToken(userB);

    // userA saves a note
    await request(app)
      .post("/notes")
      .set("Authorization", `Bearer ${tokenA}`)
      .send(notePayload);

    // userB's GET /notes should return an empty array
    const res = await request(app)
      .get("/notes")
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test("returns 401 when unauthenticated", async () => {
    const res = await request(app).get("/notes");
    expect(res.status).toBe(401);
  });
});

// ── GET /notes/:googleBookId ──────────────────────────────────────────────────

describe("GET /notes/:googleBookId", () => {
  test("returns 200 and an empty array when no notes exist", async () => {
    const token = await registerAndGetToken(userA);
    const res = await request(app)
      .get(`/notes/${BOOK_ID}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test("returns only the notes belonging to the authenticated user", async () => {
    const tokenA = await registerAndGetToken(userA);
    const tokenB = await registerAndGetToken(userB);

    // userA saves a note
    await request(app)
      .post("/notes")
      .set("Authorization", `Bearer ${tokenA}`)
      .send(notePayload);

    // userB sees no notes for the same book
    const res = await request(app)
      .get(`/notes/${BOOK_ID}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test("returns 401 when unauthenticated", async () => {
    const res = await request(app).get(`/notes/${BOOK_ID}`);
    expect(res.status).toBe(401);
  });
});

// ── POST /notes ───────────────────────────────────────────────────────────────

describe("POST /notes", () => {
  test("creates a note and returns 201 with the document", async () => {
    const token = await registerAndGetToken(userA);
    const res = await request(app)
      .post("/notes")
      .set("Authorization", `Bearer ${token}`)
      .send(notePayload);

    expect(res.status).toBe(201);
    expect(res.body.data.content).toBe(notePayload.content);
    expect(res.body.data.googleBookId).toBe(BOOK_ID);
  });

  test("returns 400 when content is missing", async () => {
    const token = await registerAndGetToken(userA);
    const res = await request(app)
      .post("/notes")
      .set("Authorization", `Bearer ${token}`)
      .send({ googleBookId: BOOK_ID, pageNumber: 1 });
    expect(res.status).toBe(400);
  });

  test("returns 401 when unauthenticated", async () => {
    const res = await request(app).post("/notes").send(notePayload);
    expect(res.status).toBe(401);
  });

  test("returns 400 for unknown fields", async () => {
    const token = await registerAndGetToken(userA);
    const res = await request(app)
      .post("/notes")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...notePayload, userId: "other" });

    expect(res.status).toBe(400);
  });

  test("trims note content and title before saving", async () => {
    const token = await registerAndGetToken(userA);
    const res = await request(app)
      .post("/notes")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...notePayload, title: "  Idea  ", content: "  Text  " });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe("Idea");
    expect(res.body.data.content).toBe("Text");
  });
});

// ── PATCH /notes/:noteId ──────────────────────────────────────────────────────

describe("PATCH /notes/:noteId", () => {
  test("updates a note and returns 200 with the updated document for the owner", async () => {
    const token = await registerAndGetToken(userA);
    const createRes = await request(app)
      .post("/notes")
      .set("Authorization", `Bearer ${token}`)
      .send(notePayload);
    const noteId = createRes.body.data._id;

    const res = await request(app)
      .patch(`/notes/${noteId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ content: "Updated note content" });

    expect(res.status).toBe(200);
    expect(res.body.data.content).toBe("Updated note content");
  });

  test("returns 403 when a different user tries to update the note", async () => {
    const tokenA = await registerAndGetToken(userA);
    const tokenB = await registerAndGetToken(userB);

    const createRes = await request(app)
      .post("/notes")
      .set("Authorization", `Bearer ${tokenA}`)
      .send(notePayload);
    const noteId = createRes.body.data._id;

    const res = await request(app)
      .patch(`/notes/${noteId}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ content: "Hijacked" });

    expect(res.status).toBe(403);
  });

  test("returns 404 when the note does not exist", async () => {
    const token = await registerAndGetToken(userA);
    const res = await request(app)
      .patch("/notes/000000000000000000000001")
      .set("Authorization", `Bearer ${token}`)
      .send({ content: "x" });
    expect(res.status).toBe(404);
  });

  test("returns 401 when unauthenticated", async () => {
    const res = await request(app)
      .patch("/notes/000000000000000000000001")
      .send({ content: "x" });
    expect(res.status).toBe(401);
  });

  test("returns 400 for invalid noteId params", async () => {
    const token = await registerAndGetToken(userA);
    const res = await request(app)
      .patch("/notes/not-a-valid-id")
      .set("Authorization", `Bearer ${token}`)
      .send({ content: "x" });

    expect(res.status).toBe(400);
  });
});

// ── DELETE /notes/:noteId ─────────────────────────────────────────────────────

describe("DELETE /notes/:noteId", () => {
  test("deletes the note and returns 204 for the owner", async () => {
    const token = await registerAndGetToken(userA);
    const createRes = await request(app)
      .post("/notes")
      .set("Authorization", `Bearer ${token}`)
      .send(notePayload);
    const noteId = createRes.body.data._id;

    const res = await request(app)
      .delete(`/notes/${noteId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });

  test("returns 403 when a different user tries to delete the note", async () => {
    const tokenA = await registerAndGetToken(userA);
    const tokenB = await registerAndGetToken(userB);

    const createRes = await request(app)
      .post("/notes")
      .set("Authorization", `Bearer ${tokenA}`)
      .send(notePayload);
    const noteId = createRes.body.data._id;

    const res = await request(app)
      .delete(`/notes/${noteId}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(403);
  });

  test("returns 404 when note does not exist", async () => {
    const token = await registerAndGetToken(userA);
    const res = await request(app)
      .delete("/notes/000000000000000000000001")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  test("returns 400 for invalid delete noteId params", async () => {
    const token = await registerAndGetToken(userA);
    const res = await request(app)
      .delete("/notes/not-a-valid-id")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

/**
 * ai.routes.test.js — Integration tests for the /ai/ask endpoint.
 *
 * The AI service (services/ai.service.js) is mocked with Jest so tests
 * never make real OpenAI API calls. This lets the suite run offline and
 * in CI without an API key.
 *
 * Covers:
 *   - 401 for unauthenticated requests
 *   - 400 for missing required body fields
 *   - 200 with { data: { response } } on success
 *   - Timeout/service error surfaced as a 500
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

// ---------------------------------------------------------------------------
// Mock AI service — prevents any real OpenAI calls
// ---------------------------------------------------------------------------

jest.mock("../../services/ai.service", () => ({
  ask: jest.fn(),
}));

const aiService = require("../../services/ai.service");

// ---------------------------------------------------------------------------
// DB lifecycle
// ---------------------------------------------------------------------------

beforeAll(connectDB);
afterEach(async () => {
  await clearDB();
  jest.clearAllMocks();
});
afterAll(disconnectDB);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const user = {
  email: "ai_user@example.com",
  password: "Password1!",
  name: "AiUser",
  avatar: "https://example.com/ai.jpg",
};

/** Register the user and return their JWT token. */
const getToken = async () => {
  await request(app).post("/signup").send(user);
  const res = await request(app)
    .post("/signin")
    .send({ email: user.email, password: user.password });
  return res.body.token;
};

/** Valid payload for /ai/ask. */
const askPayload = {
  googleBookId: "book-abc",
  title: "Clean Code",
  pageNumber: 42,
  question: "What is the main theme?",
};

// ---------------------------------------------------------------------------
// Helper: run the same 401 + 400 tests for a given endpoint
// ---------------------------------------------------------------------------

const describeAuthAndValidation = (endpoint, payload) => {
  test("returns 401 when no token is provided", async () => {
    const res = await request(app).post(endpoint).send(payload);
    expect(res.status).toBe(401);
  });

  test("returns 400 when googleBookId is missing", async () => {
    const token = await getToken();
    // eslint-disable-next-line no-unused-vars
    const { googleBookId, ...body } = payload;
    const res = await request(app)
      .post(endpoint)
      .set("Authorization", `Bearer ${token}`)
      .send(body);
    expect(res.status).toBe(400);
  });

  test("returns 400 when pageNumber is missing", async () => {
    const token = await getToken();
    // eslint-disable-next-line no-unused-vars
    const { pageNumber, ...body } = payload;
    const res = await request(app)
      .post(endpoint)
      .set("Authorization", `Bearer ${token}`)
      .send(body);
    expect(res.status).toBe(400);
  });

  test("returns 400 when unknown fields are provided", async () => {
    const token = await getToken();
    const res = await request(app)
      .post(endpoint)
      .set("Authorization", `Bearer ${token}`)
      .send({ ...payload, userId: "other" });
    expect(res.status).toBe(400);
  });
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /ai/ask", () => {
  describeAuthAndValidation("/ai/ask", askPayload);

  test("returns 200 with { data: { response } } on success", async () => {
    aiService.ask.mockResolvedValue({
      response: "The main theme is clean code.",
    });
    const token = await getToken();

    const res = await request(app)
      .post("/ai/ask")
      .set("Authorization", `Bearer ${token}`)
      .send(askPayload);

    expect(res.status).toBe(200);
    expect(res.body.data.response).toBe("The main theme is clean code.");
    expect(aiService.ask).toHaveBeenCalledWith(askPayload);
  });

  test("returns 500 when the AI service throws", async () => {
    aiService.ask.mockRejectedValue(new Error("AI request timed out."));
    const token = await getToken();

    const res = await request(app)
      .post("/ai/ask")
      .set("Authorization", `Bearer ${token}`)
      .send(askPayload);

    expect(res.status).toBe(500);
  });

  test("returns 400 when question is missing", async () => {
    const token = await getToken();
    const { question, ...body } = askPayload;
    const res = await request(app)
      .post("/ai/ask")
      .set("Authorization", `Bearer ${token}`)
      .send(body);
    expect(res.status).toBe(400);
  });

  test("returns 400 when question is too long", async () => {
    const token = await getToken();
    const res = await request(app)
      .post("/ai/ask")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...askPayload, question: "q".repeat(501) });

    expect(res.status).toBe(400);
  });
});

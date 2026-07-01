const { describe, test, expect, beforeEach } = require("@jest/globals");

jest.mock("../../repositories/progress.repository");

const progressRepository = require("../../repositories/progress.repository");
const { getProgress, saveProgress } = require("../../controllers/progress");
const BadRequestError = require("../../utils/errors/BadRequestError");
const NotFoundError = require("../../utils/errors/NotFoundError");

const USER_ID = "uid1";

const make = ({ body = {}, params = {}, user = { _id: USER_ID } } = {}) => {
  const req = { body, params, user };
  const res = {};
  res.status = jest.fn(() => res);
  res.send = jest.fn(() => res);
  const next = jest.fn();
  return { req, res, next };
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getProgress", () => {
  test("responds with progress data when a record exists", async () => {
    progressRepository.findByUserAndBook.mockResolvedValue({
      googleBookId: "g1",
      pageNumber: 42,
    });

    const { req, res, next } = make({ params: { googleBookId: "g1" } });
    await getProgress(req, res, next);

    expect(progressRepository.findByUserAndBook).toHaveBeenCalledWith(
      USER_ID,
      "g1",
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      data: { googleBookId: "g1", pageNumber: 42 },
    });
  });

  test("maps missing progress to NotFoundError", async () => {
    progressRepository.findByUserAndBook.mockResolvedValue(null);

    const { req, next } = make({ params: { googleBookId: "g1" } });
    await getProgress(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });

  test("maps CastError to BadRequestError", async () => {
    const err = new Error("cast");
    err.name = "CastError";
    progressRepository.findByUserAndBook.mockRejectedValue(err);

    const { req, next } = make({ params: { googleBookId: "bad-id" } });
    await getProgress(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
  });
});

describe("saveProgress", () => {
  test("responds with upserted progress data", async () => {
    progressRepository.upsertPage.mockResolvedValue({
      googleBookId: "g1",
      pageNumber: 5,
    });

    const { req, res, next } = make({
      params: { googleBookId: "g1" },
      body: { pageNumber: 5 },
    });
    await saveProgress(req, res, next);

    expect(progressRepository.upsertPage).toHaveBeenCalledWith(
      USER_ID,
      "g1",
      5,
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      data: { googleBookId: "g1", pageNumber: 5 },
    });
  });

  test("maps validation errors to BadRequestError", async () => {
    const err = new Error("invalid");
    err.name = "ValidationError";
    progressRepository.upsertPage.mockRejectedValue(err);

    const { req, next } = make({
      params: { googleBookId: "g1" },
      body: { pageNumber: 0 },
    });
    await saveProgress(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
  });
});

/**
 * progress.test.js — Unit tests for the progress controller.
 *
 * Progress model is mocked — no database.
 * Key scenarios: 404 on missing progress, 200 on found, upsert on save.
 */

const { describe, test, expect } = require("@jest/globals");

jest.mock("../../models/progress");
const Progress = require("../../models/progress");

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

// ── getProgress ───────────────────────────────────────────────────────────────

describe("getProgress", () => {
  test("responds with 200 and progress data when a record exists", async () => {
    Progress.findOne = jest
      .fn()
      .mockResolvedValue({ googleBookId: "g1", pageNumber: 42 });

    const { req, res, next } = make({ params: { googleBookId: "g1" } });
    await getProgress(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      data: { googleBookId: "g1", pageNumber: 42 },
    });
  });

  test("calls next(NotFoundError) when no progress record exists", async () => {
    Progress.findOne = jest.fn().mockResolvedValue(null);

    const { req, res, next } = make({ params: { googleBookId: "g1" } });
    await getProgress(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });

  test("calls next(BadRequestError) on CastError", async () => {
    const err = new Error("cast");
    err.name = "CastError";
    Progress.findOne = jest.fn().mockRejectedValue(err);

    const { req, res, next } = make({ params: { googleBookId: "bad-id" } });
    await getProgress(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
  });
});

// ── saveProgress ──────────────────────────────────────────────────────────────

describe("saveProgress", () => {
  test("responds with 200 and updated progress data (upsert)", async () => {
    Progress.findOneAndUpdate = jest
      .fn()
      .mockResolvedValue({ googleBookId: "g1", pageNumber: 5 });

    const { req, res, next } = make({
      params: { googleBookId: "g1" },
      body: { pageNumber: 5 },
    });
    await saveProgress(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      data: { googleBookId: "g1", pageNumber: 5 },
    });
    // Verify upsert options were passed
    const opts = Progress.findOneAndUpdate.mock.calls[0][2];
    expect(opts.upsert).toBe(true);
    expect(opts.new).toBe(true);
  });

  test("calls next(BadRequestError) on ValidationError", async () => {
    const err = new Error("v");
    err.name = "ValidationError";
    Progress.findOneAndUpdate = jest.fn().mockRejectedValue(err);

    const { req, res, next } = make({
      params: { googleBookId: "g1" },
      body: { pageNumber: 0 },
    });
    await saveProgress(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
  });
});

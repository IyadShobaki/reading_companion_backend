/**
 * library.test.js — Unit tests for the library controller.
 *
 * SavedBook model is mocked — no database involved.
 * Tests verify response shapes, HTTP status codes, and error delegation.
 */

const { describe, test, expect } = require("@jest/globals");

jest.mock("../../models/savedBook");
const SavedBook = require("../../models/savedBook");

const {
  getLibrary,
  saveBook,
  removeBook,
} = require("../../controllers/library");
const BadRequestError = require("../../utils/errors/BadRequestError");
const NotFoundError = require("../../utils/errors/NotFoundError");
const ForbiddenError = require("../../utils/errors/ForbiddenError");
const ConflictError = require("../../utils/errors/ConflictError");

const USER_ID = { toString: () => "uid1", equals: (id) => id === USER_ID };

/** Minimal mock request/response/next factory. */
const make = ({ body = {}, params = {}, user = { _id: USER_ID } } = {}) => {
  const req = { body, params, user };
  const res = {};
  res.status = jest.fn(() => res);
  res.send = jest.fn(() => res);
  const next = jest.fn();
  return { req, res, next };
};

// ── getLibrary ────────────────────────────────────────────────────────────────

describe("getLibrary", () => {
  test("responds with 200 and an array of books", async () => {
    const books = [{ googleBookId: "g1", title: "Book A" }];
    const sortable = { sort: jest.fn().mockResolvedValue(books) };
    SavedBook.find = jest.fn().mockReturnValue(sortable);

    const { req, res, next } = make();
    await getLibrary(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ data: books });
  });

  test("calls next(err) on unexpected errors", async () => {
    const err = new Error("db error");
    SavedBook.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockRejectedValue(err),
    });

    const { req, res, next } = make();
    await getLibrary(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});

// ── saveBook ──────────────────────────────────────────────────────────────────

describe("saveBook", () => {
  const bookBody = {
    googleBookId: "g1",
    title: "Book A",
    authors: "Author",
    thumbnail: "",
    description: "",
    categories: "",
    language: "en",
    publishedDate: "2020",
    embeddable: true,
    viewability: "PARTIAL",
    publicDomain: false,
    webReaderLink: "",
  };

  test("responds with 201 and the saved book document", async () => {
    const saved = { ...bookBody, _id: "doc1" };
    SavedBook.create = jest.fn().mockResolvedValue(saved);

    const { req, res, next } = make({ body: bookBody });
    await saveBook(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({ data: saved });
  });

  test("calls next(ConflictError) on duplicate key (11000)", async () => {
    const err = new Error("dup");
    err.code = 11000;
    SavedBook.create = jest.fn().mockRejectedValue(err);

    const { req, res, next } = make({ body: bookBody });
    await saveBook(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(ConflictError));
  });

  test("calls next(BadRequestError) on ValidationError", async () => {
    const err = new Error("v");
    err.name = "ValidationError";
    SavedBook.create = jest.fn().mockRejectedValue(err);

    const { req, res, next } = make({ body: bookBody });
    await saveBook(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
  });
});

// ── removeBook ────────────────────────────────────────────────────────────────

describe("removeBook", () => {
  test("responds with 204 when book found and owned by the user", async () => {
    const book = {
      userId: USER_ID,
      deleteOne: jest.fn().mockResolvedValue({}),
    };
    SavedBook.findOne = jest.fn().mockResolvedValue(book);

    const { req, res, next } = make({ params: { googleBookId: "g1" } });
    await removeBook(req, res, next);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(book.deleteOne).toHaveBeenCalled();
  });

  test("calls next(NotFoundError) when book is not found", async () => {
    SavedBook.findOne = jest.fn().mockResolvedValue(null);

    const { req, res, next } = make({ params: { googleBookId: "missing" } });
    await removeBook(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });

  test("calls next(ForbiddenError) when book belongs to a different user", async () => {
    const OTHER = { equals: () => false }; // different userId
    const book = { userId: OTHER, deleteOne: jest.fn() };
    SavedBook.findOne = jest.fn().mockResolvedValue(book);

    const { req, res, next } = make({ params: { googleBookId: "g1" } });
    await removeBook(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });
});

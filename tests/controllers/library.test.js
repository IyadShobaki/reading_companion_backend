const { describe, test, expect, beforeEach } = require("@jest/globals");

jest.mock("../../repositories/savedBook.repository");

const savedBookRepository = require("../../repositories/savedBook.repository");
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

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getLibrary", () => {
  test("responds with the user's books", async () => {
    const books = [{ googleBookId: "g1", title: "Book A" }];
    savedBookRepository.findByUser.mockResolvedValue(books);

    const { req, res, next } = make();
    await getLibrary(req, res, next);

    expect(savedBookRepository.findByUser).toHaveBeenCalledWith(USER_ID);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ data: books });
  });

  test("forwards unexpected repository errors", async () => {
    const err = new Error("db error");
    savedBookRepository.findByUser.mockRejectedValue(err);

    const { req, res, next } = make();
    await getLibrary(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});

describe("saveBook", () => {
  const bookBody = {
    googleBookId: "g1",
    title: "Book A",
    authors: "Author",
  };

  test("responds with the saved book document", async () => {
    const saved = { ...bookBody, _id: "doc1" };
    savedBookRepository.createForUser.mockResolvedValue(saved);

    const { req, res, next } = make({ body: bookBody });
    await saveBook(req, res, next);

    expect(savedBookRepository.createForUser).toHaveBeenCalledWith(
      USER_ID,
      bookBody,
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({ data: saved });
  });

  test("maps duplicate key errors to ConflictError", async () => {
    const err = new Error("duplicate");
    err.code = 11000;
    savedBookRepository.createForUser.mockRejectedValue(err);

    const { req, next } = make({ body: bookBody });
    await saveBook(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(ConflictError));
  });

  test("maps validation errors to BadRequestError", async () => {
    const err = new Error("invalid");
    err.name = "ValidationError";
    savedBookRepository.createForUser.mockRejectedValue(err);

    const { req, next } = make({ body: bookBody });
    await saveBook(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
  });
});

describe("removeBook", () => {
  test("deletes the scoped saved book", async () => {
    const book = { userId: USER_ID };
    savedBookRepository.findByUserAndGoogleId.mockResolvedValue(book);
    savedBookRepository.deleteBook.mockResolvedValue({});

    const { req, res, next } = make({ params: { googleBookId: "g1" } });
    await removeBook(req, res, next);

    expect(savedBookRepository.findByUserAndGoogleId).toHaveBeenCalledWith(
      USER_ID,
      "g1",
    );
    expect(savedBookRepository.deleteBook).toHaveBeenCalledWith(book);
    expect(res.status).toHaveBeenCalledWith(204);
  });

  test("maps missing books to NotFoundError", async () => {
    savedBookRepository.findByUserAndGoogleId.mockResolvedValue(null);

    const { req, next } = make({ params: { googleBookId: "missing" } });
    await removeBook(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });

  test("maps ownership mismatch to ForbiddenError", async () => {
    const otherUserId = { equals: () => false };
    savedBookRepository.findByUserAndGoogleId.mockResolvedValue({
      userId: otherUserId,
    });

    const { req, next } = make({ params: { googleBookId: "g1" } });
    await removeBook(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });
});

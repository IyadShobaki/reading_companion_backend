/**
 * notes.test.js — Unit tests for the notes controller.
 *
 * Note model is mocked — no database.
 * Ownership enforcement (403) is the critical path tested in update/delete.
 */

const { describe, test, expect } = require("@jest/globals");

jest.mock("../../models/note");
const Note = require("../../models/note");

const {
  getNotesByBook,
  createNote,
  updateNote,
  deleteNote,
} = require("../../controllers/notes");
const BadRequestError = require("../../utils/errors/BadRequestError");
const NotFoundError = require("../../utils/errors/NotFoundError");
const ForbiddenError = require("../../utils/errors/ForbiddenError");

// USER_A owns the note; USER_B is an intruder
const USER_A = { toString: () => "uid_a", equals: (id) => id === USER_A };
const USER_B = { toString: () => "uid_b", equals: (id) => id === USER_B };

const make = ({ body = {}, params = {}, user = { _id: USER_A } } = {}) => {
  const req = { body, params, user };
  const res = {};
  res.status = jest.fn(() => res);
  res.send = jest.fn(() => res);
  const next = jest.fn();
  return { req, res, next };
};

// ── getNotesByBook ────────────────────────────────────────────────────────────

describe("getNotesByBook", () => {
  test("responds with 200 and sorted notes array", async () => {
    const notes = [{ content: "Note A" }, { content: "Note B" }];
    const sortable = { sort: jest.fn().mockResolvedValue(notes) };
    Note.find = jest.fn().mockReturnValue(sortable);

    const { req, res, next } = make({ params: { googleBookId: "g1" } });
    await getNotesByBook(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ data: notes });
    // Verify sort was called with pageNumber ascending
    expect(sortable.sort).toHaveBeenCalledWith({ pageNumber: 1 });
  });

  test("responds with 200 and empty array when no notes exist", async () => {
    const sortable = { sort: jest.fn().mockResolvedValue([]) };
    Note.find = jest.fn().mockReturnValue(sortable);

    const { req, res, next } = make({ params: { googleBookId: "g1" } });
    await getNotesByBook(req, res, next);

    expect(res.send).toHaveBeenCalledWith({ data: [] });
  });
});

// ── createNote ────────────────────────────────────────────────────────────────

describe("createNote", () => {
  const noteBody = {
    googleBookId: "g1",
    pageNumber: 3,
    content: "My note",
    title: "Chapter 1",
  };

  test("responds with 201 and the created note", async () => {
    const created = { ...noteBody, _id: "note1" };
    Note.create = jest.fn().mockResolvedValue(created);

    const { req, res, next } = make({ body: noteBody });
    await createNote(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({ data: created });
    // userId must come from req.user._id, not req.body
    expect(Note.create.mock.calls[0][0].userId).toBe(USER_A);
  });

  test("calls next(BadRequestError) on ValidationError", async () => {
    const err = new Error("v");
    err.name = "ValidationError";
    Note.create = jest.fn().mockRejectedValue(err);

    const { req, res, next } = make({ body: noteBody });
    await createNote(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
  });
});

// ── updateNote ────────────────────────────────────────────────────────────────

describe("updateNote", () => {
  const noteBody = { content: "Updated" };

  test("responds with 200 and the updated note when owner calls", async () => {
    const existing = { _id: "note1", userId: USER_A };
    const updated = { ...existing, content: "Updated" };
    Note.findById = jest.fn().mockResolvedValue(existing);
    Note.findByIdAndUpdate = jest.fn().mockResolvedValue(updated);

    const { req, res, next } = make({
      params: { noteId: "note1" },
      body: noteBody,
    });
    await updateNote(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ data: updated });
  });

  test("calls next(NotFoundError) when note does not exist", async () => {
    Note.findById = jest.fn().mockResolvedValue(null);

    const { req, res, next } = make({ params: { noteId: "missing" } });
    await updateNote(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });

  test("calls next(ForbiddenError) when note belongs to a different user", async () => {
    const existing = { _id: "note1", userId: USER_B };
    Note.findById = jest.fn().mockResolvedValue(existing);

    // req.user._id is USER_A — but the note is owned by USER_B
    const { req, res, next } = make({
      params: { noteId: "note1" },
      body: noteBody,
    });
    await updateNote(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });
});

// ── deleteNote ────────────────────────────────────────────────────────────────

describe("deleteNote", () => {
  test("responds with 204 when owner deletes their note", async () => {
    const note = {
      _id: "note1",
      userId: USER_A,
      deleteOne: jest.fn().mockResolvedValue({}),
    };
    Note.findById = jest.fn().mockResolvedValue(note);

    const { req, res, next } = make({ params: { noteId: "note1" } });
    await deleteNote(req, res, next);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(note.deleteOne).toHaveBeenCalled();
  });

  test("calls next(NotFoundError) when note does not exist", async () => {
    Note.findById = jest.fn().mockResolvedValue(null);

    const { req, res, next } = make({ params: { noteId: "missing" } });
    await deleteNote(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });

  test("calls next(ForbiddenError) when note belongs to a different user", async () => {
    const note = { _id: "note1", userId: USER_B, deleteOne: jest.fn() };
    Note.findById = jest.fn().mockResolvedValue(note);

    const { req, res, next } = make({ params: { noteId: "note1" } });
    await deleteNote(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });
});

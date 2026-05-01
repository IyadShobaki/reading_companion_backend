const { describe, test, expect, beforeEach } = require("@jest/globals");

jest.mock("../../repositories/note.repository");

const noteRepository = require("../../repositories/note.repository");
const {
  getNotesByBook,
  createNote,
  updateNote,
  deleteNote,
} = require("../../controllers/notes");
const BadRequestError = require("../../utils/errors/BadRequestError");
const NotFoundError = require("../../utils/errors/NotFoundError");
const ForbiddenError = require("../../utils/errors/ForbiddenError");

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

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getNotesByBook", () => {
  test("responds with notes from the repository", async () => {
    const notes = [{ content: "Note A" }];
    noteRepository.findByUserAndBook.mockResolvedValue(notes);

    const { req, res, next } = make({ params: { googleBookId: "g1" } });
    await getNotesByBook(req, res, next);

    expect(noteRepository.findByUserAndBook).toHaveBeenCalledWith(USER_A, "g1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ data: notes });
  });
});

describe("createNote", () => {
  const noteBody = {
    googleBookId: "g1",
    pageNumber: 3,
    content: "My note",
    title: "Chapter 1",
  };

  test("creates a note scoped to the authenticated user", async () => {
    const created = { ...noteBody, _id: "note1" };
    noteRepository.createForUser.mockResolvedValue(created);

    const { req, res, next } = make({ body: noteBody });
    await createNote(req, res, next);

    expect(noteRepository.createForUser).toHaveBeenCalledWith(USER_A, noteBody);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({ data: created });
  });

  test("maps validation errors to BadRequestError", async () => {
    const err = new Error("invalid");
    err.name = "ValidationError";
    noteRepository.createForUser.mockRejectedValue(err);

    const { req, next } = make({ body: noteBody });
    await createNote(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
  });
});

describe("updateNote", () => {
  test("updates only provided fields for the owner", async () => {
    const existing = { _id: "note1", userId: USER_A };
    const updated = { ...existing, content: "Updated" };
    noteRepository.findById.mockResolvedValue(existing);
    noteRepository.updateById.mockResolvedValue(updated);

    const { req, res, next } = make({
      params: { noteId: "note1" },
      body: { content: "Updated" },
    });
    await updateNote(req, res, next);

    expect(noteRepository.updateById).toHaveBeenCalledWith("note1", {
      content: "Updated",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ data: updated });
  });

  test("maps missing notes to NotFoundError", async () => {
    noteRepository.findById.mockResolvedValue(null);

    const { req, next } = make({ params: { noteId: "missing" } });
    await updateNote(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });

  test("maps ownership mismatch to ForbiddenError", async () => {
    noteRepository.findById.mockResolvedValue({ _id: "note1", userId: USER_B });

    const { req, next } = make({
      params: { noteId: "note1" },
      body: { content: "Updated" },
    });
    await updateNote(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });
});

describe("deleteNote", () => {
  test("deletes a note for the owner", async () => {
    const note = { _id: "note1", userId: USER_A };
    noteRepository.findById.mockResolvedValue(note);
    noteRepository.deleteNote.mockResolvedValue({});

    const { req, res, next } = make({ params: { noteId: "note1" } });
    await deleteNote(req, res, next);

    expect(noteRepository.deleteNote).toHaveBeenCalledWith(note);
    expect(res.status).toHaveBeenCalledWith(204);
  });

  test("maps missing notes to NotFoundError", async () => {
    noteRepository.findById.mockResolvedValue(null);

    const { req, next } = make({ params: { noteId: "missing" } });
    await deleteNote(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });

  test("maps ownership mismatch to ForbiddenError", async () => {
    noteRepository.findById.mockResolvedValue({ _id: "note1", userId: USER_B });

    const { req, next } = make({ params: { noteId: "note1" } });
    await deleteNote(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });
});

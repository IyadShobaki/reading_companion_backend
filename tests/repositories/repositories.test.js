const { describe, test, expect, beforeEach } = require("@jest/globals");

jest.mock("../../models/user");
jest.mock("../../models/savedBook");
jest.mock("../../models/progress");
jest.mock("../../models/note");

const User = require("../../models/user");
const SavedBook = require("../../models/savedBook");
const Progress = require("../../models/progress");
const Note = require("../../models/note");
const userRepository = require("../../repositories/user.repository");
const savedBookRepository = require("../../repositories/savedBook.repository");
const progressRepository = require("../../repositories/progress.repository");
const noteRepository = require("../../repositories/note.repository");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("userRepository", () => {
  test("findByEmailWithPassword selects the password hash", async () => {
    const select = jest.fn().mockResolvedValue({ email: "a@b.com" });
    User.findOne = jest.fn().mockReturnValue({ select });

    await userRepository.findByEmailWithPassword("a@b.com");

    expect(User.findOne).toHaveBeenCalledWith({ email: "a@b.com" });
    expect(select).toHaveBeenCalledWith("+password");
  });

  test("updateProfile uses $set and runs validators", async () => {
    const orFail = jest.fn().mockResolvedValue({ name: "Bob" });
    User.findByIdAndUpdate = jest.fn().mockReturnValue({ orFail });

    await userRepository.updateProfile("uid1", { name: "Bob" });

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      "uid1",
      { $set: { name: "Bob" } },
      { new: true, runValidators: true },
    );
    expect(orFail).toHaveBeenCalled();
  });
});

describe("savedBookRepository", () => {
  test("findByUser sorts newest saved books first", async () => {
    const sort = jest.fn().mockResolvedValue([]);
    SavedBook.find = jest.fn().mockReturnValue({ sort });

    await savedBookRepository.findByUser("uid1");

    expect(SavedBook.find).toHaveBeenCalledWith({ userId: "uid1" });
    expect(sort).toHaveBeenCalledWith({ savedAt: -1 });
  });

  test("createForUser scopes saved books to the authenticated user", async () => {
    SavedBook.create = jest.fn().mockResolvedValue({ googleBookId: "g1" });

    await savedBookRepository.createForUser("uid1", {
      googleBookId: "g1",
      title: "Book",
      authors: "Author",
    });

    expect(SavedBook.create.mock.calls[0][0]).toMatchObject({
      userId: "uid1",
      googleBookId: "g1",
      title: "Book",
    });
  });
});

describe("progressRepository", () => {
  test("upsertPage updates the scoped user/book record", async () => {
    Progress.findOneAndUpdate = jest
      .fn()
      .mockResolvedValue({ googleBookId: "g1", pageNumber: 5 });

    await progressRepository.upsertPage("uid1", "g1", 5);

    expect(Progress.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: "uid1", googleBookId: "g1" },
      { $set: { pageNumber: 5 } },
      { new: true, upsert: true, runValidators: true },
    );
  });
});

describe("noteRepository", () => {
  test("findByUserAndBook sorts notes by page number", async () => {
    const sort = jest.fn().mockResolvedValue([]);
    Note.find = jest.fn().mockReturnValue({ sort });

    await noteRepository.findByUserAndBook("uid1", "g1");

    expect(Note.find).toHaveBeenCalledWith({
      userId: "uid1",
      googleBookId: "g1",
    });
    expect(sort).toHaveBeenCalledWith({ pageNumber: 1 });
  });

  test("updateById builds a $set update", async () => {
    Note.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: "n1" });

    await noteRepository.updateById("n1", { content: "Updated" });

    expect(Note.findByIdAndUpdate).toHaveBeenCalledWith(
      "n1",
      { $set: { content: "Updated" } },
      { new: true, runValidators: true },
    );
  });
});

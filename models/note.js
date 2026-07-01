const mongoose = require("mongoose");

/**
 * Note schema — one document per note per user.
 *
 * A user may have many notes for the same book (unlike Progress which is one
 * per user per book).  Notes are scoped to a specific page number and can
 * optionally carry a title.
 *
 * Indexes:
 *   - Compound `{ userId, googleBookId }` — drives the GET /notes/:googleBookId
 *     query; returning all notes a user wrote for one book is the most common
 *     read path.
 *   - `_id` (default) — used for PATCH and DELETE ownership lookups.
 */
const noteSchema = new mongoose.Schema(
  {
    // Reference to the owning user — used for all ownership and scoping checks
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    // Google Books volume ID — matches the ID used throughout the frontend
    googleBookId: {
      type: String,
      required: true,
      trim: true,
    },

    // Page the note is attached to — positive integer, validated at route level
    pageNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    // Optional short title for the note (2–100 characters)
    title: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },

    // Required body text of the note (1–5000 characters, validated at route level)
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    // Mongoose manages createdAt / updatedAt automatically
    timestamps: true,
  },
);

// Compound index for the primary read path: all notes by a user for a book
noteSchema.index({ userId: 1, googleBookId: 1 });

module.exports = mongoose.model("note", noteSchema);

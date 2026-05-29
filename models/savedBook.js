const mongoose = require("mongoose");
const validator = require("validator");

/**
 * SavedBook schema — one document per user per book.
 *
 * All book metadata is stored here so the Library API can return a full
 * book list in a single query without fetching from Google Books.
 *
 * A unique compound index on { userId, googleBookId } guarantees that the
 * same book cannot be saved twice by the same user.  The controller uses
 * this index to return a 409 on duplicate saves.
 */
const savedBookSchema = new mongoose.Schema({
  // Reference to the owning user — used for all ownership checks
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },

  // Google Books volume ID — the primary key used throughout the frontend
  googleBookId: {
    type: String,
    required: true,
    trim: true,
  },

  // ── Book metadata ──────────────────────────────────────────────────────

  title: {
    type: String,
    required: true,
    trim: true,
  },

  // Stored as a single comma-joined string to keep the schema flat and
  // avoid array-of-primitives indexing complexity at this scale.
  authors: {
    type: String,
    default: "",
    trim: true,
  },

  thumbnail: {
    type: String,
    default: "",
    validate: {
      validator(value) {
        return (
          value === "" ||
          validator.isURL(value, {
            protocols: ["http", "https"],
            require_protocol: true,
          })
        );
      },
      message: "thumbnail must be a valid URL.",
    },
  },

  description: {
    type: String,
    default: "",
  },

  categories: {
    type: String,
    default: "",
  },

  language: {
    type: String,
    default: "",
  },

  publishedDate: {
    type: String,
    default: "",
  },

  // ── Availability flags ────────────────────────────────────────────────

  embeddable: {
    type: Boolean,
    default: false,
  },

  viewability: {
    type: String,
    default: "",
  },

  publicDomain: {
    type: Boolean,
    default: false,
  },

  webReaderLink: {
    type: String,
    default: "",
    validate: {
      validator(value) {
        return value === "" || validator.isURL(value);
      },
      message: "webReaderLink must be a valid URL.",
    },
  },

  // Timestamp of when the user saved this book — stored explicitly so the
  // frontend can sort by "recently saved" without relying on _id order.
  savedAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent saving the same book twice for the same user.
// MongoDB will throw error code 11000 on a duplicate; the controller
// converts that to a 409 ConflictError.
savedBookSchema.index({ userId: 1, googleBookId: 1 }, { unique: true });

module.exports = mongoose.model("savedBook", savedBookSchema);

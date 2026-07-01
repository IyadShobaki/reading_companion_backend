const mongoose = require("mongoose");

/**
 * Progress schema — one document per authenticated user per book.
 *
 * Stores the last-saved page number for a book so authenticated users can
 * resume reading across sessions and devices.
 *
 * Guests use the client-side `progressStorage` utility instead (localStorage).
 *
 * The unique compound index `{ userId, googleBookId }` means:
 *   - Every user has at most one progress record per book.
 *   - The controller uses `findOneAndUpdate` with `upsert: true` to create or
 *     update in a single atomic operation — no separate create/update logic needed.
 */
const progressSchema = new mongoose.Schema(
  {
    // Reference to the owning user
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

    // The page number the user last read.
    // Stored as a positive integer; validated at the route level by Celebrate.
    pageNumber: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    // Mongoose automatically manages `createdAt` and `updatedAt`.
    // `updatedAt` doubles as the "last read" timestamp.
    timestamps: true,
  },
);

// Unique per user per book — enforces the one-record-per-user-per-book rule.
// MongoDB throws error code 11000 on violation; the upsert path avoids this
// for normal saves, but an explicit create would still be protected.
progressSchema.index({ userId: 1, googleBookId: 1 }, { unique: true });

module.exports = mongoose.model("progress", progressSchema);

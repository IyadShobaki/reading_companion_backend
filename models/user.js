/**
 * user.js — Mongoose model for the User collection.
 *
 * Fields:
 *   email    {string}  Unique, required. Validated as a correctly formatted email.
 *   password {string}  Bcrypt hash. Excluded from all queries by default (select: false);
 *                      must be explicitly requested for authentication.
 *   name     {string}  Display name, 2–30 characters.
 *   avatar   {string}  Optional avatar URL. An empty string means no avatar is set.
 *
 * The `password` field is hidden from API responses to prevent accidental
 * credential exposure. Queries that need it (e.g. sign-in) must use .select('+password').
 */

const mongoose = require("mongoose");
const validator = require("validator");

// Mongoose schema for the User collection.
// The password field is excluded from query results by default (select: false)
// and must be explicitly requested when needed for authentication.
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    validate: {
      validator: (v) => validator.isEmail(v),
      message: "You must enter a valid email.",
    },
  },
  password: {
    type: String,
    required: true,
    select: false, // Never returned in query results unless explicitly requested
  },
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 30,
  },
  avatar: {
    type: String,
    default: "",
    validate: {
      validator(value) {
        // Allow an empty string (no avatar) or a valid URL
        return value === "" || validator.isURL(value);
      },
      message: "You must enter a valid URL.",
    },
  },
});

module.exports = mongoose.model("user", userSchema);

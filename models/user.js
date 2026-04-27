const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const UnauthorizedError = require("../utils/errors/UnauthorizedError");

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

// Static method for credential verification during login.
// Throws UnauthorizedError rather than a plain Error so the error flows
// directly to the centralised error handler without string-matching in the controller.
userSchema.statics.findUserByCredentials = async function (email, password) {
  // Explicitly include the password field for comparison
  const user = await this.findOne({ email }).select("+password");
  if (!user) {
    throw new UnauthorizedError();
  }
  const matched = await bcrypt.compare(password, user.password);
  if (!matched) {
    throw new UnauthorizedError();
  }
  return user;
};

module.exports = mongoose.model("user", userSchema);

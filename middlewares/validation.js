const { Joi, celebrate } = require("celebrate");
const validator = require("validator");

// Custom URL validation method
const validateURL = (value, helpers) => {
  if (value === "" || validator.isURL(value)) {
    return value;
  }
  return helpers.error("string.uri");
};

// Validate user creation
const validateUserCreate = celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email().messages({
      "string.empty": "The email field must be filled in",
      "string.email": "The email field must be a valid email",
    }),
    password: Joi.string().required().messages({
      "string.empty": "The password field must be filled in",
    }),
    name: Joi.string().required().min(2).max(30).messages({
      "string.min": "The minimum length of the name field is 2",
      "string.max": "The maximum length of the name field is 30",
      "string.empty": "The name field must be filled in",
    }),
    avatar: Joi.string().allow("").custom(validateURL).messages({
      "string.uri": "The avatar field must be a valid URL",
    }),
  }),
});

// Validate user login
const validateUserLogin = celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email().messages({
      "string.empty": "The email field must be filled in",
      "string.email": "The email field must be a valid email",
    }),
    password: Joi.string().required().messages({
      "string.empty": "The password field must be filled in",
    }),
  }),
});

// Validate user profile update
const validateUserUpdate = celebrate({
  body: Joi.object()
    .keys({
      name: Joi.string().min(2).max(30).messages({
        "string.min": "The minimum length of the name field is 2",
        "string.max": "The maximum length of the name field is 30",
      }),
      avatar: Joi.string().allow("").custom(validateURL).messages({
        "string.uri": "The avatar field must be a valid URL",
      }),
    })
    .or("name", "avatar"),
});

// Validate POST /library — save a book to the user's library.
// All book metadata fields are validated here so the controller can trust
// the data without additional checks.
const validateSaveBook = celebrate({
  body: Joi.object().keys({
    googleBookId: Joi.string().required().messages({
      "string.empty": "googleBookId is required",
    }),
    title: Joi.string().required().messages({
      "string.empty": "title is required",
    }),
    authors: Joi.string().allow(""),
    thumbnail: Joi.string().allow("").custom(validateURL).messages({
      "string.uri": "thumbnail must be a valid URL",
    }),
    description: Joi.string().allow(""),
    categories: Joi.string().allow(""),
    language: Joi.string().allow(""),
    publishedDate: Joi.string().allow(""),
    embeddable: Joi.boolean(),
    viewability: Joi.string().allow(""),
    publicDomain: Joi.boolean(),
    webReaderLink: Joi.string().allow("").custom(validateURL).messages({
      "string.uri": "webReaderLink must be a valid URL",
    }),
  }),
});

// Validate PUT /progress/:googleBookId — upsert reading progress.
// pageNumber must be a positive integer (page 0 or below is not meaningful).
const validateSaveProgress = celebrate({
  body: Joi.object().keys({
    pageNumber: Joi.number().integer().min(1).required().messages({
      "number.base": "pageNumber must be a number",
      "number.integer": "pageNumber must be an integer",
      "number.min": "pageNumber must be at least 1",
      "any.required": "pageNumber is required",
    }),
  }),
});

// Validate POST /notes — create a new note.
// content is required; title and pageNumber are optional but validated when present.
const validateCreateNote = celebrate({
  body: Joi.object().keys({
    googleBookId: Joi.string().required().messages({
      "string.empty": "googleBookId is required",
    }),
    pageNumber: Joi.number().integer().min(1).required().messages({
      "number.base": "pageNumber must be a number",
      "number.integer": "pageNumber must be an integer",
      "number.min": "pageNumber must be at least 1",
      "any.required": "pageNumber is required",
    }),
    content: Joi.string().min(1).max(5000).required().messages({
      "string.empty": "content is required",
      "string.min": "content must be at least 1 character",
      "string.max": "content must be at most 5000 characters",
    }),
    title: Joi.string().allow("").max(100).messages({
      "string.max": "title must be at most 100 characters",
    }),
  }),
});

// Validate PATCH /notes/:noteId — update an existing note.
// At least one of pageNumber, title, or content must be provided.
const validateUpdateNote = celebrate({
  body: Joi.object()
    .keys({
      pageNumber: Joi.number().integer().min(1).messages({
        "number.base": "pageNumber must be a number",
        "number.integer": "pageNumber must be an integer",
        "number.min": "pageNumber must be at least 1",
      }),
      content: Joi.string().min(1).max(5000).messages({
        "string.min": "content must be at least 1 character",
        "string.max": "content must be at most 5000 characters",
      }),
      title: Joi.string().allow("").max(100).messages({
        "string.max": "title must be at most 100 characters",
      }),
    })
    .or("pageNumber", "content", "title"),
});

module.exports = {
  validateUserCreate,
  validateUserLogin,
  validateUserUpdate,
  validateSaveBook,
  validateSaveProgress,
  validateCreateNote,
  validateUpdateNote,
};

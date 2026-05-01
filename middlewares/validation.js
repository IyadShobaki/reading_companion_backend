const { Joi, celebrate } = require("celebrate");
const validator = require("validator");

const MAX_URL_LENGTH = 2048;
const MAX_GOOGLE_BOOK_ID_LENGTH = 200;
const MAX_BOOK_TITLE_LENGTH = 500;
const MAX_METADATA_LENGTH = 1000;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_LANGUAGE_LENGTH = 20;
const MAX_DATE_LENGTH = 50;
const MAX_NOTE_TITLE_LENGTH = 100;
const MAX_NOTE_CONTENT_LENGTH = 5000;
const MAX_AI_QUESTION_LENGTH = 500;

/**
 * Validate optional URL fields after Joi has trimmed and length-checked them.
 * @param {string} value - Candidate URL or empty string.
 * @param {Object} helpers - Joi helper object.
 * @returns {string} The original value when valid.
 */
const validateURL = (value, helpers) => {
  if (
    value === "" ||
    validator.isURL(value, {
      require_protocol: true,
      protocols: ["http", "https"],
    })
  ) {
    return value;
  }
  return helpers.error("string.uri");
};

/**
 * Build a trimmed, required text schema with a max length.
 * @param {number} max - Maximum allowed string length.
 * @returns {Object} Joi string schema.
 */
const nonEmptyText = (max) => Joi.string().trim().min(1).max(max);

/**
 * Build a trimmed optional text schema that allows an empty string.
 * @param {number} max - Maximum allowed string length.
 * @returns {Object} Joi string schema.
 */
const optionalText = (max) => Joi.string().trim().allow("").max(max);

/**
 * Build a bounded optional HTTP/HTTPS URL schema.
 * @returns {Object} Joi string schema.
 */
const optionalUrl = () =>
  Joi.string().trim().allow("").max(MAX_URL_LENGTH).custom(validateURL);

const googleBookId = Joi.string()
  .trim()
  .min(1)
  .max(MAX_GOOGLE_BOOK_ID_LENGTH);

const pageNumber = Joi.number().integer().min(1);

/**
 * Wrap a body schema that rejects unknown fields.
 * @param {Object} schema - Joi object schema.
 * @returns {Function} Celebrate middleware.
 */
const strictBody = (schema) => celebrate({ body: schema.unknown(false) });

/**
 * Wrap a params schema that rejects unknown fields.
 * @param {Object} schema - Joi object schema.
 * @returns {Function} Celebrate middleware.
 */
const strictParams = (schema) => celebrate({ params: schema.unknown(false) });

const validateUserCreate = strictBody(
  Joi.object({
    email: Joi.string().trim().lowercase().required().email().messages({
      "string.empty": "The email field must be filled in",
      "string.email": "The email field must be a valid email",
    }),
    password: Joi.string().min(6).required().messages({
      "string.empty": "The password field must be filled in",
      "string.min": "The password field must be at least 6 characters",
    }),
    name: Joi.string().trim().required().min(2).max(30).messages({
      "string.min": "The minimum length of the name field is 2",
      "string.max": "The maximum length of the name field is 30",
      "string.empty": "The name field must be filled in",
    }),
    avatar: optionalUrl().messages({
      "string.uri": "The avatar field must be a valid URL",
      "string.max": "The avatar field must be at most 2048 characters",
    }),
  }),
);

const validateUserLogin = strictBody(
  Joi.object({
    email: Joi.string().trim().lowercase().required().email().messages({
      "string.empty": "The email field must be filled in",
      "string.email": "The email field must be a valid email",
    }),
    password: Joi.string().required().messages({
      "string.empty": "The password field must be filled in",
    }),
  }),
);

const validateUserUpdate = strictBody(
  Joi.object({
    name: Joi.string().trim().min(2).max(30).messages({
      "string.min": "The minimum length of the name field is 2",
      "string.max": "The maximum length of the name field is 30",
    }),
    avatar: optionalUrl().messages({
      "string.uri": "The avatar field must be a valid URL",
      "string.max": "The avatar field must be at most 2048 characters",
    }),
  }).or("name", "avatar"),
);

const validateSaveBook = strictBody(
  Joi.object({
    googleBookId: googleBookId.required().messages({
      "string.empty": "googleBookId is required",
      "string.max": "googleBookId must be at most 200 characters",
    }),
    title: nonEmptyText(MAX_BOOK_TITLE_LENGTH).required().messages({
      "string.empty": "title is required",
      "string.max": "title must be at most 500 characters",
    }),
    authors: optionalText(MAX_METADATA_LENGTH),
    thumbnail: optionalUrl().messages({
      "string.uri": "thumbnail must be a valid URL",
      "string.max": "thumbnail must be at most 2048 characters",
    }),
    description: optionalText(MAX_DESCRIPTION_LENGTH),
    categories: optionalText(MAX_METADATA_LENGTH),
    language: optionalText(MAX_LANGUAGE_LENGTH),
    publishedDate: optionalText(MAX_DATE_LENGTH),
    embeddable: Joi.boolean(),
    viewability: optionalText(MAX_METADATA_LENGTH),
    publicDomain: Joi.boolean(),
    webReaderLink: optionalUrl().messages({
      "string.uri": "webReaderLink must be a valid URL",
      "string.max": "webReaderLink must be at most 2048 characters",
    }),
  }),
);

const validateGoogleBookIdParam = strictParams(
  Joi.object({
    googleBookId: googleBookId.required().messages({
      "string.empty": "googleBookId is required",
      "string.max": "googleBookId must be at most 200 characters",
    }),
  }),
);

const validateNoteIdParam = strictParams(
  Joi.object({
    noteId: Joi.string().hex().length(24).required().messages({
      "string.hex": "noteId must be a valid MongoDB ObjectId",
      "string.length": "noteId must be a valid MongoDB ObjectId",
    }),
  }),
);

const validateSaveProgress = strictBody(
  Joi.object({
    pageNumber: pageNumber.required().messages({
      "number.base": "pageNumber must be a number",
      "number.integer": "pageNumber must be an integer",
      "number.min": "pageNumber must be at least 1",
      "any.required": "pageNumber is required",
    }),
  }),
);

const validateCreateNote = strictBody(
  Joi.object({
    googleBookId: googleBookId.required().messages({
      "string.empty": "googleBookId is required",
      "string.max": "googleBookId must be at most 200 characters",
    }),
    pageNumber: pageNumber.required().messages({
      "number.base": "pageNumber must be a number",
      "number.integer": "pageNumber must be an integer",
      "number.min": "pageNumber must be at least 1",
      "any.required": "pageNumber is required",
    }),
    content: nonEmptyText(MAX_NOTE_CONTENT_LENGTH).required().messages({
      "string.empty": "content is required",
      "string.min": "content must be at least 1 character",
      "string.max": "content must be at most 5000 characters",
    }),
    title: optionalText(MAX_NOTE_TITLE_LENGTH).messages({
      "string.max": "title must be at most 100 characters",
    }),
  }),
);

const validateUpdateNote = strictBody(
  Joi.object({
    pageNumber: pageNumber.messages({
      "number.base": "pageNumber must be a number",
      "number.integer": "pageNumber must be an integer",
      "number.min": "pageNumber must be at least 1",
    }),
    content: nonEmptyText(MAX_NOTE_CONTENT_LENGTH).messages({
      "string.min": "content must be at least 1 character",
      "string.max": "content must be at most 5000 characters",
    }),
    title: optionalText(MAX_NOTE_TITLE_LENGTH).messages({
      "string.max": "title must be at most 100 characters",
    }),
  }).or("pageNumber", "content", "title"),
);

const aiBaseFields = {
  googleBookId: googleBookId.required().messages({
    "string.empty": "googleBookId is required",
    "string.max": "googleBookId must be at most 200 characters",
  }),
  title: nonEmptyText(MAX_BOOK_TITLE_LENGTH).required().messages({
    "string.empty": "title is required",
    "string.max": "title must be at most 500 characters",
  }),
  pageNumber: pageNumber.required().messages({
    "number.base": "pageNumber must be a number",
    "number.integer": "pageNumber must be an integer",
    "number.min": "pageNumber must be at least 1",
    "any.required": "pageNumber is required",
  }),
};

const validateAiRequest = strictBody(Joi.object(aiBaseFields));

const validateAiAsk = strictBody(
  Joi.object({
    ...aiBaseFields,
    question: nonEmptyText(MAX_AI_QUESTION_LENGTH).required().messages({
      "string.empty": "question is required",
      "string.min": "question must be at least 1 character",
      "string.max": "question must be at most 500 characters",
      "any.required": "question is required",
    }),
  }),
);

module.exports = {
  validateUserCreate,
  validateUserLogin,
  validateUserUpdate,
  validateSaveBook,
  validateGoogleBookIdParam,
  validateNoteIdParam,
  validateSaveProgress,
  validateCreateNote,
  validateUpdateNote,
  validateAiRequest,
  validateAiAsk,
};

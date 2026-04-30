/**
 * ai.service.js — Google Gemini AI service layer.
 *
 * Wraps the @google/genai SDK and exposes four reading-assistant actions.
 * Each action builds a focused prompt, calls the Gemini API, and returns
 * a normalised { response: string } object.
 *
 * A per-request AbortController timeout is applied to every call so a slow
 * or hung AI response never blocks the Express event loop indefinitely.
 */

const { GoogleGenAI } = require("@google/genai");
const { GEMINI_API_KEY, AI_TIMEOUT_MS } = require("../utils/config");

const MODEL = "gemini-2.0-flash";

/**
 * Build a shared reading-context preamble that orients the model.
 *
 * @param {string} title        - Book title.
 * @param {string} googleBookId - Google Books volume ID (extra context).
 * @param {number} pageNumber   - Current reader page.
 * @returns {string}
 */
const buildPreamble = (title, googleBookId, pageNumber) =>
  `You are a reading assistant for the book "${title}" (Google Books ID: ${googleBookId}). ` +
  `The reader is currently on page ${pageNumber}. Keep your response concise and relevant to this book.`;

/**
 * Call Gemini with a timeout guard.
 * Rejects with an Error whose message is safe to surface to the client.
 *
 * @param {string} prompt
 * @returns {Promise<string>} Raw text response from the model.
 */
const callGemini = async (prompt) => {
  if (!GEMINI_API_KEY) {
    const err = new Error("AI service is not configured.");
    err.statusCode = 503;
    throw err;
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  // Give the timeout error a statusCode so errorHandler surfaces its message.
  const timeoutError = new Error("AI request timed out. Please try again.");
  timeoutError.statusCode = 503;
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(timeoutError), AI_TIMEOUT_MS),
  );

  const aiPromise = ai.models
    .generateContent({
      model: MODEL,
      contents: prompt,
    })
    .then((result) => result.text);

  try {
    return await Promise.race([aiPromise, timeoutPromise]);
  } catch (err) {
    // If the error already has a statusCode (e.g. our timeout), rethrow directly.
    if (err.statusCode) throw err;

    // Gemini SDK ApiError — the message may be a JSON string containing error.code.
    let apiCode;
    try {
      const parsed = JSON.parse(err.message);
      apiCode = parsed?.error?.code;
    } catch {
      /* message is not JSON */
    }

    if (apiCode === 429) {
      const retryErr = new Error(
        "The AI service is currently at capacity. Please try again in a moment.",
      );
      retryErr.statusCode = 503;
      throw retryErr;
    }

    // Fallback — surface a generic but operational message.
    const serverErr = new Error("AI request failed. Please try again.");
    serverErr.statusCode = 500;
    throw serverErr;
  }
};

/**
 * Summarise the book around the current page.
 *
 * @param {Object} params
 * @param {string} params.googleBookId
 * @param {string} params.title
 * @param {number} params.pageNumber
 * @returns {Promise<{response: string}>}
 */
const summarize = async ({ googleBookId, title, pageNumber }) => {
  const prompt =
    buildPreamble(title, googleBookId, pageNumber) +
    " Provide a concise 2-3 paragraph summary of what a reader might be encountering around this page. " +
    "Focus on themes, key events, or ideas rather than exact plot spoilers.";

  const response = await callGemini(prompt);
  return { response };
};

/**
 * Explain key concepts or ideas the reader may encounter near the current page.
 *
 * @param {Object} params
 * @param {string} params.googleBookId
 * @param {string} params.title
 * @param {number} params.pageNumber
 * @returns {Promise<{response: string}>}
 */
const explain = async ({ googleBookId, title, pageNumber }) => {
  const prompt =
    buildPreamble(title, googleBookId, pageNumber) +
    " Identify and explain 2-3 key concepts, terms, or ideas that a reader would benefit from understanding " +
    "around this section. Keep explanations accessible to a general audience.";

  const response = await callGemini(prompt);
  return { response };
};

/**
 * Provide historical, cultural, or literary context for the current section.
 *
 * @param {Object} params
 * @param {string} params.googleBookId
 * @param {string} params.title
 * @param {number} params.pageNumber
 * @returns {Promise<{response: string}>}
 */
const context = async ({ googleBookId, title, pageNumber }) => {
  const prompt =
    buildPreamble(title, googleBookId, pageNumber) +
    " Provide relevant historical, cultural, or literary context that would help a reader better understand " +
    "this section. Include any notable background about the author, time period, or genre conventions.";

  const response = await callGemini(prompt);
  return { response };
};

/**
 * Answer a free-form question about the book at the current page.
 *
 * @param {Object} params
 * @param {string} params.googleBookId
 * @param {string} params.title
 * @param {number} params.pageNumber
 * @param {string} params.question   - The reader's question.
 * @returns {Promise<{response: string}>}
 */
const ask = async ({ googleBookId, title, pageNumber, question }) => {
  const prompt =
    buildPreamble(title, googleBookId, pageNumber) +
    ` Please answer the following question about this book: "${question}"`;

  const response = await callGemini(prompt);
  return { response };
};

module.exports = { summarize, explain, context, ask };

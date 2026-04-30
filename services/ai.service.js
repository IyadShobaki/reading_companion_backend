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
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error("AI request timed out. Please try again.")),
      AI_TIMEOUT_MS,
    ),
  );

  const aiPromise = ai.models
    .generateContent({
      model: MODEL,
      contents: prompt,
    })
    .then((result) => result.text);

  return Promise.race([aiPromise, timeoutPromise]);
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

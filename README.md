# Reading Companion — Backend

REST API for the Reading Companion application. Built with Node.js, Express 5, and MongoDB — it handles user authentication, personal library management, reading progress tracking, per-book notes, and an AI reading-assistant powered by Google Gemini.

---

## Features

- **Authentication** — JWT-based registration (`POST /signup`) and login (`POST /signin`). Passwords hashed with bcryptjs. Tokens are signed JWTs valid for 7 days.
- **Profile management** — Authenticated users can fetch and update their name and avatar URL.
- **Personal library** — Save and remove books by `googleBookId`. Returns the full saved-book list on every fetch.
- **Reading progress** — Persist and restore the last-read page number per book, per user.
- **Per-book notes** — Full CRUD for reading notes scoped to a specific book and the authenticated user. Ownership is enforced — users can only edit or delete their own notes.
- **AI reading assistant** _(stretch goal)_ — Four endpoints powered by Google Gemini 2.0 Flash: summarise, explain concepts, provide context, and answer free-form questions about a book.
- **Security** — Helmet headers, CORS allow-list, global rate limiting (100 req / 15 min), Celebrate/Joi request validation, typed HTTP error classes.
- **Logging** — Winston structured logging for requests and errors via express-winston.

---

## Tech Stack

| Technology                | Version | Role                         |
| ------------------------- | ------- | ---------------------------- |
| Node.js                   | LTS     | Runtime                      |
| Express                   | 5       | HTTP framework               |
| MongoDB / Mongoose        | 8       | Database / ODM               |
| bcryptjs                  | 3       | Password hashing             |
| jsonwebtoken              | 9       | JWT signing & verification   |
| Celebrate + Joi           | 15      | Request validation           |
| Helmet                    | 8       | HTTP security headers        |
| CORS                      | 2       | Cross-origin request control |
| express-rate-limit        | 8       | Rate limiting                |
| Winston / express-winston | 3 / 4   | Structured logging           |
| @google/genai             | 1       | Google Gemini AI SDK         |
| dotenv                    | 17      | Environment variable loading |

**Testing:** Jest · Supertest · mongodb-memory-server (119 tests, 13 suites)

---

## Getting Started

### Prerequisites

- Node.js LTS
- MongoDB running locally (or a MongoDB Atlas connection string)
- A Google Gemini API key (optional — only required for AI endpoints)

### Installation

```bash
# From the reading_companion_backend directory
npm install
```

### Environment variables

Copy `.env.example` to `.env` and fill in the values:

```env
PORT=3001
JWT_SECRET=super-strong-secret
MONGODB_URI=mongodb://127.0.0.1:27017/rc_db
CLIENT_ORIGIN=http://localhost:3000

# Google Gemini AI (optional — AI endpoints return 500 in production without this)
GEMINI_API_KEY=your-gemini-api-key-here
AI_TIMEOUT_MS=15000

# Rate limiter
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

> **Note:** `JWT_SECRET` and `GEMINI_API_KEY` are required in production (`NODE_ENV=production`). The server refuses to start without them.

### Running

```bash
# Development (auto-restarts with nodemon)
npm run dev

# Production
npm start
```

Server starts on `http://localhost:3001` (or the port set in `PORT`).

### Tests

```bash
npm test
# or with coverage
npm run test:coverage
```

---

## API Reference

All endpoints are relative to the server base URL (default: `http://localhost:3001`).

Authentication is enforced via a `Bearer <token>` `Authorization` header on all protected routes.

### Auth (public)

| Method | Endpoint  | Description              | Body                                 |
| ------ | --------- | ------------------------ | ------------------------------------ |
| `POST` | `/signup` | Register a new user      | `{ name, email, password, avatar? }` |
| `POST` | `/signin` | Log in and receive a JWT | `{ email, password }`                |

**Signup response:** `{ data: { _id, name, email, avatar } }`
**Signin response:** `{ token, data: { _id, name, email, avatar } }`

### Users (protected)

| Method  | Endpoint    | Description                          | Body                 |
| ------- | ----------- | ------------------------------------ | -------------------- |
| `GET`   | `/users/me` | Get the authenticated user's profile | —                    |
| `PATCH` | `/users/me` | Update name and/or avatar            | `{ name?, avatar? }` |

### Library (protected)

| Method   | Endpoint                 | Description         | Body                                                                   |
| -------- | ------------------------ | ------------------- | ---------------------------------------------------------------------- |
| `GET`    | `/library`               | Get all saved books | —                                                                      |
| `POST`   | `/library`               | Save a book         | `{ googleBookId, title, authors, thumbnail, embeddable, viewability }` |
| `DELETE` | `/library/:googleBookId` | Remove a saved book | —                                                                      |

### Progress (protected)

| Method | Endpoint                  | Description               | Body             |
| ------ | ------------------------- | ------------------------- | ---------------- |
| `GET`  | `/progress/:googleBookId` | Get saved page for a book | —                |
| `PUT`  | `/progress/:googleBookId` | Save current page         | `{ pageNumber }` |

### Notes (protected)

| Method   | Endpoint               | Description              | Body                                           |
| -------- | ---------------------- | ------------------------ | ---------------------------------------------- |
| `GET`    | `/notes/:googleBookId` | Get all notes for a book | —                                              |
| `POST`   | `/notes`               | Create a note            | `{ googleBookId, title, content, pageNumber }` |
| `PATCH`  | `/notes/:noteId`       | Update a note            | `{ title?, content?, pageNumber? }`            |
| `DELETE` | `/notes/:noteId`       | Delete a note            | —                                              |

> Ownership is enforced on `PATCH` and `DELETE` — a user can only modify their own notes (403 otherwise).

### AI Reading Assistant (protected, stretch goal)

All AI endpoints require `{ googleBookId, title, pageNumber }` in the request body. The `ask` endpoint additionally requires `{ question }`.

| Method | Endpoint        | Description                                |
| ------ | --------------- | ------------------------------------------ |
| `POST` | `/ai/summarize` | Summarise content around the current page  |
| `POST` | `/ai/explain`   | Explain key concepts near the current page |
| `POST` | `/ai/context`   | Provide historical / literary context      |
| `POST` | `/ai/ask`       | Answer a free-form question about the book |

**Response:** `{ data: { response: string } }`

> Requires `GEMINI_API_KEY`. Requests time out after `AI_TIMEOUT_MS` milliseconds (default 15 s).

### Error responses

All errors return `{ message: string }` with the appropriate HTTP status code.

| Status | Meaning                                        |
| ------ | ---------------------------------------------- |
| 400    | Bad request / validation failure               |
| 401    | Missing or invalid JWT                         |
| 403    | Authenticated but not authorised (wrong owner) |
| 404    | Resource not found                             |
| 409    | Conflict (e.g., email already registered)      |
| 429    | Rate limit exceeded                            |
| 500    | Internal server error                          |

---

## Project Structure

```
reading_companion_backend/
├── app.js                  # Express bootstrap, middleware chain, DB connection
├── server.js               # Entry point — calls main()
├── routes/
│   ├── index.js            # Route aggregator + 404 catch-all
│   ├── users.js            # /users/*
│   ├── library.js          # /library/*
│   ├── progress.js         # /progress/*
│   ├── notes.js            # /notes/*
│   └── ai.js               # /ai/*
├── controllers/
│   ├── users.js            # login, createUser, getCurrentUser, updateUserProfile
│   ├── library.js          # getLibrary, saveBook, removeBook
│   ├── progress.js         # getProgress, saveProgress
│   ├── notes.js            # getNotesByBook, createNote, updateNote, deleteNote
│   └── ai.js               # summarize, explain, context, ask
├── models/
│   ├── user.js             # User schema + findUserByCredentials
│   ├── book.js             # SavedBook schema
│   ├── progress.js         # Progress schema
│   └── note.js             # Note schema
├── middlewares/
│   ├── auth.js             # JWT verification — attaches req.user
│   ├── validation.js       # Celebrate/Joi validators for all routes
│   ├── rateLimiter.js      # Global rate limiter
│   ├── logger.js           # Winston request + error loggers
│   └── errorHandler.js     # Centralised error response middleware
├── services/
│   └── ai.service.js       # Gemini API integration
├── utils/
│   ├── config.js           # Environment config with production guards
│   ├── errors.js           # HTTP status codes and default messages
│   └── errors/             # Typed error classes (400 / 401 / 403 / 404 / 409)
└── tests/                  # Jest + Supertest + mongodb-memory-server

```

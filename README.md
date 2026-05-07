# Reading Companion - Backend

Express API for Reading Companion. The backend handles authentication, profile data, saved books, reading progress, notes, and OpenAI-backed AI assistant requests.

## Features

- **Authentication** - JWT registration and signin with bcrypt-hashed passwords.
- **Profile management** - Fetch and update the authenticated user's name/avatar.
- **Library** - Save and remove Google Books volumes per user.
- **Progress** - Persist one current page per user/book.
- **Notes** - Full CRUD for notes scoped to user, book, and page.
- **AI assistant** - Protected OpenAI-powered chatbot endpoint (`/ai/ask`) for answering questions about the current book.
- **Security** - Helmet, CORS allow-list, rate limiting, JWT middleware, Celebrate/Joi validation, typed HTTP errors.
- **Logging** - Winston request and error logging through express-winston.

## Tech Stack

| Technology                             | Role                         |
| -------------------------------------- | ---------------------------- |
| Node.js LTS                            | Runtime                      |
| Express 5                              | HTTP framework               |
| MongoDB and Mongoose 8                 | Persistence and ODM          |
| bcryptjs                               | Password hashing             |
| jsonwebtoken                           | JWT signing and verification |
| Celebrate/Joi                          | Request validation           |
| Helmet, CORS, express-rate-limit       | Security middleware          |
| Winston and express-winston            | Logging                      |
| openai                                 | OpenAI integration           |
| Jest, Supertest, mongodb-memory-server | Backend tests                |

Current documented test baseline: 16 Jest suites, 151 tests.

## Setup

```bash
npm install
```

Create `.env` from `.env.example`:

```env
PORT=3001
JWT_SECRET=super-strong-secret
MONGODB_URI=mongodb://127.0.0.1:27017/rc_db
CLIENT_ORIGIN=http://localhost:3000
OPENAI_API_KEY=your-openai-api-key-here
AI_TIMEOUT_MS=15000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_MESSAGE=Too many requests from this IP, please try again later.
RATE_LIMIT_STATUS_CODE=429
```

`JWT_SECRET` and `OPENAI_API_KEY` are required in production. The server refuses to start in production without them.

## Commands

```bash
npm run dev
npm start
npm test
npm run test:coverage
npm run lint
```

The API runs on `http://localhost:3001` by default.

## API Summary

All protected routes require `Authorization: Bearer <token>`.

Response shapes:

- Success: `{ data: ... }`
- Signin: `{ token, data: ... }`
- Delete success: `204 No Content`
- Errors: `{ message: string }`

| Group      | Endpoints                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------ |
| Auth/users | `POST /signup`, `POST /signin`, `GET /users/me`, `PATCH /users/me`                         |
| Library    | `GET /library`, `POST /library`, `DELETE /library/:googleBookId`                           |
| Progress   | `GET /progress/:googleBookId`, `PUT /progress/:googleBookId`                               |
| Notes      | `GET /notes/:googleBookId`, `POST /notes`, `PATCH /notes/:noteId`, `DELETE /notes/:noteId` |
| AI         | `POST /ai/ask`                                                                             |

## Project Structure

```text
reading_companion_backend/
  app.js                 Express app, middleware, DB startup
  server.js              Production entry point
  controllers/           Route handlers
  middlewares/           Auth, validation, logging, rate limit, error handling
  models/                user.js, savedBook.js, progress.js, note.js
  repositories/          Data-access modules for Mongoose models
  routes/                Route definitions and route aggregation
  services/              Auth helpers and OpenAI AI service
  tests/                 Jest, Supertest, mongodb-memory-server tests
  utils/                 Config, constants, and typed errors
```

## Data Model Notes

- `SavedBook` uses a unique `{ userId, googleBookId }` index to prevent duplicate saves.
- `Progress` is separate from `SavedBook` so users can track books that are not in their library.
- `Note` documents are user-owned; update/delete enforce ownership.
- Controllers use repositories for data access rather than importing models directly.
- JWT payloads contain only `_id`; user data is read from MongoDB.

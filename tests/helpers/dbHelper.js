/**
 * dbHelper.js — Shared MongoDB Memory Server helpers for integration tests.
 *
 * Each test file that needs a live DB connection calls these helpers in
 * beforeAll / afterEach / afterAll.  The in-memory server spins up a real
 * MongoDB instance in process — no external service required.
 *
 * Usage:
 *   const { connectDB, clearDB, disconnectDB } = require("../helpers/dbHelper");
 *
 *   beforeAll(connectDB);
 *   afterEach(clearDB);    // keep tests isolated
 *   afterAll(disconnectDB);
 */

const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

let mongod;

/**
 * Start the in-memory server and connect Mongoose to it.
 * Called once per test suite in beforeAll.
 */
const connectDB = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
};

/**
 * Drop all collections so each test starts with a clean slate.
 * Called in afterEach.
 */
const clearDB = async () => {
  if (mongoose.connection.readyState === 0) return;
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

/**
 * Close the Mongoose connection and stop the in-memory server.
 * Called once per test suite in afterAll.
 * Guards against the shared-singleton case where another suite may have
 * already closed the connection when running with --runInBand.
 */
const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
  } catch {
    // Connection already closed by a sibling suite — safe to ignore.
  }
  try {
    if (mongod) {
      await mongod.stop();
    }
  } catch {
    // Server already stopped — safe to ignore.
  }
};

module.exports = { connectDB, clearDB, disconnectDB };

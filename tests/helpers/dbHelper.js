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
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

/**
 * Close the Mongoose connection and stop the in-memory server.
 * Called once per test suite in afterAll.
 */
const disconnectDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
};

module.exports = { connectDB, clearDB, disconnectDB };

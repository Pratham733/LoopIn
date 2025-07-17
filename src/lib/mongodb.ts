/**
 * This file is kept for compatibility with existing code but is not actively used.
 * The application is now using Firebase directly for all database operations.
 */

async function dbConnect() {
  console.warn('MongoDB connection attempted but the app is configured to use Firebase only');
  return null;
}

export default dbConnect;

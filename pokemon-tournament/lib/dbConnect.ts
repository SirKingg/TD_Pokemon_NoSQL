// lib/dbConnect.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGO_URI;
if (!MONGODB_URI) {
  throw new Error("Veuillez définir la variable d'environnement MONGO_URI dans .env.local");
}

// On utilise un cache global pour éviter de recréer plusieurs connexions en développement
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: {
    conn: mongoose.Mongoose | null;
    promise: Promise<mongoose.Mongoose> | null;
  };
}

let cached = global.mongooseCache;
if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

async function dbConnect(): Promise<mongoose.Mongoose> {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI!).then(m => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;

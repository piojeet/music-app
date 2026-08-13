import mongoose from "mongoose";
import { logger } from "../lib/logger";

let isConnected = false;

export async function connectMongoDB(): Promise<typeof mongoose | null> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    logger.error("MONGODB_URI environment variable is required but was not provided.");
    return null;
  }

  try {
    logger.info("Connecting to MongoDB via Mongoose...");
    const db = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });

    isConnected = true;
    logger.info({ host: db.connection.host, name: db.connection.name }, "MongoDB connected successfully");

    mongoose.connection.on("error", (err) => {
      logger.error({ err }, "MongoDB connection error after initial connection");
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected. Attempting to reconnect...");
      isConnected = false;
    });

    return db;
  } catch (error) {
    logger.error({ error: (error as Error).message }, "Could not connect to remote MongoDB Atlas cluster. Check network/IP access.");
    return null;
  }
}

export function getIsConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

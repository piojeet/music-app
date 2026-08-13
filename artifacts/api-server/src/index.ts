import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

const [{ default: app }, { connectMongoDB }, { logger }] = await Promise.all([
  import("./app"),
  import("./db/mongodb"),
  import("./lib/logger"),
]);

const rawPort = process.env["PORT"] || "5000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Connect before exposing the API so uploads/listing never race a disconnected
// database and silently fall back to stale client content.
const database = await connectMongoDB();

if (!database) {
  throw new Error("MongoDB connection could not be established. API startup aborted.");
}

logger.info("MongoDB connected; serving uploaded songs only");

const server = app.listen(port, () => {
  logger.info({ port }, "Server running & listening for HTTP requests");
  logger.info(`Admin Dashboard: http://localhost:${port}/admin`);
  logger.info(`Song API Endpoint: http://localhost:${port}/api/songs`);
});

import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import { Song } from "../models/Song";
import { requireAdmin } from "../middlewares/auth";
import { songUploadMiddleware } from "../middlewares/upload";
import { deleteFromCloudinary, uploadBufferToCloudinary } from "../lib/cloudinary";
import { logger } from "../lib/logger";

const router = Router();

function databaseUnavailable(res: Response): void {
  res.status(503).json({
    error: "Database unavailable",
    message: "Song storage is temporarily unavailable. Please retry after MongoDB reconnects.",
  });
}

function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}

router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    if (!isDatabaseReady()) return databaseUnavailable(res);
    const songs = await Song.find().sort({ createdAt: -1 });
    res.set("Cache-Control", "no-store, max-age=0");
    res.json(songs);
  } catch (error) {
    logger.error({ error }, "Error fetching songs from MongoDB");
    res.status(500).json({ error: "Failed to fetch songs" });
  }
});

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isDatabaseReady()) return databaseUnavailable(res);
    const song = await Song.findById(req.params.id);
    if (!song) {
      res.status(404).json({ error: "Song not found" });
      return;
    }
    res.json(song);
  } catch (error) {
    logger.error({ error, id: req.params.id }, "Error fetching song by ID");
    res.status(500).json({ error: "Failed to fetch song" });
  }
});

router.post("/", requireAdmin, songUploadMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, artist, album, year, genre, duration: requestedDuration } = req.body;
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;

    if (!title || !artist || !album || !year || !genre) {
      res.status(400).json({ error: "Validation Error", message: "Fields title, artist, album, year, and genre are required." });
      return;
    }

    const audioFile = (files?.audio || files?.audioFile)?.[0];
    const coverFile = (files?.cover || files?.coverImage)?.[0];
    if (!audioFile || !coverFile) {
      res.status(400).json({ error: "Validation Error", message: "Both an audio file and cover image are required." });
      return;
    }
    if (!isDatabaseReady()) return databaseUnavailable(res);

    logger.info({ title, artist }, "Uploading audio and cover image to Cloudinary");
    // A successful upload must contain the exact submitted files—never a demo fallback.
    const [audioUpload, coverUpload] = await Promise.all([
      uploadBufferToCloudinary(audioFile.buffer, "audio", "video", audioFile.originalname),
      uploadBufferToCloudinary(coverFile.buffer, "covers", "image", coverFile.originalname),
    ]);

    const duration = requestedDuration ? Number(requestedDuration) : (audioUpload.duration || 180);
    if (!Number.isFinite(duration) || duration <= 0) {
      res.status(400).json({ error: "Validation Error", message: "Song duration must be a positive number." });
      return;
    }

    const song = await Song.create({
      title: title.trim(),
      artist: artist.trim(),
      album: album.trim(),
      year: Number(year),
      genre: genre.trim(),
      duration: Math.round(duration),
      audioUrl: audioUpload.secure_url,
      coverImage: coverUpload.secure_url,
    });

    logger.info({ id: song._id, title: song.title }, "Song and original media saved successfully");
    res.status(201).json(song);
  } catch (error) {
    logger.error({ error }, "Error creating song");
    res.status(500).json({ error: "Failed to create song", message: (error as Error).message });
  }
});

router.put("/:id", requireAdmin, songUploadMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isDatabaseReady()) return databaseUnavailable(res);
    const song = await Song.findById(req.params.id);
    if (!song) {
      res.status(404).json({ error: "Song not found" });
      return;
    }
    const { title, artist, album, year, genre, duration } = req.body;
    if (title) song.title = title.trim();
    if (artist) song.artist = artist.trim();
    if (album) song.album = album.trim();
    if (year) song.year = Number(year);
    if (genre) song.genre = genre.trim();
    if (duration) song.duration = Number(duration);
    await song.save();
    res.json(song);
  } catch (error) {
    logger.error({ error, id: req.params.id }, "Error updating song");
    res.status(500).json({ error: "Failed to update song" });
  }
});

router.delete("/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isDatabaseReady()) return databaseUnavailable(res);
    const song = await Song.findById(req.params.id);
    if (!song) {
      res.status(404).json({ error: "Song not found" });
      return;
    }
    await Promise.all([
      deleteFromCloudinary(song.audioUrl, "video"),
      deleteFromCloudinary(song.coverImage, "image"),
    ]);
    await song.deleteOne();
    res.json({ success: true, deletedId: req.params.id });
  } catch (error) {
    logger.error({ error, id: req.params.id }, "Error deleting song");
    res.status(500).json({ error: "Failed to delete song" });
  }
});

export default router;

import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import { deleteFromCloudinary, uploadBufferToCloudinary } from "../lib/cloudinary";
import { logger } from "../lib/logger";
import { requireAdmin } from "../middlewares/auth";
import { songUploadMiddleware } from "../middlewares/upload";
import { Artist } from "../models/Artist";
import { Song } from "../models/Song";

const router = Router();

function databaseUnavailable(res: Response): void {
  res.status(503).json({ error: "Database unavailable", message: "Artist storage is temporarily unavailable." });
}

function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}

function getCoverFile(req: Request): Express.Multer.File | undefined {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  return (files?.cover || files?.coverImage)?.[0];
}

router.get("/", async (_req, res): Promise<void> => {
  try {
    if (!isDatabaseReady()) return databaseUnavailable(res);
    const artists = await Artist.find().sort({ name: 1 });
    res.set("Cache-Control", "no-store, max-age=0");
    res.json(artists);
  } catch (error) {
    logger.error({ error }, "Error fetching artists");
    res.status(500).json({ error: "Failed to fetch artists" });
  }
});

router.post("/", requireAdmin, songUploadMiddleware, async (req, res): Promise<void> => {
  try {
    if (!isDatabaseReady()) return databaseUnavailable(res);
    const name = req.body.name?.trim();
    const image = getCoverFile(req);
    if (!name || !image) {
      res.status(400).json({ error: "Validation Error", message: "Artist name and image are required." });
      return;
    }
    const uploaded = await uploadBufferToCloudinary(image.buffer, "artists", "image", image.originalname);
    const artist = await Artist.create({ name, imageUrl: uploaded.secure_url });
    res.status(201).json(artist);
  } catch (error) {
    logger.error({ error }, "Error creating artist");
    res.status(500).json({ error: "Failed to create artist", message: (error as Error).message });
  }
});

router.put("/:id", requireAdmin, songUploadMiddleware, async (req, res): Promise<void> => {
  try {
    if (!isDatabaseReady()) return databaseUnavailable(res);
    const artist = await Artist.findById(req.params.id);
    if (!artist) {
      res.status(404).json({ error: "Artist not found" });
      return;
    }
    const name = req.body.name?.trim();
    if (name) artist.name = name;
    const image = getCoverFile(req);
    if (image) {
      const uploaded = await uploadBufferToCloudinary(image.buffer, "artists", "image", image.originalname);
      const previousImage = artist.imageUrl;
      artist.imageUrl = uploaded.secure_url;
      await deleteFromCloudinary(previousImage, "image");
    }
    await artist.save();
    res.json(artist);
  } catch (error) {
    logger.error({ error, id: req.params.id }, "Error updating artist");
    res.status(500).json({ error: "Failed to update artist" });
  }
});

router.delete("/:id", requireAdmin, async (req, res): Promise<void> => {
  try {
    if (!isDatabaseReady()) return databaseUnavailable(res);
    const artist = await Artist.findById(req.params.id);
    if (!artist) {
      res.status(404).json({ error: "Artist not found" });
      return;
    }
    await deleteFromCloudinary(artist.imageUrl, "image");
    await artist.deleteOne();
    res.json({ success: true, deletedId: req.params.id });
  } catch (error) {
    logger.error({ error, id: req.params.id }, "Error deleting artist");
    res.status(500).json({ error: "Failed to delete artist" });
  }
});

router.post("/:id/songs/:songId", requireAdmin, async (req, res): Promise<void> => {
  try {
    if (!isDatabaseReady()) return databaseUnavailable(res);
    const [artist, song] = await Promise.all([
      Artist.findById(req.params.id),
      Song.findById(req.params.songId),
    ]);
    if (!artist) {
      res.status(404).json({ error: "Artist not found" });
      return;
    }
    if (!song) {
      res.status(404).json({ error: "Song not found" });
      return;
    }
    song.artist = artist.name;
    await song.save();
    res.json(song);
  } catch (error) {
    logger.error({ error, artistId: req.params.id, songId: req.params.songId }, "Error assigning song to artist");
    res.status(500).json({ error: "Failed to assign song to artist" });
  }
});

export default router;

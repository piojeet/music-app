// @ts-nocheck
import { Router, type Response } from "express";
import mongoose from "mongoose";
import { deleteFromCloudinary, uploadBufferToCloudinary } from "../lib/cloudinary";
import { logger } from "../lib/logger";
import { requireAdmin } from "../middlewares/auth";
import { songUploadMiddleware } from "../middlewares/upload";
import { Mix } from "../models/Mix";
import { Song } from "../models/Song";

const router = Router();
const ready = () => mongoose.connection.readyState === 1;
const unavailable = (res: Response) => res.status(503).json({ error: "Database unavailable" });
const cover = (req: any): Express.Multer.File | undefined => ((req.files as Record<string, Express.Multer.File[]> | undefined)?.cover || (req.files as Record<string, Express.Multer.File[]> | undefined)?.coverImage)?.[0];

router.get("/", async (_req, res) => { try { if (!ready()) return unavailable(res); res.set("Cache-Control", "no-store"); res.json(await Mix.find().sort({ createdAt: -1 })); } catch (error) { logger.error({ error }, "Error fetching mixes"); res.status(500).json({ error: "Failed to fetch mixes" }); } });
router.post("/", requireAdmin, songUploadMiddleware, async (req, res) => { try { if (!ready()) return unavailable(res); const image = cover(req), title = req.body.title?.trim(); if (!title || !image) return res.status(400).json({ message: "Title and cover image are required" }); const uploaded = await uploadBufferToCloudinary(image.buffer, "mixes", "image", image.originalname); res.status(201).json(await Mix.create({ title, subtitle: req.body.subtitle?.trim() || "Made for you", imageUrl: uploaded.secure_url })); } catch (error) { const message = error instanceof Error ? error.message : "Unknown error"; logger.error({ error }, "Error creating mix"); res.status(500).json({ message: `Failed to create mix: ${message}` }); } });
router.put("/:id", requireAdmin, songUploadMiddleware, async (req, res) => { try { if (!ready()) return unavailable(res); const mix = await Mix.findById(req.params.id); if (!mix) return res.status(404).json({ message: "Mix not found" }); if (req.body.title?.trim()) mix.title = req.body.title.trim(); if (req.body.subtitle?.trim()) mix.subtitle = req.body.subtitle.trim(); const image = cover(req); if (image) { const uploaded = await uploadBufferToCloudinary(image.buffer, "mixes", "image", image.originalname); const old = mix.imageUrl; mix.imageUrl = uploaded.secure_url; await deleteFromCloudinary(old, "image"); } await mix.save(); res.json(mix); } catch (error) { logger.error({ error }, "Error updating mix"); res.status(500).json({ message: "Failed to update mix" }); } });
router.delete("/:id", requireAdmin, async (req, res) => { try { if (!ready()) return unavailable(res); const mix = await Mix.findById(req.params.id); if (!mix) return res.status(404).json({ message: "Mix not found" }); await deleteFromCloudinary(mix.imageUrl, "image"); await mix.deleteOne(); res.json({ success: true }); } catch (error) { logger.error({ error }, "Error deleting mix"); res.status(500).json({ message: "Failed to delete mix" }); } });
router.post("/:id/songs/:songId", requireAdmin, async (req, res) => { try { if (!ready()) return unavailable(res); const [mix, song] = await Promise.all([Mix.findById(req.params.id), Song.findById(req.params.songId)]); if (!mix || !song) return res.status(404).json({ message: !mix ? "Mix not found" : "Song not found" }); if (!mix.songIds.includes(song.id)) { mix.songIds.push(song.id); await mix.save(); } res.json(mix); } catch (error) { logger.error({ error }, "Error adding song to mix"); res.status(500).json({ message: "Failed to add song" }); } });
router.delete("/:id/songs/:songId", requireAdmin, async (req, res) => { try { if (!ready()) return unavailable(res); const mix = await Mix.findById(req.params.id); if (!mix) return res.status(404).json({ message: "Mix not found" }); mix.songIds = mix.songIds.filter((id) => id !== req.params.songId); await mix.save(); res.json(mix); } catch (error) { logger.error({ error }, "Error removing song from mix"); res.status(500).json({ message: "Failed to remove song" }); } });
export default router;

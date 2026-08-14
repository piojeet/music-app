import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import songsRouter from "./songs";
import artistsRouter from "./artists";
import mixesRouter from "./mixes";

const router: IRouter = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/songs", songsRouter);
router.use("/artists", artistsRouter);
router.use("/mixes", mixesRouter);

export default router;

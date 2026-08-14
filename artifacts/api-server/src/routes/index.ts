import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import songsRouter from "./songs";
import artistsRouter from "./artists";

const router: IRouter = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/songs", songsRouter);
router.use("/artists", artistsRouter);

export default router;

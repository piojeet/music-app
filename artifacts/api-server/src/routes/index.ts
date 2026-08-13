import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import songsRouter from "./songs";

const router: IRouter = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/songs", songsRouter);

export default router;

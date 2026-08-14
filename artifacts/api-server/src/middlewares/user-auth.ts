import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
export type AuthPayload = { sub: string; email: string; type: "access" | "refresh" };
declare global { namespace Express { interface Request { auth?: AuthPayload; } } }
export function requireUser(req: Request, res: Response, next: NextFunction): void { const token = req.headers.authorization?.replace(/^Bearer\s+/i, ""); if (!token) { res.status(401).json({ message: "Authentication required" }); return; } try { const payload = jwt.verify(token, process.env.JWT_SECRET || process.env.SESSION_SECRET || "") as AuthPayload; if (payload.type !== "access") throw new Error("Invalid token"); req.auth = payload; next(); } catch { res.status(401).json({ message: "Session expired. Please sign in again." }); } }

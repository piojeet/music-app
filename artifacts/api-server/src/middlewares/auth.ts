import type { Request, Response, NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    isAdmin?: boolean;
    adminEmail?: string;
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const session = req.session;

  if (session && session.isAdmin) {
    return next();
  }

  res.status(401).json({
    error: "Unauthorized",
    message: "Admin authentication required to perform this action",
  });
}

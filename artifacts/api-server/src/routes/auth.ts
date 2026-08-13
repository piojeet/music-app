import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { logger } from "../lib/logger";

const router = Router();

// Helper to get normalized admin password hash
function getAdminPasswordHash(): string {
  const envHash = (process.env.ADMIN_PASSWORD_HASH || "").trim();
  if (!envHash) {
    logger.warn("ADMIN_PASSWORD_HASH is not set in environment variables");
    return "";
  }
  // If envHash is plaintext, convert to bcrypt hash on the fly for compare compatibility
  if (!envHash.startsWith("$2a$") && !envHash.startsWith("$2b$") && !envHash.startsWith("$2y$")) {
    return bcrypt.hashSync(envHash, 10);
  }
  return envHash;
}

/**
 * POST /api/auth/login
 * Admin login endpoint
 */
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Validation Error", message: "Email and password are required" });
      return;
    }

    const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const inputEmail = String(email).trim().toLowerCase();

    if (inputEmail !== adminEmail) {
      logger.warn({ inputEmail }, "Admin login failed: Email mismatch");
      res.status(401).json({ error: "Unauthorized", message: "Invalid email or password" });
      return;
    }

    const targetHash = getAdminPasswordHash();
    if (!targetHash) {
      res.status(500).json({ error: "Server Configuration Error", message: "Admin credentials improperly configured" });
      return;
    }

    // Verify password using bcrypt.compare
    const isPasswordValid = await bcrypt.compare(String(password), targetHash);

    if (!isPasswordValid) {
      logger.warn({ inputEmail }, "Admin login failed: Incorrect password");
      res.status(401).json({ error: "Unauthorized", message: "Invalid email or password" });
      return;
    }

    // Successful authentication: store state in secure HTTP-only session
    if (req.session) {
      req.session.isAdmin = true;
      req.session.adminEmail = adminEmail;
    }

    logger.info({ adminEmail }, "Admin logged in successfully");
    res.json({
      success: true,
      message: "Admin authentication successful",
      user: {
        email: adminEmail,
        isAdmin: true,
      },
    });
  } catch (error) {
    logger.error({ error }, "Error during admin login");
    res.status(500).json({ error: "Internal Server Error", message: "An error occurred during authentication" });
  }
});

/**
 * POST /api/auth/logout
 * Admin logout endpoint
 */
router.post("/logout", (req: Request, res: Response): void => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        logger.error({ err }, "Error destroying admin session");
        res.status(500).json({ error: "Logout failed" });
        return;
      }
      res.clearCookie("connect.sid");
      res.json({ success: true, message: "Logged out successfully" });
    });
  } else {
    res.json({ success: true, message: "Logged out successfully" });
  }
});

/**
 * GET /api/auth/me
 * Check current authentication state
 */
router.get("/me", (req: Request, res: Response): void => {
  if (req.session && req.session.isAdmin) {
    res.json({
      authenticated: true,
      user: {
        email: req.session.adminEmail || process.env.ADMIN_EMAIL,
        isAdmin: true,
      },
    });
  } else {
    res.json({
      authenticated: false,
      user: null,
    });
  }
});

export default router;

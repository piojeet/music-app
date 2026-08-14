import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { logger } from "../lib/logger";
import { User } from "../models/User";
import { requireUser } from "../middlewares/user-auth";

const router = Router();
const otpHash = (otp: string) => crypto.createHash("sha256").update(otp).digest("hex");
const publicUser = (user: any) => ({ id: user._id.toString(), name: user.name, email: user.email, authProvider: user.authProvider });
const accessTokenSecret = () => process.env.JWT_SECRET || process.env.SESSION_SECRET || "";
const refreshTokenSecret = () => process.env.JWT_REFRESH_SECRET || process.env.SESSION_SECRET || "";
const issueTokens = (user: any) => ({ accessToken: jwt.sign({ sub: user._id.toString(), email: user.email, type: "access" }, accessTokenSecret(), { expiresIn: "15m" }), refreshToken: jwt.sign({ sub: user._id.toString(), email: user.email, type: "refresh" }, refreshTokenSecret(), { expiresIn: "30d" }) });
async function sendOtp(user: any): Promise<void> { if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.OTP_FROM) throw new Error("Email verification is not configured"); const otp = crypto.randomInt(100000, 1000000).toString(); user.otpHash = otpHash(otp); user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); user.otpLastSentAt = new Date(); await user.save(); const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === "true", auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }); await transporter.sendMail({ from: process.env.OTP_FROM, to: user.email, subject: "Your PlayTune verification code", text: `Your PlayTune verification code is ${otp}. It expires in 10 minutes.` }); }
function validSecrets() { return Boolean(accessTokenSecret() && refreshTokenSecret()); }

router.post("/signup", async (req, res): Promise<void> => { try { if (!validSecrets()) throw new Error("Authentication is not configured"); const name = String(req.body.name || "").trim(), email = String(req.body.email || "").trim().toLowerCase(), password = String(req.body.password || ""); if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) { res.status(400).json({ message: "Enter a name, valid email, and password of at least 8 characters." }); return; } if (await User.findOne({ email })) { res.status(409).json({ message: "An account already exists for this email. Please sign in." }); return; } const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12), authProvider: "email" }); await sendOtp(user); res.status(201).json({ user: publicUser(user), verificationRequired: true }); } catch (error) { res.status(500).json({ message: error instanceof Error ? error.message : "Could not create account" }); } });
router.post("/verify-otp", async (req, res): Promise<void> => { const email = String(req.body.email || "").trim().toLowerCase(), otp = String(req.body.otp || ""); const user = await User.findOne({ email }); if (!user || !user.otpHash || !user.otpExpiresAt || user.otpExpiresAt < new Date() || !crypto.timingSafeEqual(Buffer.from(user.otpHash), Buffer.from(otpHash(otp)))) { res.status(400).json({ message: "This verification code is invalid or expired." }); return; } user.isEmailVerified = true; user.otpHash = undefined; user.otpExpiresAt = undefined; await user.save(); res.json({ user: publicUser(user), ...issueTokens(user) }); });
router.post("/resend-otp", async (req, res): Promise<void> => { try { const user = await User.findOne({ email: String(req.body.email || "").trim().toLowerCase() }); if (!user || user.isEmailVerified) { res.status(400).json({ message: "Unable to resend a verification code." }); return; } if (user.otpLastSentAt && Date.now() - user.otpLastSentAt.getTime() < 60_000) { res.status(429).json({ message: "Please wait before requesting another code." }); return; } await sendOtp(user); res.json({ success: true }); } catch (error) { res.status(500).json({ message: error instanceof Error ? error.message : "Could not send code" }); } });
router.post("/login", async (req, res): Promise<void> => { const email = String(req.body.email || "").trim().toLowerCase(), password = String(req.body.password || ""), user = await User.findOne({ email }); if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) { res.status(401).json({ message: "Invalid email or password." }); return; } if (!user.isEmailVerified) { try { await sendOtp(user); } catch {} res.status(403).json({ message: "Verify your email to continue.", verificationRequired: true, email }); return; } res.json({ user: publicUser(user), ...issueTokens(user) }); });
router.post("/google", async (req, res): Promise<void> => { try { const idToken = String(req.body.idToken || ""); if (!idToken) throw new Error("Google sign-in could not be verified"); const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`); const google = await response.json() as any; const allowedAudiences = [process.env.GOOGLE_CLIENT_ID, process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID, process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID].filter(Boolean); const emailVerified = google.email_verified === true || google.email_verified === "true"; if (!response.ok || !emailVerified || !google.sub || !google.email || !["accounts.google.com", "https://accounts.google.com"].includes(google.iss) || !allowedAudiences.includes(google.aud)) throw new Error("Google sign-in could not be verified"); let user = await User.findOne({ $or: [{ googleId: google.sub }, { email: google.email }] }); if (user && user.authProvider === "email" && !user.googleId) { res.status(409).json({ message: "An email account already exists. Please sign in with your password." }); return; } if (!user) user = await User.create({ name: google.name || google.email.split("@")[0], email: google.email, googleId: google.sub, authProvider: "google", isEmailVerified: true }); if (!user.googleId) { user.googleId = google.sub; await user.save(); } res.json({ user: publicUser(user), ...issueTokens(user) }); } catch (error) { res.status(401).json({ message: error instanceof Error ? error.message : "Google sign-in failed" }); } });
router.get("/me", requireUser, async (req, res): Promise<void> => { const user = await User.findById(req.auth!.sub); if (!user) { res.status(401).json({ message: "Session invalid" }); return; } res.json({ user: publicUser(user) }); });
router.post("/refresh", async (req, res): Promise<void> => { try { const payload = jwt.verify(String(req.body.refreshToken || ""), refreshTokenSecret()) as any; if (payload.type !== "refresh") throw new Error(); const user = await User.findById(payload.sub); if (!user) throw new Error(); res.json({ user: publicUser(user), ...issueTokens(user) }); } catch { res.status(401).json({ message: "Session expired" }); } });
router.post("/logout", requireUser, (_req, res): void => { res.json({ success: true }); });

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
router.post("/admin-login", async (req: Request, res: Response): Promise<void> => {
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
router.post("/admin-logout", (req: Request, res: Response): void => {
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
router.get("/admin-me", (req: Request, res: Response): void => {
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

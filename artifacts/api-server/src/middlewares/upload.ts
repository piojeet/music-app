import multer from "multer";
import path from "node:path";
import type { Request } from "express";

// Storage: Memory storage so buffers can be uploaded to Cloudinary
const storage = multer.memoryStorage();

const ALLOWED_AUDIO_EXTENSIONS = [".mp3", ".wav", ".m4a", ".ogg", ".aac", ".flac"];
const ALLOWED_AUDIO_MIMES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/m4a",
  "audio/x-m4a",
  "audio/ogg",
  "audio/aac",
  "audio/flac",
  "audio/mp4",
];

const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

// File filter validator
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  if (file.fieldname === "audio" || file.fieldname === "audioFile") {
    const isExtValid = ALLOWED_AUDIO_EXTENSIONS.includes(ext);
    const isMimeValid = ALLOWED_AUDIO_MIMES.includes(mime) || mime.startsWith("audio/");

    if (!isExtValid || !isMimeValid) {
      return cb(
        new Error(
          `Invalid audio file format. Extension '${ext}' or MIME type '${mime}' is not supported.`
        )
      );
    }
    return cb(null, true);
  }

  if (file.fieldname === "cover" || file.fieldname === "coverImage") {
    const isExtValid = ALLOWED_IMAGE_EXTENSIONS.includes(ext);
    const isMimeValid = ALLOWED_IMAGE_MIMES.includes(mime) || mime.startsWith("image/");

    if (!isExtValid || !isMimeValid) {
      return cb(
        new Error(
          `Invalid cover image format. Extension '${ext}' or MIME type '${mime}' is not supported.`
        )
      );
    }
    return cb(null, true);
  }

  return cb(new Error(`Unexpected field: ${file.fieldname}`));
};

export const songUploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // Max 50MB per file
  },
  fileFilter,
}).fields([
  { name: "audio", maxCount: 1 },
  { name: "audioFile", maxCount: 1 },
  { name: "cover", maxCount: 1 },
  { name: "coverImage", maxCount: 1 },
]);

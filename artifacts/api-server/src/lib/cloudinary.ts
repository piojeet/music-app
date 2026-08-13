import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "node:crypto";
import { logger } from "./logger";

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || "").trim(),
  api_key: (process.env.CLOUDINARY_API_KEY || "").trim(),
  api_secret: (process.env.CLOUDINARY_API_SECRET || "").trim(),
  secure: true,
});

export { cloudinary };

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  duration?: number;
  format?: string;
  bytes?: number;
}

/**
 * Upload a file buffer to Cloudinary using a stream.
 */
export async function uploadBufferToCloudinary(
  buffer: Buffer,
  folder: string,
  resourceType: "image" | "video" | "raw" | "auto" = "auto",
  filename?: string
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `90s_music_stream/${folder}`,
        resource_type: resourceType,
        // Filenames repeat often; a unique id prevents a later upload from
        // resolving to an earlier song's media asset.
        public_id: `${filename ? filename.replace(/\.[^/.]+$/, "") : "upload"}-${randomUUID()}`,
      },
      (error, result) => {
        if (error || !result) {
          logger.error({ error }, "Cloudinary upload failed");
          return reject(error || new Error("Cloudinary upload produced empty result"));
        }
        logger.info({ public_id: result.public_id, url: result.secure_url }, "Cloudinary upload successful");
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          duration: result.duration ? Math.round(result.duration) : undefined,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Extract Cloudinary public_id from a Cloudinary URL.
 * Example: https://res.cloudinary.com/demo/video/upload/v1612345/90s_music_stream/audio/sample.mp3 -> 90s_music_stream/audio/sample
 */
export function extractCloudinaryPublicId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  if (!url.includes("cloudinary.com")) return null;

  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
}

/**
 * Delete a media asset from Cloudinary by public ID or Cloudinary URL.
 */
export async function deleteFromCloudinary(
  publicIdOrUrl: string,
  resourceType: "image" | "video" | "raw" = "image"
): Promise<boolean> {
  if (!publicIdOrUrl) return false;

  const publicId = publicIdOrUrl.includes("http")
    ? extractCloudinaryPublicId(publicIdOrUrl)
    : publicIdOrUrl;

  if (!publicId) {
    logger.info({ publicIdOrUrl }, "Not a Cloudinary URL or invalid public_id, skipping remote asset deletion");
    return false;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    logger.info({ publicId, resourceType, result: result.result }, "Cloudinary asset deletion response");
    return result.result === "ok";
  } catch (error) {
    logger.error({ error: (error as Error).message, publicId }, "Failed to delete asset from Cloudinary");
    return false;
  }
}

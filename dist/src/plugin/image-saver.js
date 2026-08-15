/**
 * Image Saving Utility
 *
 * Handles saving generated images to disk and returning file paths.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createLogger } from "./logger";
const log = createLogger("image-saver");
/**
 * Default directory for saving generated images.
 * Uses ~/.opencode/generated-images/
 */
function getImageOutputDir() {
    const homeDir = homedir();
    return join(homeDir, ".opencode", "generated-images");
}
/**
 * Generate a unique filename for the image.
 */
function generateImageFilename(mimeType) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const random = Math.random().toString(36).substring(2, 8);
    // Determine extension from mime type
    let ext = "png";
    if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
        ext = "jpg";
    }
    else if (mimeType.includes("gif")) {
        ext = "gif";
    }
    else if (mimeType.includes("webp")) {
        ext = "webp";
    }
    return `image-${timestamp}-${random}.${ext}`;
}
/**
 * Save base64 image data to disk and return the file path.
 *
 * The write is performed synchronously (mkdirSync + writeFileSync) and is fully
 * durable before this function returns: the path is only returned once the file
 * is actually persisted, so callers never emit a link to a nonexistent file.
 *
 * Sync-write tradeoff (accepted): image responses are rare and off the
 * token-streaming critical path, so a few-millisecond blocking write is
 * preferable to the data loss of reporting success before the write lands.
 *
 * @param base64Data - The base64-encoded image data
 * @param mimeType - The MIME type of the image (e.g., "image/jpeg")
 * @returns The absolute path to the saved image, or "" if the write failed
 */
export function saveImageToDisk(base64Data, mimeType) {
    try {
        // Keep ALL path setup inside the try: homedir()/filename/join can throw, and
        // any failure must return "" so the caller can fall back to base64.
        const outputDir = getImageOutputDir();
        const filename = generateImageFilename(mimeType);
        const filePath = join(outputDir, filename);
        // Decode base64 and write to disk durably before returning the path.
        const buffer = Buffer.from(base64Data, "base64");
        mkdirSync(outputDir, { recursive: true });
        writeFileSync(filePath, buffer);
        return filePath;
    }
    catch (error) {
        // Surface the failure and return "" so the caller falls back to base64.
        log.error("Failed to save image to disk", {
            error: error instanceof Error ? error.message : String(error),
        });
        return "";
    }
}
/**
 * Process inlineData and return either a file path or base64 data URL.
 * Attempts to save to disk first, falls back to base64 if saving fails.
 *
 * @param inlineData - Object containing mimeType and base64 data
 * @returns Markdown image string with either file path or data URL, or null
 */
export function processImageData(inlineData) {
    const mimeType = inlineData.mimeType || "image/png";
    const data = inlineData.data;
    if (!data) {
        return null;
    }
    // Try to save to disk first; only reference the path once it is persisted.
    const filePath = saveImageToDisk(data, mimeType);
    if (filePath) {
        // Successfully saved - return file path with open command hint
        return `![Generated Image](${filePath})\n\nImage saved to: \`${filePath}\`\n\nTo view: \`open "${filePath}"\``;
    }
    // Fall back to base64 data URL (payload preserved even when the write failed)
    return `![Generated Image](data:${mimeType};base64,${data})`;
}
//# sourceMappingURL=image-saver.js.map
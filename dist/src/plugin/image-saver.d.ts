/**
 * Image Saving Utility
 *
 * Handles saving generated images to disk and returning file paths.
 */
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
export declare function saveImageToDisk(base64Data: string, mimeType: string): string;
/**
 * Process inlineData and return either a file path or base64 data URL.
 * Attempts to save to disk first, falls back to base64 if saving fails.
 *
 * @param inlineData - Object containing mimeType and base64 data
 * @returns Markdown image string with either file path or data URL, or null
 */
export declare function processImageData(inlineData: {
    mimeType?: string;
    data?: string;
}): string | null;
//# sourceMappingURL=image-saver.d.ts.map
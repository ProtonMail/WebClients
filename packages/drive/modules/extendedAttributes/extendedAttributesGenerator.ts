import { getExifInfo } from './exifParser/exifParser';
import { buildExtendedAttributesMetadata } from './metadataBuilder/metadataBuilder';
import type { ExtendedAttributesMetadata, MediaInfo } from './types';

/**
 * Generates extended attributes metadata for regular Drive uploads.
 *
 * This function extracts EXIF data from the file and builds metadata including
 * media dimensions, GPS location, and camera information. It does NOT include
 * photo tags or capture time - use `generatePhotosExtendedAttributes` for those.
 *
 * @param file - The file to process
 * @param mimeType - The detected MIME type of the file
 * @param mediaInfo - Optional media information (width, height, duration)
 * @returns Promise that resolves to an object containing:
 *   - `metadata`: Extended attributes (Media, Location, Camera)
 *
 * @example
 * ```typescript
 * const { metadata } = await generateExtendedAttributes(file, 'image/jpeg', {
 *     width: 1920,
 *     height: 1080
 * });
 * ```
 */
export async function generateExtendedAttributes(
    file: File,
    mimeType: string,
    mediaInfo?: MediaInfo
): Promise<{ metadata: ExtendedAttributesMetadata }> {
    const exifInfo = await getExifInfo(file, mimeType);
    const metadata = buildExtendedAttributesMetadata(exifInfo, mediaInfo);
    return { metadata };
}

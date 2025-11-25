import type { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';

import { getExifInfo } from './exifParser/exifParser';
import { getCaptureDateTime } from './exifParser/exifUtils';
import { buildExtendedAttributesMetadata } from './metadataBuilder/metadataBuilder';
import { getPhotoTags } from './tagDetector/tagDetector';
import type { MediaInfo, PhotosExtendedAttributesResult } from './types';

/**
 * Generates extended attributes metadata, photo tags, and capture time for Photos uploads.
 *
 * This function performs comprehensive photo analysis including:
 * - EXIF data extraction (location, camera info, dimensions)
 * - Photo tag detection (RAW, screenshots, panoramas, portraits, selfies, etc.)
 * - Capture time calculation from EXIF or file modification time
 *
 * Use this for Photos-specific uploads that require full metadata including tags.
 * For regular Drive uploads without tags, use `generateExtendedAttributes` instead.
 *
 * @param file - The photo/video file to process
 * @param mimeType - The detected MIME type of the file
 * @param mediaInfo - Optional media information (width, height, duration)
 * @returns Promise that resolves to an object containing:
 *   - `metadata`: Extended attributes (Media, Location, Camera)
 *   - `tags`: Array of detected photo tags (PhotoTag enum values)
 *   - `captureTime`: Date when the photo was captured
 *
 * @example
 * ```typescript
 * const { metadata, tags, captureTime } = await generatePhotosExtendedAttributes(file, 'image/jpeg', {
 *     width: 1920,
 *     height: 1080
 * });
 * ```
 */
export async function generatePhotosExtendedAttributes(
    file: File,
    mimeType: string,
    mediaInfo?: MediaInfo
): Promise<PhotosExtendedAttributesResult> {
    const exifInfo = await getExifInfo(file, mimeType);
    const metadata = buildExtendedAttributesMetadata(exifInfo, mediaInfo);
    const tags: PhotoTag[] = await getPhotoTags(file, mimeType, exifInfo);
    const captureTime = getCaptureDateTime(file, exifInfo?.exif);

    return {
        metadata,
        tags,
        captureTime,
    };
}

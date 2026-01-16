import { isHEIC } from '@proton/shared/lib/helpers/mimetype';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

/**
 * Check if a file can be previewed or has a fallback preview available
 * This includes HEIC files which can show thumbnails on browsers that don't support HEIC natively.
 */
export const isPreviewOrFallbackAvailable = (mimeType: string, fileSize?: number) => {
    return isPreviewAvailable(mimeType, fileSize) || isHEIC(mimeType);
};

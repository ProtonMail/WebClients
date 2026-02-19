/**
 * In-memory cache for attachment binary data.
 * 
 * This prevents storing non-serializable Uint8Array data in Redux state,
 * which would trigger serialization warnings and performance issues.
 * 
 * The cache stores:
 * - `data`: Full binary data for attachments (original file or HD image)
 * - `imagePreview`: Thumbnail preview data for image attachments
 */

import type { AttachmentId } from '../types';

interface AttachmentDataEntry {
    data?: Uint8Array<ArrayBuffer>;
    imagePreview?: Uint8Array<ArrayBuffer>;
}

class AttachmentDataCache {
    private cache = new Map<AttachmentId, AttachmentDataEntry>();

    /**
     * Store attachment data (full binary content)
     */
    setData(attachmentId: AttachmentId, data: Uint8Array<ArrayBuffer>): void {
        const entry = this.cache.get(attachmentId) || {};
        entry.data = data;
        this.cache.set(attachmentId, entry);
    }

    /**
     * Get attachment data (full binary content)
     */
    getData(attachmentId: AttachmentId): Uint8Array<ArrayBuffer> | undefined {
        return this.cache.get(attachmentId)?.data;
    }

    /**
     * Store attachment image preview (thumbnail)
     */
    setImagePreview(attachmentId: AttachmentId, imagePreview: Uint8Array<ArrayBuffer>): void {
        const entry = this.cache.get(attachmentId) || {};
        entry.imagePreview = imagePreview;
        this.cache.set(attachmentId, entry);
    }

    /**
     * Get attachment image preview (thumbnail)
     */
    getImagePreview(attachmentId: AttachmentId): Uint8Array<ArrayBuffer> | undefined {
        return this.cache.get(attachmentId)?.imagePreview;
    }

    /**
     * Check if attachment has data cached
     */
    hasData(attachmentId: AttachmentId): boolean {
        return !!this.cache.get(attachmentId)?.data;
    }

    /**
     * Check if attachment has image preview cached
     */
    hasImagePreview(attachmentId: AttachmentId): boolean {
        return !!this.cache.get(attachmentId)?.imagePreview;
    }

    /**
     * Remove all data for an attachment
     */
    delete(attachmentId: AttachmentId): void {
        this.cache.delete(attachmentId);
    }

    /**
     * Clear all cached data
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics (for debugging)
     */
    getStats(): { size: number; totalBytes: number } {
        let totalBytes = 0;
        this.cache.forEach((entry) => {
            if (entry.data) {
                totalBytes += entry.data.byteLength;
            }
            if (entry.imagePreview) {
                totalBytes += entry.imagePreview.byteLength;
            }
        });
        return {
            size: this.cache.size,
            totalBytes,
        };
    }
}

// Singleton instance
export const attachmentDataCache = new AttachmentDataCache();

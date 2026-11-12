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
import type { AttachmentId, PdfPageImage } from '../types';

interface AttachmentDataEntry {
    data?: Uint8Array<ArrayBuffer>;
    imagePreview?: Uint8Array<ArrayBuffer>;
    pageImages?: PdfPageImage[];
}

class AttachmentDataCache {
    private cache = new Map<AttachmentId, AttachmentDataEntry>();
    private retained = new Map<AttachmentId, { entry: AttachmentDataEntry; owners: Set<string> }>();

    private getEntry(attachmentId: AttachmentId): AttachmentDataEntry | undefined {
        return this.cache.get(attachmentId) ?? this.retained.get(attachmentId)?.entry;
    }

    retain(attachmentId: AttachmentId, owner: string): void {
        const entry = this.getEntry(attachmentId);
        if (entry === undefined) {
            return;
        }
        const retained = this.retained.get(attachmentId) ?? { entry, owners: new Set<string>() };
        retained.owners.add(owner);
        this.retained.set(attachmentId, retained);
    }

    release(attachmentId: AttachmentId, owner: string): void {
        const retained = this.retained.get(attachmentId);
        retained?.owners.delete(owner);
        if (retained?.owners.size === 0) {
            this.retained.delete(attachmentId);
        }
    }

    /**
     * Store attachment data (full binary content)
     */
    setData(attachmentId: AttachmentId, data: Uint8Array<ArrayBuffer>): void {
        const entry = this.getEntry(attachmentId) ?? {};
        entry.data = data;
        this.cache.set(attachmentId, entry);
    }

    /**
     * Get attachment data (full binary content)
     */
    getData(attachmentId: AttachmentId): Uint8Array<ArrayBuffer> | undefined {
        return this.getEntry(attachmentId)?.data;
    }

    /**
     * Store attachment image preview (thumbnail)
     */
    setImagePreview(attachmentId: AttachmentId, imagePreview: Uint8Array<ArrayBuffer>): void {
        const entry = this.getEntry(attachmentId) ?? {};
        entry.imagePreview = imagePreview;
        this.cache.set(attachmentId, entry);
    }

    /**
     * Get attachment image preview (thumbnail)
     */
    getImagePreview(attachmentId: AttachmentId): Uint8Array<ArrayBuffer> | undefined {
        return this.getEntry(attachmentId)?.imagePreview;
    }

    /**
     * Store the rendered pages of a PDF attachment
     */
    setPageImages(attachmentId: AttachmentId, pageImages: PdfPageImage[]): void {
        const entry = this.getEntry(attachmentId) ?? {};
        entry.pageImages = pageImages;
        this.cache.set(attachmentId, entry);
    }

    /**
     * Get the rendered pages of a PDF attachment
     */
    getPageImages(attachmentId: AttachmentId): PdfPageImage[] | undefined {
        return this.getEntry(attachmentId)?.pageImages;
    }

    /**
     * Check if the attachment has data cached
     */
    hasData(attachmentId: AttachmentId): boolean {
        return !!this.getEntry(attachmentId)?.data;
    }

    /**
     * Check if the attachment has image preview cached
     */
    hasImagePreview(attachmentId: AttachmentId): boolean {
        return !!this.getEntry(attachmentId)?.imagePreview;
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
        this.retained.clear();
    }

    /**
     * Get cache statistics (for debugging)
     */
    getStats(): { size: number; totalBytes: number } {
        const entries = new Map(this.cache);
        for (const [id, retained] of this.retained) {
            if (!entries.has(id)) {
                entries.set(id, retained.entry);
            }
        }
        let totalBytes = 0;
        entries.forEach((entry) => {
            if (entry.data) {
                totalBytes += entry.data.byteLength;
            }
            if (entry.imagePreview) {
                totalBytes += entry.imagePreview.byteLength;
            }
            entry.pageImages?.forEach((p) => {
                totalBytes += p.data.byteLength;
            });
        });
        return {
            size: entries.size,
            totalBytes,
        };
    }
}

// Singleton instance
export const attachmentDataCache = new AttachmentDataCache();

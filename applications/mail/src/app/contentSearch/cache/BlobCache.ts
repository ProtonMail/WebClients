import type { Cached } from '@proton/proton-foundation-search';

export class BlobCache {
    private blobs = new Map<string, Cached>();

    free() {
        for (const blob of this.blobs.values()) {
            blob.free();
        }
    }

    set(id: string, blob: Cached) {
        const existing = this.blobs.get(id);
        existing?.free();
        this.blobs.set(id, blob);
    }

    get(id: string): Cached | undefined {
        return this.blobs.get(id);
    }

    delete(id: string) {
        const existing = this.blobs.get(id);
        if (existing) {
            existing.free();
            this.blobs.delete(id);
        }
    }
}

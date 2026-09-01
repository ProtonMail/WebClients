export type BackgroundField = 'metadata' | 'preview' | 'image';

export interface BackgroundRecord {
    namespace: string;
    id: string;
    revisionUid?: string;
    createdAt: number;
    metadata: Uint8Array<ArrayBuffer>;
    preview?: Uint8Array<ArrayBuffer>;
    image?: Uint8Array<ArrayBuffer>;
}

/** A cache record with its name and preview decrypted, which is all the grid needs. */
export interface CachedBackground {
    id: string;
    revisionUid?: string;
    createdAt: number;
    name: string;
    preview?: Uint8Array<ArrayBuffer>;
}

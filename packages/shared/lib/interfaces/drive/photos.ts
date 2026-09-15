import type { PhotoTag } from './file';
import type { LinkState } from './link';

interface PhotoBasePayload {
    LinkID: string;
    CaptureTime: number;
    Hash: string | null;
    ContentHash: string | null;
}

export interface PhotoPayload extends PhotoBasePayload {
    Tags: PhotoTag[];
    RelatedPhotos: PhotoBasePayload[];
}

export interface DuplicatePhotosHash {
    Hash: string;
    ContentHash: string;
    LinkState: LinkState;
    ClientUID: string;
    LinkID: string;
    RevisionID: number;
}

import { LinkState } from '@proton/shared/lib/interfaces/drive/link';

export interface Photo {
    LinkID: string;
    CaptureTime: number;
    MainPhotoLinkID: string | null;
    Exif: string | null;
    Hash: string | null;
    ContentHash: string | null;
}

export interface DuplicatePhotosHash {
    Hash: string;
    ContentHash: string;
    LinkState: LinkState;
    ClientUID: string;
    LinkID: string;
    RevisionID: number;
}

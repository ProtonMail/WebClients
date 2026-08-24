import type { PhotoTag } from './file';
import type { LinkState } from './link';

export interface PhotoBasePayload {
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

export interface CreateAlbum {
    Locked: boolean;
    Link: {
        Name: string;
        Hash: string;
        ParentLinkID: string;
        NodePassphrase: string;
        NodePassphraseSignature: string;
        SignatureAddress: string;
        NodeKey: string;
        NodeHashKey: string;
        XAttr?: string;
    };
}

export interface PhotoMigrationPayload {
    OldVolumeID: string;
    NewVolumeID: string | null;
}

export interface PhotoDataForAddToAlbumPayload {
    LinkID: string;
    Name: string;
    Hash: string;
    NodePassphrase: string;
    NodePassphraseSignature?: string;
    SignatureEmail?: string;
    NameSignatureEmail?: string;
    ContentHash?: string;
}

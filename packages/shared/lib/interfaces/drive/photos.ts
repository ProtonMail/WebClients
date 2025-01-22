import type { LinkState } from '@proton/shared/lib/interfaces/drive/link';

export interface Photo {
    LinkID: string;
    CaptureTime: number;
    MainPhotoLinkID: string | null;
    Exif: string | null;
    Hash: string | null;
    ContentHash: string | null;
    RelatedPhotosLinkIDs?: string[] | null;
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

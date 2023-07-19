export enum FileRevisionState {
    Draft = 0,
    Active = 1,
    Inactive = 2,
}

export interface CreateDriveFile {
    Name: string;
    Hash: string;
    ParentLinkID: string;
    NodePassphrase: string;
    NodePassphraseSignature: string;
    SignatureAddress: string;
    NodeKey: string;
    MIMEType: string;
    ContentKeyPacket: string;
    ContentKeyPacketSignature: string;
    ClientUID?: string;
}

export interface RevisionManifest {
    PreviousRootHash: string;
    BlockHashes: {
        Hash: string;
        Index: number;
    }[];
}

export interface UpdateFileRevision {
    ManifestSignature: string;
    SignatureAddress: string;
    XAttr?: string;
}

export interface CreateFileResult {
    File: {
        ID: string;
        RevisionID: string;
    };
}

export interface CreateFileRevisionResult {
    Revision: {
        ID: string;
    };
}

export interface UploadLink {
    Token: string;
    BareURL: string;
}

export interface RequestUploadResult {
    UploadLinks: UploadLink[];
    ThumbnailLink?: UploadLink;
}

export interface DriveFileBlock {
    Index: number;
    EncSignature?: string;
    BareURL: string;
    Token: string;
    Hash: string;
}

export interface DriveFileRevision {
    ID: string;
    CreateTime: number;
    Size: number;
    State: number;
    ManifestSignature: string;
    SignatureAddress: string;
    SignatureEmail: string;
    Blocks: DriveFileBlock[];
    ThumbnailHash: string;
    XAttr?: string;
}

export interface DriveFileRestoreRevisionResult {
    Code: 1000 | 1002; // 1000: restore sync, 1002: restore async
}

export interface DriveFileRevisionsResult {
    Revisions: DriveFileRevision[];
}

export interface DriveFileRevisionResult {
    Revision: DriveFileRevision;
}

export interface DriveFileRevisionThumbnailResult {
    ThumbnailBareURL: string;
    ThumbnailToken: string;
}

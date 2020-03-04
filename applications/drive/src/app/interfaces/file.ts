export enum FileRevisionState {
    Draft = 0,
    Active = 1,
    Inactive = 2
}

export interface CreateDriveFile {
    Name: string;
    Hash: string;
    ParentLinkID: string;
    NodePassphrase: string;
    NodePassphraseSignature: string;
    SignatureAddressID: string;
    NodeKey: string;
    MimeType: string;
    ContentKeyPacket: string;
}

export interface RevisionManifest {
    PreviousRootHash: string;
    BlockHashes: {
        Hash: string;
        Index: number;
    }[];
}

export interface UpdateFileRevision {
    State: FileRevisionState;
    BlockList: { Index: number; Token: string }[];
    RootHash: string;
    RootHashSignature: string;
    AuthorAddressID: string;
}

export interface CreateFileResult {
    File: {
        ID: string;
        RevisionID: string;
    };
}

export interface UploadLink {
    Token: string;
    URL: string;
}

export interface RequestUploadResult {
    UploadLinks: UploadLink[];
}

export interface DriveFileBlock {
    Index: number;
    URL: string;
}

export interface DriveFileRevision {
    ID: string;
    Created: number;
    Size: number;
    Hash: string;
    State: number;
    RootHash: string;
    RootHashSignature: string;
    AuthorAddressID: string;
    Blocks: DriveFileBlock[];
}

export interface DriveFileRevisionResult {
    Revision: DriveFileRevision;
}

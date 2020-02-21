export enum FileRevisionState {
    Draft = 0,
    Active = 1,
    Inactive = 2
}

export interface ActiveFileRevision {
    ID: number;
    Created: number;
    Size: number;
    Hash: string;
    RootHash: string;
    RootHashSignature: string;
    AuthorAddressID: string;
    State: FileRevisionState;
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

export interface DriveFile {
    ID: string;
    ParentLinkID: string;
    Attributes: number;
    Permissions: number;
    MimeType: string;
    Key: string;
    Passphrase: string;
    PassphraseSignature: string;
    SignatureAddressID: string;
    HashKey: string;
    ContentKeyPacket: string;
    Name: string;
    ActiveRevision: ActiveFileRevision;
}

export interface DriveFileResult {
    File: DriveFile;
}

export interface FileUploadInfo {
    LinkID: string;
    ShareID: string;
    RevisionID: string;
}

export interface CreateFileResult {
    File: {
        ID: string;
        RevisionID: string;
    };
}

export interface RequestUploadResult {
    UploadLinks: {
        Token: string;
        URL: string;
    }[];
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

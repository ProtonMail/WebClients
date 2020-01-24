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
    State: FileRevisionState;
}

export interface CreateDriveFile {
    Name: string;
    Hash: string;
    ParentLinkID: string;
    NodePassphrase: string;
    NodeKey: string;
    MimeType: string;
    ContentKeyPacket: string;
}

export interface UpdateFileRevision {
    State: FileRevisionState;
    BlockList: { Index: number; Token: string }[];
}

export interface DriveBlock {
    BlockHash: string;
    HashType: string;
}

export interface DriveFile {
    ID: string;
    ParentLinkID: string;
    Attributes: number;
    Permissions: number;
    MimeType: string;
    Key: string;
    Passphrase: string;
    HashKey: string;
    ContentKeyPacket: string;
    Name: string;
    ActiveRevision: ActiveFileRevision;
}

export interface DriveFileResult {
    File: DriveFile;
}

export interface FileUploadInfo {
    ID: string;
    RevisionID: string;
}

export interface CreateFileResult {
    File: FileUploadInfo;
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
    Blocks: DriveFileBlock[];
}

export interface DriveFileRevisionResult {
    Revision: DriveFileRevision;
}

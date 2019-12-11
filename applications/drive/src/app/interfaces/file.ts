export interface ActiveFileRevision {
    ID: number;
    Created: number;
    Size: number;
    Hash: string;
    State: number;
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
    ActiveRevision: ActiveFileRevision;
}

export interface DriveFileResult {
    File: DriveFile;
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

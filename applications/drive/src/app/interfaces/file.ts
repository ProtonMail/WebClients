import { ReadableStream } from 'web-streams-polyfill';

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
    SignatureAddress: string;
    NodeKey: string;
    MIMEType: string;
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
    SignatureAddress: string;
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
    CreateTime: number;
    Size: number;
    Hash: string;
    State: number;
    RootHash: string;
    RootHashSignature: string;
    SignatureAddress: string;
    Blocks: DriveFileBlock[];
}

export interface DriveFileRevisionResult {
    Revision: DriveFileRevision;
}

export interface NestedFileStream {
    stream: ReadableStream<Uint8Array>;
    path: string;
}

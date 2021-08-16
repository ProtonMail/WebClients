import { OpenPGPKey, SessionKey } from 'pmcrypto';

export interface UploadControls {
    start: () => Promise<void>;
    pause: () => void;
    resume: () => void;
    cancel: () => void;
}

export interface UploadCallbacks {
    initialize: (
        abortSignal: AbortSignal,
        mimeType: string,
        conflictStrategy?: TransferConflictStrategy
    ) => Promise<InitializedFileMeta>;
    createBlockLinks: (
        fileBlocks: FileRequestBlock[],
        thumbnailBlock?: ThumbnailRequestBlock
    ) => Promise<{ fileLinks: Link[]; thumbnailLink?: Link }>;
    onProgress?: (bytes: number) => void;
    finalize: (blockTokens: BlockToken[], signature: string, signatureAddress: string) => Promise<void>;
    onError?: (error: Error) => void;
}

export enum TransferConflictStrategy {
    Rename = 'rename',
    Replace = 'replace',
    Merge = 'merge',
    Skip = 'skip',
}

export type InitializedFileMeta = {
    fileName: string,
    privateKey: OpenPGPKey;
    sessionKey: SessionKey;
    address: {
        privateKey: OpenPGPKey;
        email: string;
    };
}

export type EncryptedBlock = {
    index: number;
    originalSize: number;
    encryptedData: Uint8Array;
    hash: Uint8Array;
    signature: string;
}

export type EncryptedThumbnailBlock = {
    index: number;
    originalSize: number;
    encryptedData: Uint8Array;
    hash: Uint8Array;
}

export type FileRequestBlock = {
    index: number,
    signature: string,
    size: number,
    hash: Uint8Array,
}

export type ThumbnailRequestBlock = {
    size: number,
    hash: Uint8Array,
}

export type Link = {
    index: number,
    token: string,
    url: string,
}

export type BlockTokenHash = {
    index: number;
    token: string;
    hash: Uint8Array;
}

export type BlockToken = {
    index: number;
    token: string;
}

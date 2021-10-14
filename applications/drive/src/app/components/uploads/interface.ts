import { OpenPGPKey, SessionKey } from 'pmcrypto';

export interface UploadFileControls {
    start: (progressCallbacks?: UploadFileProgressCallbacks) => Promise<void>;
    pause: () => void;
    resume: () => void;
    cancel: () => void;
}

export interface UploadFileProgressCallbacks {
    onInit?: (mimeType: string, fileName: string) => void;
    onProgress?: (bytes: number) => void;
    onFinalize?: () => void;
}

export interface UploadFolderControls {
    start: () => Promise<{ folderId: string }>;
    cancel: () => void;
}

export interface UploadCallbacks {
    initialize: (
        abortSignal: AbortSignal,
        mimeType: string,
        conflictStrategy?: TransferConflictStrategy
    ) => Promise<InitializedFileMeta>;
    createBlockLinks: (
        abortSignal: AbortSignal,
        fileBlocks: FileRequestBlock[],
        thumbnailBlock?: ThumbnailRequestBlock
    ) => Promise<{ fileLinks: Link[]; thumbnailLink?: Link }>;
    finalize: (blockTokens: BlockToken[], signature: string, signatureAddress: string) => Promise<void>;
    onError?: (error: Error) => void;
}

export type UploadFileList = (UploadFileItem | UploadFolderItem)[];
export type UploadFileItem = { path: string[]; file: File };
export type UploadFolderItem = { path: string[]; folder: string; modificationTime?: Date };

export type InitializedFileMeta = {
    fileName: string;
    privateKey: OpenPGPKey;
    sessionKey: SessionKey;
    address: {
        privateKey: OpenPGPKey;
        email: string;
    };
};

export type EncryptedBlock = {
    index: number;
    originalSize: number;
    encryptedData: Uint8Array;
    hash: Uint8Array;
    signature: string;
};

export type EncryptedThumbnailBlock = {
    index: number;
    originalSize: number;
    encryptedData: Uint8Array;
    hash: Uint8Array;
};

export type FileRequestBlock = {
    index: number;
    signature: string;
    size: number;
    hash: Uint8Array;
};

export type ThumbnailRequestBlock = {
    size: number;
    hash: Uint8Array;
};

export type Link = {
    index: number;
    token: string;
    url: string;
};

export type BlockTokenHash = {
    index: number;
    token: string;
    hash: Uint8Array;
};

export type BlockToken = {
    index: number;
    token: string;
};

export enum TransferConflictStrategy {
    Rename = 'rename',
    Replace = 'replace',
    Merge = 'merge',
    Skip = 'skip',
}

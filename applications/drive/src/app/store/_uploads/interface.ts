import type { PrivateKeyReference, SessionKey } from '@proton/crypto';

import type { ThumbnailType } from './media';

export interface UploadFileControls {
    start: (progressCallbacks?: UploadFileProgressCallbacks) => Promise<void>;
    pause: () => void;
    resume: () => void;
    cancel: () => void;
}

export interface UploadFileProgressCallbacks {
    onInit?: (mimeType: string, fileName: string) => void;
    onProgress?: (bytes: number) => void;
    onNetworkError?: (error: any) => void;
    onFinalize?: () => void;
}

export interface UploadFolderControls {
    start: () => Promise<{ folderId: string; folderName: string }>;
    cancel: () => void;
}

export interface UploadCallbacks {
    initialize: (abortSignal: AbortSignal) => Promise<{
        addressPrivateKey: PrivateKeyReference | undefined;
        parentPrivateKey: PrivateKeyReference;
    }>;
    getVerificationData: (abortSignal: AbortSignal) => Promise<VerificationData>;
    createFileRevision: (abortSignal: AbortSignal, mimeType: string, keys: FileKeys) => Promise<InitializedFileMeta>;
    createBlockLinks: (
        abortSignal: AbortSignal,
        fileBlocks: FileRequestBlock[],
        thumbnailBlocks?: ThumbnailRequestBlock[]
    ) => Promise<{ fileLinks: Link[]; thumbnailLinks?: Link[] }>;
    finalize: (signature: string, signatureEmail: string, xattr: string, photo?: PhotoUpload) => Promise<void>;
    onError?: (error: Error) => void;
    notifyVerificationError: (retryHelped: boolean) => void;
}

export type UploadFileList = (UploadFileItem | UploadFolderItem)[];
export type UploadFileItem = { path: string[]; file: File };
export type UploadFolderItem = { path: string[]; folder: string; modificationTime?: Date };

export type FileKeys = {
    nodeKey: string;
    nodePassphrase: string;
    nodePassphraseSignature: string;
    contentKeyPacket: string;
    contentKeyPacketSignature: string;
    privateKey: PrivateKeyReference;
    sessionKey: SessionKey;
};

type InitializedFileMeta = {
    fileName: string;
    privateKey: PrivateKeyReference;
    sessionKey: SessionKey;
    parentHashKey: Uint8Array;
    address?: {
        privateKey: PrivateKeyReference;
        email: string;
    };
};

export type EncryptedBlock = {
    index: number;
    originalSize: number;
    encryptedData: Uint8Array;
    hash: Uint8Array;
    signature: string;
    verificationToken: Uint8Array;

    // Thumbnails specific properties
    thumbnailType?: never;
};

export type ThumbnailEncryptedBlock = {
    index: number;
    originalSize: number;
    encryptedData: Uint8Array;
    hash: Uint8Array;

    // Thumbnails specific properties
    thumbnailType: ThumbnailType;
};

export type FileRequestBlock = {
    index: number;
    size: number;
    hash: Uint8Array;
    signature: string;
    verificationToken: Uint8Array;
};

export type ThumbnailRequestBlock = {
    index: number;
    size: number;
    hash: Uint8Array;
    type: ThumbnailType;
};

export type VerificationData = {
    verificationCode: Uint8Array;
    verifierSessionKey: SessionKey;
};

export type Link = {
    index: number;
    token: string;
    url: string;
};

export type PhotoUpload = {
    encryptedExif?: string;
    captureTime: number;
    contentHash?: string;
};

export enum TransferConflictStrategy {
    Rename = 'rename',
    Replace = 'replace',
    Skip = 'skip',
}

// key = linkId, value = AuthorizationToken
export type AnonymousUploadsToken = Map<string, string>;

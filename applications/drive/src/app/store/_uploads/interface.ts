import type { PrivateKeyReference, SessionKey } from '@proton/crypto';
import type { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';

import type { ThumbnailType } from './media';

export type OnFileUploadSuccessCallbackData = {
    shareId: string;
    fileId: string;
    fileName: string;
    photo?: PhotoUpload;
} | void;
export type OnFileSkippedSuccessCallbackData = { shareId: string; fileId: string; fileName: string };
export type OnFolderUploadSuccessCallbackData = { folderId: string; folderName: string };
export interface UploadFileControls {
    start: (progressCallbacks?: UploadFileProgressCallbacks) => Promise<OnFileUploadSuccessCallbackData>;
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
    start: () => Promise<OnFolderUploadSuccessCallbackData>;
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
    finalize: (
        signature: string,
        signatureEmail: string,
        xattr: string,
        photo?: PhotoUpload
    ) => Promise<OnFileUploadSuccessCallbackData>;
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
    parentHashKey: Uint8Array<ArrayBuffer>;
    address?: {
        privateKey: PrivateKeyReference;
        email: string;
    };
};

export type EncryptedBlock = {
    index: number;
    originalSize: number;
    encryptedData: Uint8Array<ArrayBuffer>;
    hash: Uint8Array<ArrayBuffer>;
    signature: string;
    verificationToken: Uint8Array<ArrayBuffer>;

    // Thumbnails specific properties
    thumbnailType?: never;
};

export type ThumbnailEncryptedBlock = {
    index: number;
    originalSize: number;
    encryptedData: Uint8Array<ArrayBuffer>;
    hash: Uint8Array<ArrayBuffer>;

    // Thumbnails specific properties
    thumbnailType: ThumbnailType;
};

export type FileRequestBlock = {
    index: number;
    size: number;
    hash: Uint8Array<ArrayBuffer>;
    signature: string;
    verificationToken: Uint8Array<ArrayBuffer>;
};

export type ThumbnailRequestBlock = {
    index: number;
    size: number;
    hash: Uint8Array<ArrayBuffer>;
    type: ThumbnailType;
};

export type VerificationData = {
    verificationCode: Uint8Array<ArrayBuffer>;
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
    tags?: PhotoTag[];
};

export enum TransferConflictStrategy {
    Rename = 'rename',
    Replace = 'replace',
    Skip = 'skip',
}

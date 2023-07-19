import React from 'react';

import { PrivateKeyReference, SessionKey } from '@proton/crypto';

export type UploadConflictModal = React.FunctionComponent<UploadConflictModalProps>;

export interface UploadConflictModalProps {
    name: string;
    isFolder?: boolean;
    originalIsDraft?: boolean;
    originalIsFolder?: boolean;
    apply: (strategy: TransferConflictStrategy, all: boolean) => void;
    cancelAll: () => void;
}

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
        addressPrivateKey: PrivateKeyReference;
        parentPrivateKey: PrivateKeyReference;
    }>;
    createFileRevision: (abortSignal: AbortSignal, mimeType: string, keys: FileKeys) => Promise<InitializedFileMeta>;
    createBlockLinks: (
        abortSignal: AbortSignal,
        fileBlocks: FileRequestBlock[],
        thumbnailBlock?: ThumbnailRequestBlock
    ) => Promise<{ fileLinks: Link[]; thumbnailLink?: Link }>;
    finalize: (signature: string, signatureAddress: string, xattr: string) => Promise<void>;
    onError?: (error: Error) => void;
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

export type InitializedFileMeta = {
    fileName: string;
    privateKey: PrivateKeyReference;
    sessionKey: SessionKey;
    address: {
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
    Skip = 'skip',
}

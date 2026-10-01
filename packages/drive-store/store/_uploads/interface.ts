import type { SessionKey } from '@protontech/crypto';

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
export type UploadFileList = (UploadFileItem | UploadFolderItem)[];
export type UploadFileItem = { path: string[]; file: File };
export type UploadFolderItem = { path: string[]; folder: string; modificationTime?: Date };

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

export type VerificationData = {
    verificationCode: Uint8Array<ArrayBuffer>;
    verifierSessionKey: SessionKey;
};

export type Link = {
    index: number;
    token: string;
    url: string;
};

type PhotoUpload = {
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

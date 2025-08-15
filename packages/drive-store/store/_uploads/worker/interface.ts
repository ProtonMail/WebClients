import type { EncryptedBlock, ThumbnailEncryptedBlock } from '../interface';

export type BlockHash = {
    index: number;
    hash: Uint8Array<ArrayBuffer>;
};

export type UploadingBlock = {
    block: EncryptedBlock | ThumbnailEncryptedBlock;
    uploadLink: string;
    uploadToken: string;
    isTokenExpired: () => boolean;
    isThumbnail?: boolean;
};

export type UploadingBlockControl = {
    index: number;
    encryptedData: Uint8Array<ArrayBuffer>;
    originalSize: number;
    uploadLink: string;
    uploadToken: string;
    isTokenExpired: () => boolean;
    finish: () => void;
    onTokenExpiration: () => void;
};

export type Verifier = (encryptedBlock: Uint8Array<ArrayBuffer>) => Promise<Uint8Array<ArrayBuffer>>;

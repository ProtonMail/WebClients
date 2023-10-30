import { EncryptedBlock, ThumbnailEncryptedBlock } from '../interface';

export type BlockHash = {
    index: number;
    hash: Uint8Array;
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
    encryptedData: Uint8Array;
    originalSize: number;
    uploadLink: string;
    uploadToken: string;
    isTokenExpired: () => boolean;
    finish: () => void;
    onTokenExpiration: () => void;
};

export type Verifier = (encryptedBlock: Uint8Array) => Promise<Uint8Array>;

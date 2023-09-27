import { EncryptedBlock, EncryptedThumbnailBlock } from '../interface';

export type BlockHash = {
    index: number;
    hash: Uint8Array;
};

export type UploadingBlock = {
    block: EncryptedBlock | EncryptedThumbnailBlock;
    uploadLink: string;
    uploadToken: string;
    isTokenExpired: () => boolean;
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

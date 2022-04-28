export interface UploadingBlock {
    index: number;
    encryptedData: Uint8Array;
    uploadLink: string;
    uploadToken: string;
    originalSize: number;
}

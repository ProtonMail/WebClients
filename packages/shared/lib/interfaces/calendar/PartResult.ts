export interface EncryptPartResult {
    dataPacket: Uint8Array<ArrayBuffer>;
    signature: string;
}

export interface SignPartResult {
    data: string;
    signature: string;
}

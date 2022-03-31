export interface EncryptPartResult {
    dataPacket: Uint8Array;
    signature: string;
}

export interface SignPartResult {
    data: string;
    signature: string;
}

import { OpenPGPSignature } from 'pmcrypto';

export interface EncryptPartResult {
    dataPacket: Uint8Array;
    signature: OpenPGPSignature;
}

export interface SignPartResult {
    data: string;
    signature: OpenPGPSignature;
}

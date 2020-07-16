import { OpenPGPKey } from 'pmcrypto';

export interface Key {
    ID: string;
    Primary: number;
    Flags: number;
    Fingerprint: string;
    Fingerprints: string[];
    PublicKey: string; // armored key
    Version: number;
    Activation?: string;
    PrivateKey: string; // armored key
    Token?: string;
    Signature: string;
}

export interface KeyPair {
    privateKey: OpenPGPKey;
    publicKey: OpenPGPKey;
}

export interface KeysPair {
    privateKeys: OpenPGPKey[];
    publicKeys: OpenPGPKey[];
}

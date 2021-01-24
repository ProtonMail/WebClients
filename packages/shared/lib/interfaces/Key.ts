import { OpenPGPKey } from 'pmcrypto';

export interface Key {
    ID: string;
    Primary: 1 | 0;
    Flags?: number; // undefined for user keys
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

export interface DecryptedKey extends KeyPair {
    ID: string;
}

export interface InactiveKey {
    Key: Key;
    privateKey?: OpenPGPKey;
    publicKey?: OpenPGPKey;
    fingerprint?: string;
}

export interface ActiveKey extends DecryptedKey {
    fingerprint: string;
    flags: number;
    primary: 1 | 0;
    sha256Fingerprints: string[];
}

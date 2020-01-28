import { PmcryptoKey } from 'pmcrypto';

export interface KeyData {
    Code: number;
    RecipientType: number;
    MIMEType: string;
    Keys: Key[];
    SignedKeyList: any[];
    Warnings: any[];
}

export interface Key {
    ID: string;
    Primary: number;
    Flags: number;
    Fingerprint: string;
    Fingerprints: string[];
    PublicKey: string;
    Version: number;
    Activation: any;
    PrivateKey: string;
    Token: any;
    Signature: any;
}

export interface AddressKeys {
    Key: Key;
    privateKey: PmcryptoKey;
    publicKey: PmcryptoKey;
}

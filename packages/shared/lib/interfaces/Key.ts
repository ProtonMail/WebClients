import { PrivateKeyReference, PublicKeyReference } from '@proton/crypto';

import { RequireSome } from './utils';

export interface KeyWithRecoverySecret extends Key {
    RecoverySecret: string;
    RecoverySecretSignature: string;
}

export interface Key {
    ID: string;
    Primary: 1 | 0;
    Active: 1 | 0;
    Flags?: number; // Only available for address keys
    Fingerprint: string;
    Fingerprints: string[];
    PublicKey: string; // armored key
    Version: number;
    Activation?: string;
    PrivateKey: string; // armored key
    Token?: string;
    Signature?: string; // Only available for address keys
    RecoverySecret?: string | null; // Only available for user keys
    RecoverySecretSignature?: string | null; // Only available for user keys
    AddressForwardingID?: string | null; // Only available for address keys
}

export type AddressKey = RequireSome<Key, 'Flags' | 'Signature' | 'AddressForwardingID'>;
export type UserKey = RequireSome<Key, 'RecoverySecret' | 'RecoverySecretSignature'>;

export interface KeyPair {
    privateKey: PrivateKeyReference;
    publicKey: PublicKeyReference;
}

export interface KeysPair {
    privateKeys: PrivateKeyReference[];
    publicKeys: PublicKeyReference[];
}

export interface DecryptedKey extends KeyPair {
    ID: string;
}

export interface DecryptedAddressKey extends KeyPair {
    ID: string;
    Flags: number;
    Primary: 1 | 0;
}

export interface InactiveKey {
    Key: Key;
    publicKey?: PublicKeyReference;
    fingerprint?: string;
}

export interface ActiveKey extends DecryptedKey {
    fingerprint: string;
    flags: number;
    primary: 1 | 0;
    sha256Fingerprints: string[];
}

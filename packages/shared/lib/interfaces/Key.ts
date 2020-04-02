import { OpenPGPKey } from 'pmcrypto';
import { DRAFT_MIME_TYPES, PGP_SCHEMES, RECIPIENT_TYPES } from '../constants';
import { Address } from './Address';
import { MailSettings } from './MailSettings';

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

export interface KeyPairs {
    privateKeys: OpenPGPKey[];
    publicKeys: OpenPGPKey[];
}

export type MimeTypeVcard = DRAFT_MIME_TYPES.PLAINTEXT;

export interface PublicKeyData {
    Code?: number;
    RecipientType?: RECIPIENT_TYPES;
    MIMEType?: MimeTypeVcard;
    Keys: Key[];
    SignedKeyList?: any[];
    Warnings?: string[];
}

export interface PublicKeyWithPref {
    publicKey: OpenPGPKey;
    pref?: number;
}

export interface SelfSend {
    address: Address;
    publicKey?: OpenPGPKey;
}

export interface ApiKeysConfig extends PublicKeyData {
    publicKeys: (OpenPGPKey | undefined)[];
}

export interface PinnedKeysConfig {
    pinnedKeys: OpenPGPKey[];
    encrypt?: boolean;
    sign?: boolean;
    scheme?: PGP_SCHEMES;
    mimeType?: MimeTypeVcard;
    error?: Error;
}

export interface PublicKeyConfigs {
    emailAddress: string;
    apiKeysConfig: ApiKeysConfig;
    pinnedKeysConfig: PinnedKeysConfig;
    mailSettings: MailSettings;
}

export interface PublicKeyModel {
    emailAddress: string;
    publicKeys: { api: OpenPGPKey[]; pinned: OpenPGPKey[] };
    encrypt: boolean;
    sign: boolean;
    mimeType: DRAFT_MIME_TYPES;
    scheme: PGP_SCHEMES;
    trustedFingerprints: Set<string>;
    expiredFingerprints: Set<string>;
    revokedFingerprints: Set<string>;
    verifyOnlyFingerprints: Set<string>;
    isPGPExternal: boolean;
    isPGPInternal: boolean;
    isPGPExternalWithWKDKeys: boolean;
    isPGPExternalWithoutWKDKeys: boolean;
    pgpAddressDisabled: boolean;
}

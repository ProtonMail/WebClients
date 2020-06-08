import { OpenPGPKey } from 'pmcrypto';
import {
    CONTACT_MIME_TYPES,
    CONTACT_PGP_SCHEMES,
    DRAFT_MIME_TYPES,
    MIME_TYPES,
    PGP_SCHEMES,
    RECIPIENT_TYPES
} from '../constants';
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

export interface PublicKeyWithPref {
    publicKey: OpenPGPKey;
    pref?: number;
}

export interface SelfSend {
    address: Address;
    publicKey?: OpenPGPKey;
}

export type MimeTypeVcard = DRAFT_MIME_TYPES.PLAINTEXT;

export interface ApiKeysConfig {
    Keys: Key[];
    publicKeys: (OpenPGPKey | undefined)[];
    Code?: number;
    RecipientType?: RECIPIENT_TYPES;
    MIMEType?: MIME_TYPES;
    SignedKeyList?: any[];
    Warnings?: string[];
}

export interface PinnedKeysConfig {
    pinnedKeys: OpenPGPKey[];
    encrypt?: boolean;
    sign?: boolean;
    scheme?: PGP_SCHEMES;
    mimeType?: MimeTypeVcard;
    error?: Error;
    isContactSignatureVerified: boolean;
}

export interface PublicKeyConfigs {
    emailAddress: string;
    apiKeysConfig: ApiKeysConfig;
    pinnedKeysConfig: PinnedKeysConfig;
    mailSettings: MailSettings;
}

export interface ContactPublicKeyModel {
    emailAddress: string;
    publicKeys: { apiKeys: OpenPGPKey[]; pinnedKeys: OpenPGPKey[] };
    encrypt?: boolean;
    sign?: boolean;
    mimeType: CONTACT_MIME_TYPES;
    scheme: CONTACT_PGP_SCHEMES;
    trustedFingerprints: Set<string>;
    expiredFingerprints: Set<string>;
    revokedFingerprints: Set<string>;
    verifyOnlyFingerprints: Set<string>;
    isPGPExternal: boolean;
    isPGPInternal: boolean;
    isPGPExternalWithWKDKeys: boolean;
    isPGPExternalWithoutWKDKeys: boolean;
    pgpAddressDisabled: boolean;
    isContactSignatureVerified: boolean;
    emailAddressWarnings?: string[];
}

export interface PublicKeyModel {
    emailAddress: string;
    publicKeys: { apiKeys: OpenPGPKey[]; pinnedKeys: OpenPGPKey[] };
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
    isContactSignatureVerified: boolean;
    emailAddressWarnings?: string[];
}

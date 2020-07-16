import { OpenPGPKey } from 'pmcrypto';
import { Address } from './Address';
import {
    CONTACT_MIME_TYPES,
    CONTACT_PGP_SCHEMES,
    DRAFT_MIME_TYPES,
    MIME_TYPES,
    PGP_SCHEMES,
    RECIPIENT_TYPES,
} from '../constants';
import { MailSettings } from './MailSettings';
import { Key } from './Key';

export interface PublicKeyWithPref {
    publicKey: OpenPGPKey;
    pref?: number;
}

export interface SelfSend {
    address: Address;
    publicKey?: OpenPGPKey;
}

export type MimeTypeVcard = MIME_TYPES.PLAINTEXT;

export interface ApiKeysConfig {
    Keys: Key[];
    publicKeys: (OpenPGPKey | undefined)[];
    Code?: number;
    RecipientType?: RECIPIENT_TYPES;
    MIMEType?: MIME_TYPES;
    SignedKeyList?: any[];
    Errors?: string[];
}

export interface PinnedKeysConfig {
    pinnedKeys: OpenPGPKey[];
    encrypt?: boolean;
    sign?: boolean;
    scheme?: PGP_SCHEMES;
    mimeType?: MimeTypeVcard;
    error?: Error;
    isContact: boolean;
    isContactSignatureVerified?: boolean;
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
    isContact: boolean;
    isContactSignatureVerified?: boolean;
    emailAddressWarnings?: string[];
    emailAddressErrors?: string[];
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
    isContact: boolean;
    isContactSignatureVerified?: boolean;
    emailAddressWarnings?: string[];
    emailAddressErrors?: string[];
}

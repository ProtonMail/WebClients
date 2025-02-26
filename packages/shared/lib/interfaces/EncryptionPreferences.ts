import type { PublicKeyReference } from '@proton/crypto';

import type {
    API_KEY_SOURCE,
    CONTACT_MIME_TYPES,
    CONTACT_PGP_SCHEMES,
    KEY_FLAG,
    MIME_TYPES,
    PGP_SCHEMES,
    RECIPIENT_TYPES,
} from '../constants';
import type { Address } from './Address';
import type { KeyTransparencyVerificationResult } from './KeyTransparency';
import type { MailSettings } from './MailSettings';
import type { FetchedSignedKeyList } from './SignedKeyList';

export interface ApiAddressKey {
    PublicKey: string;
    Flags: number;
    Source: API_KEY_SOURCE;
    Primary: 1 | 0;
}

export interface GetAllPublicKeysResponse {
    Address: {
        Keys: ApiAddressKey[];
        SignedKeyList: FetchedSignedKeyList | null;
    };
    CatchAll:
        | {
              Keys: ApiAddressKey[];
              SignedKeyList: FetchedSignedKeyList | null;
          }
        | undefined;
    Unverified: {
        Keys: ApiAddressKey[];
    };
    ProtonMX: boolean;
    Warnings: string[];
}

export interface PublicKeyWithPref {
    publicKey: PublicKeyReference;
    pref?: number;
}

export interface SelfSend {
    address: Address;
    publicKey?: PublicKeyReference;
    canSend?: boolean;
}

export type MimeTypeVcard = MIME_TYPES.PLAINTEXT;

export interface ProcessedApiKey {
    armoredKey: string;
    flags: KEY_FLAG;
    publicKey: PublicKeyReference;
    source: API_KEY_SOURCE;
    primary: 0 | 1;
}

export interface ApiKeysConfig {
    publicKeys: ProcessedApiKey[];
    Code?: number;
    RecipientType?: RECIPIENT_TYPES;
    isCatchAll?: boolean;
    /**
     * Internal addresses with e2ee disabled are marked as having EXTERNAL recipient type.
     * This flag allows distinguishing them from actual external users, for which E2EE should
     * never be disabled, even for mail (since e.g. they might have WKD set up, or uploaded keys associated with them).
     */
    isInternalWithDisabledE2EEForMail?: boolean;
    MIMEType?: MIME_TYPES;
    Warnings?: string[];
    Errors?: string[];
    ktVerificationResult?: KeyTransparencyVerificationResult;
}

export interface PinnedKeysConfig {
    pinnedKeys: PublicKeyReference[];
    encryptToPinned?: boolean;
    encryptToUntrusted?: boolean;
    sign?: boolean;
    scheme?: PGP_SCHEMES;
    mimeType?: MimeTypeVcard;
    error?: Error;
    isContact: boolean;
    isContactSignatureVerified?: boolean;
    contactSignatureTimestamp?: Date;
}

export interface PublicKeyConfigs {
    emailAddress: string;
    apiKeysConfig: ApiKeysConfig;
    pinnedKeysConfig: PinnedKeysConfig;
    mailSettings: MailSettings;
    /** whether to pick v6/PQC keys over v4 ones if available, for security; doing so may come with a performance hit. */
    preferV6Keys: boolean;
}

export interface ContactPublicKeyModel {
    emailAddress: string;
    publicKeys: {
        apiKeys: PublicKeyReference[];
        pinnedKeys: PublicKeyReference[];
        verifyingPinnedKeys: PublicKeyReference[]; // Subset of pinned keys not marked as compromised
    };
    encrypt?: boolean;
    sign?: boolean;
    mimeType: CONTACT_MIME_TYPES;
    scheme: CONTACT_PGP_SCHEMES;
    isInternalWithDisabledE2EEForMail: boolean; // Both `encrypt` and `isInternalWithDisabledE2EEForMail` might be true at this stage
    trustedFingerprints: Set<string>;
    obsoleteFingerprints: Set<string>; // Keys that are not allowed to encrypt, because they are marked as obsolete.
    encryptionCapableFingerprints: Set<string>; // Keys that are capable of encryption (regardless of whether they are allowed to encrypt).
    compromisedFingerprints: Set<string>; // Keys that are not allowed to encrypt nor sign, because they are marked as compromised
    primaryKeyFingerprints: Set<string>; // either one or two keys (one v4 and maybe one v6)
    isPGPExternal: boolean;
    isPGPInternal: boolean;
    isPGPExternalWithExternallyFetchedKeys: boolean; // Keys from e.g. WKD or keys.openpgp.org (KOO)
    isPGPExternalWithoutExternallyFetchedKeys: boolean;
    pgpAddressDisabled: boolean;
    isContact: boolean;
    isContactSignatureVerified?: boolean;
    contactSignatureTimestamp?: Date;
    emailAddressWarnings?: string[];
    emailAddressErrors?: string[];
    ktVerificationResult?: KeyTransparencyVerificationResult;
}

export interface ContactPublicKeyModelWithApiKeySource extends ContactPublicKeyModel {
    apiKeysSourceMap: Partial<{ [source in API_KEY_SOURCE]: Set<string> }>; // map source to fingerprints
}

export interface PublicKeyModel {
    emailAddress: string;
    publicKeys: {
        apiKeys: PublicKeyReference[];
        pinnedKeys: PublicKeyReference[];
        verifyingPinnedKeys: PublicKeyReference[];
    };
    encrypt: boolean;
    sign: boolean;
    mimeType: CONTACT_MIME_TYPES;
    scheme: PGP_SCHEMES;
    isInternalWithDisabledE2EEForMail: boolean; // Both `encrypt` and `isInternalWithDisabledE2EEForMail` might be true at this stage
    trustedFingerprints: Set<string>;
    obsoleteFingerprints: Set<string>;
    encryptionCapableFingerprints: Set<string>;
    compromisedFingerprints: Set<string>;
    isPGPExternal: boolean;
    isPGPInternal: boolean;
    isPGPExternalWithExternallyFetchedKeys: boolean; // Keys from e.g. WKD or keys.openpgp.org (KOO)
    isPGPExternalWithoutExternallyFetchedKeys: boolean;
    pgpAddressDisabled: boolean;
    isContact: boolean;
    isContactSignatureVerified?: boolean;
    contactSignatureTimestamp?: Date;
    emailAddressWarnings?: string[];
    emailAddressErrors?: string[];
    ktVerificationResult?: KeyTransparencyVerificationResult;
}

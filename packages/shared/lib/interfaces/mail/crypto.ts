import type { PublicKeyReference } from '@proton/crypto';
import type { PACKAGE_TYPE } from '@proton/shared/lib/mail/mailSettings';

import type { MIME_TYPES } from '../../constants';
import type { EncryptionPreferencesError } from '../../mail/encryptionPreferences';
import type { KeyTransparencyVerificationResult } from '../KeyTransparency';
import type { SimpleMap } from '../utils';

export interface SendPreferences {
    encrypt: boolean;
    sign: boolean;
    pgpScheme: PACKAGE_TYPE;
    mimeType: MIME_TYPES;
    publicKeys?: PublicKeyReference[];
    isPublicKeyPinned?: boolean;
    hasApiKeys: boolean;
    hasPinnedKeys: boolean;
    encryptionDisabled: boolean; // if `encryptionDisabled` is true, `encrypt` will always be false
    warnings?: string[];
    error?: EncryptionPreferencesError;
    ktVerificationResult?: KeyTransparencyVerificationResult;
}

export interface Packets {
    Filename: string;
    MIMEType: MIME_TYPES;
    FileSize: number;
    Inline: boolean;
    signature?: Uint8Array;
    Preview: Uint8Array | string;
    keys: Uint8Array;
    data: Uint8Array;
}

export interface Package {
    Flags?: number;
    Addresses?: { [email: string]: Package };
    MIMEType?: MIME_TYPES;
    Body?: string | Uint8Array;
    BodyKey?: any;
    BodyKeyPacket?: string;
    Type?: PACKAGE_TYPE | 0;
    PublicKey?: PublicKeyReference;
    AttachmentKeys?: { [AttachmentID: string]: { Key: string; Algorithm: string } };
    AttachmentKeyPackets?: { [AttachmentID: string]: string };
}

export interface PackageDirect {
    Addresses?: SimpleMap<PackageDirect>;
    MIMEType?: MIME_TYPES;
    Body?: string;
    BodyKey?: any;
    BodyKeyPacket?: string;
    Type?: PACKAGE_TYPE | 0;
    PublicKey?: PublicKeyReference;
    Token?: string;
    EncToken?: string;
    Auth?: {
        Version: number;
        ModulusID: string;
        Salt: string;
        Verifier: string;
    };
    PasswordHint?: string;
    Signature?: number;
    AttachmentKeys?: { Key: string; Algorithm: string }[];
    AttachmentKeyPackets?: string[];
}

export interface AttachmentDirect {
    Filename: string;
    MIMEType: MIME_TYPES;
    ContentID?: string;
    Contents: string;
    Headers?: any;
}

export type PackageStatus = {
    [key in MIME_TYPES]?: boolean;
};

export type Packages = {
    [key in MIME_TYPES]?: Package;
};

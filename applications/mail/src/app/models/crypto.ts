import { OpenPGPKey } from 'pmcrypto';
import { MIME_TYPES, PACKAGE_TYPE } from 'proton-shared/lib/constants';
import { EncryptionPreferencesFailure } from 'proton-shared/lib/mail/encryptionPreferences';

export interface SendPreferences {
    encrypt: boolean;
    sign: boolean;
    pgpScheme: PACKAGE_TYPE;
    mimetype: MIME_TYPES;
    publicKeys?: OpenPGPKey[];
    isPublicKeyPinned?: boolean;
    hasApiKeys: boolean;
    hasPinnedKeys: boolean;
    warnings?: any[];
    failure?: EncryptionPreferencesFailure;
}

export interface MapSendPreferences {
    [email: string]: SendPreferences;
}

export enum StatusIconFills {
    PLAIN = 0,
    CHECKMARK = 1,
    SIGN = 2,
    WARNING = 3,
    FAIL = 4
}

export interface StatusIcon {
    colorClassName: string;
    isEncrypted: boolean;
    fill: StatusIconFills;
    text: string;
}

export interface MapStatusIcon {
    [key: string]: StatusIcon | undefined;
}

export interface SendInfo {
    sendPreferences: SendPreferences;
    sendIcon?: StatusIcon;
}

export interface MapSendInfo {
    [key: string]: SendInfo;
}

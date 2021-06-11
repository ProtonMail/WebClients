import { SendPreferences } from 'proton-shared/lib/interfaces/mail/crypto';

export enum STATUS_ICONS_FILLS {
    PLAIN = 0,
    CHECKMARK = 1,
    SIGN = 2,
    WARNING = 3,
    FAIL = 4,
}

export enum X_PM_HEADERS {
    NONE = 'none',
    PGP_INLINE = 'pgp-inline',
    PGP_INLINE_PINNED = 'pgp-inline-pinned',
    PGP_MIME = 'pgp-mime',
    PGP_MIME_PINNED = 'pgp-mime-pinned',
    PGP_PM = 'pgp-pm',
    PGP_PM_PINNED = 'pgp-pm-pinned',
    PGP_EO = 'pgp-eo',
    INTERNAL = 'internal',
    EXTERNAL = 'external',
    END_TO_END = 'end-to-end',
    ON_COMPOSE = 'on-compose',
    ON_DELIVERY = 'on-delivery',
}

export interface StatusIcon {
    colorClassName: string;
    isEncrypted: boolean;
    fill: STATUS_ICONS_FILLS;
    text: string;
}

export interface MapStatusIcons {
    [key: string]: StatusIcon | undefined;
}

export interface ContactSignatureInfo {
    isVerified?: boolean;
    creationTime?: Date;
}

export interface SendInfo {
    sendPreferences?: SendPreferences;
    sendIcon?: StatusIcon;
    loading: boolean;
    emailValidation: boolean;
    emailAddressWarnings?: string[];
    contactSignatureInfo?: ContactSignatureInfo;
}

export interface MapSendInfo {
    [key: string]: SendInfo | undefined;
}

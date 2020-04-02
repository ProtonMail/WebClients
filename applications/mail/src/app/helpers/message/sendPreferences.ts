import { OpenPGPKey } from 'pmcrypto';
import { MIME_TYPES, PACKAGE_TYPE, PGP_SCHEMES } from 'proton-shared/lib/constants';
import { EncryptionPreferences } from 'proton-shared/lib/mail/encryptionPreferences';
import { Message } from '../../models/message';
import { isEO } from './messages';

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
}

export interface MapSendPreferences {
    [email: string]: SendPreferences;
}

const { SEND_PM, SEND_EO, SEND_CLEAR, SEND_PGP_INLINE, SEND_PGP_MIME } = PACKAGE_TYPE;

/**
 * Logic for determining the PGP scheme to be used when sending to an email address.
 * The API expects a package type.
 */
export const getPGPScheme = (
    { sign, scheme, isInternal }: Pick<EncryptionPreferences, 'sign' | 'scheme' | 'isInternal'>,
    message?: Message
): PACKAGE_TYPE => {
    if (isInternal) {
        return SEND_PM;
    }
    if (sign) {
        return scheme === PGP_SCHEMES.PGP_INLINE ? SEND_PGP_INLINE : SEND_PGP_MIME;
    }
    if (isEO(message)) {
        // notice encrypt must be false at this point; otherwise sign would be true
        return SEND_EO;
    }
    return SEND_CLEAR;
};

export const getMimeType = (
    { sign, scheme, isInternal, mimeType }: Pick<EncryptionPreferences, 'sign' | 'scheme' | 'mimeType' | 'isInternal'>,
    message?: Message
): MIME_TYPES => {
    const messageMimeType = message?.MIMEType as MIME_TYPES;
    const pgpScheme = getPGPScheme({ sign, scheme, isInternal }, message);

    if (sign && [SEND_PGP_INLINE, SEND_PGP_MIME].includes(pgpScheme)) {
        return pgpScheme === SEND_PGP_INLINE ? MIME_TYPES.PLAINTEXT : MIME_TYPES.MIME;
    }
    // If sending EO, respect the MIME type of the composer, since it will be what the API returns when retrieving the message.
    // If plain text is selected in the composer and the message is not signed, send in plain text
    if (pgpScheme === SEND_EO || messageMimeType === MIME_TYPES.PLAINTEXT) {
        return messageMimeType || mimeType;
    }
    return (mimeType as unknown) as MIME_TYPES;
};

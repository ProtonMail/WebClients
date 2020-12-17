import { MIME_TYPES, PACKAGE_TYPE, PGP_SCHEMES } from '../../constants';
import { Message } from '../../interfaces/mail/Message';
import { EncryptionPreferences } from '../encryptionPreferences';
import { isEO } from '../messages';

const { SEND_PM, SEND_EO, SEND_CLEAR, SEND_PGP_INLINE, SEND_PGP_MIME } = PACKAGE_TYPE;

/**
 * Logic for determining the PGP scheme to be used when sending to an email address.
 * The API expects a package type.
 */
export const getPGPScheme = (
    { encrypt, sign, scheme, isInternal }: Pick<EncryptionPreferences, 'encrypt' | 'sign' | 'scheme' | 'isInternal'>,
    message?: Partial<Message>
): PACKAGE_TYPE => {
    if (isInternal) {
        return SEND_PM;
    }
    if (!encrypt && isEO(message)) {
        return SEND_EO;
    }
    if (sign) {
        return scheme === PGP_SCHEMES.PGP_INLINE ? SEND_PGP_INLINE : SEND_PGP_MIME;
    }
    return SEND_CLEAR;
};

export const getPGPSchemeAndMimeType = (
    {
        encrypt,
        sign,
        scheme,
        isInternal,
        mimeType: prefMimeType,
    }: Pick<EncryptionPreferences, 'encrypt' | 'sign' | 'scheme' | 'mimeType' | 'isInternal'>,
    message?: Partial<Message>
): { pgpScheme: PACKAGE_TYPE; mimeType: MIME_TYPES } => {
    const messageMimeType = message?.MIMEType as MIME_TYPES;
    const pgpScheme = getPGPScheme({ encrypt, sign, scheme, isInternal }, message);

    if (sign && [SEND_PGP_INLINE, SEND_PGP_MIME].includes(pgpScheme)) {
        const enforcedMimeType = pgpScheme === SEND_PGP_INLINE ? MIME_TYPES.PLAINTEXT : MIME_TYPES.MIME;
        return { pgpScheme, mimeType: enforcedMimeType };
    }

    // If sending EO, respect the MIME type of the composer, since it will be what the API returns when retrieving the message.
    // If plain text is selected in the composer and the message is not signed, send in plain text
    if (pgpScheme === SEND_EO || messageMimeType === MIME_TYPES.PLAINTEXT) {
        return { pgpScheme, mimeType: messageMimeType || prefMimeType };
    }

    return { pgpScheme, mimeType: prefMimeType || messageMimeType };
};

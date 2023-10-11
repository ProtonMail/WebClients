import { CONTACT_MIME_TYPES, MIME_TYPES, PGP_SCHEMES } from '../../constants';
import { ContactPublicKeyModel, MailSettings } from '../../interfaces';
import { PACKAGE_TYPE, SIGN } from '../../mail/mailSettings';

/**
 * Extract sign flag from the contact public key model and mail settings
 */
export const extractSign = (model: ContactPublicKeyModel, mailSettings: MailSettings): boolean => {
    const { sign } = model;
    return sign !== undefined ? sign : mailSettings.Sign === SIGN.ENABLED;
};

/**
 * Extract PGP scheme from the contact public key model and mail settings
 */
export const extractScheme = (model: ContactPublicKeyModel, mailSettings: MailSettings): PGP_SCHEMES => {
    const { scheme } = model;
    if (scheme === PGP_SCHEMES.PGP_INLINE || scheme === PGP_SCHEMES.PGP_MIME) {
        return scheme;
    }
    if (mailSettings.PGPScheme === PACKAGE_TYPE.SEND_PGP_INLINE) {
        return PGP_SCHEMES.PGP_INLINE;
    }
    return PGP_SCHEMES.PGP_MIME;
};

/**
 * Extract MIME type (for the composer) from the contact public key model and mail settings
 */
export const extractDraftMIMEType = (model: ContactPublicKeyModel, mailSettings: MailSettings): CONTACT_MIME_TYPES => {
    const { mimeType } = model;
    const sign = extractSign(model, mailSettings);
    const scheme = extractScheme(model, mailSettings);

    if (sign && scheme === PGP_SCHEMES.PGP_INLINE) {
        return MIME_TYPES.PLAINTEXT;
    }

    return mimeType;
};

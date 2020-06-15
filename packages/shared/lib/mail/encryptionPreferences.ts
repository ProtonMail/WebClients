import { c } from 'ttag';
import { OpenPGPKey } from 'pmcrypto';
import { extractDraftMIMEType, extractScheme, extractSign } from '../api/helpers/mailSettings';
import { DRAFT_MIME_TYPES, PGP_SCHEMES } from '../constants';
import { ContactPublicKeyModel, MailSettings, PublicKeyModel, SelfSend } from '../interfaces';
import { getEmailMismatchWarning, getIsValidForSending } from '../keys/publicKeys';

export enum EncryptionPreferencesFailureTypes {
    EMAIL_ADDRESS_ERROR,
    INTERNAL_USER_DISABLED = 0,
    INTERNAL_USER_NO_API_KEY = 1,
    INTERNAL_USER_NO_VALID_API_KEY = 2,
    PRIMARY_NOT_PINNED = 3,
    WKD_USER_NO_VALID_WKD_KEY = 4,
    EXTERNAL_USER_NO_VALID_PINNED_KEY = 6,
    CONTACT_SIGNATURE_NOT_VERIFIED
}

export interface EncryptionPreferencesFailure {
    type: EncryptionPreferencesFailureTypes;
    error: Error;
}

export interface EncryptionPreferences {
    encrypt: boolean;
    sign: boolean;
    scheme: PGP_SCHEMES;
    mimeType: DRAFT_MIME_TYPES;
    sendKey?: OpenPGPKey;
    isSendKeyPinned?: boolean;
    apiKeys: OpenPGPKey[];
    pinnedKeys: OpenPGPKey[];
    isInternal: boolean;
    hasApiKeys: boolean;
    hasPinnedKeys: boolean;
    isContact: boolean;
    isContactSignatureVerified?: boolean;
    warnings?: string[];
    failure?: EncryptionPreferencesFailure;
    emailAddressWarnings?: string[];
}

const extractEncryptionPreferencesOwnAddress = (
    publicKeyModel: PublicKeyModel,
    selfSend: SelfSend
): EncryptionPreferences => {
    const {
        publicKeys: { apiKeys },
        emailAddress,
        scheme,
        mimeType,
        isContact,
        isContactSignatureVerified,
        emailAddressWarnings,
        emailAddressErrors
    } = publicKeyModel;
    const { address, publicKey } = selfSend;
    const hasApiKeys = !!address.HasKeys;
    const canAddressReceive = !!address.Receive;
    const result = {
        encrypt: true,
        sign: true,
        scheme,
        mimeType,
        isInternal: true,
        apiKeys,
        pinnedKeys: [],
        hasApiKeys,
        hasPinnedKeys: false,
        isContact,
        isContactSignatureVerified,
        emailAddressWarnings
    };
    if (emailAddressErrors?.length) {
        const errorString = emailAddressErrors[0];
        return {
            ...result,
            failure: {
                type: EncryptionPreferencesFailureTypes.EMAIL_ADDRESS_ERROR,
                error: new Error(errorString)
            }
        };
    }
    if (!canAddressReceive) {
        return {
            ...result,
            failure: {
                type: EncryptionPreferencesFailureTypes.INTERNAL_USER_DISABLED,
                error: new Error(c('Error').t`Email address disabled`)
            }
        };
    }
    if (!hasApiKeys) {
        return {
            ...result,
            failure: {
                type: EncryptionPreferencesFailureTypes.INTERNAL_USER_NO_API_KEY,
                error: new Error(c('Error').t`No keys retrieved for internal user`)
            }
        };
    }
    if (!publicKey) {
        return {
            ...result,
            failure: {
                type: EncryptionPreferencesFailureTypes.INTERNAL_USER_NO_VALID_API_KEY,
                error: new Error(c('Error').t`No valid keys retrieved for internal user`)
            }
        };
    }
    const warnings = getEmailMismatchWarning(publicKey, emailAddress, true);
    return { ...result, sendKey: publicKey, isSendKeyPinned: false, warnings };
};

const extractEncryptionPreferencesInternal = (publicKeyModel: PublicKeyModel): EncryptionPreferences => {
    const {
        emailAddress,
        publicKeys: { apiKeys, pinnedKeys },
        scheme,
        mimeType,
        trustedFingerprints,
        isContact,
        isContactSignatureVerified,
        emailAddressWarnings,
        emailAddressErrors
    } = publicKeyModel;
    const hasApiKeys = !!apiKeys.length;
    const hasPinnedKeys = !!pinnedKeys.length;
    const result = {
        encrypt: true,
        sign: true,
        scheme,
        mimeType,
        apiKeys,
        pinnedKeys,
        isInternal: true,
        hasApiKeys,
        hasPinnedKeys,
        isContact,
        isContactSignatureVerified,
        emailAddressWarnings
    };
    if (emailAddressErrors?.length) {
        const errorString = emailAddressErrors[0];
        return {
            ...result,
            failure: {
                type: EncryptionPreferencesFailureTypes.EMAIL_ADDRESS_ERROR,
                error: new Error(errorString)
            }
        };
    }
    if (isContact && !isContactSignatureVerified) {
        return {
            ...result,
            failure: {
                type: EncryptionPreferencesFailureTypes.CONTACT_SIGNATURE_NOT_VERIFIED,
                error: new Error(c('Error').t`Contact signature could not be verified`)
            }
        };
    }
    if (!hasApiKeys) {
        return {
            ...result,
            failure: {
                type: EncryptionPreferencesFailureTypes.INTERNAL_USER_NO_API_KEY,
                error: new Error(c('Error').t`No keys retrieved for internal user`)
            }
        };
    }
    // API keys are ordered in terms of user preference. The primary key (first in the list) will be used for sending
    const [primaryKey] = apiKeys;
    const primaryKeyFingerprint = primaryKey.getFingerprint();
    const validApiSendKey = apiKeys.find((key) => getIsValidForSending(key.getFingerprint(), publicKeyModel));
    if (!validApiSendKey) {
        return {
            ...result,
            failure: {
                type: EncryptionPreferencesFailureTypes.INTERNAL_USER_NO_VALID_API_KEY,
                error: new Error(c('Error').t`No key retrieved for internal user is valid for sending`)
            }
        };
    }
    if (!hasPinnedKeys) {
        const warnings = getEmailMismatchWarning(primaryKey, emailAddress, true);
        return { ...result, sendKey: primaryKey, isSendKeyPinned: false, warnings };
    }
    // if there are pinned keys, make sure the primary API key is trusted and valid for sending
    const isPrimaryTrustedAndValid =
        trustedFingerprints.has(primaryKeyFingerprint) && getIsValidForSending(primaryKeyFingerprint, publicKeyModel);
    if (!isPrimaryTrustedAndValid) {
        return {
            ...result,
            sendKey: validApiSendKey,
            failure: {
                type: EncryptionPreferencesFailureTypes.PRIMARY_NOT_PINNED,
                error: new Error(c('Error').t`Trusted keys are not valid for sending`)
            }
        };
    }
    // return the pinned key, not the API one
    const [sendKey] = pinnedKeys;
    const warnings = getEmailMismatchWarning(sendKey, emailAddress, true);
    return { ...result, sendKey, isSendKeyPinned: true, warnings };
};

const extractEncryptionPreferencesExternalWithWKDKeys = (publicKeyModel: PublicKeyModel): EncryptionPreferences => {
    const {
        emailAddress,
        publicKeys: { apiKeys, pinnedKeys },
        scheme,
        mimeType,
        trustedFingerprints,
        isContact,
        isContactSignatureVerified,
        emailAddressWarnings,
        emailAddressErrors
    } = publicKeyModel;
    const hasApiKeys = true;
    const hasPinnedKeys = !!pinnedKeys.length;
    const result = {
        encrypt: true,
        sign: true,
        scheme,
        mimeType,
        apiKeys,
        pinnedKeys,
        isInternal: false,
        hasApiKeys,
        hasPinnedKeys,
        isContact,
        isContactSignatureVerified,
        emailAddressWarnings
    };
    if (emailAddressErrors?.length) {
        const errorString = emailAddressErrors[0];
        return {
            ...result,
            failure: {
                type: EncryptionPreferencesFailureTypes.EMAIL_ADDRESS_ERROR,
                error: new Error(errorString)
            }
        };
    }
    if (isContact && !isContactSignatureVerified) {
        return {
            ...result,
            failure: {
                type: EncryptionPreferencesFailureTypes.CONTACT_SIGNATURE_NOT_VERIFIED,
                error: new Error(c('Error').t`Contact signature could not be verified`)
            }
        };
    }
    // WKD keys are ordered in terms of user preference. The primary key (first in the list) will be used for sending
    const [primaryKey] = apiKeys;
    const primaryKeyFingerprint = primaryKey.getFingerprint();
    const validApiSendKey = apiKeys.find((key) => getIsValidForSending(key.getFingerprint(), publicKeyModel));
    if (!validApiSendKey) {
        return {
            ...result,
            failure: {
                type: EncryptionPreferencesFailureTypes.WKD_USER_NO_VALID_WKD_KEY,
                error: new Error(c('Error').t`No WKD key retrieved for user is valid for sending`)
            }
        };
    }
    if (!hasPinnedKeys) {
        const warnings = getEmailMismatchWarning(primaryKey, emailAddress, false);
        return { ...result, sendKey: primaryKey, isSendKeyPinned: false, warnings };
    }
    // if there are pinned keys, make sure the primary API key is trusted and valid for sending
    const isPrimaryTrustedAndValid =
        trustedFingerprints.has(primaryKeyFingerprint) && getIsValidForSending(primaryKeyFingerprint, publicKeyModel);
    if (!isPrimaryTrustedAndValid) {
        return {
            ...result,
            sendKey: validApiSendKey,
            failure: {
                type: EncryptionPreferencesFailureTypes.PRIMARY_NOT_PINNED,
                error: new Error(c('Error').t`Trusted keys are not valid for sending`)
            }
        };
    }
    // return the pinned key, not the API one
    const [sendKey] = pinnedKeys;
    const warnings = getEmailMismatchWarning(sendKey, emailAddress, false);
    return { ...result, sendKey, isSendKeyPinned: true, warnings };
};

const extractEncryptionPreferencesExternalWithoutWKDKeys = (publicKeyModel: PublicKeyModel): EncryptionPreferences => {
    const {
        emailAddress,
        publicKeys: { apiKeys, pinnedKeys },
        encrypt,
        sign,
        scheme,
        mimeType,
        isContact,
        isContactSignatureVerified,
        emailAddressWarnings,
        emailAddressErrors
    } = publicKeyModel;
    const hasPinnedKeys = !!pinnedKeys.length;
    const result = {
        encrypt,
        sign,
        mimeType,
        scheme,
        apiKeys,
        pinnedKeys,
        isInternal: false,
        hasApiKeys: false,
        hasPinnedKeys,
        isContact,
        isContactSignatureVerified,
        emailAddressWarnings
    };
    if (emailAddressErrors?.length) {
        const errorString = emailAddressErrors[0];
        return {
            ...result,
            failure: {
                type: EncryptionPreferencesFailureTypes.EMAIL_ADDRESS_ERROR,
                error: new Error(errorString)
            }
        };
    }
    if (isContact && !isContactSignatureVerified) {
        return {
            ...result,
            failure: {
                type: EncryptionPreferencesFailureTypes.CONTACT_SIGNATURE_NOT_VERIFIED,
                error: new Error(c('Error').t`Contact signature could not be verified`)
            }
        };
    }
    if (!hasPinnedKeys) {
        return result;
    }
    // Pinned keys are ordered in terms of preference. Make sure the first is valid
    const [sendKey] = pinnedKeys;
    if (!getIsValidForSending(sendKey.getFingerprint(), publicKeyModel)) {
        return {
            ...result,
            failure: {
                type: EncryptionPreferencesFailureTypes.EXTERNAL_USER_NO_VALID_PINNED_KEY,
                error: new Error(c('Error').t`The sending key is not valid`)
            }
        };
    }
    const warnings = getEmailMismatchWarning(sendKey, emailAddress, false);
    return { ...result, sendKey, isSendKeyPinned: true, warnings };
};

/**
 * Extract the encryption preferences from a public-key model corresponding to a certain email address
 */
const extractEncryptionPreferences = (
    model: ContactPublicKeyModel,
    mailSettings: MailSettings,
    selfSend?: SelfSend
): EncryptionPreferences => {
    // Determine encrypt and sign flags, plus PGP scheme and MIME type.
    // Take mail settings into account if they are present
    const encrypt = !!model.encrypt;
    const sign = extractSign(model, mailSettings);
    const scheme = extractScheme(model, mailSettings);
    const mimeType = extractDraftMIMEType(model, mailSettings);

    const publicKeyModel = {
        ...model,
        encrypt,
        sign: encrypt || sign,
        scheme,
        mimeType
    };
    // case of own address
    if (selfSend) {
        return extractEncryptionPreferencesOwnAddress(publicKeyModel, selfSend);
    }
    // case of internal user
    if (model.isPGPInternal) {
        return extractEncryptionPreferencesInternal(publicKeyModel);
    }
    // case of external user with WKD keys
    if (model.isPGPExternalWithWKDKeys) {
        return extractEncryptionPreferencesExternalWithWKDKeys(publicKeyModel);
    }
    // case of external user without WKD keys
    return extractEncryptionPreferencesExternalWithoutWKDKeys(publicKeyModel);
};

export default extractEncryptionPreferences;

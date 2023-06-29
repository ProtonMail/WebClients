import { c } from 'ttag';

import { PublicKeyReference } from '@proton/crypto';

import { extractDraftMIMEType, extractScheme, extractSign } from '../api/helpers/mailSettings';
import { BRAND_NAME, CONTACT_MIME_TYPES, PGP_SCHEMES } from '../constants';
import {
    ContactPublicKeyModel,
    KeyTransparencyVerificationResult,
    MailSettings,
    PublicKeyModel,
    SelfSend,
} from '../interfaces';
import { getEmailMismatchWarning, getIsValidForSending } from '../keys/publicKeys';

export enum ENCRYPTION_PREFERENCES_ERROR_TYPES {
    EMAIL_ADDRESS_ERROR,
    INTERNAL_USER_DISABLED,
    INTERNAL_USER_NO_API_KEY,
    PRIMARY_CANNOT_SEND,
    PRIMARY_NOT_PINNED,
    WKD_USER_NO_VALID_WKD_KEY,
    EXTERNAL_USER_NO_VALID_PINNED_KEY,
    CONTACT_SIGNATURE_NOT_VERIFIED,
}

export class EncryptionPreferencesError extends Error {
    type: ENCRYPTION_PREFERENCES_ERROR_TYPES;

    constructor(type: ENCRYPTION_PREFERENCES_ERROR_TYPES, message: string) {
        super(message);
        this.type = type;
        Object.setPrototypeOf(this, EncryptionPreferencesError.prototype);
    }
}

export interface EncryptionPreferences {
    encrypt: boolean;
    sign: boolean;
    scheme: PGP_SCHEMES;
    mimeType: CONTACT_MIME_TYPES;
    sendKey?: PublicKeyReference;
    isSendKeyPinned?: boolean;
    apiKeys: PublicKeyReference[];
    pinnedKeys: PublicKeyReference[];
    verifyingPinnedKeys: PublicKeyReference[];
    isInternal: boolean;
    hasApiKeys: boolean;
    hasPinnedKeys: boolean;
    isContact: boolean;
    isContactSignatureVerified?: boolean;
    contactSignatureTimestamp?: Date;
    warnings?: string[];
    error?: EncryptionPreferencesError;
    emailAddressWarnings?: string[];
    ktVerificationResult?: KeyTransparencyVerificationResult;
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
        contactSignatureTimestamp,
        emailAddressWarnings,
        emailAddressErrors,
        ktVerificationResult,
    } = publicKeyModel;
    const { address, publicKey, canSend } = selfSend;
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
        verifyingPinnedKeys: [],
        hasApiKeys,
        hasPinnedKeys: false,
        isContact,
        isContactSignatureVerified,
        contactSignatureTimestamp,
        emailAddressWarnings,
        ktVerificationResult,
    };
    if (emailAddressErrors?.length) {
        const errorString = emailAddressErrors[0];
        return {
            ...result,
            error: new EncryptionPreferencesError(ENCRYPTION_PREFERENCES_ERROR_TYPES.EMAIL_ADDRESS_ERROR, errorString),
        };
    }
    if (!canAddressReceive) {
        return {
            ...result,
            error: new EncryptionPreferencesError(
                ENCRYPTION_PREFERENCES_ERROR_TYPES.INTERNAL_USER_DISABLED,
                c('Error').t`Email address disabled`
            ),
        };
    }
    if (!hasApiKeys) {
        return {
            ...result,
            error: new EncryptionPreferencesError(
                ENCRYPTION_PREFERENCES_ERROR_TYPES.INTERNAL_USER_NO_API_KEY,
                // Proton users should always have keys, so this case should never happen in practice. Therefore we don't translate the error message
                `No key was found for the ${BRAND_NAME} user`
            ),
        };
    }
    if (!publicKey || !canSend) {
        return {
            ...result,
            error: new EncryptionPreferencesError(
                ENCRYPTION_PREFERENCES_ERROR_TYPES.PRIMARY_CANNOT_SEND,
                c('Error').t`Primary key is not valid for sending`
            ),
        };
    }
    const warnings = getEmailMismatchWarning(publicKey, emailAddress, true);

    return { ...result, sendKey: publicKey, isSendKeyPinned: false, warnings };
};

const extractEncryptionPreferencesInternal = (publicKeyModel: PublicKeyModel): EncryptionPreferences => {
    const {
        emailAddress,
        publicKeys: { apiKeys, pinnedKeys, verifyingPinnedKeys },
        scheme,
        mimeType,
        trustedFingerprints,
        isContact,
        isContactSignatureVerified,
        contactSignatureTimestamp,
        emailAddressWarnings,
        emailAddressErrors,
        ktVerificationResult,
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
        verifyingPinnedKeys,
        isInternal: true,
        hasApiKeys,
        hasPinnedKeys,
        isContact,
        isContactSignatureVerified,
        contactSignatureTimestamp,
        emailAddressWarnings,
        ktVerificationResult,
    };
    if (emailAddressErrors?.length) {
        const errorString = emailAddressErrors[0];
        return {
            ...result,
            error: new EncryptionPreferencesError(ENCRYPTION_PREFERENCES_ERROR_TYPES.EMAIL_ADDRESS_ERROR, errorString),
        };
    }
    if (isContact && isContactSignatureVerified === false) {
        return {
            ...result,
            error: new EncryptionPreferencesError(
                ENCRYPTION_PREFERENCES_ERROR_TYPES.CONTACT_SIGNATURE_NOT_VERIFIED,
                c('Error').t`Contact signature could not be verified`
            ),
        };
    }
    if (!hasApiKeys) {
        return {
            ...result,
            error: new EncryptionPreferencesError(
                ENCRYPTION_PREFERENCES_ERROR_TYPES.INTERNAL_USER_NO_API_KEY,
                // Proton users should always have keys, so this case should never happen in practice. Therefore we don't translate the error message
                `No key was found for the ${BRAND_NAME} user`
            ),
        };
    }
    // API keys are ordered in terms of user preference. The primary key (first in the list) will be used for sending
    const [primaryKey] = apiKeys;
    const primaryKeyFingerprint = primaryKey.getFingerprint();
    if (!getIsValidForSending(primaryKeyFingerprint, publicKeyModel)) {
        return {
            ...result,
            error: new EncryptionPreferencesError(
                ENCRYPTION_PREFERENCES_ERROR_TYPES.PRIMARY_CANNOT_SEND,
                c('Error').t`Primary key retrieved for ${BRAND_NAME} user is not valid for sending`
            ),
        };
    }
    if (!hasPinnedKeys) {
        const warnings = getEmailMismatchWarning(primaryKey, emailAddress, true);
        return { ...result, sendKey: primaryKey, isSendKeyPinned: false, warnings };
    }
    // if there are pinned keys, make sure the primary API key is trusted and valid for sending
    const isPrimaryTrustedAndValid =
        trustedFingerprints.has(primaryKeyFingerprint) && getIsValidForSending(primaryKeyFingerprint, publicKeyModel);
    const sendKey = pinnedKeys.find((key) => key.getFingerprint() === primaryKeyFingerprint);
    if (!isPrimaryTrustedAndValid || !sendKey) {
        return {
            ...result,
            sendKey: primaryKey,
            error: new EncryptionPreferencesError(
                ENCRYPTION_PREFERENCES_ERROR_TYPES.PRIMARY_NOT_PINNED,
                c('Error').t`Trusted keys are not valid for sending`
            ),
        };
    }
    const warnings = getEmailMismatchWarning(sendKey, emailAddress, true);

    // return the pinned key, not the API one
    return { ...result, sendKey, isSendKeyPinned: true, warnings };
};

const extractEncryptionPreferencesExternalWithWKDKeys = (publicKeyModel: PublicKeyModel): EncryptionPreferences => {
    const {
        encrypt,
        sign,
        emailAddress,
        publicKeys: { apiKeys, pinnedKeys, verifyingPinnedKeys },
        scheme,
        mimeType,
        trustedFingerprints,
        isContact,
        isContactSignatureVerified,
        contactSignatureTimestamp,
        emailAddressWarnings,
        emailAddressErrors,
        ktVerificationResult,
    } = publicKeyModel;
    const hasApiKeys = true;
    const hasPinnedKeys = !!pinnedKeys.length;
    const result = {
        encrypt,
        sign,
        scheme,
        mimeType,
        apiKeys,
        pinnedKeys,
        verifyingPinnedKeys,
        isInternal: false,
        hasApiKeys,
        hasPinnedKeys,
        isContact,
        isContactSignatureVerified,
        contactSignatureTimestamp,
        emailAddressWarnings,
        ktVerificationResult,
    };
    if (emailAddressErrors?.length) {
        const errorString = emailAddressErrors[0];
        return {
            ...result,
            error: new EncryptionPreferencesError(ENCRYPTION_PREFERENCES_ERROR_TYPES.EMAIL_ADDRESS_ERROR, errorString),
        };
    }
    if (isContact && isContactSignatureVerified === false) {
        return {
            ...result,
            error: new EncryptionPreferencesError(
                ENCRYPTION_PREFERENCES_ERROR_TYPES.CONTACT_SIGNATURE_NOT_VERIFIED,
                c('Error').t`Contact signature could not be verified`
            ),
        };
    }
    // WKD keys are ordered in terms of user preference. The primary key (first in the list) will be used for sending
    const [primaryKey] = apiKeys;
    const primaryKeyFingerprint = primaryKey.getFingerprint();
    const validApiSendKey = apiKeys.find((key) => getIsValidForSending(key.getFingerprint(), publicKeyModel));
    if (!validApiSendKey) {
        return {
            ...result,
            error: new EncryptionPreferencesError(
                ENCRYPTION_PREFERENCES_ERROR_TYPES.WKD_USER_NO_VALID_WKD_KEY,
                c('Error').t`No WKD key retrieved for user is valid for sending`
            ),
        };
    }
    if (!hasPinnedKeys) {
        const warnings = getEmailMismatchWarning(primaryKey, emailAddress, false);
        return { ...result, sendKey: primaryKey, isSendKeyPinned: false, warnings };
    }
    // if there are pinned keys, make sure the primary API key is trusted and valid for sending
    const isPrimaryTrustedAndValid =
        trustedFingerprints.has(primaryKeyFingerprint) && getIsValidForSending(primaryKeyFingerprint, publicKeyModel);
    const sendKey = pinnedKeys.find((key) => key.getFingerprint() === primaryKeyFingerprint);
    if (!isPrimaryTrustedAndValid || !sendKey) {
        return {
            ...result,
            sendKey: validApiSendKey,
            error: new EncryptionPreferencesError(
                ENCRYPTION_PREFERENCES_ERROR_TYPES.PRIMARY_NOT_PINNED,
                c('Error').t`Trusted keys are not valid for sending`
            ),
        };
    }
    const warnings = getEmailMismatchWarning(sendKey, emailAddress, false);

    // return the pinned key, not the API one
    return { ...result, sendKey, isSendKeyPinned: true, warnings };
};

const extractEncryptionPreferencesExternalWithoutWKDKeys = (publicKeyModel: PublicKeyModel): EncryptionPreferences => {
    const {
        emailAddress,
        publicKeys: { apiKeys, pinnedKeys, verifyingPinnedKeys },
        encrypt,
        sign,
        scheme,
        mimeType,
        isContact,
        isContactSignatureVerified,
        contactSignatureTimestamp,
        emailAddressWarnings,
        emailAddressErrors,
        ktVerificationResult,
    } = publicKeyModel;
    const hasPinnedKeys = !!pinnedKeys.length;
    const result = {
        encrypt,
        sign,
        mimeType,
        scheme,
        apiKeys,
        pinnedKeys,
        verifyingPinnedKeys,
        isInternal: false,
        hasApiKeys: false,
        hasPinnedKeys,
        isContact,
        isContactSignatureVerified,
        contactSignatureTimestamp,
        emailAddressWarnings,
        ktVerificationResult,
    };
    if (emailAddressErrors?.length) {
        const errorString = emailAddressErrors[0];
        return {
            ...result,
            error: new EncryptionPreferencesError(ENCRYPTION_PREFERENCES_ERROR_TYPES.EMAIL_ADDRESS_ERROR, errorString),
        };
    }
    if (isContact && isContactSignatureVerified === false) {
        return {
            ...result,
            error: new EncryptionPreferencesError(
                ENCRYPTION_PREFERENCES_ERROR_TYPES.CONTACT_SIGNATURE_NOT_VERIFIED,
                c('Error').t`Contact signature could not be verified`
            ),
        };
    }
    if (!hasPinnedKeys || !encrypt) {
        return result;
    }
    // Pinned keys are ordered in terms of preference. Make sure the first is valid
    const [sendKey] = pinnedKeys;
    if (!getIsValidForSending(sendKey.getFingerprint(), publicKeyModel)) {
        return {
            ...result,
            error: new EncryptionPreferencesError(
                ENCRYPTION_PREFERENCES_ERROR_TYPES.EXTERNAL_USER_NO_VALID_PINNED_KEY,
                c('Error').t`The sending key is not valid`
            ),
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
        mimeType,
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

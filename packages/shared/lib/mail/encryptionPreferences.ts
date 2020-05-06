import { c } from 'ttag';
import { OpenPGPKey } from 'pmcrypto';
import { DRAFT_MIME_TYPES, PGP_SCHEMES } from '../constants';
import { PublicKeyModel, SelfSend } from '../interfaces';
import { getEmailMismatchWarning, getIsValidForSending } from '../keys/publicKeys';

export enum EncryptionPreferencesFailureTypes {
    INTERNAL_USER_DISABLED = 0,
    INTERNAL_USER_NO_API_KEY = 1,
    INTERNAL_USER_NO_VALID_API_KEY = 2,
    INTERNAL_USER_PRIMARY_NOT_PINNED = 3,
    WKD_USER_NO_VALID_WKD_KEY = 4,
    WKD_USER_PRIMARY_NOT_PINNED = 5,
    EXTERNAL_USER_NO_VALID_PINNED_KEY = 6
}

export interface EncryptionPreferencesFailure {
    type: EncryptionPreferencesFailureTypes;
    error: Error;
}

export interface EncryptionPreferences {
    encrypt: boolean;
    sign: boolean;
    mimeType: DRAFT_MIME_TYPES;
    scheme: PGP_SCHEMES;
    sendKey?: OpenPGPKey;
    isSendKeyPinned?: boolean;
    apiKeys: OpenPGPKey[];
    pinnedKeys: OpenPGPKey[];
    isInternal: boolean;
    hasApiKeys: boolean;
    hasPinnedKeys: boolean;
    isContactSignatureVerified: boolean;
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
        isContactSignatureVerified,
        emailAddressWarnings
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
        isContactSignatureVerified,
        emailAddressWarnings
    };
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
        isContactSignatureVerified,
        emailAddressWarnings
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
        isContactSignatureVerified,
        emailAddressWarnings
    };
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
                type: EncryptionPreferencesFailureTypes.INTERNAL_USER_PRIMARY_NOT_PINNED,
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
        isContactSignatureVerified,
        emailAddressWarnings
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
        isContactSignatureVerified,
        emailAddressWarnings
    };
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
                type: EncryptionPreferencesFailureTypes.WKD_USER_PRIMARY_NOT_PINNED,
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
        isContactSignatureVerified,
        emailAddressWarnings
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
        isContactSignatureVerified,
        emailAddressWarnings
    };
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
const extractEncryptionPreferences = (publicKeyModel: PublicKeyModel, selfSend?: SelfSend): EncryptionPreferences => {
    // case of own address
    if (selfSend) {
        return extractEncryptionPreferencesOwnAddress(publicKeyModel, selfSend);
    }
    // case of internal user
    if (publicKeyModel.isPGPInternal) {
        return extractEncryptionPreferencesInternal(publicKeyModel);
    }
    // case of external user with WKD keys
    if (publicKeyModel.isPGPExternalWithWKDKeys) {
        return extractEncryptionPreferencesExternalWithWKDKeys(publicKeyModel);
    }
    // case of external user without WKD keys
    return extractEncryptionPreferencesExternalWithoutWKDKeys(publicKeyModel);
};

export default extractEncryptionPreferences;

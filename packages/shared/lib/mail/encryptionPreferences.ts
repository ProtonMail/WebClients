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
    publicKey?: OpenPGPKey;
    isPublicKeyPinned?: boolean;
    isInternal: boolean;
    hasApiKeys: boolean;
    hasPinnedKeys: boolean;
    warnings?: string[];
    failure?: EncryptionPreferencesFailure;
}

const extractEncryptionPreferencesOwnAddress = (
    publicKeyModel: PublicKeyModel,
    selfSend: SelfSend
): EncryptionPreferences => {
    const { emailAddress, scheme, mimeType, pgpAddressDisabled } = publicKeyModel;
    const { address, publicKey } = selfSend;
    const hasApiKeys = !!address.HasKeys;
    const hasPinnedKeys = false;
    const canAddressReceive = !!address.Receive && !pgpAddressDisabled;
    const result = { encrypt: true, sign: true, scheme, mimeType, isInternal: true, hasApiKeys, hasPinnedKeys };
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
    const warnings = getEmailMismatchWarning(publicKey, emailAddress);
    return { ...result, publicKey, isPublicKeyPinned: false, warnings };
};

const extractEncryptionPreferencesInternal = (publicKeyModel: PublicKeyModel): EncryptionPreferences => {
    const {
        emailAddress,
        publicKeys: { api: apiKeys, pinned: pinnedKeys } = { api: [], pinned: [] },
        scheme,
        mimeType,
        trustedFingerprints
    } = publicKeyModel;
    const hasApiKeys = !!apiKeys.length;
    const hasPinnedKeys = !!pinnedKeys.length;
    const result = { encrypt: true, sign: true, scheme, mimeType, isInternal: true, hasApiKeys, hasPinnedKeys };
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
    const validSendingKey = apiKeys.find((key) => getIsValidForSending(key.getFingerprint(), publicKeyModel));
    if (!validSendingKey) {
        return {
            ...result,
            failure: {
                type: EncryptionPreferencesFailureTypes.INTERNAL_USER_NO_VALID_API_KEY,
                error: new Error(c('Error').t`No key retrieved for internal user is valid for sending`)
            }
        };
    }
    if (!hasPinnedKeys) {
        const warnings = getEmailMismatchWarning(primaryKey, emailAddress);
        return { ...result, publicKey: primaryKey, isPublicKeyPinned: false, warnings };
    }
    // if there are pinned keys, make sure the primary API key is trusted and valid for sending
    const isPrimaryTrustedAndValid =
        trustedFingerprints.has(primaryKeyFingerprint) && getIsValidForSending(primaryKeyFingerprint, publicKeyModel);
    if (!isPrimaryTrustedAndValid) {
        return {
            ...result,
            publicKey: validSendingKey,
            failure: {
                type: EncryptionPreferencesFailureTypes.INTERNAL_USER_PRIMARY_NOT_PINNED,
                error: new Error(c('Error').t`Trusted keys are not valid for sending`)
            }
        };
    }
    // return the pinned key, not the API one
    const [sendingKey] = pinnedKeys;
    const warnings = getEmailMismatchWarning(sendingKey, emailAddress);
    return { ...result, publicKey: sendingKey, isPublicKeyPinned: true, warnings };
};

const extractEncryptionPreferencesExternalWithWKDKeys = (publicKeyModel: PublicKeyModel): EncryptionPreferences => {
    const {
        emailAddress,
        publicKeys: { api: apiKeys, pinned: pinnedKeys } = { api: [], pinned: [] },
        scheme,
        mimeType,
        trustedFingerprints
    } = publicKeyModel;
    const hasApiKeys = true;
    const hasPinnedKeys = !!pinnedKeys.length;
    const result = { encrypt: true, sign: true, scheme, mimeType, isInternal: false, hasApiKeys, hasPinnedKeys };
    // WKD keys are ordered in terms of user preference. The primary key (first in the list) will be used for sending
    const [primaryKey] = apiKeys;
    const primaryKeyFingerprint = primaryKey.getFingerprint();
    const validSendingKey = apiKeys.find((key) => getIsValidForSending(key.getFingerprint(), publicKeyModel));
    if (!validSendingKey) {
        return {
            ...result,
            failure: {
                type: EncryptionPreferencesFailureTypes.WKD_USER_NO_VALID_WKD_KEY,
                error: new Error(c('Error').t`No WKD key retrieved for user is valid for sending`)
            }
        };
    }
    if (!hasPinnedKeys) {
        const warnings = getEmailMismatchWarning(primaryKey, emailAddress);
        return { ...result, publicKey: primaryKey, isPublicKeyPinned: false, warnings };
    }
    // if there are pinned keys, make sure the primary API key is trusted and valid for sending
    const isPrimaryTrustedAndValid =
        trustedFingerprints.has(primaryKeyFingerprint) && getIsValidForSending(primaryKeyFingerprint, publicKeyModel);
    if (!isPrimaryTrustedAndValid) {
        return {
            ...result,
            publicKey: validSendingKey,
            failure: {
                type: EncryptionPreferencesFailureTypes.WKD_USER_PRIMARY_NOT_PINNED,
                error: new Error(c('Error').t`Trusted keys are not valid for sending`)
            }
        };
    }
    // return the pinned key, not the API one
    const [sendingKey] = pinnedKeys;
    const warnings = getEmailMismatchWarning(sendingKey, emailAddress);
    return { ...result, publicKey: sendingKey, isPublicKeyPinned: true, warnings };
};

const extractEncryptionPreferencesExternalWithoutWKDKeys = (publicKeyModel: PublicKeyModel): EncryptionPreferences => {
    const {
        emailAddress,
        publicKeys: { pinned: pinnedKeys } = { pinned: [] },
        encrypt,
        sign,
        scheme,
        mimeType
    } = publicKeyModel;
    const hasPinnedKeys = !!pinnedKeys.length;
    const result = {
        encrypt,
        sign,
        mimeType,
        scheme,
        isInternal: false,
        hasApiKeys: false,
        hasPinnedKeys
    };
    if (!hasPinnedKeys) {
        return result;
    }
    // Pinned keys are ordered in terms of preference. Make sure the first is valid
    const [sendingKey] = pinnedKeys;
    if (!getIsValidForSending(sendingKey.getFingerprint(), publicKeyModel)) {
        return {
            ...result,
            failure: {
                type: EncryptionPreferencesFailureTypes.EXTERNAL_USER_NO_VALID_PINNED_KEY,
                error: new Error(c('Error').t`The sending key is not valid`)
            }
        };
    }
    const warnings = getEmailMismatchWarning(sendingKey, emailAddress);
    return { ...result, publicKey: sendingKey, isPublicKeyPinned: true, warnings };
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

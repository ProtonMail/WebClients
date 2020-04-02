import { c } from 'ttag';
import { OpenPGPKey } from 'pmcrypto';
import { DRAFT_MIME_TYPES, PGP_SCHEMES } from '../constants';
import { PublicKeyModel, SelfSend } from '../interfaces';
import { getEmailMismatchWarning } from '../keys/publicKeys';

enum EncryptionPreferencesFailureTypes {
    INTERNAL_USER_DISABLED = 0,
    INTERNAL_USER_NO_API_KEY = 1,
    INTERNAL_USER_NO_VALID_API_KEY = 2,
    INTERNAL_USER_PRIMARY_NOT_PINNED = 3,
    WKD_USER_NO_VALID_WKD_KEY = 4,
    WKD_USER_PRIMARY_NOT_PINNED = 5,
    EXTERNAL_USER_NO_VALID_PINNED_KEY = 6
}

interface EncryptionPreferencesFailure {
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
        trustedFingerprints,
        revokedFingerprints,
        expiredFingerprints,
        verifyOnlyFingerprints
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
    // API keys are ordered in terms of preference. Make sure the primary is valid
    const primaryKeyFingerprint = apiKeys[0].getFingerprint();
    const isPrimaryValid =
        !verifyOnlyFingerprints.has(primaryKeyFingerprint) &&
        !revokedFingerprints.has(primaryKeyFingerprint) &&
        !expiredFingerprints.has(primaryKeyFingerprint);
    if (!isPrimaryValid) {
        return {
            ...result,
            failure: {
                type: EncryptionPreferencesFailureTypes.INTERNAL_USER_NO_VALID_API_KEY,
                error: new Error(c('Error').t`No valid keys retrieved for internal user`)
            }
        };
    }
    if (!hasPinnedKeys) {
        const publicKey = apiKeys[0];
        const warnings = getEmailMismatchWarning(publicKey, emailAddress);
        return { ...result, publicKey, isPublicKeyPinned: false, warnings };
    }
    // Make sure the primary API key is trusted
    if (!trustedFingerprints.has(primaryKeyFingerprint)) {
        return {
            ...result,
            failure: {
                type: EncryptionPreferencesFailureTypes.INTERNAL_USER_PRIMARY_NOT_PINNED,
                error: new Error(c('Error').t`The sending key is not trusted`)
            }
        };
    }
    // return the pinned key, not the API one
    const publicKey = pinnedKeys.find((key) => key.getFingerprint() === primaryKeyFingerprint) as OpenPGPKey;
    const warnings = getEmailMismatchWarning(publicKey, emailAddress);
    return { ...result, publicKey, isPublicKeyPinned: true, warnings };
};

const extractEncryptionPreferencesExternalWithWKDKeys = (publicKeyModel: PublicKeyModel): EncryptionPreferences => {
    const {
        emailAddress,
        publicKeys: { api: apiKeys, pinned: pinnedKeys } = { api: [], pinned: [] },
        scheme,
        mimeType,
        trustedFingerprints,
        revokedFingerprints,
        expiredFingerprints,
        verifyOnlyFingerprints
    } = publicKeyModel;
    const hasApiKeys = true;
    const hasPinnedKeys = !!pinnedKeys.length;
    const result = { encrypt: true, sign: true, scheme, mimeType, isInternal: false, hasApiKeys, hasPinnedKeys };
    // WKD keys are ordered in terms of preference. Make sure the primary is valid
    const primaryKeyFingerprint = apiKeys[0].getFingerprint();
    const isPrimaryValid =
        !verifyOnlyFingerprints.has(primaryKeyFingerprint) &&
        !revokedFingerprints.has(primaryKeyFingerprint) &&
        !expiredFingerprints.has(primaryKeyFingerprint);
    if (!isPrimaryValid) {
        return {
            ...result,
            failure: {
                type: EncryptionPreferencesFailureTypes.WKD_USER_NO_VALID_WKD_KEY,
                error: new Error(c('Error').t`No valid WKD keys retrieved for external user`)
            }
        };
    }
    if (!hasPinnedKeys) {
        const publicKey = apiKeys[0];
        const warnings = getEmailMismatchWarning(publicKey, emailAddress);
        return { ...result, publicKey, isPublicKeyPinned: false, warnings };
    }
    // Make sure the primary API key is trusted
    if (!trustedFingerprints.has(primaryKeyFingerprint)) {
        return {
            ...result,
            failure: {
                type: EncryptionPreferencesFailureTypes.WKD_USER_PRIMARY_NOT_PINNED,
                error: new Error(c('Error').t`The sending key is not trusted`)
            }
        };
    }
    // return the pinned key, not the API one
    const publicKey = pinnedKeys.find((key) => key.getFingerprint() === primaryKeyFingerprint) as OpenPGPKey;
    const warnings = getEmailMismatchWarning(publicKey, emailAddress);
    return { ...result, publicKey, isPublicKeyPinned: true, warnings };
};

const extractEncryptionPreferencesExternalWithoutWKDKeys = (publicKeyModel: PublicKeyModel): EncryptionPreferences => {
    const {
        emailAddress,
        publicKeys: { pinned: pinnedKeys } = { pinned: [] },
        encrypt,
        sign,
        scheme,
        mimeType,
        revokedFingerprints,
        expiredFingerprints
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
    const preferredKeyFingerprint = pinnedKeys[0].getFingerprint();
    const isPreferredValid =
        !revokedFingerprints.has(preferredKeyFingerprint) && !expiredFingerprints.has(preferredKeyFingerprint);
    if (!isPreferredValid) {
        return {
            ...result,
            failure: {
                type: EncryptionPreferencesFailureTypes.EXTERNAL_USER_NO_VALID_PINNED_KEY,
                error: new Error(c('Error').t`The sending key is not valid`)
            }
        };
    }
    const publicKey = pinnedKeys[0];
    const warnings = getEmailMismatchWarning(publicKey, emailAddress);
    return { ...result, publicKey, isPublicKeyPinned: true, warnings };
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

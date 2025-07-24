import { canKeyEncryptAndDecrypt } from '@proton/crypto';
import type { AddressKey, KeyPair, KeysPair } from '@proton/shared/lib/interfaces';
import { getAddressKeyPassword, getDecryptedAddressKey } from '@proton/shared/lib/keys';

export enum InvalidKeyErrorEnum {
    AddressKeySuccessError,
    AddressKeyError,
    AddressKeyTokenEmptyError,
    AddressKeyTokenError,
    AddressKeyTokenSignatureVerificationError,
    AddressKeyInactiveDecrypted,
}

export interface InvalidKeyError {
    errorMessage: string;
    errorType: InvalidKeyErrorEnum;
}

export const getInactiveKeyDecryptedError = (): InvalidKeyError => {
    return {
        errorMessage: 'Decrypted inactive key',
        errorType: InvalidKeyErrorEnum.AddressKeyInactiveDecrypted,
    };
};

export const getAddressKeyInvalidError = async ({
    addressKey,
    keyPassword,
    userKeysPair,
    organizationKey,
}: {
    addressKey: AddressKey;
    userKeysPair: KeysPair;
    keyPassword: string;
    organizationKey?: KeyPair;
}): Promise<InvalidKeyError> => {
    let password = '';
    try {
        password = await getAddressKeyPassword(addressKey, userKeysPair, keyPassword, organizationKey);
        if (!password) {
            return {
                errorMessage: 'Address key token empty',
                errorType: InvalidKeyErrorEnum.AddressKeyTokenEmptyError,
            };
        }
    } catch (e: any) {
        if (e?.name === 'SignatureError') {
            return {
                errorMessage: 'Address key token signature verification failed',
                errorType: InvalidKeyErrorEnum.AddressKeyTokenSignatureVerificationError,
            };
        }
        return {
            errorMessage: e.message || 'Address key token general error',
            errorType: InvalidKeyErrorEnum.AddressKeyTokenError,
        };
    }
    try {
        const decryptedKey = await getDecryptedAddressKey(addressKey, password);
        return (await canKeyEncryptAndDecrypt(decryptedKey.privateKey))
            ? {
                  errorMessage: 'Address key decrypted unexpectedly',
                  errorType: InvalidKeyErrorEnum.AddressKeySuccessError,
              }
            : {
                  // error details for a specific edge cases, where the key can be decrypted but was e.g. generated
                  // with corrupted key material due a WebCrypto bug on WebKit Linux, and was marked as inactive through a password reset;
                  // such key will not be able to be reactivated due to an encrypt-decrypt test done as part of the reactivation process.
                  errorMessage: 'Address key cannot be used for encryption or decryption',
                  errorType: InvalidKeyErrorEnum.AddressKeyError,
              };
    } catch (e: any) {
        return {
            errorMessage: e.message || 'Address key failed to decrypt',
            errorType: InvalidKeyErrorEnum.AddressKeyError,
        };
    }
};

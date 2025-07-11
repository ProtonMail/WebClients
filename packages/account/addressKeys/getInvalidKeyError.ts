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
        await getDecryptedAddressKey(addressKey, password);
        return {
            errorMessage: 'Address key decrypted unexpectedly',
            errorType: InvalidKeyErrorEnum.AddressKeySuccessError,
        };
    } catch (e: any) {
        return {
            errorMessage: e.message || 'Address key failed to decrypt',
            errorType: InvalidKeyErrorEnum.AddressKeyError,
        };
    }
};

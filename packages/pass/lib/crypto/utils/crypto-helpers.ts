import { stringToUtf8Array } from '@proton/crypto/lib/utils';
import {
    KEY_LENGTH_BYTES,
    generateKey,
    decryptData as genericDecryptData,
    encryptData as genericEncryptData,
    importKey,
} from '@proton/crypto/lib/subtle/aesGcm';
import type { PassEncryptionTag } from '@proton/pass/types';

export { generateKey, importKey as importSymmetricKey, KEY_LENGTH_BYTES };

export const encryptData = async (key: CryptoKey, data: Uint8Array<ArrayBuffer>, tag: PassEncryptionTag) =>
    genericEncryptData(key, data, stringToUtf8Array(tag));

export const decryptData = async (key: CryptoKey, data: Uint8Array<ArrayBuffer>, tag: PassEncryptionTag) =>
    genericDecryptData(key, data, stringToUtf8Array(tag));

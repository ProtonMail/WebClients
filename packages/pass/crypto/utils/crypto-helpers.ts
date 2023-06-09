import { stringToUtf8Array } from '@proton/crypto/lib/utils';
import type { EncryptionTag } from '@proton/pass/types';
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

export const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const ALGORITHM = 'AES-GCM';

export const getSymmetricKey = async (key: Uint8Array): Promise<CryptoKey> =>
    crypto.subtle.importKey('raw', key.slice(0, KEY_LENGTH).buffer, ALGORITHM, false, ['decrypt', 'encrypt']);

export const generateKey = (): Uint8Array => crypto.getRandomValues(new Uint8Array(KEY_LENGTH));

export const encryptData = async (key: CryptoKey, data: Uint8Array, tag: EncryptionTag) => {
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const cipher = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv, additionalData: stringToUtf8Array(tag) },
        key,
        data
    );

    return mergeUint8Arrays([iv, new Uint8Array(cipher)]);
};

export const decryptData = async (key: CryptoKey, data: Uint8Array, tag: EncryptionTag) => {
    const iv = data.slice(0, IV_LENGTH);
    const cipher = data.slice(IV_LENGTH, data.length);
    const result = await crypto.subtle.decrypt(
        { name: ALGORITHM, iv, additionalData: stringToUtf8Array(tag) },
        key,
        cipher
    );

    return new Uint8Array(result);
};

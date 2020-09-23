import { mergeUint8Arrays } from '../helpers/array';

const IV_LENGTH = 16;
const ALGORITHM = 'AES-GCM';

export const getKey = (key: Uint8Array, keyUsage: KeyUsage[] = ['decrypt', 'encrypt']) => {
    return window.crypto.subtle.importKey('raw', key.buffer, ALGORITHM, false, keyUsage);
};

export const encryptData = async (key: CryptoKey, data: Uint8Array) => {
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const cipher = await window.crypto.subtle.encrypt(
        {
            name: ALGORITHM,
            iv,
        },
        key,
        data
    );
    return mergeUint8Arrays([iv, new Uint8Array(cipher)]);
};

export const decryptData = async (key: CryptoKey, data: Uint8Array) => {
    const iv = data.slice(0, IV_LENGTH);
    const cipher = data.slice(IV_LENGTH, data.length);
    const result = await window.crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, cipher);
    return new Uint8Array(result);
};

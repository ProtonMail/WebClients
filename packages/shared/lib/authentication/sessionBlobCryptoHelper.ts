import { decryptData, encryptData, encryptDataWith16ByteIV } from '@proton/crypto/lib/subtle/aesGcm';
import { uint8ArrayToUtf8String, utf8StringToUint8Array } from '@proton/crypto/lib/utils';

import { stringToUint8Array, uint8ArrayToString } from '../helpers/encoding';

export const getEncryptedBlob = async (key: CryptoKey, data: string, additionalData?: Uint8Array<ArrayBuffer>) => {
    const result = await encryptDataWith16ByteIV(key, stringToUint8Array(data), additionalData);
    return result.toBase64();
};

export const getDecryptedBlob = async (key: CryptoKey, blob: string, additionalData?: Uint8Array<ArrayBuffer>) => {
    const result = await decryptData(key, Uint8Array.fromBase64(blob), additionalData, true);
    return uint8ArrayToString(result);
};

export const getEncryptedBlobV3 = async (key: CryptoKey, data: string, additionalData?: Uint8Array<ArrayBuffer>) => {
    const result = await encryptData(key, utf8StringToUint8Array(data), additionalData);
    return result.toBase64();
};

export const getDecryptedBlobV3 = async (key: CryptoKey, blob: string, additionalData?: Uint8Array<ArrayBuffer>) => {
    const result = await decryptData(key, Uint8Array.fromBase64(blob), additionalData);
    return uint8ArrayToUtf8String(result);
};

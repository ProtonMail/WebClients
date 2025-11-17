import { decryptData, encryptDataWith16ByteIV } from '@proton/crypto/lib/subtle/aesGcm';

import {
    stringToUint8Array,
    uint8ArrayToString,
} from '../helpers/encoding';

export const getEncryptedBlob = async (key: CryptoKey, data: string, additionalData?: Uint8Array<ArrayBuffer>) => {
    const result = await encryptDataWith16ByteIV(key, stringToUint8Array(data), additionalData);
    return result.toBase64();
};

export const getDecryptedBlob = async (key: CryptoKey, blob: string, additionalData?: Uint8Array<ArrayBuffer>) => {
    const result = await decryptData(key, Uint8Array.fromBase64(blob), additionalData, true);
    return uint8ArrayToString(result);
};

import { decryptData, encryptDataWith16ByteIV } from '@proton/crypto/lib/subtle/aesGcm';

import {
    base64StringToUint8Array,
    stringToUint8Array,
    uint8ArrayToBase64String,
    uint8ArrayToString,
} from '../helpers/encoding';

export const getEncryptedBlob = async (key: CryptoKey, data: string, additionalData?: Uint8Array<ArrayBuffer>) => {
    const result = await encryptDataWith16ByteIV(key, stringToUint8Array(data), additionalData);
    return uint8ArrayToBase64String(result);
};

export const getDecryptedBlob = async (key: CryptoKey, blob: string, additionalData?: Uint8Array<ArrayBuffer>) => {
    const result = await decryptData(key, base64StringToUint8Array(blob), additionalData, true);
    return uint8ArrayToString(result);
};

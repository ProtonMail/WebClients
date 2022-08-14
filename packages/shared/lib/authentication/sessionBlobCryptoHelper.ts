import {
    base64StringToUint8Array,
    stringToUint8Array,
    uint8ArrayToBase64String,
    uint8ArrayToString,
} from '../helpers/encoding';
import { decryptData, encryptData } from './cryptoHelper';

export const getEncryptedBlob = async (key: CryptoKey, data: string) => {
    const result = await encryptData(key, stringToUint8Array(data));
    return uint8ArrayToBase64String(result);
};

export const getDecryptedBlob = async (key: CryptoKey, blob: string) => {
    const result = await decryptData(key, base64StringToUint8Array(blob));
    return uint8ArrayToString(result);
};

import { encryptData, decryptData } from './cryptoHelper';
import {
    uint8ArrayToString,
    stringToUint8Array,
    base64StringToUint8Array,
    uint8ArrayToBase64String,
} from '../helpers/encoding';

export const getEncryptedBlob = async (key: CryptoKey, data: string) => {
    const result = await encryptData(key, stringToUint8Array(data));
    return uint8ArrayToBase64String(result);
};

export const getDecryptedBlob = async (key: CryptoKey, blob: string) => {
    const result = await decryptData(key, base64StringToUint8Array(blob));
    return uint8ArrayToString(result);
};

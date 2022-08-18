import { CryptoProxy } from '@proton/crypto';
import { arrayToBinaryString, arrayToHexString, binaryStringToArray } from '@proton/crypto/lib/utils';

import { stringToUint8Array, uint8ArrayToBase64String, uint8ArrayToString } from './encoding';

export const getSHA256String = async (data: string) => {
    const value = await CryptoProxy.computeHash({ algorithm: 'SHA256', data: binaryStringToArray(data) });
    return arrayToHexString(value);
};

export const getSHA256BinaryString = async (data: string) => {
    const value = await CryptoProxy.computeHash({ algorithm: 'SHA256', data: binaryStringToArray(data) });
    return arrayToBinaryString(value);
};

export const getSHA256Base64String = async (data: string) => {
    const value = await CryptoProxy.computeHash({ algorithm: 'SHA256', data: binaryStringToArray(data) });
    return uint8ArrayToBase64String(value);
};

export const generateRandomBytes = (numberOfBytes: number) => crypto.getRandomValues(new Uint8Array(numberOfBytes));

export const xorEncryptDecrypt = ({ key, data }: { key: string; data: string }) => {
    if (key.length !== data.length) {
        throw new Error('The length of the key and data do not match.');
    }

    const Uint8Key = stringToUint8Array(key);
    const Uint8Data = stringToUint8Array(data);

    const xored = new Uint8Array(Uint8Data.length);

    for (let j = 0; j < Uint8Data.length; j++) {
        xored[j] = +Uint8Key[j] ^ +Uint8Data[j];
    }

    return uint8ArrayToString(xored);
};

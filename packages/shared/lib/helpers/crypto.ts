import { CryptoProxy } from '@proton/crypto';
import { binaryStringToUint8Array, uint8ArrayToBinaryString } from '@proton/crypto/lib/utils';

export const getSHA256String = async (data: string) => {
    const value = await CryptoProxy.computeHash({ algorithm: 'SHA256', data: binaryStringToUint8Array(data) });
    return value.toHex();
};

export const getSHA256BinaryString = async (data: string) => {
    const value = await CryptoProxy.computeHash({ algorithm: 'SHA256', data: binaryStringToUint8Array(data) });
    return uint8ArrayToBinaryString(value);
};

export const getSHA256Base64String = async (data: string) => {
    const value = await CryptoProxy.computeHash({ algorithm: 'SHA256', data: binaryStringToUint8Array(data) });
    return value.toBase64();
};

export const generateRandomBytes = (numberOfBytes: number) => crypto.getRandomValues(new Uint8Array(numberOfBytes));

export const xorEncryptDecrypt = ({ key, data }: { key: Uint8Array<ArrayBuffer>; data: Uint8Array<ArrayBuffer> }) => {
    if (key.length !== data.length) {
        throw new Error('The length of the key and data do not match.');
    }

    const xored = new Uint8Array(data.length);

    for (let j = 0; j < data.length; j++) {
        xored[j] = key[j] ^ data[j];
    }

    return xored;
};

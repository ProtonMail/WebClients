import { stringToUtf8Array, utf8ArrayToString } from '@proton/crypto/lib/utils';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

// Browser-imposed limitation - maximum byte length for crypto.getRandomValues
const MAX_ENTROPY = 65536;

export type XorObfuscation = { v: string; m: string };

export const obfuscate = (str: string): XorObfuscation => {
    const bytes = stringToUtf8Array(str);
    const xor = new Uint8Array(Math.min(bytes.length, MAX_ENTROPY));
    crypto.getRandomValues(xor);

    for (let i = 0, len = bytes.length; i < len; i++) {
        bytes[i] ^= xor[i % xor.length];
    }

    return {
        v: uint8ArrayToBase64String(bytes),
        m: uint8ArrayToBase64String(xor),
    };
};

export const deobfuscate = (obfuscation: XorObfuscation): string => {
    const data = base64StringToUint8Array(obfuscation.v);
    const xor = base64StringToUint8Array(obfuscation.m);

    for (var i = 0, len = data.length; i < len; i++) {
        data[i] ^= xor[i % xor.length];
    }

    return utf8ArrayToString(data);
};

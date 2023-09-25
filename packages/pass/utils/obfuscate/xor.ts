import { stringToUtf8Array, utf8ArrayToString } from '@proton/crypto/lib/utils';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

export type XorObfuscation = { v: string; m: string };

export const obfuscate = (str: string): XorObfuscation => {
    const bytes = stringToUtf8Array(str);
    const xor = new Uint8Array(bytes.length);
    crypto.getRandomValues(xor);

    for (let i = 0, len = bytes.length; i < len; i++) {
        bytes[i] ^= xor[i];
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
        data[i] ^= xor[i];
    }

    return utf8ArrayToString(data);
};

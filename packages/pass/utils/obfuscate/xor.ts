import { stringToUtf8Array, utf8ArrayToString } from '@proton/crypto/lib/utils';

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
        v: bytes.toBase64(),
        m: xor.toBase64(),
    };
};

export const deobfuscate = (obfuscation: XorObfuscation): string => {
    const data = Uint8Array.fromBase64(obfuscation.v);
    const xor = Uint8Array.fromBase64(obfuscation.m);

    for (var i = 0, len = data.length; i < len; i++) {
        data[i] ^= xor[i % xor.length];
    }

    return utf8ArrayToString(data);
};

/** For credit card numbers, each digit should be represented by a single
 * byte in UTF-8. We deobfuscate only the first and last 4 digits, masking
 * everything in between with asterisks. If input length is less than 12 bytes
 * (shortest valid CC length), returns a masked string. */
export const deobfuscatePartialCCField = (obfuscation: XorObfuscation): string => {
    const data = Uint8Array.fromBase64(obfuscation.v);
    const xor = Uint8Array.fromBase64(obfuscation.m);
    const valid = data.length >= 12;

    for (let i = 0; i < data.length; i++) {
        if (valid && (i < 4 || i >= data.length - 4)) data[i] ^= xor[i % xor.length];
        else data[i] = 0x2a; /* ASCII single byte for '*' */
    }

    return utf8ArrayToString(data);
};

export const deobfuscateCCField = (obfuscation: XorObfuscation, partial: boolean): string =>
    (partial ? deobfuscatePartialCCField : deobfuscate)(obfuscation);

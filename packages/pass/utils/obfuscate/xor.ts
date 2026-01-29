import { uint8ArrayToUtf8String, utf8StringToUint8Array } from '@proton/crypto/lib/utils';

const OBFS_SCHEME_VERSION = 2;
const OBFS_MIN_MASK_SIZE = 128;
const OBFS_MAX_MASK_SIZE = 256;

/** @deprecated use XorObfuscation */
export type XorObfuscationDeprecated = {
    /** xored data as base64 */
    v: string;
    /** mask as base64 */
    m: string;
};

/** @deprecated use obfuscate */
export const obfuscateLegacy = (str: string): XorObfuscationDeprecated => {
    // Browser-imposed limitation - maximum byte length for crypto.getRandomValues
    const MAX_ENTROPY = 65536;
    const bytes = utf8StringToUint8Array(str);
    const xor = new Uint8Array(Math.min(bytes.length, MAX_ENTROPY));
    crypto.getRandomValues(xor);

    for (let i = 0, len = bytes.length; i < len; i++) bytes[i] ^= xor[i % xor.length];
    return { v: bytes.toBase64(), m: xor.toBase64() };
};

export type XorObfuscation = {
    /** obfuscation scheme version */
    s: 2;
    /** xored byte array */
    v: Uint8Array<ArrayBuffer>;
    /** mask byte array */
    m: Uint8Array<ArrayBuffer>;
};

const isV2 = (obfuscation: XorObfuscation | XorObfuscationDeprecated): obfuscation is XorObfuscation =>
    's' in obfuscation && obfuscation.s === OBFS_SCHEME_VERSION;

/** Adapts any obfuscation version to V2 format */
const adapt = (obfuscation: XorObfuscation | XorObfuscationDeprecated): XorObfuscation =>
    isV2(obfuscation)
        ? obfuscation
        : { s: OBFS_SCHEME_VERSION, v: Uint8Array.fromBase64(obfuscation.v), m: Uint8Array.fromBase64(obfuscation.m) };

/** Returns a random mask size based on input length.
 * - For short inputs (< 128 bytes): mask is 1-2x the input length (min 16 bytes)
 * - For longer inputs: mask is between 128-256 bytes */
const randomMaskSize = (inputLength: number): number => {
    if (inputLength === 0) return 0;

    if (inputLength < OBFS_MIN_MASK_SIZE) {
        const min = Math.max(16, inputLength);
        const max = Math.max(32, inputLength * 2);
        return min + Math.floor(Math.random() * (max - min + 1));
    }

    return OBFS_MIN_MASK_SIZE + Math.floor(Math.random() * (OBFS_MAX_MASK_SIZE - OBFS_MIN_MASK_SIZE + 1));
};

/** Obfuscates a string using XOR with a random mask.
 * Mask size is randomized (128-256 bytes) to prevent length inference. */
export const obfuscate = (str: string): XorObfuscation => {
    const data = utf8StringToUint8Array(str);
    const mask = new Uint8Array(randomMaskSize(data.length));
    crypto.getRandomValues(mask);

    for (let i = 0; i < data.length; i++) data[i] ^= mask[i % mask.length];

    return { s: OBFS_SCHEME_VERSION, v: data, m: mask };
};

/** Deobfuscates an XorObfuscation back to the original string. */
export const deobfuscate = (obfuscation: XorObfuscation): string => {
    const { v, m } = adapt(obfuscation);
    const data = new Uint8Array(v);

    for (let i = 0; i < data.length; i++) data[i] ^= m[i % m.length];

    return uint8ArrayToUtf8String(data);
};

/** Deobfuscates a credit card number, revealing only first and last 4 digits.
 * Middle digits are masked with asterisks. Returns fully masked string if
 * input is shorter than 12 bytes (minimum valid CC length). */
export const deobfuscatePartialCCField = (obfuscation: XorObfuscation): string => {
    const { v, m } = adapt(obfuscation);
    const data = new Uint8Array(v);
    const valid = data.length >= 12;

    for (let i = 0; i < data.length; i++) {
        if (valid && (i < 4 || i >= data.length - 4)) data[i] ^= m[i % m.length];
        else data[i] = 0x2a; /* asterisk */
    }

    return uint8ArrayToUtf8String(data);
};

/** Deobfuscates a credit card field, optionally masking middle digits. */
export const deobfuscateCCField = (obfuscation: XorObfuscation, partial: boolean): string =>
    (partial ? deobfuscatePartialCCField : deobfuscate)(obfuscation);

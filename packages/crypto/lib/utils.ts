// This module should be kept free of functions that require 'openpgp'
const ifDefined =
    <T, R>(cb: (input: T) => R) =>
    <U extends T | undefined>(input: U) => {
        return (input !== undefined ? cb(input as T) : undefined) as U extends T ? R : undefined;
    };
export const encodeUtf8 = ifDefined((input: string) => unescape(encodeURIComponent(input)));
export const decodeUtf8 = ifDefined((input: string) => decodeURIComponent(escape(input)));
export const encodeBase64 = ifDefined((input: string) => btoa(input).trim());
export const decodeBase64 = ifDefined((input: string) => atob(input.trim()));
export const encodeUtf8Base64 = ifDefined((input: string) => encodeBase64(encodeUtf8(input)));
export const decodeUtf8Base64 = ifDefined((input: string) => decodeUtf8(decodeBase64(input)));

const isString = (data: any): data is string | String => {
    return typeof data === 'string' || data instanceof String;
};

/**
 * Convert a string to an array of 8-bit integers
 * @param str String to convert
 * @returns An array of 8-bit integers
 */
export const binaryStringToArray = (str: string) => {
    if (!isString(str)) {
        throw new Error('binaryStringToArray: Data must be in the form of a string');
    }

    const result = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        result[i] = str.charCodeAt(i);
    }
    return result;
};

/**
 * Encode an array of 8-bit integers as a string
 * @param bytes data to encode
 * @return string-encoded bytes
 */
export const arrayToBinaryString = (bytes: Uint8Array<ArrayBuffer>) => {
    const result = [];
    const bs = 1 << 14;
    const j = bytes.length;

    for (let i = 0; i < j; i += bs) {
        // @ts-ignore Uint8Array treated as number[]
        result.push(String.fromCharCode.apply(String, bytes.subarray(i, i + bs < j ? i + bs : j)));
    }
    return result.join('');
};

/**
 * Convert a hex string to an array of 8-bit integers
 * @param hex  A hex string to convert
 * @returns An array of 8-bit integers
 */
export const hexStringToArray = (hex: string) => {
    const result = new Uint8Array(hex.length >> 1);
    for (let k = 0; k < result.length; k++) {
        const i = k << 1;
        result[k] = parseInt(hex.substring(i, i + 2), 16);
    }
    return result;
};

/**
 * Convert an array of 8-bit integers to a hex string
 * @param bytes Array of 8-bit integers to convert
 * @returns Hexadecimal representation of the array
 */
export const arrayToHexString = (bytes: Uint8Array<ArrayBuffer>) => {
    const hexAlphabet = '0123456789abcdef';
    let s = '';
    bytes.forEach((v) => {
        s += hexAlphabet[v >> 4] + hexAlphabet[v & 15];
    });
    return s;
};

/**
 * Convert a native javascript string to a Uint8Array of utf8 bytes
 * @param str - The string to convert
 * @returns A valid squence of utf8 bytes.
 */
export function stringToUtf8Array(str: string): Uint8Array<ArrayBuffer> {
    const encoder = new TextEncoder();

    return encoder.encode(str);
}

/**
 * Convert a Uint8Array of utf8 bytes to a native javascript string
 * @param utf8 - A valid squence of utf8 bytes
 * @returns A native javascript string.
 */
export function utf8ArrayToString(utf8: Uint8Array<ArrayBuffer>): string {
    const decoder = new TextDecoder();

    return decoder.decode(utf8);
}

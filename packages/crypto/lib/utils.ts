// This module should be kept free of functions that require 'openpgp'

const isString = (data: any): data is string | String => {
    return typeof data === 'string' || data instanceof String;
};

/**
 * Encode an array of bytes as a string where each character encodes 8 bits.
 * NB: this helper is not the same as `utf8ArrayToString`: the latter expects the input bytes to
 * encode valid utf8 data, to avoid data loss.
 * Instead, this helper takes any binary data in input, and the result can be serialized back into
 * the original bytes using `binaryStringToUint8Array`.
 * @dev For new applications, using this helper is not recommended: base64 or hex encoding should be preferred
 * to avoid ambiguity about the encoding method used.
 */
export const uint8ArrayToBinaryString = (bytes: Uint8Array<ArrayBuffer>) => {
    const result = [];
    const bs = 1 << 14;
    const j = bytes.length;

    for (let i = 0; i < j; i += bs) {
        // @ts-ignore expects number[] instead of Uint8Array
        result.push(String.fromCharCode.apply(String, bytes.subarray(i, Math.min(i + bs, j))));
    }
    return result.join('');
};

/**
 * Convert a 8-bit string to an array of 8-bit integers.
 * NB: if the input string includes characters that cannot be encoded using 8 bits (e.g. special utf8 chars),
 * the conversion will result in data loss.
 * To encode utf8 data into bytes, you should be using `stringToUtf8Array`.
 * This helper is instead intended to be used to e.g. encode back strings returned by `uint8uint8ArrayToBinaryString`.
 */
export const binaryStringToUint8Array = (binaryString: string) => {
    if (!isString(binaryString)) {
        throw new Error('binaryStringToUint8Array: Data must be in the form of a string');
    }

    const result = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        result[i] = binaryString.charCodeAt(i);
    }
    return result;
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

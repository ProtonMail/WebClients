import { encodeBase64, decodeBase64 } from './base64';

/**
 * NOTE: These functions exist in openpgp, but in order to load the application
 * without having to load openpgpjs they are added here.
 */
export const uint8ArrayToString = (bytes: Uint8Array): string => {
    const buffer = new Uint8Array(bytes);
    const bs = 1 << 14;
    const j = bytes.length;
    const result = [];
    for (let i = 0; i < j; i += bs) {
        // @ts-ignore
        // eslint-disable-next-line prefer-spread
        result.push(String.fromCharCode.apply(String, buffer.subarray(i, i + bs < j ? i + bs : j)));
    }
    return result.join('');
};

export const stringToUint8Array = (str: string) => {
    const result = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        result[i] = str.charCodeAt(i);
    }
    return result;
};

export const uint8ArrayToBase64String = (array: Uint8Array) => encodeBase64(uint8ArrayToString(array));

export const base64StringToUint8Array = (string: string) => stringToUint8Array(decodeBase64(string) || '');

/**
 * Encode a binary string in the so-called base64 URL (https://tools.ietf.org/html/rfc4648#section-5)
 * @dev Each character in a binary string can only be one of the characters in a reduced 255 ASCII alphabet. I.e. morally each character is one byte
 * @dev This function will fail if the argument contains characters which are not in this alphabet
 * @dev This encoding works by converting groups of three "bytes" into groups of four base64 characters (2 ** 6 ** 4 is also three bytes)
 * @dev Therefore, if the argument string has a length not divisible by three, the returned string will be padded with one or two '=' characters
 */
export const encodeBase64URL = (str: string, removePadding = true) => {
    const base64String = encodeBase64(str).replace(/\+/g, '-').replace(/\//g, '_');

    return removePadding ? base64String.replace(/=/g, '') : base64String;
};

/**
 * Convert a string encoded in base64 URL into a binary string
 * @param str
 */
export const decodeBase64URL = (str: string) => {
    return decodeBase64((str + '==='.slice((str.length + 3) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
};

export const uint8ArrayToPaddedBase64URLString = (array: Uint8Array) =>
    encodeBase64URL(uint8ArrayToString(array), false);

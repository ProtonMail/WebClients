import { arrayToBinaryString, binaryStringToArray, decodeBase64, encodeBase64 } from '@proton/crypto/lib/utils';

export const uint8ArrayToString = arrayToBinaryString;

export const stringToUint8Array = binaryStringToArray;

export const uint8ArrayToBase64String = (array: Uint8Array<ArrayBuffer>) => encodeBase64(uint8ArrayToString(array));

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

export const uint8ArrayToPaddedBase64URLString = (array: Uint8Array<ArrayBuffer>) =>
    encodeBase64URL(uint8ArrayToString(array), false);

export const validateBase64string = (str: string, useVariantAlphabet?: boolean) => {
    const regex = useVariantAlphabet ? /^[-_A-Za-z0-9]*={0,3}$/ : /^[+/A-Za-z0-9]*={0,3}$/;

    return regex.test(str);
};

/**
 * Automatic password reset parameter encoder
 */
export const encodeAutomaticResetParams = (json: any) => {
    const jsonString = JSON.stringify(json);
    return encodeBase64URL(jsonString);
};

/**
 * Automatic password reset parameter decoder
 */
export const decodeAutomaticResetParams = (base64String: string) => {
    const decodedString = decodeBase64URL(base64String);
    return JSON.parse(decodedString);
};

/**
 * Convert a Blob into a Uint8Array
 */
export const blobToUint8Array = async (blob: Blob) => new Uint8Array(await blob.arrayBuffer());

/**
 * Convert a Uint8Array into a Blob
 */
export const uint8ArrayToBlob = (uint8Array: Uint8Array<ArrayBuffer>, mimeType = 'application/octet-stream') =>
    new Blob([uint8Array], { type: mimeType });

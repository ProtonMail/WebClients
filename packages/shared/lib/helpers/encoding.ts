import { binaryStringToUint8Array, uint8ArrayToBinaryString } from '@protontech/crypto/utils';

export { uint8ArrayToBinaryString, binaryStringToUint8Array };

/**
 * Convert a utf8 string to a so-called binary string, where each character can be encoded as one byte.
 * The conversion done is equivalent to encoding the utf8 string to bytes (using the utf8 encoder)
 * and decoding them back as 8-bit ASCII characters.
 */
export const utf8StringToBinaryString = (input: string) => unescape(encodeURIComponent(input));

export const validateBase64string = (str: string, useVariantAlphabet?: boolean) => {
    const regex = useVariantAlphabet ? /^[-_A-Za-z0-9]*={0,3}$/ : /^[+/A-Za-z0-9]*={0,3}$/;

    return regex.test(str);
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

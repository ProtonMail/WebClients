import { arrayToBinaryString, binaryStringToArray, decodeBase64, encodeBase64 } from 'pmcrypto';

/**
 * @param {Uint8Array} array
 * @returns {String}
 */
export const serializeUint8Array = (array) => encodeBase64(arrayToBinaryString(array));

/**
 * @param {String} string
 * @returns {Uint8Array}
 */
export const deserializeUint8Array = (string) => binaryStringToArray(decodeBase64(string));

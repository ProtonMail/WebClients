import { arrayToBinaryString, binaryStringToArray, decodeBase64, encodeBase64 } from 'pmcrypto';

export const serializeUint8Array = (array: Uint8Array) => encodeBase64(arrayToBinaryString(array));

export const deserializeUint8Array = (string: string) => binaryStringToArray(decodeBase64(string) || '');

import { encodeBase64, decodeBase64 } from 'pmcrypto';
import { arrayToBinaryString, binaryStringToArray } from 'proton-shared/lib/helpers/string';

export const arrayToBase64 = (data: Uint8Array): string => encodeBase64(arrayToBinaryString(data)) || '';

export const base64ToArray = (data: string): Uint8Array => binaryStringToArray(decodeBase64(data) || '');

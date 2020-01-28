import { encodeBase64, decodeBase64 } from 'pmcrypto';
import { arrayToBinaryString, binaryStringToArray } from 'proton-shared/lib/helpers/string';
import { Binary } from '../models/utils';

export const arrayToBase64 = (data: Binary): string => encodeBase64(arrayToBinaryString(data)) || '';

export const base64ToArray = (data: string): Binary => binaryStringToArray(decodeBase64(data) || '');

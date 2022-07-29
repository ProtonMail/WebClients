import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

export const arrayToBase64 = (data: Uint8Array): string => uint8ArrayToBase64String(data) || '';

export const base64ToArray = (data: string): Uint8Array => base64StringToUint8Array(data);

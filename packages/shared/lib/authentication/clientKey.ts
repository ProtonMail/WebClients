import { generateKey, importKey } from '@proton/crypto/lib/subtle/aesGcm';

import { base64StringToUint8Array, uint8ArrayToBase64String } from '../helpers/encoding';

export const getParsedClientKey = (value: string) => {
    return base64StringToUint8Array(value);
};

const getSerializedClientKey = (value: Uint8Array<ArrayBuffer>) => {
    return uint8ArrayToBase64String(value);
};

export const getClientKey = (value: string) => {
    return importKey(getParsedClientKey(value));
};

export const generateClientKey = async () => {
    const data = generateKey();
    const serializedData = getSerializedClientKey(data);
    const key = await importKey(data);

    return {
        data,
        serializedData,
        key,
    };
};

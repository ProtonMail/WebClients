import { generateKey, importKey } from '@proton/crypto/lib/subtle/aesGcm';

export const getParsedClientKey = (value: string) => {
    return Uint8Array.fromBase64(value);
};

const getSerializedClientKey = (value: Uint8Array<ArrayBuffer>) => {
    return value.toBase64();
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

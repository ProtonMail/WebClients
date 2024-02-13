import { base64StringToUint8Array, uint8ArrayToBase64String } from '../helpers/encoding';
import { getKey } from './cryptoHelper';

export const getParsedClientKey = (value: string) => {
    return base64StringToUint8Array(value);
};

const getSerializedClientKey = (value: Uint8Array) => {
    return uint8ArrayToBase64String(value);
};

export const getClientKey = (value: string) => {
    return getKey(getParsedClientKey(value));
};

export const generateClientKey = async () => {
    const data = crypto.getRandomValues(new Uint8Array(32));
    const serializedData = getSerializedClientKey(data);
    const key = await getKey(data);

    return {
        data,
        serializedData,
        key,
    };
};

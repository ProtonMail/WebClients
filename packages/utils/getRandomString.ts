import getRandomValues from '@proton/get-random-values';

export const DEFAULT_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export default function getRandomString(length: number, charset = DEFAULT_CHARSET) {
    const values = getRandomValues(new Uint32Array(length));

    let result = '';
    for (let i = 0; i < length; i++) {
        result += charset[values[i] % charset.length];
    }

    return result;
}

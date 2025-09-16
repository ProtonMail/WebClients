export const DEFAULT_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
export const DEFAULT_LOWERCASE_CHARSET = 'abcdefghijklmnopqrstuvwxyz';

export default function getRandomString(length: number, charset = DEFAULT_CHARSET) {
    const values = crypto.getRandomValues(new Uint32Array(length));

    let result = '';
    for (let i = 0; i < length; i++) {
        result += charset[values[i] % charset.length];
    }

    return result;
}

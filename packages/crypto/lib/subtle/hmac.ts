const HASH_ALGORITHM = 'SHA-256';
const KEY_LENGTH_BYTES = 32;
export type HmacCryptoKey = CryptoKey;

type HmacKeyUsage = 'sign' | 'verify';

/**
 * Import an HMAC-SHA256 key in order to use it with `signData` and `verifyData`.
 */
export const importKey = async (
    key: Uint8Array<ArrayBuffer>,
    keyUsage: HmacKeyUsage[] = ['sign', 'verify']
): Promise<HmacCryptoKey> => {
    // From https://datatracker.ietf.org/doc/html/rfc2104:
    // The key for HMAC can be of any length (keys longer than B bytes are first hashed using H).
    // However, less than L bytes (L = 32 bytes for SHA-256) is strongly discouraged as it would
    // decrease the security strength of the function.  Keys longer than L bytes are acceptable
    // but the extra length would not significantly increase the function strength.
    // (A longer key may be advisable if the randomness of the key is considered weak.)
    if (key.length < KEY_LENGTH_BYTES) {
        throw new Error('Unexpected HMAC key size: key is too short');
    }
    return crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: HASH_ALGORITHM }, false, keyUsage);
};

/**
 * Sign data using HMAC-SHA256
 * @param key - WebCrypto secret key for signing
 * @param data - data to sign
 * @param additionalData - additional data to authenticate
 */
export const signData = async (key: HmacCryptoKey, data: Uint8Array<ArrayBuffer>) => {
    const signatureBuffer = await crypto.subtle.sign({ name: 'HMAC', hash: HASH_ALGORITHM }, key, data);
    return new Uint8Array(signatureBuffer);
};

/**
 * Verify data using HMAC-SHA256
 * @param key - WebCrypto secret key for verification
 * @param signature - signature over data
 * @param data - data to verify
 * @param additionalData - additional data to authenticate
 */
export const verifyData = async (key: HmacCryptoKey, signature: Uint8Array<ArrayBuffer>, data: Uint8Array<ArrayBuffer>) => {
    return crypto.subtle.verify({ name: 'HMAC', hash: HASH_ALGORITHM }, key, signature, data);
};

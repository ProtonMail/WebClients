import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

export const KEY_LENGTH_BYTES = 32;
const IV_LENGTH_BYTES = 12;
export const ENCRYPTION_ALGORITHM = 'AES-GCM';
export type AesCryptoKey = CryptoKey;

/**
 * Import an AES-GCM key in order to use it with `encryptData` and `decryptData`.
 */
export const importKey = async (
    key: Uint8Array,
    keyUsage: KeyUsage[] = ['decrypt', 'encrypt']
): Promise<AesCryptoKey> => {
    return crypto.subtle.importKey('raw', key, ENCRYPTION_ALGORITHM, false, keyUsage);
};

/**
 * Generate key (bytes) for AES-GCM.
 * The key needs to be imported using `importKey` to used for `encryptData` and `decryptData`.
 */
export const generateKey = (): Uint8Array => crypto.getRandomValues(new Uint8Array(KEY_LENGTH_BYTES));

/**
 * Encrypt data using AES-GCM
 * @param key - WebCrypto key for encryption
 * @param data - data to encrypt
 * @param additionalData - additional data to authenticate
 */
export const encryptData = async (key: AesCryptoKey, data: Uint8Array, additionalData?: Uint8Array) => {
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
    const ciphertext = await crypto.subtle.encrypt(
        { name: ENCRYPTION_ALGORITHM, iv, ...(additionalData !== undefined ? { additionalData } : undefined) },
        key,
        data
    );

    return mergeUint8Arrays([iv, new Uint8Array(ciphertext)]);
};

/**
 * Decrypt data using AES-GCM
 * @param key - WebCrypto key for decryption
 * @param data - ciphertext to decrypt
 * @param additionalData - additional authenticated data
 * @param with16ByteIV - whether a non-standard IV size of 16 bytes was used on encryption
 */
export const decryptData = async (
    key: AesCryptoKey,
    data: Uint8Array,
    additionalData?: Uint8Array,
    with16ByteIV = false
) => {
    const ivLength = with16ByteIV ? 16 : IV_LENGTH_BYTES;
    const iv = data.slice(0, ivLength);
    const ciphertext = data.slice(ivLength, data.length);
    const result = await crypto.subtle.decrypt(
        { name: ENCRYPTION_ALGORITHM, iv, ...(additionalData !== undefined ? { additionalData } : undefined) },
        key,
        ciphertext
    );

    return new Uint8Array(result);
};

/**
 * DEPRECATED: use `encryptData` instead.
 * This function encrypts using a non-standard IV of 16 bytes, which can be problematic if a large number of
 * messages is encrypted with the same key.
 * This function will be removed once the new version of fork & session blobs is implemented for authentication.
 * @param key - WebCrypto key for encryption
 * @param data - data to encrypt
 * @param additionalData - additional data to authenticate
 * @deprecated use `encryptData` instead; this helper is kept around for legacy use-cases only.
 */
export const encryptDataWith16ByteIV = async (key: AesCryptoKey, data: Uint8Array, additionalData?: Uint8Array) => {
    const ivLength = 16;
    const iv = crypto.getRandomValues(new Uint8Array(ivLength));
    const ciphertext = await crypto.subtle.encrypt(
        { name: ENCRYPTION_ALGORITHM, iv, ...(additionalData !== undefined ? { additionalData } : undefined) },
        key,
        data
    );

    return mergeUint8Arrays([iv, new Uint8Array(ciphertext)]);
};

import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

export const KEY_LENGTH_BYTES = 32;
const IV_LENGTH_BYTES = 12;
export const ENCRYPTION_ALGORITHM = 'AES-GCM';
export type AesCryptoKey = CryptoKey;

type AesGcmKeyUsage = 'decrypt' | 'encrypt';
interface AesGcmKeyOptions {
    /** allowed key operations */
    keyUsage?: AesGcmKeyUsage[];
    /** whether the key can be exported using `subtle.crypto.exportKey` */
    extractable?: boolean;
}

/**
 * Import an AES-GCM key in order to use it with `encryptData` and `decryptData`.
 */
export const importKey = async (
    key: Uint8Array,
    keyUsage: AesGcmKeyUsage[] = ['decrypt', 'encrypt']
): Promise<AesCryptoKey> => {
    return crypto.subtle.importKey('raw', key, ENCRYPTION_ALGORITHM, false, keyUsage);
};

/**
 * Generate key (bytes) for AES-GCM.
 * The key needs to be imported using `importKey` to used for `encryptData` and `decryptData`.
 */
export const generateKey = (): Uint8Array => crypto.getRandomValues(new Uint8Array(KEY_LENGTH_BYTES));

/**
 * Use HKDF to derive AES-GCM key material from some high-entropy secret.
 * NB: this is NOT designed to derive keys from relatively low-entropy inputs such as passwords.
 * @param highEntropySecret - input key material for HKDF
 * @param salt - HKDF salt
 * @param info - context or application specific information to bind to the derived key
 */
export const deriveKey = async (
    highEntropySecret: Uint8Array,
    salt: Uint8Array,
    info: Uint8Array,
    { keyUsage = ['decrypt', 'encrypt'], extractable = false }: AesGcmKeyOptions = {}
) => {
    // This is meant more as a sanity check than a security safe-guard, since entropy might still be
    // too low even for longer inputs
    if (highEntropySecret.length < 16) {
        throw new Error('Unexpected HKDF input size: secret input is too short');
    }

    const inputKeyMaterial = await crypto.subtle.importKey('raw', highEntropySecret, 'HKDF', false, ['deriveKey']);

    return crypto.subtle.deriveKey(
        { name: 'HKDF', salt, info, hash: 'SHA-256' },
        inputKeyMaterial,
        { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH_BYTES * 8 },
        extractable,
        keyUsage
    );
};

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
 * This function encrypts using a non-standard IV of 16 bytes.
 * @param key - WebCrypto key for encryption
 * @param data - data to encrypt
 * @param additionalData - additional data to authenticate
 * @deprecated use `encryptData` instead; this helper is kept around for legacy use-cases only.
 */
export const encryptDataWith16ByteIV = async (key: AesCryptoKey, data: Uint8Array, additionalData?: Uint8Array) => {
    const ivLength = 16;
    // A random 16-byte IV is non-standard, but it does not negatively affect the max number of encryptable messages using the same key,
    // nor does it increase the risk of nonce collision; see summary at https://crypto.stackexchange.com/a/80390.
    const iv = crypto.getRandomValues(new Uint8Array(ivLength));
    const ciphertext = await crypto.subtle.encrypt(
        { name: ENCRYPTION_ALGORITHM, iv, ...(additionalData !== undefined ? { additionalData } : undefined) },
        key,
        data
    );

    return mergeUint8Arrays([iv, new Uint8Array(ciphertext)]);
};

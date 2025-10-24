/**
 * The encrypted-search package requires specific helpers as it was implemented
 * before the 'subtle' helpers were introduced. The differences are:
 * - AES-128 is used instead of AES-256 (this is for performance considerations; security-wise, the shorter key is acceptable as ES data is only stored locally)
 * - the ciphertext-IV encoding uses JSON instead of serialized binary (this should be refactored in a future version of ES)
 * - encryption does not rely on associatedData
 */
import { type AesGcmCryptoKey, ENCRYPTION_ALGORITHM } from '../aesGcm';

const ES_KEY_LENGTH_BYTES = 16;
const IV_LENGTH_BYTES = 12;

export type IndexKey = AesGcmCryptoKey;
export type GeneratedIndexKey = { indexKey: AesGcmCryptoKey; exportedJsonKey: JsonWebKey };
export const generateIndexKey = async (): Promise<GeneratedIndexKey> => {
    const indexKey = await crypto.subtle.generateKey(
        { name: ENCRYPTION_ALGORITHM, length: ES_KEY_LENGTH_BYTES * 8 },
        true,
        ['decrypt', 'encrypt']
    );
    const exportedJsonKey = await crypto.subtle.exportKey('jwk', indexKey);

    return {
        indexKey,
        exportedJsonKey,
    };
};

export const importIndexKey = (jwkKey: JsonWebKey) => {
    return crypto.subtle.importKey('jwk', jwkKey, ENCRYPTION_ALGORITHM, false, ['decrypt', 'encrypt']);
};

/**
 * Object containing the ciphertext of items as stored in IDB
 */
export interface ESCiphertext {
    iv: Uint8Array<ArrayBuffer>;
    ciphertext: ArrayBuffer;
}

export const encryptItem = async (
    indexKey: IndexKey,
    serializedItem: Uint8Array<ArrayBuffer>
): Promise<ESCiphertext> => {
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));

    const ciphertext = await crypto.subtle.encrypt({ iv, name: ENCRYPTION_ALGORITHM }, indexKey, serializedItem);

    return { iv, ciphertext };
};

export const decryptItem = async (
    indexKey: IndexKey,
    { iv, ciphertext }: ESCiphertext
): Promise<Uint8Array<ArrayBuffer>> => {
    const serializedItem = await crypto.subtle.decrypt({ iv, name: ENCRYPTION_ALGORITHM }, indexKey, ciphertext);

    return new Uint8Array(serializedItem);
};

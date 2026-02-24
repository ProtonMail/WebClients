import {
    decryptData,
    deriveKey,
    encryptData,
    exportKey,
    generateKey as generateAesGcmKeyBytes,
    generateWrappingKey as generateAesWrapKeyBytes,
    importKey as importAesGcmKey,
    importWrappingKey,
    unwrapKey,
    wrapKey,
} from '@proton/crypto/lib/subtle/aesGcm';
import {computeSHA256} from '@proton/crypto/lib/subtle/hash';
import {uint8ArrayToUtf8String, utf8StringToUint8Array} from '@proton/crypto/lib/utils';

import {type AdString, type Base64, type EncryptedData, isOldEncryptedData} from '../types';
import type {AesGcmCryptoKey, AesKwCryptoKey} from './types';

export const generateMasterKeyBytes = () => generateAesWrapKeyBytes();
export const generateSpaceKeyBytes = () => generateAesGcmKeyBytes(); // meant to go through HKDF to achieve domain separation (e.g. `SPACE_DEK_CONTEXT`)
export const generateRequestKeyBytes = () => generateAesGcmKeyBytes();

export const generateSpaceKeyBase64 = () => generateSpaceKeyBytes().toBase64();
export const generateMasterKeyBase64 = () => generateMasterKeyBytes().toBase64();

export async function encryptString(
    plaintext: string,
    { encryptKey }: AesGcmCryptoKey,
    adString?: string
): Promise<string> {
    const plaintextBytes = utf8StringToUint8Array(plaintext);
    const adBytes = adString ? utf8StringToUint8Array(adString) : undefined;
    const result = await encryptData(encryptKey, plaintextBytes, adBytes);
    return result.toBase64();
}

export async function encryptUint8Array(
    plaintextBytes: Uint8Array<ArrayBuffer>,
    { encryptKey }: AesGcmCryptoKey,
    adString?: string
): Promise<string> {
    const adBytes = adString ? utf8StringToUint8Array(adString) : undefined;
    const result = await encryptData(encryptKey, plaintextBytes, adBytes);
    return result.toBase64();
}

export async function cryptoKeyToBase64(key: CryptoKey): Promise<Base64> {
    const exportedKey = await exportKey(key);
    return exportedKey.toBase64();
}

export async function bytesToAesGcmCryptoKey(
    bytes: Uint8Array<ArrayBuffer>,
    extractable?: boolean
): Promise<AesGcmCryptoKey> {
    if (bytes.length !== 32) {
        throw new Error('Unexpected AES-GCM key size');
    }
    const encryptKey = await importAesGcmKey(bytes, { extractable });
    return {
        type: 'AesGcmCryptoKey',
        encryptKey,
    };
}

async function base64ToAesGcmCryptoKey(base64Key: string, extractable?: boolean): Promise<AesGcmCryptoKey> {
    const bytes = Uint8Array.fromBase64(base64Key);
    return bytesToAesGcmCryptoKey(bytes, extractable);
}

export const base64ToSpaceKey = base64ToAesGcmCryptoKey;

export async function bytesToAesWrapKey(bytes: Uint8Array<ArrayBuffer>): Promise<AesKwCryptoKey> {
    const wrappingKey = await importWrappingKey(bytes);
    return {
        type: 'AesKwCryptoKey',
        wrappingKey,
    };
}

export async function base64ToAesWrapKey(base64Key: string): Promise<AesKwCryptoKey> {
    const bytes = Uint8Array.fromBase64(base64Key);
    return bytesToAesWrapKey(bytes);
}

export const base64ToMasterKey = base64ToAesWrapKey;
export const bytesToMasterKey = bytesToAesWrapKey;

export async function decryptUint8Array(
    encryptedBase64: EncryptedData,
    { encryptKey }: AesGcmCryptoKey,
    ad: AdString
): Promise<Uint8Array<ArrayBuffer>> {
    let encryptedBytes: Uint8Array<ArrayBuffer>;
    if (typeof encryptedBase64 === 'string') {
        encryptedBytes = Uint8Array.fromBase64(encryptedBase64);
    } else if (isOldEncryptedData(encryptedBase64)) {
        // Messages stored before Jan 2025 can have this { iv, data } structure instead of all-concatenated "$iv$data".
        // We make sure we still handle them.
        const { iv, data } = encryptedBase64;
        const concat = `${iv}${data}`;
        encryptedBytes = Uint8Array.fromBase64(concat);
    } else {
        throw new Error('Unexpected shape for EncryptedData');
    }
    const adBytes = utf8StringToUint8Array(ad);
    try {
        return await decryptData(encryptKey, encryptedBytes, adBytes);
    } catch (error) {
        if (error instanceof DOMException && error.name === 'OperationError' && ad !== undefined) {
            // prettier-ignore
            console.error(
                'Error during decryption. A possible cause is an incorrect AD. ' +
                'This payload was attempted to be decrypted with the following AD, make sure it matches the AD used during encryption.\n' +
                `AD = ${ad}`
            );
        }
        throw error;
    }
}

export async function decryptString(
    encryptedBase64: EncryptedData,
    key: AesGcmCryptoKey,
    ad: AdString
): Promise<string> {
    const decryptedBytes = await decryptUint8Array(encryptedBase64, key, ad);
    return uint8ArrayToUtf8String(decryptedBytes);
}

const SPACE_KEY_DERIVATION_SALT = 'Xd6V94/+5BmLAfc67xIBZcjsBPimm9/j02kHPI7Vsuc=';
const SPACE_DEK_CONTEXT = 'dek.space.lumo';
const HKDF_PARAMS_SPACE_DATA_ENCRYPTION = {
    salt: Uint8Array.fromBase64(SPACE_KEY_DERIVATION_SALT),
    info: utf8StringToUint8Array(SPACE_DEK_CONTEXT),
};

const SEARCH_INDEX_KEY_DERIVATION_SALT = 'pct0RupKjBBJ/mTxU0XxJQnA+jfcvkn9IFcnB/FNdLA=';
const SEARCH_INDEX_DEK_CONTEXT = 'dek.search_index.lumo';
const HKDF_PARAMS_SEARCH_INDEX_ENCRYPTION = {
    salt: Uint8Array.fromBase64(SEARCH_INDEX_KEY_DERIVATION_SALT),
    info: utf8StringToUint8Array(SEARCH_INDEX_DEK_CONTEXT),
};

export async function deriveDataEncryptionKey(spaceKeyBytes: Uint8Array<ArrayBuffer>): Promise<AesGcmCryptoKey> {
    const encryptKey = await deriveKey(
        spaceKeyBytes,
        HKDF_PARAMS_SPACE_DATA_ENCRYPTION.salt,
        HKDF_PARAMS_SPACE_DATA_ENCRYPTION.info
    );
    return {
        type: 'AesGcmCryptoKey',
        encryptKey,
    };
}

/**
 * Generate a new search index key (same as space key generation).
 */
export const generateSearchIndexKeyBytes = () => generateAesGcmKeyBytes();
export const generateSearchIndexKeyBase64 = () => generateSearchIndexKeyBytes().toBase64();

/**
 * Derives the DEK for the search index from the search index key.
 * Uses a separate HKDF context ('dek.search_index.lumo') for proper domain separation.
 */
export async function deriveSearchIndexDek(searchIndexKeyBytes: Uint8Array<ArrayBuffer>): Promise<AesGcmCryptoKey> {
    const encryptKey = await deriveKey(
        searchIndexKeyBytes,
        HKDF_PARAMS_SEARCH_INDEX_ENCRYPTION.salt,
        HKDF_PARAMS_SEARCH_INDEX_ENCRYPTION.info
    );
    return {
        type: 'AesGcmCryptoKey',
        encryptKey,
    };
}

/**
 * Convert base64 search index key to AesGcmCryptoKey
 */
export const base64ToSearchIndexKey = base64ToAesGcmCryptoKey;

export async function wrapAesKey(
    keyToWrap: AesGcmCryptoKey,
    { wrappingKey }: AesKwCryptoKey
): Promise<Uint8Array<ArrayBuffer>> {
    const wrappedBytes = await wrapKey(keyToWrap.encryptKey, wrappingKey);
    return wrappedBytes;
}

export async function unwrapAesKey(
    encryptedKeyBytes: Uint8Array<ArrayBuffer>,
    masterKey: AesKwCryptoKey,
    extractable?: boolean
): Promise<AesGcmCryptoKey> {
    try {
        const { wrappingKey } = masterKey;
        const encryptKey = await unwrapKey(encryptedKeyBytes, wrappingKey, { extractable });
        return {
            type: 'AesGcmCryptoKey',
            encryptKey,
        };
    } catch (e) {
        // todo OperationError is the class of error that indicates (among other things) a wrong wrapping key
        throw new Error(`error while unwrapping aes key: are you sure it was wrapped with this wrapping key? ${e}`);
    }
}

export async function computeSha256AsBase64(input: string, urlSafe: boolean = false): Promise<Base64> {
    const data = utf8StringToUint8Array(input);
    const hashBytes = await computeSHA256(data);
    let hashString = hashBytes.toBase64();
    if (urlSafe) {
        hashString = hashString.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    return hashString;
}

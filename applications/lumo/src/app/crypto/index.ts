import {
    decryptData,
    deriveKey,
    encryptData,
    generateKey as generateAesGcmKeyBytes,
    generateWrappingKey as generateAesWrapKeyBytes,
    importKey as importAesGcmKey,
    importWrappingKey,
    unwrapKey,
    wrapKey,
} from '@proton/crypto/lib/subtle/aesGcm';
import { stringToUtf8Array, utf8ArrayToString } from '@proton/crypto/lib/utils';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

import { type AdString, type Base64, type EncryptedData, isOldEncryptedData } from '../types';
import type { AesGcmCryptoKey, AesKwCryptoKey } from './types';

export const generateMasterKeyBytes = () => generateAesWrapKeyBytes();
export const generateSpaceKeyBytes = () => generateAesGcmKeyBytes(); // meant to go through HKDF to achieve domain separation (e.g. `SPACE_DEK_CONTEXT`)
export const generateRequestKeyBytes = () => generateAesGcmKeyBytes();

export const generateSpaceKeyBase64 = () => uint8ArrayToBase64String(generateSpaceKeyBytes());
export const generateMasterKeyBase64 = () => uint8ArrayToBase64String(generateMasterKeyBytes());

export async function encryptString(
    plaintext: string,
    { encryptKey }: AesGcmCryptoKey,
    adString?: string
): Promise<string> {
    const plaintextBytes = stringToUtf8Array(plaintext);
    const adBytes = adString ? stringToUtf8Array(adString) : undefined;
    const result = await encryptData(encryptKey, plaintextBytes, adBytes);
    return uint8ArrayToBase64String(result);
}

export async function encryptUint8Array(
    plaintextBytes: Uint8Array,
    { encryptKey }: AesGcmCryptoKey,
    adString?: string
): Promise<string> {
    const adBytes = adString ? stringToUtf8Array(adString) : undefined;
    const result = await encryptData(encryptKey, plaintextBytes, adBytes);
    return uint8ArrayToBase64String(result);
}

export async function cryptoKeyToBase64(key: CryptoKey): Promise<Base64> {
    const exportedKey = await crypto.subtle.exportKey('raw', key);
    const keyBuffer = new Uint8Array(exportedKey);
    return uint8ArrayToBase64String(keyBuffer);
}

export async function cryptoKeyToBytes(key: CryptoKey): Promise<Uint8Array> {
    const exportedKey = await crypto.subtle.exportKey('raw', key);
    const keyBuffer = new Uint8Array(exportedKey);
    return keyBuffer;
}

export async function bytesToAesGcmCryptoKey(bytes: Uint8Array, extractable?: boolean): Promise<AesGcmCryptoKey> {
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
    const bytes = base64StringToUint8Array(base64Key);
    return bytesToAesGcmCryptoKey(bytes, extractable);
}

export const base64ToSpaceKey = base64ToAesGcmCryptoKey;

export async function bytesToAesWrapKey(bytes: Uint8Array): Promise<AesKwCryptoKey> {
    const wrappingKey = await importWrappingKey(bytes);
    return {
        type: 'AesKwCryptoKey',
        wrappingKey,
    };
}

export async function base64ToAesWrapKey(base64Key: string): Promise<AesKwCryptoKey> {
    const bytes = base64StringToUint8Array(base64Key);
    return bytesToAesWrapKey(bytes);
}

export const base64ToMasterKey = base64ToAesWrapKey;
export const bytesToMasterKey = bytesToAesWrapKey;

export async function decryptUint8Array(
    encryptedBase64: EncryptedData,
    { encryptKey }: AesGcmCryptoKey,
    ad: AdString
): Promise<Uint8Array> {
    let encryptedBytes: Uint8Array;
    if (typeof encryptedBase64 === 'string') {
        encryptedBytes = base64StringToUint8Array(encryptedBase64);
    } else if (isOldEncryptedData(encryptedBase64)) {
        // Messages stored before Jan 2025 can have this { iv, data } structure instead of all-concatenated "$iv$data".
        // We make sure we still handle them.
        const { iv, data } = encryptedBase64;
        const concat = `${iv}${data}`;
        encryptedBytes = base64StringToUint8Array(concat);
    } else {
        throw new Error('Unexpected shape for EncryptedData');
    }
    const adBytes = stringToUtf8Array(ad);
    try {
        const decryptedBytes = await decryptData(encryptKey, encryptedBytes, adBytes);
        return decryptedBytes;
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
    return utf8ArrayToString(decryptedBytes);
}

const SPACE_KEY_DERIVATION_SALT = 'Xd6V94/+5BmLAfc67xIBZcjsBPimm9/j02kHPI7Vsuc=';
const SPACE_DEK_CONTEXT = 'dek.space.lumo';
const HKDF_PARAMS_SPACE_DATA_ENCRYPTION = {
    salt: base64StringToUint8Array(SPACE_KEY_DERIVATION_SALT),
    info: stringToUtf8Array(SPACE_DEK_CONTEXT),
};

export async function deriveDataEncryptionKey(spaceKeyBytes: Uint8Array): Promise<AesGcmCryptoKey> {
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

export async function wrapAesKey(keyToWrap: AesGcmCryptoKey, { wrappingKey }: AesKwCryptoKey): Promise<Uint8Array> {
    const wrappedBytes = await wrapKey(keyToWrap.encryptKey, wrappingKey);
    return wrappedBytes;
}

export async function unwrapAesKey(
    encryptedKeyBytes: Uint8Array,
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
    const data = stringToUtf8Array(input);
    const hashBytes = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
    let hashString = uint8ArrayToBase64String(hashBytes);
    if (urlSafe) {
        hashString = hashString.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    return hashString;
}

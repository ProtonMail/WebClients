import { decryptData, encryptData } from '@protontech/crypto/subtle/aesGcm.ts';
import { uint8ArrayToUtf8String, utf8StringToUint8Array } from '@protontech/crypto/utils';

import { type AdString, type EncryptedData, isOldEncryptedData } from '../types';
import type { AesGcmCryptoKey } from './types';

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

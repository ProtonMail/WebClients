import { v4 as uuidv4 } from 'uuid';

import { CryptoProxy } from '@proton/crypto';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

import { LUMO_GPG_PUB_KEY_PROD_2 } from '../../../keys';
import type { AesGcmCryptoKey, Base64, EncryptedTurn, RequestId, Turn } from './types';

// Default Lumo public key (imported from keys.ts for consistency)
export const DEFAULT_LUMO_PUB_KEY = LUMO_GPG_PUB_KEY_PROD_2;

/**
 * Generate a new request ID for encryption
 */
export function generateRequestId(): RequestId {
    return uuidv4();
}

/**
 * Generate a new AES-GCM encryption key
 */
export async function generateRequestKey(): Promise<AesGcmCryptoKey> {
    const key = await crypto.subtle.generateKey(
        {
            name: 'AES-GCM',
            length: 256,
        },
        true,
        ['encrypt', 'decrypt']
    );

    return {
        type: 'AesGcmCryptoKey',
        encryptKey: key,
    };
}

/**
 * Encrypt a string using AES-GCM
 */
export async function encryptString(
    plaintext: string,
    { encryptKey }: AesGcmCryptoKey,
    adString?: string
): Promise<string> {
    const textEncoder = new TextEncoder();
    const data = textEncoder.encode(plaintext);
    const additionalData = adString ? textEncoder.encode(adString) : undefined;
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv,
            additionalData,
        },
        encryptKey,
        data
    );

    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return uint8ArrayToBase64String(combined);
}

/**
 * Convert CryptoKey to bytes for transmission
 */
export async function cryptoKeyToBytes(key: CryptoKey): Promise<Uint8Array<ArrayBuffer>> {
    const exported = await crypto.subtle.exportKey('raw', key);
    return new Uint8Array(exported);
}

/**
 * Encrypt conversation turns for U2L encryption
 */
export async function encryptTurns(
    turns: Turn[],
    requestKey: AesGcmCryptoKey,
    requestId: RequestId
): Promise<EncryptedTurn[]> {
    return Promise.all(
        turns.map(async (turn) => {
            const content = turn.content ?? '';
            const turnAd = `lumo.request.${requestId}.turn`;
            const contentEnc = await encryptString(content, requestKey, turnAd);
            return {
                ...turn,
                content: contentEnc,
                encrypted: true,
            };
        })
    );
}

/**
 * Prepare encrypted request key for transmission
 */
export async function prepareEncryptedRequestKey(requestKey: AesGcmCryptoKey, lumoPubKey: string): Promise<Base64> {
    const lumoPublicKey = await CryptoProxy.importPublicKey({ armoredKey: lumoPubKey });
    const requestKeyBin = await cryptoKeyToBytes(requestKey.encryptKey);
    const requestKeyEnc = await CryptoProxy.encryptMessage({
        binaryData: requestKeyBin,
        encryptionKeys: lumoPublicKey,
        format: 'binary',
    });
    return uint8ArrayToBase64String(requestKeyEnc.message);
}

/**
 * Decrypt content using AES-GCM
 */
export async function decryptContent(
    encryptedContent: string,
    requestKey: AesGcmCryptoKey,
    adString: string
): Promise<string> {
    // Convert base64 to Uint8Array
    const combined = Uint8Array.from(atob(encryptedContent), (c) => c.charCodeAt(0));

    // Extract IV (first 12 bytes) and ciphertext
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    // Prepare additional data
    const textEncoder = new TextEncoder();
    const additionalData = textEncoder.encode(adString);

    try {
        const decrypted = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv,
                additionalData,
            },
            requestKey.encryptKey,
            ciphertext
        );

        const textDecoder = new TextDecoder();
        return textDecoder.decode(decrypted);
    } catch (error) {
        console.error('Failed to decrypt content:', error);
        throw new Error('Decryption failed');
    }
}

import { v4 as uuidv4 } from 'uuid';

import { CryptoProxy } from '@proton/crypto';
import { exportKey, generateKey, importKey } from '@proton/crypto/lib/subtle/aesGcm';

import { decryptString as decryptContent, decryptUint8Array, encryptString, encryptUint8Array } from '../../../crypto';
import type { AesGcmCryptoKey } from '../../../crypto/types';
import { LUMO_GPG_PUB_KEY } from '../../../keys';
import type { Base64, EncryptedTurn, RequestId, Turn } from './types';

// Default Lumo public key (uses production key or custom key from LUMO_PUB_KEY_PATH env var)
export const DEFAULT_LUMO_PUB_KEY = LUMO_GPG_PUB_KEY;

export { decryptContent, decryptUint8Array, encryptString };

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
    const key = await importKey(generateKey(), { extractable: true });

    return {
        type: 'AesGcmCryptoKey',
        encryptKey: key,
    };
}

export function base64StringToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

export function uint8ArrayToBase64String(bytes: Uint8Array<ArrayBuffer>): string {
    let binaryString = '';
    for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
    }
    return btoa(binaryString);
}

/**
 * Encrypt conversation turns for U2L encryption
 */
export async function encryptTurns(
    turns: Turn[],
    requestKey: AesGcmCryptoKey,
    requestId: RequestId
): Promise<EncryptedTurn[]> {
    const requestAd = `lumo.request.${requestId}.turn`;

    // Start all encryption operations in parallel
    const turnPromises = turns.map((turn) => {
        const content = turn.content ?? '';
        const contentPromise = encryptString(content, requestKey, requestAd);

        // Start encrypting images in parallel if present
        const imagePromises =
            turn.images?.map(async (image) => {
                const data = base64StringToUint8Array(image.data);
                console.log('image.data (truncated):', image.data.slice(0, 128));
                console.log('decoded data (truncated):', data.slice(0, 128));
                const dataPromise = encryptUint8Array(data, requestKey, requestAd);
                const encryptedData = await dataPromise;
                console.log('encryptedData (truncated):', encryptedData.slice(0, 128));
                return {
                    ...image,
                    data: encryptedData,
                    encrypted: true,
                };
            }) || [];

        // Combine content and images promises
        return Promise.all([contentPromise, ...imagePromises]).then(([encryptedContent, ...encryptedImages]) => {
            const encryptedTurn: EncryptedTurn = {
                ...turn,
                content: encryptedContent,
                encrypted: true,
            };

            if (encryptedImages.length > 0) {
                encryptedTurn.images = encryptedImages;
            }

            return encryptedTurn;
        });
    });

    // Await all turns at once
    return Promise.all(turnPromises);
}

/**
 * Prepare encrypted request key for transmission
 */
export async function prepareEncryptedRequestKey(requestKey: AesGcmCryptoKey, lumoPubKey: string): Promise<Base64> {
    const lumoPublicKey = await CryptoProxy.importPublicKey({ armoredKey: lumoPubKey });
    const requestKeyBin = await exportKey(requestKey.encryptKey);
    const requestKeyEnc = await CryptoProxy.encryptMessage({
        binaryData: requestKeyBin,
        encryptionKeys: lumoPublicKey,
        format: 'binary',
    });
    return requestKeyEnc.message.toBase64();
}

import { v4 as uuidv4 } from 'uuid';

import { CryptoProxy } from '@proton/crypto';
import { exportKey, generateKey, importKey } from '@proton/crypto/lib/subtle/aesGcm';

import { decryptString as decryptContent, encryptString } from '../../../crypto';
import { LUMO_GPG_PUB_KEY_PROD_2 } from '../../../keys';
import type { AesGcmCryptoKey, Base64, EncryptedTurn, RequestId, Turn } from './types';

// Default Lumo public key (imported from keys.ts for consistency)
export const DEFAULT_LUMO_PUB_KEY = LUMO_GPG_PUB_KEY_PROD_2;

export { decryptContent, encryptString };

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
    const requestKeyBin = await exportKey(requestKey.encryptKey);
    const requestKeyEnc = await CryptoProxy.encryptMessage({
        binaryData: requestKeyBin,
        encryptionKeys: lumoPublicKey,
        format: 'binary',
    });
    return requestKeyEnc.message.toBase64();
}

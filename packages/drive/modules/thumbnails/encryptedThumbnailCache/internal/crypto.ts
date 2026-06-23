import { CryptoProxy } from '@protontech/crypto';
import { decryptData, encryptData, generateKey, importKey } from '@protontech/crypto/subtle/aesGcm.ts';

import type { DecryptedKey } from '@proton/shared/lib/interfaces';

import { sendErrorReport } from '../../../../legacy/errorHandling';
import type { ThumbnailCacheDb } from './thumbnailCacheDb';

/**
 * Cryptography for the thumbnail cache: resolving the per-user AES-GCM key and
 * encrypting/decrypting thumbnail bytes with it.
 */

const SIGNATURE_CONTEXT = 'drive.thumbnail-cache.key';

const wrapThumbnailCacheEncryptionKeyWithUserKey = async (
    rawKey: Uint8Array<ArrayBuffer>,
    primaryKey: DecryptedKey
): Promise<string> => {
    const { message } = await CryptoProxy.encryptMessage({
        binaryData: rawKey,
        encryptionKeys: [primaryKey.publicKey],
        signingKeys: [primaryKey.privateKey],
        signatureContext: { value: SIGNATURE_CONTEXT, critical: true },
    });
    return message;
};

const unwrapThumbnailCacheEncryptionKeyWithUserKeys = async (
    armoredMessage: string,
    userKeys: DecryptedKey[]
): Promise<Uint8Array<ArrayBuffer>> => {
    const { data } = await CryptoProxy.decryptMessage({
        armoredMessage,
        decryptionKeys: userKeys.map(({ privateKey }) => privateKey),
        verificationKeys: userKeys.map(({ publicKey }) => publicKey),
        signatureContext: { value: SIGNATURE_CONTEXT, required: true },
        expectSigned: true,
        format: 'binary',
    });
    return data as Uint8Array<ArrayBuffer>;
};

/**
 * Resolves the per-user AES-GCM key used to encrypt cached thumbnails.
 *
 * Mirrors the search module: the symmetric key is generated once, OpenPGP-wrapped
 * with the user's primary key and stored in IndexedDB. On subsequent loads the
 * stored key is unwrapped. If unwrapping fails (e.g. OpenPGP key rotation) the key
 * is regenerated and stale cached blobs are cleared.
 */
export const resolveThumbnailEncryptionKey = async (
    userKeys: DecryptedKey[],
    db: ThumbnailCacheDb
): Promise<CryptoKey> => {
    const primaryKey = userKeys[0];
    if (!primaryKey) {
        throw new Error('Cannot resolve thumbnail cache key: no user key available');
    }

    try {
        const wrapped = await db.getWrappedKey();
        if (wrapped) {
            const rawKey = await unwrapThumbnailCacheEncryptionKeyWithUserKeys(wrapped, userKeys);
            return await importKey(rawKey);
        }
    } catch (e) {
        // The stored key can no longer be unwrapped - fall through to regenerate.
        sendErrorReport(new Error('Failed to unwrap thumbnail cache key, regenerating', { cause: e }));
    }

    // No usable key (none stored, or unwrap failed): any cached blobs are encrypted
    // with a key we no longer have, so drop them before minting a fresh one. This
    // upholds the invariant that cached data is only ever readable with the current key.
    await db.clearData();

    const rawKey = generateKey();
    const wrapped = await wrapThumbnailCacheEncryptionKeyWithUserKey(rawKey, primaryKey);
    await db.setWrappedKey(wrapped);
    return importKey(rawKey);
};

/**
 * AES-GCM encrypt/decrypt for thumbnail bytes. The cache key is bound as
 * additional authenticated data (AAD) so ciphertext cannot be swapped between
 * slots or replayed under a different key.
 */

const textEncoder = new TextEncoder();

const additionalData = (cacheKey: string): Uint8Array<ArrayBuffer> =>
    textEncoder.encode(`drive.thumbnail-cache.${cacheKey}`);

export const encryptThumbnail = (
    cryptoKey: CryptoKey,
    bytes: Uint8Array<ArrayBuffer>,
    cacheKey: string
): Promise<Uint8Array<ArrayBuffer>> => encryptData(cryptoKey, bytes, additionalData(cacheKey));

export const decryptThumbnail = (
    cryptoKey: CryptoKey,
    ciphertext: Uint8Array<ArrayBuffer>,
    cacheKey: string
): Promise<Uint8Array<ArrayBuffer>> => decryptData(cryptoKey, ciphertext, additionalData(cacheKey));

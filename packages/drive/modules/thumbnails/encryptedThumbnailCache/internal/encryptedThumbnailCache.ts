import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';

import { sendErrorReport } from '../../../../legacy/errorHandling';
import { decryptThumbnail, encryptThumbnail, resolveThumbnailEncryptionKey } from './crypto';
import { ThumbnailCacheDb } from './thumbnailCacheDb';

/**
 * Persistent, at-rest-encrypted cache for decrypted thumbnail bytes.
 *
 * Until initialised (and on any error) the cache is a transparent no-op: reads
 * return undefined and writes are dropped, so the loader behaves exactly as if
 * there were no cache.
 */

export type ThumbnailCacheType = 'sd' | 'hd';

interface InitParams {
    userKeys: DecryptedKey[];
    userId: string;
}

/** The cache is usable only when both the db and the key resolved. */
interface ReadyCache {
    db: ThumbnailCacheDb;
    cryptoKey: CryptoKey;
}

// `undefined` means the cache is not initialised (or disabled/errored): a
// transparent no-op. A value means it is ready to read and write.
let ready: ReadyCache | undefined;
let currentUserId: string | undefined;
let initPromise: Promise<void> | undefined;

// `nodeUidOrRevisionUid` is the thumbnail's store key: the revisionUid for
// multi-revision nodes, or the nodeUid for single-revision ones (photos).
const cacheKeyFor = (nodeUidOrRevisionUid: string, type: ThumbnailCacheType): string =>
    `${nodeUidOrRevisionUid}-${type}`;

/** Reports a thumbnail-cache failure to Sentry, tagged so it is identifiable as coming from this module. */
const sendErrorReportForThumbnailCache = (error: unknown) =>
    sendErrorReport(error, { tags: { component: 'encrypted-thumbnail-cache' } });

/**
 * Opens the per-user database and resolves (caching in memory) the user's
 * symmetric key. Safe to call repeatedly; re-resolves only when the user changes.
 */
export const initEncryptedThumbnailCache = ({ userKeys, userId }: InitParams): Promise<void> => {
    if (currentUserId === userId && initPromise) {
        return initPromise;
    }

    // No IndexedDB (e.g. unsupported browser, private mode, locked-down webview):
    // leave the cache disabled silently. Real open/runtime failures are still
    // reported by the try/catch below.
    if (typeof indexedDB === 'undefined') {
        currentUserId = userId;
        ready = undefined;
        initPromise = Promise.resolve();
        return initPromise;
    }

    const previous = ready;
    currentUserId = userId;
    ready = undefined;
    initPromise = (async () => {
        try {
            previous?.db.close();
            const db = await ThumbnailCacheDb.open(userId);
            const cryptoKey = await resolveThumbnailEncryptionKey(userKeys, db);
            ready = { db, cryptoKey };
        } catch (e) {
            // Leave the cache disabled — thumbnails still load straight from the SDK.
            sendErrorReportForThumbnailCache(e);
            ready = undefined;
        }
    })();

    return initPromise;
};

/** Returns decrypted thumbnail bytes from the cache, or undefined on miss/disabled/error. */
export const getCachedThumbnail = async (
    nodeUidOrRevisionUid: string,
    type: ThumbnailCacheType
): Promise<Uint8Array<ArrayBuffer> | undefined> => {
    const cache = ready;
    if (!cache) {
        return undefined;
    }
    try {
        const cacheKey = cacheKeyFor(nodeUidOrRevisionUid, type);
        const ciphertext = await cache.db.getEntry(cacheKey);
        if (!ciphertext) {
            return undefined;
        }
        return await decryptThumbnail(cache.cryptoKey, ciphertext, cacheKey);
    } catch (e) {
        sendErrorReportForThumbnailCache(e);
        return undefined;
    }
};

/** Encrypts and stores thumbnail bytes. No-op when the cache is disabled. */
export const setCachedThumbnail = async (
    nodeUidOrRevisionUid: string,
    type: ThumbnailCacheType,
    bytes: Uint8Array<ArrayBuffer>
): Promise<void> => {
    const cache = ready;
    if (!cache) {
        return;
    }
    try {
        const cacheKey = cacheKeyFor(nodeUidOrRevisionUid, type);
        const ciphertext = await encryptThumbnail(cache.cryptoKey, bytes, cacheKey);
        await cache.db.putEntry(cacheKey, ciphertext);
    } catch (e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
            const estimate = await navigator.storage?.estimate?.();
            captureMessage('Encrypted thumbnail cache: storage quota exceeded', {
                level: 'debug',
                extra: { usage: estimate?.usage, quota: estimate?.quota },
            });

            // TODO: Define and send graphana metric to plot.
            return;
        }
        sendErrorReportForThumbnailCache(e);
    }
};

/** Test-only: closes the db and resets the in-memory key/init state. */
export const resetEncryptedThumbnailCacheForTest = () => {
    ready?.db.close();
    ready = undefined;
    currentUserId = undefined;
    initPromise = undefined;
};

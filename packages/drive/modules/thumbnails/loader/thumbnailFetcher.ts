import type { ThumbnailType } from '@protontech/drive-sdk';

import { handleSdkError } from '../../../legacy/errorHandling';
import { getCachedThumbnail, setCachedThumbnail } from '../encryptedThumbnailCache';
import { logger } from './logger';
import { type DriveClient, THUMBNAIL_KEY_MAP, type ThumbnailRequest } from './types';

/**
 * Key under which a thumbnail is stored and deduplicated. Defaults to
 * `revisionUid` (so a new revision invalidates the cached thumbnail), falling
 * back to `nodeUid` for single-revision nodes that load without a revision.
 */
export const storeKeyOf = ({ revisionUid, nodeUid }: ThumbnailRequest) => revisionUid ?? nodeUid;

export interface ThumbnailFetchResult {
    item: ThumbnailRequest;
    ok: boolean;
    bytes?: Uint8Array<ArrayBuffer>;
    /** True when `bytes` came from the persistent cache rather than the SDK. */
    fromCache?: boolean;
}

/**
 * Fetches thumbnails for a list of items, using the persistent cache when available.
 *
 * 1. Check the cache for each item that opted in via `usePersistentCache`.
 * 2. Make one SDK call for everything still missing.
 * 3. Write new results back to the cache.
 *
 * Items with no result from the SDK are simply left out of the returned list.
 */
export const fetchThumbnails = async (
    drive: DriveClient,
    items: ThumbnailRequest[],
    thumbnailType: ThumbnailType
): Promise<ThumbnailFetchResult[]> => {
    if (items.length === 0) {
        return [];
    }

    const { cacheKey } = THUMBNAIL_KEY_MAP[thumbnailType];

    const lookups = await Promise.all(
        items.map(async (item) => ({
            item,
            cached: item.usePersistentCache ? await getCachedThumbnail(storeKeyOf(item), cacheKey) : undefined,
        }))
    );

    const results: ThumbnailFetchResult[] = [];
    const misses: ThumbnailRequest[] = [];
    for (const { item, cached } of lookups) {
        if (cached) {
            results.push({ item, ok: true, bytes: cached, fromCache: true });
        } else {
            misses.push(item);
        }
    }

    if (misses.length === 0) {
        return results;
    }

    const uidsToProcess = misses.map((item) => item.nodeUid);
    const settledUids = new Set<string>();

    try {
        for await (const thumbnailResult of drive.iterateThumbnails(uidsToProcess, thumbnailType)) {
            const item = misses.find((candidate) => candidate.nodeUid === thumbnailResult.nodeUid);
            if (!item) {
                continue;
            }
            settledUids.add(item.nodeUid);
            if (!thumbnailResult.ok) {
                results.push({ item, ok: false });
                continue;
            }
            const bytes = thumbnailResult.thumbnail as Uint8Array<ArrayBuffer>;
            if (item.usePersistentCache) {
                void setCachedThumbnail(storeKeyOf(item), cacheKey, bytes);
            }
            results.push({ item, ok: true, bytes });
        }
    } catch (error) {
        // SDK call failed: cache hits and any misses already yielded survive; only report
        // the ones the aborted iteration never reached as unavailable.
        logger.warn(`Fetching ${misses.length} thumbnail(s) failed (type: ${thumbnailType}): ${error}`);
        handleSdkError(error, { showNotification: false });
        for (const item of misses) {
            if (!settledUids.has(item.nodeUid)) {
                results.push({ item, ok: false });
            }
        }
    }

    return results;
};

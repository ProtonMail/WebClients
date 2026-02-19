import type { IndexKey } from '@proton/crypto/lib/subtle/ad-hoc/encryptedSearch';

import { ES_MAX_CACHE, ES_MAX_ITEMS_PER_BATCH } from '../constants';
import { readContentBatch, readMetadataBatch, readSortedIDs } from '../esIDB';
import type { CachedItem, ESCache, ESTimepoint, GetItemInfo } from '../models';
import { decryptFromDB } from './esSearch';
import { isTimepointSmaller } from './esUtils';

/**
 * Estimate the size of a ESItem object in memory
 */
export const sizeOfESItem = (value: any): number => {
    if (typeof value === 'boolean') {
        return 4;
    } else if (typeof value === 'string') {
        return value.length * 2;
    } else if (typeof value === 'number') {
        return 8;
    } else if (Array.isArray(value)) {
        return value.map(sizeOfESItem).reduce((p, c) => p + c, 0);
    } else if (value === null) {
        // This is to avoid the "typeof null === 'object'" bug
        return 0;
    } else if (typeof value === 'object') {
        // Note that object keys are ignored as this function is already an
        // over-estimate of the actual memory footprint
        return sizeOfESItem(Object.values(value));
    }
    // Only 'undefined' type should reach this point
    return 0;
};

/**
 * Cache both content and metadata at once
 */
export const cacheIDB = async <ESItemMetadata, ESItemContent>(
    indexKey: IndexKey,
    userID: string,
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, ESItemContent>>,
    checkpoint?: ESTimepoint
) => {
    esCacheRef.current.isCacheReady = false;

    const sortedIDs = await readSortedIDs(userID, true, checkpoint);
    if (!sortedIDs) {
        throw new Error('IDB caching cannot read sorted IDs');
    }
    // In case IDB is empty, there is nothing to cache
    if (!sortedIDs.length) {
        esCacheRef.current.isCacheReady = true;
        return;
    }

    for (let i = 0; i < sortedIDs.length; i += ES_MAX_ITEMS_PER_BATCH) {
        const IDs = sortedIDs.slice(i, i + ES_MAX_ITEMS_PER_BATCH);
        const [metadata, content] = await Promise.all([readMetadataBatch(userID, IDs), readContentBatch(userID, IDs)]);
        if (!metadata || !content) {
            throw new Error('IDB caching failed to get data');
        }

        const data = await Promise.all(
            metadata.map(async (encryptedMetadata, index) => {
                if (!encryptedMetadata) {
                    return;
                }

                const encryptedContent = content[index];

                const [plaintextMetadata, plaintextContent] = await Promise.all([
                    decryptFromDB<ESItemMetadata>(encryptedMetadata.aesGcmCiphertext, indexKey, 'cacheIDB'),
                    !!encryptedContent
                        ? decryptFromDB<ESItemContent>(encryptedContent, indexKey, 'cacheIDB')
                        : undefined,
                ]);

                return { ID: encryptedMetadata.ID, metadata: plaintextMetadata, content: plaintextContent };
            })
        );

        data.forEach((dataPoint) => {
            if (!dataPoint || esCacheRef.current.cacheSize >= ES_MAX_CACHE) {
                return;
            }

            const { ID, metadata, content } = dataPoint;

            esCacheRef.current.esCache.set(ID, {
                metadata,
                content,
            });
            esCacheRef.current.cacheSize += sizeOfESItem(metadata) + sizeOfESItem(content);

            if (esCacheRef.current.cacheSize >= ES_MAX_CACHE) {
                esCacheRef.current.isCacheLimited = true;
            }
        });
    }

    esCacheRef.current.isCacheReady = true;
};

/**
 * Remove a single item from cache. If contentOnly is true,
 * the item's metadata is kept, otherwise it is completely
 * removed from cache. It returns the size of the removed item
 * (or portion thereof)
 */
export const removeFromESCache = <ESItemMetadata, ESItemContent>(
    itemID: string,
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, ESItemContent>>,
    contentOnly: boolean
) => {
    let size = 0;

    const item = esCacheRef.current.esCache.get(itemID);
    if (!item) {
        return size;
    }

    if (contentOnly) {
        esCacheRef.current.esCache.set(itemID, { metadata: item.metadata });
        size = sizeOfESItem(item.content);
    } else {
        esCacheRef.current.esCache.delete(itemID);
        size = sizeOfESItem(item);
    }

    esCacheRef.current.cacheSize -= size;
};

/**
 * Return the oldest cached item, which is the last one since
 * the cache is in reverse chronological order
 */
const getOldestCachedItem = <ESItemMetadata, ESItemContent>(
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, ESItemContent>>
): CachedItem<ESItemMetadata, ESItemContent> | undefined => {
    if (!esCacheRef.current.isCacheReady) {
        return;
    }

    let lastItem;
    for (const item of esCacheRef.current.esCache.values()) {
        lastItem = item;
    }
    return lastItem;
};

/**
 * Return the oldest cached item's timepoint, which is the last one since
 * the cache is in reverse chronological order
 */
export const getOldestCachedTimepoint = <ESItemMetadata>(
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, unknown>>,
    getItemInfo: GetItemInfo<ESItemMetadata>
) => {
    const oldestItem = getOldestCachedItem(esCacheRef);
    if (!oldestItem) {
        return;
    }

    return getItemInfo(oldestItem.metadata).timepoint;
};

/**
 * Remove items to make room for the content of the
 * given one
 */
const freeCacheSpace = <ESItemMetadata, ESItemContent>(
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, ESItemContent>>,
    getItemInfo: GetItemInfo<ESItemMetadata>,
    oldestItem: CachedItem<ESItemMetadata, ESItemContent> | undefined,
    itemSize: number
) => {
    while (oldestItem && esCacheRef.current.esCache.size + itemSize >= ES_MAX_CACHE) {
        removeFromESCache(getItemInfo(oldestItem.metadata).ID, esCacheRef, true);
        oldestItem = getOldestCachedItem(esCacheRef);
    }
};

/**
 * Return the most recent cached item
 */
const getMostRecentCachedItem = <ESItemMetadata, ESItemContent>(
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, ESItemContent>>
): CachedItem<ESItemMetadata, ESItemContent> | undefined => {
    if (!esCacheRef.current.isCacheReady) {
        return;
    }

    return esCacheRef.current.esCache.values().next().value;
};

/**
 * Restructure the cache in such a way that the order of insertion
 * correspond to the reverse chronological order of items
 */
const reorderCache = <ESItemMetadata, ESItemContent>(
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, ESItemContent>>,
    getItemInfo: GetItemInfo<ESItemMetadata>
) => {
    const entries = [...esCacheRef.current.esCache.entries()];
    entries.sort(([, i1], [, i2]) =>
        isTimepointSmaller(getItemInfo(i1.metadata).timepoint, getItemInfo(i2.metadata).timepoint) ? 1 : -1
    );
    esCacheRef.current.esCache.clear();

    entries.forEach(([ID, value]) => {
        esCacheRef.current.esCache.set(ID, value);
    });
};

/**
 * Add a single item to cache, depending on whether the size limit has been reached or not
 */
export const addToESCache = <ESItemMetadata, ESItemContent>(
    inputItem: CachedItem<ESItemMetadata, ESItemContent>,
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, ESItemContent>>,
    getItemInfo: GetItemInfo<ESItemMetadata>
) => {
    if (!esCacheRef.current.esCache.size && !esCacheRef.current.isCacheReady) {
        return;
    }

    const itemSize = sizeOfESItem(inputItem);

    let wereItemsRemoved = false;
    if (esCacheRef.current.isCacheLimited || esCacheRef.current.cacheSize + itemSize >= ES_MAX_CACHE) {
        // The oldest item is needed as a reference to decide whether to include the given one or not
        const oldestItem = getOldestCachedItem(esCacheRef);
        if (
            oldestItem &&
            isTimepointSmaller(getItemInfo(inputItem.metadata).timepoint, getItemInfo(oldestItem.metadata).timepoint)
        ) {
            return;
        }

        freeCacheSpace<ESItemMetadata, ESItemContent>(esCacheRef, getItemInfo, oldestItem, itemSize);
        wereItemsRemoved = true;
    }

    // In case the item already existed and this is just updating it, we want to first remove the size
    // of the existing version. In case it doesn't exist this variable will simply be 0
    const previousItemSize = sizeOfESItem(esCacheRef.current.esCache.get(getItemInfo(inputItem.metadata).ID));

    esCacheRef.current.esCache.set(getItemInfo(inputItem.metadata).ID, inputItem);
    esCacheRef.current.cacheSize += itemSize - previousItemSize;
    esCacheRef.current.isCacheLimited ||= wereItemsRemoved;

    // If the item to be added is not newer than the most recent item in
    // cache, the whole cache needs to be rebuilt to keep the reverse
    // chronological order of the cache (which is a map, therefore insertion
    // order matters)
    const mostRecentMetadata = getMostRecentCachedItem(esCacheRef)?.metadata;
    if (
        mostRecentMetadata &&
        isTimepointSmaller(getItemInfo(inputItem.metadata).timepoint, getItemInfo(mostRecentMetadata).timepoint)
    ) {
        return reorderCache(esCacheRef, getItemInfo);
    }
};

/**
 * Add more content to a limited cache in case many were removed
 */
export const refreshESCache = async <ESItemMetadata, ESItemContent>(
    indexKey: IndexKey,
    userID: string,
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, ESItemContent>>,
    getItemInfo: GetItemInfo<ESItemMetadata>
) => {
    const { cacheSize, isCacheReady, isCacheLimited } = esCacheRef.current;

    // Perform this operation only if there is space left in cache but not all items are cached, and if the initial
    // caching operation had succeeded
    if (cacheSize < ES_MAX_CACHE && isCacheLimited && isCacheReady) {
        const oldestItem = getOldestCachedItem(esCacheRef);
        return cacheIDB<ESItemMetadata, ESItemContent>(
            indexKey,
            userID,
            esCacheRef,
            !!oldestItem ? getItemInfo(oldestItem.metadata).timepoint : undefined
        );
    }
};

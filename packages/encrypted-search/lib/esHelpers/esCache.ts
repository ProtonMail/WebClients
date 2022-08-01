import { ES_MAX_CACHE, ES_MAX_ITEMS_PER_BATCH } from '../constants';
import { readContentItemsBatch, readMetadata, readNumContent } from '../esIDB';
import { CachedItem, ESCache, GetItemInfo } from '../models';
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
 * Sorting helper to sort in chronological order, i.e. oldest
 * first, based on timepoints. Note that we assume there can
 * be no two equal timepoints, therefore we don't need to ever
 * return 0
 */
export const sortChronologicalOrder = (t1: [number, number], t2: [number, number]) =>
    isTimepointSmaller(t1, t2) ? -1 : 1;

/**
 * Return the oldest cached item with content, which is the
 * first one with content since the cache is in chronological
 * order
 */
export const getOldestCachedContentItem = <ESItemMetadata, ESItemContent>(
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, ESItemContent>>
): Required<CachedItem<ESItemMetadata, ESItemContent>> | undefined => {
    if (!esCacheRef.current.isContentCached) {
        return;
    }

    const values = esCacheRef.current.esCache.values();
    let value = values.next();

    while (!value.done) {
        // Since the cache is in chronological order, the first item
        // to have content must be the oldest to do so
        if (!!value.value.content) {
            return { metadata: value.value.metadata, content: value.value.content };
        }
        value = values.next();
    }
};

/**
 * Return the timepoint of the oldest cached item with content
 */
export const getOldestCachedContentTimepoint = <ESItemMetadata, ESItemContent>(
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, ESItemContent>>,
    getItemInfo: GetItemInfo<ESItemMetadata>
) => {
    if (!esCacheRef.current.isContentCached) {
        return;
    }

    const item = getOldestCachedContentItem(esCacheRef);
    if (!item) {
        return;
    }

    return getItemInfo(item.metadata).timepoint;
};

/**
 * Return the most recent cached item with content
 */
export const getMostRecentCachedContentItem = <ESItemMetadata, ESItemContent>(
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, ESItemContent>>
): Required<CachedItem<ESItemMetadata, ESItemContent>> | undefined => {
    if (!esCacheRef.current.isContentCached) {
        return;
    }

    const values = [...esCacheRef.current.esCache.values()];
    values.reverse();

    // Note that we might need to scan deeper than the first element since it
    // might be that content isn't there for the first items due to decryption
    // failure while indexing
    return values.find((item) => !!item.content) as Required<CachedItem<ESItemMetadata, ESItemContent>> | undefined;
};

/**
 * Return the timepoint of the oldest cached item with content
 */
export const getMostRecentCachedContentTimepoint = <ESItemMetadata, ESItemContent>(
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, ESItemContent>>,
    getItemInfo: GetItemInfo<ESItemMetadata>
) => {
    if (!esCacheRef.current.isContentCached) {
        return;
    }

    const item = getMostRecentCachedContentItem(esCacheRef);
    if (!item) {
        return;
    }

    return getItemInfo(item.metadata).timepoint;
};

/**
 * Cache the whole metadata table, under the assumption that metadata
 * always fit in memory. The order of insertion into the map is the
 * chronological order, so that such an order is maintained
 * in the data structure
 */
export const cacheMetadata = async <ESItemMetadata>(
    userID: string,
    indexKey: CryptoKey,
    getItemInfo: GetItemInfo<ESItemMetadata>,
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, unknown>>
) => {
    const ciphertexts = await readMetadata(userID);
    if (!ciphertexts) {
        throw new Error('ESDB cannot be opened to cache metadata');
    }

    // We sort the items to cache such that the order of insertion into the cache
    // is the chronological order, i.e. the first element is the oldest. This way
    // newer messages can simply be set into the map and will be in order
    const itemsToCache = await Promise.all(
        ciphertexts.map(async (ciphertext) => decryptFromDB<ESItemMetadata>(ciphertext, indexKey))
    );
    itemsToCache.sort((i1, i2) => sortChronologicalOrder(getItemInfo(i1).timepoint, getItemInfo(i2).timepoint));

    itemsToCache.map((itemMetadata) => {
        esCacheRef.current.esCache.set(getItemInfo(itemMetadata).ID, { metadata: itemMetadata });
        esCacheRef.current.cacheSize += sizeOfESItem(itemMetadata);
    });

    esCacheRef.current.isCacheReady = true;
};

/**
 * Return a batch of item IDs from metadata cache in reverse chronological order,
 * whose content needs to be fetched from disk
 */
export const extractBatch = <ESItemMetadata>(
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, unknown>>,
    getItemInfo: GetItemInfo<ESItemMetadata>,
    recoveryPoint?: [number, number],
    batchSize: number = ES_MAX_ITEMS_PER_BATCH
) => {
    const entries = [...esCacheRef.current.esCache.entries()];
    entries.reverse();

    let lastIndex = -1;
    if (recoveryPoint) {
        lastIndex = entries.findIndex(
            ([, { metadata }]) =>
                getItemInfo(metadata).timepoint[0] === recoveryPoint[0] &&
                getItemInfo(metadata).timepoint[1] === recoveryPoint[1]
        );
        if (lastIndex === -1) {
            throw new Error('Inconsistent recovery point from cache');
        }
    }

    return entries.slice(lastIndex + 1, lastIndex + 1 + batchSize);
};

/**
 * Cache items' content. The cache is always guaranteed to contain all metadata
 * of all items, as well as content (if applicable) up until a hardcoded
 * limit is reached
 */
export const cacheContent = async <ESItemMetadata, ESItemContent>(
    indexKey: CryptoKey,
    userID: string,
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, ESItemContent>>,
    getItemInfo: GetItemInfo<ESItemMetadata>,
    inputTimeBound?: [number, number]
) => {
    let recoveryPoint = inputTimeBound;
    // In case the content table is empty, there is nothing to cache
    const count = await readNumContent(userID);
    if (!count) {
        return;
    }

    esCacheRef.current.isCacheReady = false;

    while (true) {
        if (esCacheRef.current.isCacheLimited) {
            break;
        }

        // Fetch data from IDB
        const itemsMetadata = extractBatch<ESItemMetadata>(esCacheRef, getItemInfo, recoveryPoint);

        const storedData = await readContentItemsBatch(
            userID,
            itemsMetadata.map(([ID]) => ID)
        );
        if (!storedData) {
            throw new Error('Content caching fetched corrupt data');
        }

        if (!storedData.length) {
            break;
        }

        // Decrypt and process the retrieved data
        const decryptedItems = await Promise.all(
            storedData.map(async ({ aesGcmCiphertext }) => decryptFromDB<ESItemContent>(aesGcmCiphertext, indexKey))
        );

        // Decrypted items are processed one by one in such a way that if
        // at any point the limit is reached, we stop
        for (let i = 0; i < decryptedItems.length; i++) {
            const itemToCache = decryptedItems[i];

            esCacheRef.current.esCache.set(itemsMetadata[i][0], {
                metadata: itemsMetadata[i][1].metadata,
                content: itemToCache,
            });
            esCacheRef.current.cacheSize += sizeOfESItem(itemToCache);

            if (esCacheRef.current.cacheSize >= ES_MAX_CACHE) {
                esCacheRef.current.isCacheLimited = true;
                break;
            }

            recoveryPoint = getItemInfo(itemsMetadata[i][1].metadata).timepoint;
        }
    }

    esCacheRef.current.isCacheReady = true;
    esCacheRef.current.isContentCached = true;
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
    let returnSize = 0;

    const item = esCacheRef.current.esCache.get(itemID);
    if (!item) {
        return returnSize;
    }

    if (contentOnly) {
        esCacheRef.current.esCache.set(itemID, { metadata: item.metadata });
        returnSize = sizeOfESItem(item.content);
    } else {
        esCacheRef.current.esCache.delete(itemID);
        returnSize = sizeOfESItem(item);
    }

    esCacheRef.current.cacheSize -= returnSize;

    return returnSize;
};

/**
 * Restructure the cache in such a way that the order of insertion
 * correspond to the chronological order of items
 */
export const reorderCache = <ESItemMetadata, ESItemContent>(
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, ESItemContent>>,
    getItemInfo: GetItemInfo<ESItemMetadata>
) => {
    const entries = [...esCacheRef.current.esCache.entries()];
    entries.sort(([, i1], [, i2]) =>
        sortChronologicalOrder(getItemInfo(i1.metadata).timepoint, getItemInfo(i2.metadata).timepoint)
    );
    esCacheRef.current.esCache.clear();

    entries.map(([ID, value]) => {
        esCacheRef.current.esCache.set(ID, value);
    });
};

/**
 * Remove content of older items to make room for the content of the
 * given one
 */
const freeCacheSpace = <ESItemMetadata, ESItemContent>(
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, ESItemContent>>,
    getItemInfo: GetItemInfo<ESItemMetadata>,
    oldestItem: Required<CachedItem<ESItemMetadata, ESItemContent>> | undefined,
    itemSize: number
) => {
    while (oldestItem && esCacheRef.current.esCache.size + itemSize >= ES_MAX_CACHE) {
        removeFromESCache(getItemInfo(oldestItem.metadata).ID, esCacheRef, true);
        oldestItem = getOldestCachedContentItem(esCacheRef);
    }
};

/**
 * Add a single item to cache, depending on whether the size limit has been reached or not.
 * Either way, its metadata is added
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
    const isSpaceLimited = esCacheRef.current.isCacheLimited || esCacheRef.current.cacheSize + itemSize >= ES_MAX_CACHE;

    let shouldIncludeContent = !!inputItem.content;
    let wasContentRemoved = false;
    if (isSpaceLimited && shouldIncludeContent) {
        // The oldest item is needed as a reference to decide whether to include content
        // of the given one or not
        const oldestItem = getOldestCachedContentItem(esCacheRef);
        shouldIncludeContent =
            !!oldestItem &&
            isTimepointSmaller(getItemInfo(oldestItem.metadata).timepoint, getItemInfo(inputItem.metadata).timepoint);

        if (shouldIncludeContent) {
            wasContentRemoved = true;
            freeCacheSpace<ESItemMetadata, ESItemContent>(esCacheRef, getItemInfo, oldestItem, itemSize);
        }
    }

    const itemToAdd = {
        metadata: inputItem.metadata,
        content: shouldIncludeContent ? inputItem.content : undefined,
    };
    const size = sizeOfESItem(itemToAdd);

    esCacheRef.current.esCache.set(getItemInfo(itemToAdd.metadata).ID, itemToAdd);
    esCacheRef.current.cacheSize += size;
    esCacheRef.current.isCacheLimited ||= wasContentRemoved;

    // If the item to be added is not newer than the most recent item in
    // cache, the whole cache needs to be rebuilt to keep the
    // chronological order of the cache (which is a map, therefore insertion
    // order matters)
    const mostRecentTimepoint = getMostRecentCachedContentTimepoint(esCacheRef, getItemInfo);
    if (mostRecentTimepoint && isTimepointSmaller(getItemInfo(inputItem.metadata).timepoint, mostRecentTimepoint)) {
        return reorderCache(esCacheRef, getItemInfo);
    }
};

/**
 * Add more content to a limited cache in case many were removed
 */
export const refreshESCache = async <ESItemMetadata, ESItemContent>(
    indexKey: CryptoKey,
    userID: string,
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, ESItemContent>>,
    getItemInfo: GetItemInfo<ESItemMetadata>
) => {
    const { cacheSize, isCacheReady, isCacheLimited } = esCacheRef.current;

    // Perform this operation only if there is space left in cache but not all items are cached, and if the initial
    // caching operation had succeeded
    if (cacheSize < ES_MAX_CACHE && isCacheLimited && isCacheReady) {
        return cacheContent<ESItemMetadata, ESItemContent>(
            indexKey,
            userID,
            esCacheRef,
            getItemInfo,
            getOldestCachedContentTimepoint(esCacheRef, getItemInfo)
        );
    }
};

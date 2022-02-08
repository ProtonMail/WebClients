import { ES_MAX_CACHE } from './constants';
import { ESCache, ESSearchingHelpers } from './interfaces';
import { checkEndSearchReverse, decryptFromDB, initializeTimeBounds, updateBatchTimeBound } from './esSearch';
import { getNumItemsDB, openESDB } from './esUtils';

/**
 * Check whether the cache is limited
 */
export const checkIsCacheLimited = async <ESItem>(
    userID: string,
    esCacheRef: React.MutableRefObject<ESCache<ESItem>>,
    storeName: string
) => {
    const count = await getNumItemsDB(userID, storeName);
    return esCacheRef.current.esCache.length < count;
};

/**
 * Remove extra items from cache
 */
export const trimCache = <ESItem>(
    esCacheRef: React.MutableRefObject<ESCache<ESItem>>,
    sizeOfESItem: (esItem: ESItem) => number
) => {
    let rollingSize = 0;
    for (let index = 0; index < esCacheRef.current.esCache.length; index++) {
        if (rollingSize >= ES_MAX_CACHE) {
            esCacheRef.current.esCache = esCacheRef.current.esCache.slice(0, index);
            esCacheRef.current.cacheSize = rollingSize;
            return;
        }

        rollingSize += sizeOfESItem(esCacheRef.current.esCache[index]);
    }
};

/**
 * Callback to sort cached messages by Time and Order, such that the last element is the oldest
 */
export const sortCachedItems =
    <ESItem>(getTimePoint: (item: ESItem) => [number, number]) =>
    (firstEl: ESItem, secondEl: ESItem) => {
        const [firstTime, firstOrder] = getTimePoint(firstEl);
        const [secondTime, secondOrder] = getTimePoint(secondEl);
        return secondTime - firstTime || secondOrder - firstOrder;
    };

/**
 * Cache IndexedDB
 */
export const cacheDB = async <ESItem, ESCiphertext, ESSearchParameters>(
    indexKey: CryptoKey,
    userID: string,
    esCacheRef: React.MutableRefObject<ESCache<ESItem>>,
    storeName: string,
    indexName: string,
    esSearchingHelpers: ESSearchingHelpers<ESItem, ESCiphertext, ESSearchParameters>,
    inputTimeBound?: [number, number]
) => {
    const { getTimePoint, sizeOfESItem } = esSearchingHelpers;

    const initialTimeBounds = await initializeTimeBounds<ESCiphertext>(
        userID,
        storeName,
        indexName,
        getTimePoint,
        inputTimeBound
    );
    const { searchTimeBound } = initialTimeBounds;
    let { batchTimeBound } = initialTimeBounds;

    const esDB = await openESDB(userID);
    let keepCaching = true;
    while (keepCaching) {
        // Fetch data from IDB
        const storedData = await esDB.getAllFromIndex(storeName, indexName, batchTimeBound);

        // Decrypt and process the retrieved data
        await Promise.all(
            storedData.map(async (storedCiphertext) => {
                const itemToCache = await decryptFromDB<ESItem, ESCiphertext>(storedCiphertext, indexKey);
                esCacheRef.current.cacheSize += sizeOfESItem(itemToCache);
                esCacheRef.current.esCache.push(itemToCache);
            })
        );

        // Check we reached the specified time boundaries
        if (esCacheRef.current.cacheSize >= ES_MAX_CACHE || checkEndSearchReverse(batchTimeBound, searchTimeBound)) {
            keepCaching = false;
        }

        // Set the time boundaries for the subsequent batch
        batchTimeBound = updateBatchTimeBound(batchTimeBound, searchTimeBound);
    }

    esDB.close();

    // Sort the cached messages by time, such that the last element is the oldest
    esCacheRef.current.esCache.sort(sortCachedItems<ESItem>(getTimePoint));
    // Since batches are processed as a whole, trimming is necessery to make sure the cache
    // size limit is not exceeded by too much
    trimCache<ESItem>(esCacheRef, sizeOfESItem);
    esCacheRef.current.isCacheLimited = await checkIsCacheLimited<ESItem>(userID, esCacheRef, storeName);
};

/**
 * Check whether an item should be added to cache or not
 */
export const checkAddToCache = <ESItem>(
    newESItem: ESItem,
    esCache: ESItem[],
    getTimePoint: (item: ESItem) => [number, number]
) => {
    const [Time, Order] = getTimePoint(newESItem);
    const [lastTime, lastOrder] = getTimePoint(esCache[esCache.length - 1]);
    return Time > lastTime || (Time === lastTime && Order > lastOrder);
};

/**
 * Add a single item to cache, depending on whether the size limit has been reached or not
 */
export const addToESCache = <ESItem>(
    itemToCache: ESItem,
    esCacheRef: React.MutableRefObject<ESCache<ESItem>>,
    sizeOfESItem: (esItem: ESItem) => number,
    getTimePoint: (item: ESItem) => [number, number],
    itemSize?: number
) => {
    let itemAdded = false;

    if (esCacheRef.current.cacheSize < ES_MAX_CACHE) {
        esCacheRef.current.esCache.push(itemToCache);
        itemAdded = true;
    } else if (checkAddToCache(itemToCache, esCacheRef.current.esCache, getTimePoint)) {
        // It is assumed that the last item is the oldest
        const lastIndex = esCacheRef.current.esCache.length - 1;
        esCacheRef.current.cacheSize -= sizeOfESItem(esCacheRef.current.esCache[lastIndex]);
        esCacheRef.current.esCache[lastIndex] = itemToCache;
        itemAdded = true;
    }

    if (itemAdded) {
        esCacheRef.current.cacheSize += itemSize || sizeOfESItem(itemToCache);
        // Sort the cached items by time, such that the last element is the oldest
        esCacheRef.current.esCache.sort(sortCachedItems<ESItem>(getTimePoint));
    }
};

/**
 * Find the index of an item in cache. Should return -1 if the index is not found
 */
export const findItemIndex = <ESItem>(
    itemID: string,
    esCache: ESItem[],
    getIDStoredItem: (storedItem: ESItem) => string
) => esCache.findIndex((cachedMessage) => getIDStoredItem(cachedMessage) === itemID);

/**
 * Remove a single item from cache
 */
export const removeFromESCache = <ESItem>(
    itemToRemove: string,
    esCacheRef: React.MutableRefObject<ESCache<ESItem>>,
    sizeOfESItem: (esItem: ESItem) => number,
    getIDStoredItem: (storedItem: ESItem) => string,
    messageSize?: number
) => {
    const index = findItemIndex(itemToRemove, esCacheRef.current.esCache, getIDStoredItem);
    if (index !== -1) {
        const size = messageSize || sizeOfESItem(esCacheRef.current.esCache[index]);
        esCacheRef.current.cacheSize -= size;
        esCacheRef.current.esCache.splice(index, 1);
        return size;
    }
};

/**
 * Update an existing item in cache with a given one. Since this is an update, the old and
 * new items are supposed to have the same ID
 */
export const replaceInESCache = <ESItem>(
    itemToCache: ESItem,
    esCacheRef: React.MutableRefObject<ESCache<ESItem>>,
    sizeOfESItem: (esItem: ESItem) => number,
    getIDStoredItem: (storedItem: ESItem) => string,
    getTimePoint: (item: ESItem) => [number, number],
    isDraftUpdate: boolean,
    sizeDelta?: number
) => {
    const index = findItemIndex(getIDStoredItem(itemToCache), esCacheRef.current.esCache, getIDStoredItem);
    if (index !== -1) {
        esCacheRef.current.cacheSize +=
            sizeDelta || sizeOfESItem(itemToCache) - sizeOfESItem(esCacheRef.current.esCache[index]);
        esCacheRef.current.esCache.splice(index, 1, itemToCache);

        // The time order am item can change only if it was a draft being updated.
        // In this case we sort again
        if (isDraftUpdate) {
            esCacheRef.current.esCache.sort(sortCachedItems<ESItem>(getTimePoint));
        }
    }
};

/**
 * Add more messages to a limited cache in case many were removed
 */
export const refreshESCache = async <ESItem, ESCiphertext, ESSearchParameters>(
    indexKey: CryptoKey,
    userID: string,
    esCacheRef: React.MutableRefObject<ESCache<ESItem>>,
    storeName: string,
    indexName: string,
    esSearchingHelpers: ESSearchingHelpers<ESItem, ESCiphertext, ESSearchParameters>
) => {
    const { getTimePoint } = esSearchingHelpers;
    const { cacheSize, isCacheReady } = esCacheRef.current;
    const isCachePartial = await checkIsCacheLimited(userID, esCacheRef, storeName);

    // Perform this operation only if there is space left in cache but not all items are cached, and if the initial
    // caching operation had succeeded
    if (cacheSize < ES_MAX_CACHE && isCachePartial && isCacheReady) {
        // The last item is assumed to be the oldest one
        const esTimeBound = getTimePoint(esCacheRef.current.esCache[esCacheRef.current.esCache.length - 1]);
        await cacheDB<ESItem, ESCiphertext, ESSearchParameters>(
            indexKey,
            userID,
            esCacheRef,
            storeName,
            indexName,
            esSearchingHelpers,
            esTimeBound
        );
    }

    // Update the cache status after the above change
    esCacheRef.current.isCacheLimited = await checkIsCacheLimited(userID, esCacheRef, storeName);
};

import { startOfDay, sub } from 'date-fns';
import { wait } from '@proton/shared/lib/helpers/promise';
import { Api } from '@proton/shared/lib/interfaces/Api';
import { getES, getMostRecentTime, getNumItemsDB, openESDB, roundMilliseconds, sendESMetrics } from './esUtils';
import { getIndexKey } from './esBuild';
import { ESCache, ESSearchingHelpers, ESStoredItem, GetUserKeys } from './interfaces';
import { AesKeyGenParams, ES_MAX_ITEMS_PER_BATCH, ES_EXTRA_RESULTS_LIMIT } from './constants';
import { getOldestTime } from './esHelpers';

/**
 * Decrypt encrypted object from IndexedDB
 */
export const decryptFromDB = async <ESItem, ESCiphertext>(
    storedCiphertext: ESCiphertext,
    indexKey: CryptoKey
): Promise<ESItem> => {
    const { aesGcmCiphertext } = storedCiphertext as any as ESStoredItem;
    const textDecoder = new TextDecoder();

    const decryptedMessage: ArrayBuffer = await crypto.subtle.decrypt(
        { iv: aesGcmCiphertext.iv, name: AesKeyGenParams.name },
        indexKey,
        aesGcmCiphertext.ciphertext
    );

    return JSON.parse(textDecoder.decode(new Uint8Array(decryptedMessage)));
};

/**
 * Set the initial time range to fetch data from IDB for uncached search in chronological order. This
 * is the equivalent of initializeTimeBounds for uncached search)
 */
export const initializeTimeBounds = async <ESCiphertext>(
    userID: string,
    storeName: string,
    indexName: string,
    getTimePoint: (item: ESCiphertext) => [number, number],
    inputTimePoint: [number, number] | undefined,
    begin?: number,
    end?: number
) => {
    const oldestTime = begin || (await getOldestTime<ESCiphertext>(userID, storeName, indexName, getTimePoint));
    const mostRecentTime = Math.min(
        end || Number.MAX_SAFE_INTEGER,
        inputTimePoint
            ? inputTimePoint[0]
            : await getMostRecentTime<ESCiphertext>(userID, storeName, indexName, getTimePoint)
    );

    const startTime = roundMilliseconds(startOfDay(sub(mostRecentTime * 1000, { days: 1 })).getTime());

    return {
        batchTimeBound: IDBKeyRange.bound(
            [Math.max(startTime, oldestTime), 0],
            [mostRecentTime, Number.MAX_SAFE_INTEGER]
        ),
        searchTimeBound: IDBKeyRange.bound([oldestTime, 0], [mostRecentTime, Number.MAX_SAFE_INTEGER]),
    };
};

/**
 * Update the time range to fetch data from IDB after each batch,
 * such that the subsequent batch spans different times, for uncached search in reverse chronological order
 */
export const updateBatchTimeBound = (batchTimeBound: IDBKeyRange, searchTimeBound: IDBKeyRange) => {
    let endTime = batchTimeBound.lower[0] - 1;
    const startTime = Math.max(
        searchTimeBound.lower[0],
        roundMilliseconds(startOfDay(sub(endTime * 1000, { days: 1 })).getTime())
    );

    if (startTime > endTime) {
        endTime = startTime;
    }

    return IDBKeyRange.bound([startTime, 0], [endTime, Number.MAX_SAFE_INTEGER]);
};

/**
 * Set the initial time range to fetch data from IDB for uncached search in chronological order. This
 * is the equivalent of initializeTimeBounds for uncached search)
 */
const initializeLowerBound = async <ESCiphertext>(
    userID: string,
    storeName: string,
    indexName: string,
    getTimePoint: (item: ESCiphertext) => [number, number],
    inputTimePoint: [number, number] | undefined,
    begin?: number,
    end?: number
) => {
    const oldestTime = begin || (await getOldestTime<ESCiphertext>(userID, storeName, indexName, getTimePoint));
    const mostRecentTime = end || (await getMostRecentTime<ESCiphertext>(userID, storeName, indexName, getTimePoint));

    const lowerBound = inputTimePoint || [oldestTime, 0];
    const batchLowerBound = IDBKeyRange.lowerBound(lowerBound, true);

    return {
        batchLowerBound,
        searchLowerBound: IDBKeyRange.bound([oldestTime, 0], [mostRecentTime, Number.MAX_SAFE_INTEGER]),
    };
};

/**
 * Update the time range to fetch data from IDB after each batch, such that the subsequent batch spans
 * different times, for uncached search in chronological order. This is the equivalent of updateBatchTimeBound
 * for uncached search
 */
const updateBatchLowerBound = (lastTimePoint: [number, number]) => IDBKeyRange.lowerBound(lastTimePoint, true);

/**
 * Check whether an uncached search in reverse chronological order should end because of exceeded time bounds
 */
export const checkEndSearchReverse = (batchTimeBound: IDBKeyRange, searchTimeBound: IDBKeyRange) => {
    return batchTimeBound.lower[0] === searchTimeBound.lower[0];
};

/**
 * Check whether an uncached search in chronological order should end because of exceeded time bounds
 */
const checkEndSearchChrono = (lastTimePoint: [number, number], searchTimeBound: IDBKeyRange) => {
    return lastTimePoint[0] > searchTimeBound.upper[0];
};

/**
 * Perfom an uncached search, i.e. with data being retrieved directly from IDB, in descending order
 */
const uncachedSearchDesc = async <ESItem, ESCiphertext, ESSearchParameters>(
    userID: string,
    indexKey: CryptoKey,
    esSearchParams: ESSearchParameters,
    storeName: string,
    indexName: string,
    esSearchingHelpers: Required<ESSearchingHelpers<ESItem, ESCiphertext, ESSearchParameters>>,
    itemLimit?: number,
    setIncrementalResults?: (newResults: ESItem[]) => void,
    inputTimePoint?: [number, number],
    abortSearchingRef?: React.MutableRefObject<AbortController>
) => {
    const { preFilter, applySearch, getTimePoint, getSearchInterval } = esSearchingHelpers;

    const esDB = await openESDB(userID);

    const resultsArray: ESItem[] = [];
    let lastTimePoint: [number, number] | undefined;

    const { begin, end } = getSearchInterval(esSearchParams);

    let previousLenght = 0;
    const initialTimeBounds = await initializeTimeBounds<ESCiphertext>(
        userID,
        storeName,
        indexName,
        getTimePoint,
        inputTimePoint,
        begin,
        end
    );
    const { searchTimeBound } = initialTimeBounds;
    let { batchTimeBound } = initialTimeBounds;
    let partialLastTimePoint: [number, number] | undefined;

    while (!lastTimePoint) {
        if (abortSearchingRef && abortSearchingRef.current.signal.aborted) {
            return { resultsArray, lastTimePoint };
        }

        // Fetch data from IDB
        const storedData = await esDB.getAllFromIndex(storeName, indexName, batchTimeBound);

        // Decrypt and process the retrieved data
        await Promise.all(
            storedData.map(async (storedCiphertext) => {
                if (!preFilter(storedCiphertext, esSearchParams)) {
                    return;
                }

                const itemToSearch = await decryptFromDB<ESItem, ESCiphertext>(storedCiphertext, indexKey);

                if (applySearch(esSearchParams, itemToSearch)) {
                    resultsArray.push(itemToSearch);
                }
            })
        );

        // partialLastTimePoint is always updated, because the next batch might be empty
        // therefore we need a reliable last time point from the previous batch. Yet, its
        // value is stored in lastTimePoint only if some limit has been reached because
        // the existence of lastTimePoint is considered the termination condition
        if (storedData.length) {
            partialLastTimePoint = getTimePoint(storedData[0]);
        }

        // If the limit has been reached, save which item was reached so that
        // the next search can start from there
        if (itemLimit && resultsArray.length >= itemLimit) {
            lastTimePoint = partialLastTimePoint;
        }

        // Check we reached the specified time boundaries
        if (checkEndSearchReverse(batchTimeBound, searchTimeBound)) {
            break;
        }

        // Set the time boundaries for the subsequent batch
        batchTimeBound = updateBatchTimeBound(batchTimeBound, searchTimeBound);

        // In case the callback to show new search results while searching was given
        // and there are new search results in the current batch, show them
        if (setIncrementalResults && resultsArray.length > previousLenght) {
            previousLenght = resultsArray.length;
            setIncrementalResults(resultsArray);
        }
    }

    esDB.close();

    return { resultsArray, lastTimePoint };
};

/**
 * Perfom an uncached search, i.e. with data being retrieved directly from IDB, in ascending order
 */
const uncachedSearchAsc = async <ESItem, ESCiphertext, ESSearchParameters>(
    userID: string,
    indexKey: CryptoKey,
    esSearchParams: ESSearchParameters,
    storeName: string,
    indexName: string,
    esSearchingHelpers: Required<ESSearchingHelpers<ESItem, ESCiphertext, ESSearchParameters>>,
    itemLimit?: number,
    setIncrementalResults?: (newResults: ESItem[]) => void,
    inputTimePoint?: [number, number],
    abortSearchingRef?: React.MutableRefObject<AbortController>
) => {
    const { preFilter, applySearch, getTimePoint, getSearchInterval } = esSearchingHelpers;
    const esDB = await openESDB(userID);

    const resultsArray: ESItem[] = [];
    let lastTimePoint: [number, number] | undefined;

    const { begin, end } = getSearchInterval(esSearchParams);

    const initialLowerBound = await initializeLowerBound<ESCiphertext>(
        userID,
        storeName,
        indexName,
        getTimePoint,
        inputTimePoint,
        begin,
        end
    );
    const { searchLowerBound } = initialLowerBound;
    let { batchLowerBound } = initialLowerBound;

    let previousLenght = 0;
    while (!lastTimePoint) {
        if (abortSearchingRef && abortSearchingRef.current.signal.aborted) {
            return { resultsArray, lastTimePoint };
        }

        const storedData = await esDB.getAllFromIndex(storeName, indexName, batchLowerBound, ES_MAX_ITEMS_PER_BATCH);

        if (!storedData.length) {
            break;
        }

        // Decrypt and process the retrieved data
        await Promise.all(
            storedData.map(async (storedCiphertext) => {
                if (!preFilter(storedCiphertext, esSearchParams)) {
                    return;
                }

                const itemToSearch = await decryptFromDB<ESItem, ESCiphertext>(storedCiphertext, indexKey);

                if (applySearch(esSearchParams, itemToSearch)) {
                    resultsArray.push(itemToSearch);
                }
            })
        );

        const partialLastTimePoint = getTimePoint(storedData[storedData.length - 1]);

        // If the limit has been reached, save which item was reached so that
        // the next search can start from there
        if (itemLimit && resultsArray.length >= itemLimit) {
            lastTimePoint = partialLastTimePoint;
        }

        // Check we reached the specified time boundaries
        if (checkEndSearchChrono(partialLastTimePoint, searchLowerBound)) {
            break;
        }

        // Set the time boundaries for the subsequent batch
        batchLowerBound = updateBatchLowerBound(partialLastTimePoint);

        // In case the callback to show new search results while searching was given
        // and there are new search results in the current batch, show them
        if (setIncrementalResults && resultsArray.length > previousLenght) {
            previousLenght = resultsArray.length;
            setIncrementalResults(resultsArray);
        }
    }

    esDB.close();

    return { resultsArray, lastTimePoint };
};

/**
 * Perfom an uncached search in either ascending or descending order
 */
export const uncachedSearch = async <ESItem, ESCiphertext, ESSearchParameters>(
    userID: string,
    indexKey: CryptoKey,
    esSearchParams: ESSearchParameters,
    storeName: string,
    indexName: string,
    esSearchingHelpers: Required<ESSearchingHelpers<ESItem, ESCiphertext, ESSearchParameters>>,
    itemLimit?: number,
    setIncrementalResults?: (newResults: ESItem[]) => void,
    inputTimePoint?: [number, number],
    abortSearchingRef?: React.MutableRefObject<AbortController>
) => {
    const { checkIsReverse } = esSearchingHelpers;

    if (checkIsReverse(esSearchParams)) {
        return uncachedSearchDesc<ESItem, ESCiphertext, ESSearchParameters>(
            userID,
            indexKey,
            esSearchParams,
            storeName,
            indexName,
            esSearchingHelpers,
            itemLimit,
            setIncrementalResults,
            inputTimePoint,
            abortSearchingRef
        );
    }

    return uncachedSearchAsc<ESItem, ESCiphertext, ESSearchParameters>(
        userID,
        indexKey,
        esSearchParams,
        storeName,
        indexName,
        esSearchingHelpers,
        itemLimit,
        setIncrementalResults,
        inputTimePoint,
        abortSearchingRef
    );
};

/**
 * Perfom an cached search, i.e. over the given items only
 */
const cachedSearch = <ESItem, ESSearchParameters>(
    esCache: ESItem[],
    esSearchParams: ESSearchParameters,
    abortSearchingRef: React.MutableRefObject<AbortController>,
    applySearch: (esSearchParams: ESSearchParameters, itemToSearch: ESItem) => boolean
) => {
    const searchResults: ESItem[] = [];

    esCache.forEach((itemToSearch: ESItem) => {
        if (abortSearchingRef.current.signal.aborted) {
            return;
        }
        if (applySearch(esSearchParams, itemToSearch)) {
            searchResults.push(itemToSearch);
        }
    });

    return searchResults;
};

/**
 * Based on the time boundaries of a search and the time span of a cache, check whether any more
 * items from IDB are needed. This is done because even if the cache is limited, i.e. does not fully
 * contain the whole IDB, its time span might already cover any user selected time window. It should
 * also return the first time point from where to start the uncached search and potentially adjusted
 * search parameters that take into account the new time boundaries
 */
const checkCacheTimespan = <ESItem, ESSearchParameters>(
    esSearchParams: ESSearchParameters,
    esCache: ESItem[],
    getTimePoint: (item: ESItem) => [number, number],
    getSearchInterval: (esSearchParameters?: ESSearchParameters) => {
        begin: number | undefined;
        end: number | undefined;
    }
) => {
    const [startCache, Order] = getTimePoint(esCache[esCache.length - 1]);
    const { begin, end } = getSearchInterval(esSearchParams);

    const beginOrder = Order;
    const intervalEnd = Math.min(startCache, end || Number.MAX_SAFE_INTEGER);
    const intervalStart = begin || 0;
    const shouldKeepSearching = intervalStart < startCache;
    esSearchParams = {
        ...esSearchParams,
        begin: intervalStart,
        end: intervalEnd,
    };

    const timePoint: [number, number] = [intervalEnd, beginOrder];
    return {
        shouldKeepSearching,
        esSearchParams,
        timePoint,
    };
};

/**
 * Perform a search by switching between cached and uncached search when necessary
 */
export const hybridSearch = async <ESItem, ESCiphertext, ESSearchParameters>(
    esCacheRef: React.MutableRefObject<ESCache<ESItem>>,
    esSearchParams: ESSearchParameters,
    cachedIndexKey: CryptoKey | undefined,
    getUserKeys: GetUserKeys,
    userID: string,
    setResultsList: (Elements: ESItem[]) => void,
    abortSearchingRef: React.MutableRefObject<AbortController>,
    storeName: string,
    indexName: string,
    esSearchingHelpers: Required<ESSearchingHelpers<ESItem, ESCiphertext, ESSearchParameters>>
) => {
    const { checkIsReverse, applySearch, getTimePoint, getSearchInterval } = esSearchingHelpers;

    let searchResults: ESItem[] = [];
    let isSearchPartial = false;
    let lastTimePoint: [number, number] | undefined;
    const isReverse = checkIsReverse(esSearchParams);

    // Messages in cache are the most recent ones, therefore if the cache is not ready and full and the search
    // is in descending order, we cannot used cached items
    if (isReverse || (esCacheRef.current.isCacheReady && !esCacheRef.current.isCacheLimited)) {
        // searchResults is initialized with the first portion of cached results
        let lastLength = esCacheRef.current.esCache.length;
        searchResults = cachedSearch<ESItem, ESSearchParameters>(
            esCacheRef.current.esCache,
            esSearchParams,
            abortSearchingRef,
            applySearch
        );
        let resultsCounter = searchResults.length;

        // The first batch of results (if any) are shown only if the cache is still being built, or if it has finished
        // but it's limited. Otherwise we want to show all results at the end
        if (resultsCounter !== 0 && (!esCacheRef.current.isCacheReady || esCacheRef.current.isCacheLimited)) {
            setResultsList(searchResults);
        }

        // If the cache is still being built, incremental portions of cache are searched
        while (!esCacheRef.current.isCacheReady) {
            if (abortSearchingRef.current.signal.aborted) {
                return {
                    searchResults,
                    isSearchPartial,
                    lastTimePoint,
                };
            }

            const newLastLength = esCacheRef.current.esCache.length;
            searchResults.push(
                ...cachedSearch<ESItem, ESSearchParameters>(
                    esCacheRef.current.esCache.slice(lastLength),
                    esSearchParams,
                    abortSearchingRef,
                    applySearch
                )
            );

            // In case there are new results, we show them
            if (searchResults.length > resultsCounter) {
                setResultsList(searchResults);
            }

            resultsCounter = searchResults.length;
            lastLength = newLastLength;
            await wait(200);
        }

        // To avoid any race condition at the end of the while loop, one last search of the very last portion
        // is performed
        searchResults.push(
            ...cachedSearch<ESItem, ESSearchParameters>(
                esCacheRef.current.esCache.slice(lastLength),
                esSearchParams,
                abortSearchingRef,
                applySearch
            )
        );

        // Once caching has terminated, if the cache turns out to be not limited, we stop searching
        if (!esCacheRef.current.isCacheLimited || abortSearchingRef.current.signal.aborted) {
            return {
                searchResults,
                isSearchPartial,
                lastTimePoint,
            };
        }

        // If enough items to fill two pages were already found, we don't continue the search
        if (searchResults.length >= 2 * ES_EXTRA_RESULTS_LIMIT || abortSearchingRef.current.signal.aborted) {
            // The last item in cache is assumed to be the oldest
            const lastEmailInCache = getTimePoint(esCacheRef.current.esCache[esCacheRef.current.esCache.length - 1]);
            return {
                searchResults,
                isSearchPartial: true,
                lastEmail: lastEmailInCache,
            };
        }

        // If there were more results in the last batch, we show them before continuing with uncached search
        if (searchResults.length > resultsCounter) {
            setResultsList(searchResults);
        }
    }

    // If the cache hasn't been searched because the order is ascending, the search
    // parameters shouldn't be influenced by the cache timespan
    let shouldKeepSearching = !abortSearchingRef.current.signal.aborted;
    let timePoint: [number, number] | undefined;
    if (isReverse) {
        // The remaining items are searched from DB, but only if the indicated timespan
        // hasn't been already covered by cache. The cache is ordered such that the last item is the oldest
        ({ shouldKeepSearching, esSearchParams, timePoint } = checkCacheTimespan<ESItem, ESSearchParameters>(
            esSearchParams,
            esCacheRef.current.esCache,
            getTimePoint,
            getSearchInterval
        ));
    }

    if (shouldKeepSearching) {
        const remainingMessages = 2 * ES_EXTRA_RESULTS_LIMIT - searchResults.length;

        const setIncrementalResults = (newResults: ESItem[]) => {
            setResultsList(searchResults.concat(newResults));
        };

        const indexKey = cachedIndexKey || (await getIndexKey(getUserKeys, userID));
        if (!indexKey) {
            throw new Error('Key not found');
        }

        const uncachedResult = await uncachedSearch<ESItem, ESCiphertext, ESSearchParameters>(
            userID,
            indexKey,
            esSearchParams,
            storeName,
            indexName,
            esSearchingHelpers,
            remainingMessages,
            setIncrementalResults,
            timePoint,
            abortSearchingRef
        );
        searchResults.push(...uncachedResult.resultsArray);
        lastTimePoint = uncachedResult.lastTimePoint;
        isSearchPartial = !!lastTimePoint;
    }

    return { searchResults, isSearchPartial, lastTimePoint };
};

/**
 * Send metrics about a single encrypted search
 */
export const sendSearchingMetrics = async (
    api: Api,
    userID: string,
    cacheSize: number,
    searchTime: number,
    isFirstSearch: boolean,
    isCacheLimited: boolean,
    storeName: string
) => {
    // Note: the metrics dashboard expects a variable called "numMessagesIndexed" but
    // it doesn't make too much sense in general to talk about "messages"
    const numMessagesIndexed = await getNumItemsDB(userID, storeName);

    return sendESMetrics(api, 'search', {
        indexSize: getES.Size(userID),
        numMessagesIndexed,
        cacheSize,
        searchTime,
        isFirstSearch,
        isCacheLimited,
    });
};

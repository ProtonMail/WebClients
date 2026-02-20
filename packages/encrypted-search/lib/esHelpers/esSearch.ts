import { type ESCiphertext, type IndexKey, decryptItem } from '@proton/crypto/lib/subtle/ad-hoc/encryptedSearch';
import { wait } from '@proton/shared/lib/helpers/promise';
import isTruthy from '@proton/utils/isTruthy';

import { ES_EXTRA_RESULTS_LIMIT, ES_MAX_ITEMS_PER_BATCH } from '../constants';
import { readContentBatch, readMetadataBatch, readSortedIDs } from '../esIDB';
import type {
    CachedItem,
    ESCache,
    ESItem,
    ESTimepoint,
    GetItemInfo,
    GetUserKeys,
    InternalESCallbacks,
} from '../models';
import { ESDecryptionError, ESParseError } from '../models/errors';
import { esSentryReport } from './esAPI';
import { getIndexKey } from './esBuild';
import { cacheIDB, getOldestCachedTimepoint } from './esCache';
import { normalizeString, replaceApostrophes, replaceQuotes } from './esUtils';

/**
 * Process the string input by the user in the searchbar by performing the following
 * transformations:
 *   - trims whitespaces from the input string;
 *   - removes diacritics;
 *   - turn unusual quotes into normal ones, that can then be searched to split sentences;
 *   - turn unusual apostrophes into normal ones;
 *   - casts to locale lower case;
 *   - splits the input string in multiple keywords if separated by whitespace, unless
 *     it's within quotes
 * @param keyword the string as input by users in the searchbar
 * @returns the array of normalised keywords to be searched
 */
export const normalizeKeyword = (keyword: string) => {
    const trimmedKeyword = replaceApostrophes(replaceQuotes(normalizeString(keyword)));
    const quotesIndexes: number[] = [];

    let index = 0;
    while (index !== -1) {
        index = trimmedKeyword.indexOf(`"`, index);
        if (index !== -1) {
            quotesIndexes.push(index);
            index++;
        }
    }

    const normalizedKeywords: string[] = [];
    let previousIndex = -1;
    for (let index = 0; index < quotesIndexes.length; index++) {
        const keyword = trimmedKeyword.slice(previousIndex + 1, quotesIndexes[index]);

        if (index % 2 === 1) {
            // If the user placed quotes, we want to keep everything inside as a single block
            normalizedKeywords.push(keyword);
        } else {
            // Otherwise we split by whitespace
            normalizedKeywords.push(...keyword.split(' '));
        }

        previousIndex = quotesIndexes[index];
    }

    normalizedKeywords.push(...trimmedKeyword.slice(quotesIndexes[quotesIndexes.length - 1] + 1).split(' '));

    return normalizedKeywords.filter(isTruthy);
};

/**
 * Check if all given keywords are in any of the given strings. In other words, all given
 * keywords should be included in at least one of the searched strings
 * @param normalizedKeywords keywords to search
 * @param stringsToSearch string to be searched
 * @returns whether all keywords can be found in at least one given string
 */
export const testKeywords = (normalizedKeywords: string[], stringsToSearch: string[], hasApostrophe: boolean) => {
    const normalizedStrings = stringsToSearch.map((str) =>
        normalizeString(hasApostrophe ? replaceApostrophes(str) : str)
    );
    let result = true;
    let index = 0;
    while (result && index !== normalizedKeywords.length) {
        const keyword = normalizedKeywords[index];
        result = result && normalizedStrings.some((string) => string.includes(keyword));
        index++;
    }

    return result;
};

/**
 * Combine both metadata and content search, the latter only if available
 */
export const applySearch = <ESItemMetadata, ESItemContent, ESSearchParameters>({
    esSearchParams,
    item,
    hasApostrophe,
    esCallbacks,
}: {
    esSearchParams: ESSearchParameters;
    item: CachedItem<ESItemMetadata, ESItemContent>;
    hasApostrophe: boolean;
    esCallbacks: InternalESCallbacks<ESItemMetadata, ESSearchParameters, ESItemContent>;
}) => {
    const { applyFilters, searchKeywords, getKeywords } = esCallbacks;

    const filters = applyFilters(esSearchParams, item.metadata);
    const keywords = getKeywords(esSearchParams);
    if (!filters || !keywords) {
        return filters;
    }

    return searchKeywords(keywords, item, hasApostrophe);
};

/**
 * Decrypt encrypted object from IndexedDB
 */
export const decryptFromDB = async <Plaintext>({
    aesGcmCiphertext,
    indexKey,
    source,
}: {
    aesGcmCiphertext: ESCiphertext;
    indexKey: IndexKey;
    source: 'uncachedSearch' | 'cacheIDB' | 'readMetadataItem' | 'readContentItem' | 'searchUndecryptedElements';
}): Promise<Plaintext> => {
    try {
        const textDecoder = new TextDecoder();

        const serializedItem = await decryptItem(indexKey, aesGcmCiphertext);

        const decodedText = textDecoder.decode(serializedItem);

        try {
            return JSON.parse(decodedText);
        } catch (error) {
            const parseError = new ESParseError('Failed to parse decrypted data', error as Error);
            esSentryReport(`${parseError.message}: decryptFromDB`, {
                source,
                length: decodedText.length,
                error: parseError,
            });
            throw parseError;
        }
    } catch (error) {
        if (error instanceof ESParseError) {
            throw error;
        }

        const decryptError = new ESDecryptionError('Failed to decrypt data', error as Error);
        esSentryReport(`${decryptError.message}: decryptFromDB`, { source, error: decryptError });
        throw decryptError;
    }
};

/**
 * Perform an uncached search, i.e. with data being retrieved directly from IDB
 */
export const uncachedSearch = async <ESItemMetadata, ESItemContent, ESSearchParameters>({
    userID,
    indexKey,
    esSearchParams,
    esCallbacks,
    lastTimePoint,
    itemLimit,
    hasApostrophe,
    setIncrementalResults,
    abortSearchingRef,
}: {
    userID: string;
    indexKey: IndexKey;
    esSearchParams: ESSearchParameters;
    esCallbacks: InternalESCallbacks<ESItemMetadata, ESSearchParameters, ESItemContent>;
    lastTimePoint: ESTimepoint | undefined;
    itemLimit: number;
    hasApostrophe: boolean;
    setIncrementalResults?: (newResults: ESItem<ESItemMetadata, ESItemContent>[]) => void;
    abortSearchingRef?: React.MutableRefObject<AbortController>;
}): Promise<{ resultsArray: ESItem<ESItemMetadata, ESItemContent>[]; newLastTimePoint: ESTimepoint | undefined }> => {
    const { getItemInfo, checkIsReverse } = esCallbacks;

    const resultsArray: ESItem<ESItemMetadata, ESItemContent>[] = [];
    let newLastTimePoint = lastTimePoint;
    let remainingItems = itemLimit;
    let previousLenght = 0;

    const isReverse = checkIsReverse(esSearchParams);
    const remainingIDs = await readSortedIDs(userID, isReverse, newLastTimePoint);
    if (!remainingIDs) {
        return { resultsArray, newLastTimePoint };
    }

    for (let i = 0; i < remainingIDs.length; i += ES_MAX_ITEMS_PER_BATCH) {
        const IDs = remainingIDs.slice(i, i + ES_MAX_ITEMS_PER_BATCH);
        const [metadata, content] = await Promise.all([readMetadataBatch(userID, IDs), readContentBatch(userID, IDs)]);
        if (!metadata || !content || (abortSearchingRef && abortSearchingRef.current.signal.aborted)) {
            return { resultsArray, newLastTimePoint };
        }

        const data = await Promise.all(
            metadata.map(async (encryptedMetadata, index) => {
                if (abortSearchingRef && abortSearchingRef.current.signal.aborted) {
                    return;
                }

                if (!encryptedMetadata) {
                    return;
                }

                const encryptedContent = content[index];
                const [plaintextMetadata, plaintextContent] = await Promise.all([
                    decryptFromDB<ESItemMetadata>({
                        aesGcmCiphertext: encryptedMetadata.aesGcmCiphertext,
                        indexKey,
                        source: 'uncachedSearch',
                    }),
                    !!encryptedContent
                        ? decryptFromDB<ESItemContent>({
                              aesGcmCiphertext: encryptedContent,
                              indexKey,
                              source: 'uncachedSearch',
                          })
                        : undefined,
                ]);

                return { metadata: plaintextMetadata, content: plaintextContent };
            })
        );

        if (abortSearchingRef && abortSearchingRef.current.signal.aborted) {
            return { resultsArray, newLastTimePoint };
        }

        // eslint-disable-next-line @typescript-eslint/no-loop-func
        data.forEach((item) => {
            if (!item || remainingItems === 0 || (abortSearchingRef && abortSearchingRef.current.signal.aborted)) {
                return;
            }

            if (
                applySearch<ESItemMetadata, ESItemContent, ESSearchParameters>({
                    esSearchParams,
                    item,
                    hasApostrophe,
                    esCallbacks,
                })
            ) {
                newLastTimePoint = getItemInfo(item.metadata).timepoint;
                resultsArray.push({ ...item.metadata, ...item.content });
                remainingItems--;
            }
        });

        // In case the callback to show new search results while searching was given
        // and there are new search results in the current batch, show them
        if (setIncrementalResults && resultsArray.length > previousLenght) {
            previousLenght = resultsArray.length;
            setIncrementalResults(resultsArray);
        }
    }

    return { resultsArray, newLastTimePoint };
};

/**
 * Perform a cached search, i.e. over cached items only, potentially over a partial
 * cache, i.e. still being built, therefore we need to keep track of how many
 * items were searched
 */
const cachedSearch = <ESItemMetadata, ESItemContent, ESSearchParameters>({
    iterator,
    esSearchParams,
    abortSearchingRef,
    hasApostrophe,
    esCallbacks,
}: {
    iterator: IterableIterator<CachedItem<ESItemMetadata, ESItemContent>>;
    esSearchParams: ESSearchParameters;
    abortSearchingRef: React.MutableRefObject<AbortController>;
    hasApostrophe: boolean;
    esCallbacks: InternalESCallbacks<ESItemMetadata, ESSearchParameters, ESItemContent>;
}) => {
    const searchResults: ESItem<ESItemMetadata, ESItemContent>[] = [];
    let iteration = iterator.next();
    let iterationCount = 0;

    while (!iteration.done) {
        if (abortSearchingRef.current.signal.aborted) {
            break;
        }

        if (applySearch({ esSearchParams, item: iteration.value, hasApostrophe, esCallbacks })) {
            searchResults.push({ ...iteration.value.metadata, ...iteration.value.content });
        }

        iterationCount += 1;
        iteration = iterator.next();
    }

    return { searchResults, iterationCount };
};

/**
 * Based on the time boundaries of a search and the time span of a cache, check whether any more
 * items from IDB are needed. This is done because even if the cache is limited, i.e. does not fully
 * contain the whole IDB, its time span might already cover any user selected time window. It should
 * also return the first time point from where to start the uncached search and potentially adjusted
 * search parameters that take into account the new time boundaries
 */
const checkCacheTimespan = <ESItemMetadata, ESItemContent>({
    esCacheRef,
    getItemInfo,
    searchTimeInterval,
}: {
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, ESItemContent>>;
    getItemInfo: GetItemInfo<ESItemMetadata>;
    searchTimeInterval: {
        begin: number | undefined;
        end: number | undefined;
    };
}): { shouldKeepSearching: boolean; lastTimePoint?: ESTimepoint } => {
    const oldestCachedTimepoint = getOldestCachedTimepoint<ESItemMetadata>({ esCacheRef, getItemInfo });
    if (!oldestCachedTimepoint) {
        return {
            shouldKeepSearching: true,
        };
    }

    const [startCache, Order] = oldestCachedTimepoint;
    const { begin, end } = searchTimeInterval;

    const beginOrder = Order;
    const intervalEnd = Math.min(startCache, end || Number.MAX_SAFE_INTEGER);
    const intervalStart = begin || 0;
    const shouldKeepSearching = intervalStart < startCache;

    return {
        shouldKeepSearching,
        lastTimePoint: [intervalEnd, beginOrder],
    };
};

/**
 * Perform a search by switching between cached and uncached search when necessary
 */
export const hybridSearch = async <ESItemMetadata, ESItemContent, ESSearchParameters>({
    esCacheRef,
    esSearchParams,
    cachedIndexKey,
    getUserKeys,
    userID,
    setResultsList,
    abortSearchingRef,
    esCallbacks,
    minimumItems,
}: {
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, ESItemContent>>;
    esSearchParams: ESSearchParameters;
    cachedIndexKey: IndexKey | undefined;
    getUserKeys: GetUserKeys;
    userID: string;
    setResultsList: (Elements: ESItem<ESItemMetadata, ESItemContent>[]) => void;
    abortSearchingRef: React.MutableRefObject<AbortController>;
    esCallbacks: InternalESCallbacks<ESItemMetadata, ESSearchParameters, ESItemContent>;
    minimumItems: number | undefined;
}) => {
    const { checkIsReverse, getItemInfo, getSearchInterval, getKeywords } = esCallbacks;

    let searchResults: ESItem<ESItemMetadata, ESItemContent>[] = [];
    let isSearchPartial = false;
    const isReverse = checkIsReverse(esSearchParams);
    const hasApostrophe = (getKeywords(esSearchParams) || []).some((keyword) => keyword.includes(`'`));

    // Caching needs to be triggered here for when a refresh happens on a search URL
    if (!esCacheRef.current.isCacheReady && esCacheRef.current.esCache.size === 0) {
        const indexKey = cachedIndexKey || (await getIndexKey(getUserKeys, userID));
        if (!indexKey) {
            throw new Error('Key not found');
        }
        void cacheIDB<ESItemMetadata, ESItemContent>({ indexKey, userID, esCacheRef });
    }

    // Items in cache are the most recent ones, therefore if the cache is not ready and full and the search
    // is in descending order, we cannot use cached items
    if (isReverse || (esCacheRef.current.isCacheReady && !esCacheRef.current.isCacheLimited)) {
        // We have to wait for the cache to contain at least one message, because if it is empty the iterator
        // will be exhausted immediately and will not loop over newly inserted messages when they'll come in
        while (!esCacheRef.current.isCacheReady && esCacheRef.current.esCache.size === 0) {
            await wait(200);
        }

        /** Get current cache length */
        let searchedItemsCount = 0;
        /** Perform search on cache */
        const { searchResults: cachedSearchResults, iterationCount } = cachedSearch<
            ESItemMetadata,
            ESItemContent,
            ESSearchParameters
        >({
            iterator: esCacheRef.current.esCache.values(),
            esSearchParams,
            abortSearchingRef,
            hasApostrophe,
            esCallbacks,
        });
        searchResults = cachedSearchResults;
        searchedItemsCount += iterationCount;

        // The first batch of results (if any) are shown only if the cache is still being built, or if it has finished
        // but it's limited. Otherwise we want to show all results at the end
        if (searchResults.length !== 0 && (!esCacheRef.current.isCacheReady || esCacheRef.current.isCacheLimited)) {
            setResultsList(searchResults);
        }

        /**
         * Incremental search
         * Start incremental search if cache is not ready
         */
        if (!esCacheRef.current.isCacheReady) {
            while (true) {
                if (abortSearchingRef.current.signal.aborted) {
                    return {
                        searchResults,
                        isSearchPartial,
                    };
                }

                const cacheIsReadyBeforeSearch = esCacheRef.current.isCacheReady;
                const searchCacheValues = esCacheRef.current.esCache.values();
                // Go where we were at last iteration
                for (let i = 0; i < searchedItemsCount; i++) {
                    searchCacheValues.next();
                }

                // Search over newly cached items
                const { searchResults: cachedSearchResults, iterationCount } = cachedSearch<
                    ESItemMetadata,
                    ESItemContent,
                    ESSearchParameters
                >({ iterator: searchCacheValues, esSearchParams, abortSearchingRef, hasApostrophe, esCallbacks });
                searchedItemsCount += iterationCount;

                // Increment search result and execute callback
                if (cachedSearchResults.length) {
                    searchResults.push(...cachedSearchResults);
                    setResultsList(searchResults);
                }

                // If cache was ready before starting search, we did the last search iteration needed.
                if (cacheIsReadyBeforeSearch) {
                    break;
                }

                // Or wait until it becomes ready
                await wait(200);
            }
        }

        // Once caching has terminated, if the cache turns out to be not limited, we stop searching
        if (!esCacheRef.current.isCacheLimited || abortSearchingRef.current.signal.aborted) {
            return {
                searchResults,
                isSearchPartial,
            };
        }

        // If enough items to fill two pages were already found, we don't continue the search
        if (searchResults.length >= 2 * ES_EXTRA_RESULTS_LIMIT || abortSearchingRef.current.signal.aborted) {
            // The last item in cache is assumed to be the oldest
            const lastTimePoint = getOldestCachedTimepoint<ESItemMetadata>({ esCacheRef, getItemInfo });
            return {
                searchResults,
                isSearchPartial: true,
                lastTimePoint,
            };
        }
    }

    let shouldKeepSearching = !abortSearchingRef.current.signal.aborted;
    let lastTimePoint: ESTimepoint | undefined;
    isSearchPartial = true;

    // If the cache hasn't been searched because the order is ascending, the search
    // parameters shouldn't be influenced by the cache timespan
    if (isReverse) {
        // The remaining items are searched from DB, but only if the indicated timespan
        // hasn't been already covered by cache. The cache is ordered such that the last item is the oldest
        ({ shouldKeepSearching, lastTimePoint } = checkCacheTimespan<ESItemMetadata, ESItemContent>({
            esCacheRef,
            getItemInfo,
            searchTimeInterval: getSearchInterval(esSearchParams),
        }));
    }

    const remainingItems = Math.max(2 * ES_EXTRA_RESULTS_LIMIT - searchResults.length, minimumItems || 0);
    if (shouldKeepSearching && remainingItems > 0) {
        const setIncrementalResults = (newResults: ESItem<ESItemMetadata, ESItemContent>[]) => {
            setResultsList(searchResults.concat(newResults));
        };

        const indexKey = cachedIndexKey || (await getIndexKey(getUserKeys, userID));
        if (!indexKey) {
            throw new Error('Key not found');
        }

        const { resultsArray, newLastTimePoint } = await uncachedSearch<
            ESItemMetadata,
            ESItemContent,
            ESSearchParameters
        >({
            userID,
            indexKey,
            esSearchParams,
            esCallbacks,
            lastTimePoint,
            itemLimit: remainingItems,
            hasApostrophe,
            setIncrementalResults,
            abortSearchingRef,
        });
        searchResults.push(...resultsArray);
        isSearchPartial = !!newLastTimePoint;
        lastTimePoint = newLastTimePoint;
    }

    return { searchResults, isSearchPartial, lastTimePoint };
};

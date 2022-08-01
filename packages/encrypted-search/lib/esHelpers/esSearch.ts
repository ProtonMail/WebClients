import { wait } from '@proton/shared/lib/helpers/promise';
import isTruthy from '@proton/utils/isTruthy';

import { AesKeyGenParams, ES_EXTRA_RESULTS_LIMIT, ES_MAX_ITEMS_PER_BATCH } from '../constants';
import { getSortedInfo, openESDB, readContentItemsBatch, readNumContent } from '../esIDB';
import { AesGcmCiphertext, CachedItem, ESCache, ESItem, GetItemInfo, GetUserKeys, InternalESHelpers } from '../models';
import { getIndexKey } from './esBuild';
import { cacheContent, getOldestCachedContentTimepoint } from './esCache';
import { isTimepointSmaller, normalizeString } from './esUtils';

/**
 * Process the string input by the user in the searchbar by performing the following
 * transformations:
 *   - trims whitespaces from the input string;
 *   - removes diacritics;
 *   - casts to locale lower case;
 *   - splits the input string in multiple keywords if separated by whitespace, unless
 *     it's within quotes
 * @param keyword the string as input by users in the searchbar
 * @returns the array of normalised keywords to be searched
 */
export const normalizeKeyword = (keyword: string) => {
    const trimmedKeyword = normalizeString(keyword);
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
export const testKeywords = (normalizedKeywords: string[], stringsToSearch: string[]) => {
    const normalizedStrings = stringsToSearch.map((str) => normalizeString(str));
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
export const applySearch = <ESItemMetadata, ESItemContent, ESSearchParameters>(
    esSearchParams: ESSearchParameters,
    item: CachedItem<ESItemMetadata, ESItemContent>,
    searchMetadata: (esSearchParams: ESSearchParameters, metadata: ESItemMetadata) => boolean,
    searchContent: (esSearchParams: ESSearchParameters, itemToSearch: ESItemContent) => boolean,
    contentIndexingDone: boolean
) =>
    searchMetadata(esSearchParams, item.metadata) ||
    (!!item.content && contentIndexingDone ? searchContent(esSearchParams, item.content) : false);

/**
 * Decrypt encrypted object from IndexedDB
 */
export const decryptFromDB = async <Plaintext>(
    aesGcmCiphertext: AesGcmCiphertext,
    indexKey: CryptoKey
): Promise<Plaintext> => {
    const textDecoder = new TextDecoder();

    const decryptedMessage: ArrayBuffer = await crypto.subtle.decrypt(
        { iv: aesGcmCiphertext.iv, name: AesKeyGenParams.name },
        indexKey,
        aesGcmCiphertext.ciphertext
    );

    return JSON.parse(textDecoder.decode(new Uint8Array(decryptedMessage)));
};

/**
 * Perfom an uncached search, i.e. with data being retrieved directly from IDB, in ascending order.
 * Note that the order of element must be dictated by the order in which items appear in contentIDs
 */
export const uncachedSearch = async <ESItemMetadata, ESItemContent, ESSearchParameters>(
    userID: string,
    indexKey: CryptoKey,
    esSearchParams: ESSearchParameters,
    esHelpers: InternalESHelpers<ESItemMetadata, ESSearchParameters, ESItemContent>,
    contentIDs: Set<string>,
    itemLimit: number,
    contentIndexingDone: boolean,
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, ESItemContent>>,
    setIncrementalResults?: (newResults: ESItem<ESItemMetadata, ESItemContent>[]) => void,
    abortSearchingRef?: React.MutableRefObject<AbortController>
) => {
    const { searchContent, searchMetadata } = esHelpers;

    const resultsArray: ESItem<ESItemMetadata, ESItemContent>[] = [];

    let previousLenght = 0;
    while (resultsArray.length < itemLimit && contentIDs.size !== 0) {
        if (abortSearchingRef && abortSearchingRef.current.signal.aborted) {
            return resultsArray;
        }

        const storedData = await readContentItemsBatch(userID, Array.from(contentIDs).slice(0, ES_MAX_ITEMS_PER_BATCH));
        if (!storedData) {
            throw new Error('Failed to fetch items to search from IDB');
        }

        // Decrypt and process the retrieved data
        await Promise.all(
            storedData.map(async ({ itemID, aesGcmCiphertext }) => {
                // The ID of the searched item is removed so that next iterations won't
                // search it again
                contentIDs.delete(itemID);

                const item: CachedItem<ESItemMetadata, ESItemContent> = {
                    metadata: esCacheRef.current.esCache.get(itemID)!.metadata,
                    content: await decryptFromDB<ESItemContent>(aesGcmCiphertext, indexKey),
                };

                // We want to search metadata as well, since metadata of non-cached content are
                // not searched during cached search
                if (
                    applySearch<ESItemMetadata, ESItemContent, ESSearchParameters>(
                        esSearchParams,
                        item,
                        searchMetadata,
                        searchContent,
                        contentIndexingDone
                    )
                ) {
                    if (item) {
                        resultsArray.push({ ...item.metadata, ...item.content });
                    }
                }
            })
        );

        // In case the callback to show new search results while searching was given
        // and there are new search results in the current batch, show them
        if (setIncrementalResults && resultsArray.length > previousLenght) {
            previousLenght = resultsArray.length;
            setIncrementalResults(resultsArray);
        }

        // IDs of content already fetched from disk are removed from the contentIDs
        // set so that in the next iteration they won't be fetched again
        storedData.forEach((value) => contentIDs.delete(value.itemID));
    }

    return resultsArray;
};

/**
 * Perfom a cached search, i.e. over cached items only, for cases when the
 * cache is already full and we don't need to keep track of where the search reaches
 */
const fullCachedSearch = <ESItemMetadata, ESItemContent, ESSearchParameters>(
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, ESItemContent>>,
    esSearchParams: ESSearchParameters,
    abortSearchingRef: React.MutableRefObject<AbortController>,
    searchMetadata: (esSearchParams: ESSearchParameters, metadata: ESItemMetadata) => boolean,
    searchContent: (esSearchParams: ESSearchParameters, itemToSearch: ESItemContent) => boolean,
    getItemInfo: GetItemInfo<ESItemMetadata>,
    contentIndexingDone: boolean
) => {
    // If cache is limited, we should only search metadata for which we have content, see
    // the note in point 3. in hybridSearch
    const { isCacheLimited, esCache } = esCacheRef.current;
    let oldestContentTimepoint: [number, number] | undefined;
    if (isCacheLimited) {
        oldestContentTimepoint = getOldestCachedContentTimepoint(esCacheRef, getItemInfo);
    }

    const searchResults: ESItem<ESItemMetadata, ESItemContent>[] = [];

    esCache.forEach((value) => {
        if (
            abortSearchingRef.current.signal.aborted ||
            (oldestContentTimepoint &&
                isTimepointSmaller(getItemInfo(value.metadata).timepoint, oldestContentTimepoint))
        ) {
            return;
        }

        if (applySearch(esSearchParams, value, searchMetadata, searchContent, contentIndexingDone)) {
            searchResults.push({ ...value.metadata, ...value.content });
        }
    });

    return searchResults;
};

/**
 * Perfom a cached search, i.e. over cached items only, for cases when the
 * cache is partial, i.e. still being built, therefore we need to keep track
 * of hw many items were searched
 */
const partialCachedSearch = <ESItemMetadata, ESItemContent, ESSearchParameters>(
    iterator: IterableIterator<CachedItem<ESItemMetadata, ESItemContent>>,
    index: number,
    contentIDs: Set<string>,
    esSearchParams: ESSearchParameters,
    abortSearchingRef: React.MutableRefObject<AbortController>,
    searchMetadata: (esSearchParams: ESSearchParameters, metadata: ESItemMetadata) => boolean,
    searchContent: (esSearchParams: ESSearchParameters, itemToSearch: ESItemContent) => boolean,
    getItemInfo: GetItemInfo<ESItemMetadata>,
    contentIndexingDone: boolean
) => {
    const searchResults: ESItem<ESItemMetadata, ESItemContent>[] = [];
    let iteration = iterator.next();

    while (!iteration.done) {
        // In case we search the content of an item, we remove it from the list of content IDs
        // so that it won't be searched with uncached search
        if (!!iteration.value.content) {
            contentIDs.delete(getItemInfo(iteration.value.metadata).ID);
        }

        if (applySearch(esSearchParams, iteration.value, searchMetadata, searchContent, contentIndexingDone)) {
            searchResults.push({ ...iteration.value.metadata, ...iteration.value.content });
        }

        iteration = iterator.next();
        // The termination condition is threefold:
        //   - search was aborted;
        //   - search has reached the end of cache;
        //   - an item whose content is in IDB but not in cache is found, which means
        //     that caching still hasn't loaded it
        if (
            abortSearchingRef.current.signal.aborted ||
            iteration.done ||
            (!iteration.value.content && contentIDs.has(getItemInfo(iteration.value.metadata).ID))
        ) {
            return { searchResults, index };
        }
    }

    return { searchResults, index };
};

/**
 * Get all IDs of content, organised in a set
 */
const getContentIDs = async <ESItemMetadata>(
    userID: string,
    esCache: Map<string, CachedItem<ESItemMetadata, unknown>>,
    getItemInfo: GetItemInfo<ESItemMetadata>
) => {
    const esDB = await openESDB(userID);
    if (!esDB) {
        throw new Error('ESDB is needed to search while caching');
    }
    const contentInfo = await getSortedInfo<ESItemMetadata>(esDB, esCache, getItemInfo);
    esDB.close();

    return new Set(contentInfo.map(({ ID }) => ID));
};

/**
 * Create a set of content IDs, in reverse chronological order or not depending
 * on the isReverse parameter, that are only present on disk and not in cache.
 * In case a set is already given in input, use it for the intersection, otherwise
 * create one anew
 */
const intersectWithCache = async <ESItemMetadata, ESItemContent, ESSearchParameters>(
    userID: string,
    esSearchParams: ESSearchParameters,
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, ESItemContent>>,
    getItemInfo: GetItemInfo<ESItemMetadata>,
    searchMetadata: (
        esSearchParams: ESSearchParameters,
        metadata: ESItemMetadata,
        filterOnly?: boolean | undefined
    ) => boolean,
    isReverse: boolean,
    inputContentIDs?: Set<string>
) => {
    let contentIDs = new Set<string>();
    const localContentIDs = inputContentIDs || (await getContentIDs(userID, esCacheRef.current.esCache, getItemInfo));

    esCacheRef.current.esCache.forEach((value, key) => {
        if (localContentIDs.has(key) && !value.content && searchMetadata(esSearchParams, value.metadata, true)) {
            contentIDs.add(key);
        }
    });

    if (isReverse) {
        contentIDs = new Set(Array.from(contentIDs).reverse());
    }

    return contentIDs;
};

/**
 * Perform a search by switching between cached and uncached search when necessary
 */
export const hybridSearch = async <ESItemMetadata, ESItemContent, ESSearchParameters>(
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, ESItemContent>>,
    esSearchParams: ESSearchParameters,
    cachedIndexKey: CryptoKey | undefined,
    getUserKeys: GetUserKeys,
    userID: string,
    setResultsList: (Elements: ESItem<ESItemMetadata, ESItemContent>[]) => void,
    abortSearchingRef: React.MutableRefObject<AbortController>,
    esHelpers: InternalESHelpers<ESItemMetadata, ESSearchParameters, ESItemContent>,
    contentIndexingDone: boolean,
    minimumItems: number | undefined
) => {
    /*
        We assume that metadata cache is fully built, while content cache might be building as this
        function is invoked. So there are the following cases:
            1. if content is not needed (e.g. content search not active yet or for "no-content"
            products), we can search cache straight away.

            2. If content is needed, content cache is ready and not limited, again search it straight away.

            3. If content is needed, content cache is ready but limited, we need to first search cache
            and then fallback to disk. Note that even if metadata is in cache in its entirety, we can't search
            metadata of content that is not cached, since we might find a hit in items older than some item for
            which we find a hit only when looking into disk for content. In other words, metadata should be
            searched along with content when cache is limited. In case the search is in chronological order,
            however, we need to go to disk directly.
            
            4. If content is needed but content cache is not ready, we use the trick of looping while it
            is and incrementally search it. At the end, one of the above two is applied depending on
            whether it ends up being limited or not.
    */
    const { checkIsReverse, getItemInfo, searchMetadata, searchContent } = esHelpers;

    let searchResults: ESItem<ESItemMetadata, ESItemContent>[] = [];
    let isSearchPartial = false;

    // Caching needs to be triggered here for when a refresh happens on a search URL
    const count = (await readNumContent(userID)) || 0;
    if (!esCacheRef.current.isContentCached && count > 0) {
        const indexKey = cachedIndexKey || (await getIndexKey(getUserKeys, userID));
        if (!indexKey) {
            throw new Error('Key not found');
        }
        esCacheRef.current.isCacheReady = false;
        void cacheContent<ESItemMetadata, ESItemContent>(indexKey, userID, esCacheRef, esHelpers.getItemInfo);
    }

    // if content is needed in chronological order over a limited cache, there is no point in searching the latter.
    // Note that if content caching is in progress, we don't know whether it will turn out to be limited or not,
    // therefore we assume that we cannot use it if the search is in chronological order and the cache is not ready
    const isReverse = checkIsReverse(esSearchParams);
    const canUseCache =
        !contentIndexingDone || isReverse || (esCacheRef.current.isCacheReady && !esCacheRef.current.isCacheLimited);

    // In case we'll need to resort to uncached search, we keep track of which content were already
    // searched by cached search
    let contentIDs = new Set<string>();

    if (canUseCache) {
        // If the cache is ready, we can already use it. Note that if it is not, it must mean that
        // content is being added to cache, since we assume that metadata cache is already available
        // when performing a search
        if (esCacheRef.current.isCacheReady) {
            searchResults = fullCachedSearch(
                esCacheRef,
                esSearchParams,
                abortSearchingRef,
                searchMetadata,
                searchContent,
                getItemInfo,
                contentIndexingDone
            );

            // If no content is needed, or it is and the cache is not limited, search is over. This
            // corresponds to cases 1. and 2. above. In case content is needed and cache is limited, since
            // we have just searched it all, we need to fallback to uncached search, which is case 3. above
            if (!contentIndexingDone || !esCacheRef.current.isCacheLimited) {
                return {
                    searchResults,
                    isSearchPartial,
                    contentIDs,
                };
            }

            // In case the cache is limited, we add all content IDs that are not in cache and whose
            // metadata pass any user's filter so that they can be used to inform uncached search.
            // Note that since we traverse the cache, which is in chronological order, we need to
            // reverse contentIDs in order to have them in reverse chronological order
            contentIDs = await intersectWithCache(
                userID,
                esSearchParams,
                esCacheRef,
                getItemInfo,
                searchMetadata,
                isReverse
            );
        } else {
            // In case cache is not ready we need to incrementally search it until it is over, i.e.
            // case 4. above. The tricky part is to know which point of the content caching is at,
            // since the cache size remains the same, and is at full length since the very beginning
            // due to the presence of metadata, while an undefined content for a specific cached
            // item might mean both a decryption failure and that caching isn't there yet. To solve
            // this we use the IDs of the content items stored in IDB and follow those
            const localContentIDs = await getContentIDs(userID, esCacheRef.current.esCache, getItemInfo);

            let index = 0;
            const iterator = esCacheRef.current.esCache.values();
            let resultsCounter = 0;

            // We keep searching cache until it's done
            while (!esCacheRef.current.isCacheReady) {
                if (abortSearchingRef.current.signal.aborted) {
                    return {
                        searchResults,
                        isSearchPartial,
                        contentIDs,
                    };
                }

                const newResult = partialCachedSearch<ESItemMetadata, ESItemContent, ESSearchParameters>(
                    iterator,
                    index,
                    localContentIDs,
                    esSearchParams,
                    abortSearchingRef,
                    searchMetadata,
                    searchContent,
                    getItemInfo,
                    contentIndexingDone
                );
                index = newResult.index;
                searchResults.push(...newResult.searchResults);

                // In case there are new results, we show them
                if (searchResults.length > resultsCounter) {
                    setResultsList(searchResults);
                }

                resultsCounter = searchResults.length;
                await wait(200);
            }

            // To avoid any race condition at the end of the while loop, one last search of the very last portion
            // is performed
            const { searchResults: newSearchResults } = partialCachedSearch<
                ESItemMetadata,
                ESItemContent,
                ESSearchParameters
            >(
                iterator,
                index,
                localContentIDs,
                esSearchParams,
                abortSearchingRef,
                searchMetadata,
                searchContent,
                getItemInfo,
                contentIndexingDone
            );
            searchResults.push(...newSearchResults);

            // Once caching has terminated, if the cache turns out to be not limited, we stop searching
            if (!esCacheRef.current.isCacheLimited || abortSearchingRef.current.signal.aborted) {
                return {
                    searchResults,
                    isSearchPartial,
                    contentIDs,
                };
            }

            // We store all content IDs that have not been searched, because not in cache, and that
            // pass any filters. This way, both in case we found enough items but the search is limited
            // and if we need more items from disk, we know which content IDs to fetch from IDB
            contentIDs = await intersectWithCache(
                userID,
                esSearchParams,
                esCacheRef,
                getItemInfo,
                searchMetadata,
                isReverse,
                localContentIDs
            );

            // If enough items to fill two pages were already found, we don't continue the search
            if (searchResults.length >= 2 * ES_EXTRA_RESULTS_LIMIT || abortSearchingRef.current.signal.aborted) {
                return {
                    searchResults,
                    isSearchPartial: true,
                    contentIDs,
                };
            }

            // If there were more results in the last batch, we show them before continuing with uncached search
            if (searchResults.length > resultsCounter) {
                setResultsList(searchResults);
            }
        }
    } else {
        // In case no cache was used, we still want to filter out any items thanks to search parameters
        // before starting uncached search
        contentIDs = await intersectWithCache(
            userID,
            esSearchParams,
            esCacheRef,
            getItemInfo,
            searchMetadata,
            isReverse
        );
    }

    // For uncached search we want to leverage having all metadata raedily available and only
    // fetch, decrypt and search those contents that pass any filter the user might have selected,
    // as well as only those that weren't already searched by cached search. By this point, contentIDs
    // contains all content IDs in the correct order, reverse or otherwise, that pass filters.
    if (!abortSearchingRef.current.signal.aborted && contentIDs.size > 0) {
        const remainingItems = Math.max(2 * ES_EXTRA_RESULTS_LIMIT - searchResults.length, minimumItems || 0);

        let resultsArray: ESItem<ESItemMetadata, ESItemContent>[] = [];
        if (remainingItems > 0) {
            const setIncrementalResults = (newResults: ESItem<ESItemMetadata, ESItemContent>[]) => {
                setResultsList(searchResults.concat(newResults));
            };

            const indexKey = cachedIndexKey || (await getIndexKey(getUserKeys, userID));
            if (!indexKey) {
                throw new Error('Key not found');
            }

            resultsArray = await uncachedSearch<ESItemMetadata, ESItemContent, ESSearchParameters>(
                userID,
                indexKey,
                esSearchParams,
                esHelpers,
                contentIDs,
                remainingItems,
                contentIndexingDone,
                esCacheRef,
                setIncrementalResults,
                abortSearchingRef
            );
        }

        searchResults.push(...resultsArray);
        isSearchPartial = contentIDs.size > 0;
    }

    return { searchResults, isSearchPartial, contentIDs };
};

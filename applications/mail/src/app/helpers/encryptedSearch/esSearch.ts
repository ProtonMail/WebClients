import { Api, Recipient } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { IDBPDatabase } from 'idb';
import { endOfDay, endOfToday, startOfDay, sub } from 'date-fns';
import { getRecipients } from '@proton/shared/lib/mail/messages';
import { wait } from '@proton/shared/lib/helpers/promise';
import { removeDiacritics } from '@proton/shared/lib/helpers/string';
import { Filter, SearchParameters, Sort } from '../../models/tools';
import { Element } from '../../models/element';
import {
    ESMessage,
    EncryptedSearchDB,
    ESCache,
    GetUserKeys,
    LastEmail,
    NormalisedSearchParams,
    StoredCiphertext,
    UncachedSearchOptions,
} from '../../models/encryptedSearch';
import { ES_MAX_MESSAGES_PER_BATCH, PAGE_SIZE } from '../../constants';
import { esSentryReport, getES, getNumMessagesDB, getOldestTime, openESDB } from './esUtils';
import { decryptFromDB } from './esSync';
import { getIndexKey } from './esBuild';
import { sendESMetrics } from './esAPI';

/**
 * Normalise keyword
 */
const normaliseKeyword = (keyword: string) => {
    const trimmedKeyword = removeDiacritics(keyword.trim().toLocaleLowerCase());
    const quotesIndexes: number[] = [];

    let index = 0;
    while (index !== -1) {
        index = trimmedKeyword.indexOf(`"`, index);
        if (index !== -1) {
            quotesIndexes.push(index);
            index++;
        }
    }

    const normalisedKeywords: string[] = [];
    let previousIndex = -1;
    for (let index = 0; index < quotesIndexes.length; index++) {
        const keyword = trimmedKeyword.slice(previousIndex + 1, quotesIndexes[index]);

        if (index % 2 === 1) {
            // If the user placed quotes, we want to keep everything inside as a single block
            normalisedKeywords.push(keyword);
        } else {
            // Otherwise we split by whitespace
            normalisedKeywords.push(...keyword.split(' '));
        }

        previousIndex = quotesIndexes[index];
    }

    normalisedKeywords.push(...trimmedKeyword.slice(quotesIndexes[quotesIndexes.length - 1] + 1).split(' '));

    return normalisedKeywords.filter(isTruthy);
};

/**
 * Remove milliseconds from numeric value of a date
 */
export const roundMilliseconds = (time: number) => Math.floor(time / 1000);

/**
 * Remove wildcard, normalise keyword and include end day
 */
export const normaliseSearchParams = (
    searchParams: SearchParameters,
    labelID: string,
    filter?: Filter,
    sort?: Sort
) => {
    const { wildcard, keyword, end, to, from, ...otherParams } = searchParams;
    let normalisedKeywords: string[] | undefined;
    if (keyword) {
        normalisedKeywords = normaliseKeyword(keyword);
    }
    let roundedEnd: number | undefined;
    if (end) {
        roundedEnd = roundMilliseconds(endOfDay(end * 1000).getTime());
    }

    const normalisedSearchParams: NormalisedSearchParams = {
        labelID,
        search: {
            end: roundedEnd,
            from: from ? from.toLocaleLowerCase() : undefined,
            to: to ? to.toLocaleLowerCase() : undefined,
            ...otherParams,
        },
        normalisedKeywords,
        filter: filter || {},
        sort: sort || { sort: 'Time', desc: true },
    };

    return normalisedSearchParams;
};

/**
 * Check if keywords are in subject, Sender, body, ToList, CCList or BCCList
 */
const testKeywords = (normalisedKeywords: string[], messageToSearch: ESMessage, addresses: string[]) => {
    const { Subject, decryptedBody, decryptedSubject } = messageToSearch;
    const subject = decryptedSubject || Subject;

    const messageStrings = [subject, ...addresses, decryptedBody || ''].map((string) =>
        removeDiacritics(string.toLocaleLowerCase())
    );

    let result = true;
    let index = 0;
    while (result && index !== normalisedKeywords.length) {
        const keyword = normalisedKeywords[index];
        result = result && messageStrings.some((string) => string.includes(keyword));
        index++;
    }

    return result;
};

/**
 * Test whether a given message fulfills every metadata requirement
 */
export const testMetadata = (
    normalisedSearchParams: NormalisedSearchParams,
    messageToSearch: ESMessage,
    recipients: string[],
    sender: string[]
) => {
    const { search, labelID, decryptionError, filter } = normalisedSearchParams;
    const { address, from, to, begin, end, attachments } = search || {};
    const { AddressID, Time, LabelIDs, NumAttachments, decryptionError: messageError, Unread } = messageToSearch;

    if (
        !LabelIDs.includes(labelID) ||
        (address && AddressID !== address) ||
        (begin && Time < begin) ||
        (end && Time > end) ||
        (from && !sender.some((string) => string.includes(from))) ||
        (to && !recipients.some((string) => string.includes(to))) ||
        (typeof attachments !== 'undefined' &&
            ((attachments === 0 && NumAttachments > 0) || (attachments === 1 && NumAttachments === 0))) ||
        (typeof decryptionError !== 'undefined' && decryptionError !== messageError) ||
        (typeof filter?.Unread !== 'undefined' && filter?.Unread !== Unread)
    ) {
        return false;
    }

    return true;
};

/**
 * Apply advanced search filters and search for keywords
 */
export const applySearch = (normalisedSearchParams: NormalisedSearchParams, messageToSearch: ESMessage) => {
    const { Sender } = messageToSearch;

    const transformRecipients = (recipients: Recipient[]) => [
        ...recipients.map((recipient) => recipient.Address.toLocaleLowerCase()),
        ...recipients.map((recipient) => recipient.Name.toLocaleLowerCase()),
    ];

    const recipients = transformRecipients(getRecipients(messageToSearch));
    const sender = transformRecipients([Sender]);

    if (!testMetadata(normalisedSearchParams, messageToSearch, recipients, sender)) {
        return false;
    }

    const { normalisedKeywords } = normalisedSearchParams;
    if (!normalisedKeywords) {
        return true;
    }

    return testKeywords(normalisedKeywords, messageToSearch, [...recipients, ...sender]);
};

/**
 * Derive the correct time boundaries to get batches of messages from IndexedDB.
 * Time intervals are around one month long
 */
export const getTimeLimits = (prevStart: number, begin: number | undefined, end: number | undefined) => {
    const endTime = prevStart ? prevStart - 1 : end || roundMilliseconds(endOfToday().getTime());
    const startTime = Math.max(begin || 0, roundMilliseconds(startOfDay(sub(endTime * 1000, { days: 1 })).getTime()));

    const lower: [number, number] = [startTime, 0];
    const upper: [number, number] = [endTime, Number.MAX_SAFE_INTEGER];

    return {
        lower,
        upper,
    };
};

/**
 * Initialise some helpers to query the correct time frames
 */
export const initialiseQuery = async (userID: string, beginOrder?: number, begin?: number, end?: number) => {
    // Data is retrieved in batches, in such a way that decryption of earlier batches
    // can start before fetching later batches. Messages are retrieved in reverse chronological order.
    // Initial time represents the oldest moment in time the search has to go back to. It is
    // "begin" if specified, otherwise it's the oldest date in IndexedDB
    const initialTime = begin || (await getOldestTime(userID));
    const getTimes = (start: number) => getTimeLimits(start, initialTime, end);
    const lower: [number, number] = [0, 0];
    const upper: [number, number] = [0, 0];
    const startingOrder = beginOrder ? beginOrder - 1 : undefined;
    return { getTimes, initialTime, lower, upper, startingOrder };
};

/**
 * Fetch a new batch of messages from IDB
 */
export const queryNewData = async (
    getTimes: (start: number) => {
        lower: [number, number];
        upper: [number, number];
    },
    lower: [number, number],
    upper: [number, number],
    startingOrder: number | undefined,
    esDB: IDBPDatabase<EncryptedSearchDB>
) => {
    const bounds = getTimes(lower[0]);
    ({ lower, upper } = bounds);
    if (startingOrder) {
        upper[1] = startingOrder;
        startingOrder = undefined;
    }

    const storedData = await esDB.getAllFromIndex('messages', 'byTime', IDBKeyRange.bound(lower, upper));
    return { lower, upper, startingOrder, storedData };
};

/**
 * Perfom an uncached search in ascending order, i.e. fetching and searching messages from IndexedDB
 */
export const uncachedSearchAsc = async (
    indexKey: CryptoKey,
    userID: string,
    normalisedSearchParams: NormalisedSearchParams,
    options: UncachedSearchOptions
) => {
    const esDB = await openESDB(userID);
    const { messageLimit, setCache, beginOrder, abortSearchingRef } = options;
    const resultsArray: ESMessage[] = [];

    let lastEmail: LastEmail | undefined;
    let lowerBound = [normalisedSearchParams.search.begin || (await getOldestTime(userID)), beginOrder || 0];

    while (!lastEmail) {
        if (abortSearchingRef && abortSearchingRef.current.signal.aborted) {
            return { resultsArray, lastEmail };
        }

        const storedData = await esDB.getAllFromIndex(
            'messages',
            'byTime',
            IDBKeyRange.lowerBound(lowerBound, true),
            ES_MAX_MESSAGES_PER_BATCH
        );

        if (!storedData.length) {
            break;
        }

        lowerBound = [storedData[storedData.length - 1].Time, storedData[storedData.length - 1].Order];

        await Promise.all(
            storedData.map(async (storedCiphertext) => {
                if (!storedCiphertext.LabelIDs.includes(normalisedSearchParams.labelID)) {
                    return;
                }
                const messageToSearch = await decryptFromDB(storedCiphertext, indexKey);
                if (applySearch(normalisedSearchParams, messageToSearch)) {
                    resultsArray.push(messageToSearch);
                }
            })
        );

        if (messageLimit && resultsArray.length >= messageLimit) {
            const lastCiphertext = storedData[storedData.length - 1];
            lastEmail = { Time: lastCiphertext.Time, Order: lastCiphertext.Order };
        }

        if (
            normalisedSearchParams.search.end &&
            storedData[storedData.length - 1].Time > normalisedSearchParams.search.end
        ) {
            break;
        }

        if (setCache && resultsArray.length > 0) {
            setCache(resultsArray);
        }
    }

    esDB.close();

    return { resultsArray, lastEmail };
};

/**
 * Perfom an uncached search in descending order, i.e. fetching and searching messages from IndexedDB
 */
export const uncachedSearchDesc = async (
    indexKey: CryptoKey,
    userID: string,
    normalisedSearchParams: NormalisedSearchParams,
    options: UncachedSearchOptions
) => {
    const esDB = await openESDB(userID);
    const { messageLimit, beginOrder, setCache, abortSearchingRef } = options;
    const resultsArray: ESMessage[] = [];

    const queryStart = await initialiseQuery(
        userID,
        beginOrder,
        normalisedSearchParams.search.begin,
        normalisedSearchParams.search.end
    );
    const { getTimes, initialTime } = queryStart;
    let { lower, upper, startingOrder } = queryStart;
    let lastEmail: LastEmail | undefined;

    while (!lastEmail) {
        if (abortSearchingRef && abortSearchingRef.current.signal.aborted) {
            return { resultsArray, lastEmail };
        }

        let storedData: StoredCiphertext[];
        ({ lower, upper, startingOrder, storedData } = await queryNewData(getTimes, lower, upper, startingOrder, esDB));

        await Promise.all(
            storedData.map(async (storedCiphertext) => {
                if (!storedCiphertext.LabelIDs.includes(normalisedSearchParams.labelID)) {
                    return;
                }
                const messageToSearch = await decryptFromDB(storedCiphertext, indexKey);
                if (applySearch(normalisedSearchParams, messageToSearch)) {
                    resultsArray.push(messageToSearch);
                }
            })
        );

        if (messageLimit && resultsArray.length >= messageLimit) {
            const lastCiphertext = storedData[0];
            lastEmail = { Time: lastCiphertext.Time, Order: lastCiphertext.Order };
        }

        if (lower[0] === initialTime) {
            break;
        }

        if (setCache && resultsArray.length > 0) {
            setCache(resultsArray);
        }
    }

    esDB.close();

    return { resultsArray, lastEmail };
};

/**
 * Perfom an cached search, i.e. over the given messages only
 */
export const cachedSearch = (
    esCache: ESMessage[],
    normalisedSearchParams: NormalisedSearchParams,
    abortSearchingRef: React.MutableRefObject<AbortController>
) => {
    const searchResults: ESMessage[] = [];

    esCache.forEach((messageToSearch: ESMessage) => {
        if (abortSearchingRef.current.signal.aborted) {
            return;
        }
        if (applySearch(normalisedSearchParams, messageToSearch)) {
            searchResults.push(messageToSearch);
        }
    });

    return searchResults;
};

/**
 * Perfom an uncached search in either ascending or descending order
 */
export const uncachedSearch = async (
    userID: string,
    indexKey: CryptoKey,
    normalisedSearchParams: NormalisedSearchParams,
    options: UncachedSearchOptions
) => {
    const { lastEmailTime } = options;

    if (normalisedSearchParams.sort.desc) {
        return uncachedSearchDesc(
            indexKey,
            userID,
            { ...normalisedSearchParams, search: { end: lastEmailTime || normalisedSearchParams.search.end } },
            options
        );
    }

    return uncachedSearchAsc(
        indexKey,
        userID,
        { ...normalisedSearchParams, search: { begin: lastEmailTime || normalisedSearchParams.search.begin } },
        options
    );
};

/**
 * Perform a search by switching between cached and uncached search when necessary
 */
export const hybridSearch = async (
    esCacheRef: React.MutableRefObject<ESCache>,
    normalisedSearchParams: NormalisedSearchParams,
    cachedIndexKey: CryptoKey | undefined,
    getUserKeys: GetUserKeys,
    userID: string,
    setCache: (Elements: Element[]) => void,
    abortSearchingRef: React.MutableRefObject<AbortController>
) => {
    let searchResults: ESMessage[] = [];
    let isSearchPartial = false;
    let lastEmail: LastEmail | undefined;
    const isDescending = normalisedSearchParams.sort.desc;

    // Messages in cache are the most recent ones, therefore if the cache is not ready and full and the search
    // is in descending order, we cannot used cached messages
    if (isDescending || (esCacheRef.current.isCacheReady && !esCacheRef.current.isCacheLimited)) {
        // searchResults is initialised with the first portion of cached results
        let lastLength = esCacheRef.current.esCache.length;
        searchResults = cachedSearch(esCacheRef.current.esCache, normalisedSearchParams, abortSearchingRef);
        let resultsCounter = searchResults.length;

        // The first batch of results (if any) are shown only if the cache is still being built, or if it has finished
        // but it's limited. Otherwise we want to show all results at the end
        if (resultsCounter !== 0 && (!esCacheRef.current.isCacheReady || esCacheRef.current.isCacheLimited)) {
            setCache(searchResults);
        }

        // If the cache is still being built, incremental portions of cache are searched
        while (!esCacheRef.current.isCacheReady) {
            if (abortSearchingRef.current.signal.aborted) {
                return {
                    searchResults,
                    isSearchPartial,
                    lastEmail,
                };
            }

            const newLastLength = esCacheRef.current.esCache.length;
            searchResults.push(
                ...cachedSearch(esCacheRef.current.esCache.slice(lastLength), normalisedSearchParams, abortSearchingRef)
            );

            // In case there are new results, we show them
            if (searchResults.length > resultsCounter) {
                setCache(searchResults);
            }

            resultsCounter = searchResults.length;
            lastLength = newLastLength;
            await wait(200);
        }

        // To avoid any race condition at the end of the while loop, one last search of the very last portion
        // is performed
        searchResults.push(
            ...cachedSearch(esCacheRef.current.esCache.slice(lastLength), normalisedSearchParams, abortSearchingRef)
        );

        // Once caching has terminated, if the cache turns out to be not limited, we stop searching
        if (!esCacheRef.current.isCacheLimited || abortSearchingRef.current.signal.aborted) {
            return {
                searchResults,
                isSearchPartial,
                lastEmail,
            };
        }

        // If enough messages to fill two pages were already found, we don't continue the search
        if (searchResults.length >= 2 * PAGE_SIZE || abortSearchingRef.current.signal.aborted) {
            // The last message in cache is assumed to be the oldest
            const { Time, Order } = esCacheRef.current.esCache[esCacheRef.current.esCache.length - 1];
            const lastEmailInCache: LastEmail = { Time, Order };
            return {
                searchResults,
                isSearchPartial: true,
                lastEmail: lastEmailInCache,
            };
        }

        // If there were more results in the last batch, we show them before continuing with uncached search
        if (searchResults.length > resultsCounter) {
            setCache(searchResults);
        }
    }

    // If the cache hasn't been searched because the order is ascending, the search
    // parameters shouldn't be influenced by the cache timespan
    let shouldKeepSearching = !abortSearchingRef.current.signal.aborted;
    let beginOrder: number | undefined;
    if (isDescending) {
        // The remaining messages are searched from DB, but only if the indicated timespan
        // hasn't been already covered by cache. The cache is ordered such that the last message is the oldest
        const { Time: startCache, Order } = esCacheRef.current.esCache[esCacheRef.current.esCache.length - 1];
        beginOrder = Order;
        const intervalEnd = Math.min(startCache, normalisedSearchParams.search.end || Number.MAX_SAFE_INTEGER);
        const intervalStart = normalisedSearchParams.search.begin || 0;
        shouldKeepSearching = intervalStart < startCache;
        normalisedSearchParams = {
            ...normalisedSearchParams,
            search: { begin: intervalStart, end: intervalEnd },
        };
    }

    if (shouldKeepSearching) {
        const remainingMessages = 2 * PAGE_SIZE - searchResults.length;

        const setCacheIncremental = (newResults: ESMessage[]) => {
            setCache(searchResults.concat(newResults));
        };

        const indexKey = cachedIndexKey || (await getIndexKey(getUserKeys, userID));
        if (!indexKey) {
            throw new Error('Key not found');
        }

        const uncachedResult = await uncachedSearch(userID, indexKey, normalisedSearchParams, {
            messageLimit: remainingMessages,
            setCache: setCacheIncremental,
            beginOrder,
            abortSearchingRef,
        });
        searchResults.push(...uncachedResult.resultsArray);
        lastEmail = uncachedResult.lastEmail;
        isSearchPartial = !!lastEmail;
    }

    return { searchResults, isSearchPartial, lastEmail };
};

/**
 * Check whether only sorting changed and, if so, only sort existing results
 * rather than executing a new search
 */
export const shouldOnlySortResults = (
    normalisedSearchParams: NormalisedSearchParams,
    previousNormSearchParams: NormalisedSearchParams
) => {
    const {
        labelID,
        filter,
        search: { address, from, to, begin, end, attachments },
        normalisedKeywords,
        decryptionError,
    } = normalisedSearchParams;
    const {
        labelID: prevLabelID,
        filter: prevFilter,
        search: {
            address: prevAddress,
            from: prevFrom,
            to: prevTo,
            begin: prevBegin,
            end: prevEnd,
            attachments: prevAttachments,
        },
        normalisedKeywords: prevNormalisedKeywords,
        decryptionError: prevDecryptionError,
    } = previousNormSearchParams;

    // In case search parameters are different, then a new search is needed
    if (
        labelID !== prevLabelID ||
        address !== prevAddress ||
        from !== prevFrom ||
        to !== prevTo ||
        begin !== prevBegin ||
        end !== prevEnd ||
        attachments !== prevAttachments ||
        decryptionError !== prevDecryptionError ||
        !!normalisedKeywords !== !!prevNormalisedKeywords ||
        filter?.Unread !== prevFilter?.Unread
    ) {
        return false;
    }

    // Same goes for keywords
    if (normalisedKeywords && prevNormalisedKeywords) {
        if (normalisedKeywords.length !== prevNormalisedKeywords.length) {
            return false;
        }
        for (let i = 0; i < normalisedKeywords.length; i++) {
            if (normalisedKeywords[i] !== prevNormalisedKeywords[i]) {
                return false;
            }
        }
    }

    return true;
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
    isCacheLimited: boolean
) => {
    const numMessagesIndexed = await getNumMessagesDB(userID);

    // Random number of seconds between 1 second and 3 minutes, expressed in milliseconds
    await wait(1000 * Math.floor(180 * Math.random() + 1));

    return sendESMetrics(api, 'search', {
        indexSize: getES.Size(userID),
        numMessagesIndexed,
        cacheSize,
        searchTime,
        isFirstSearch,
        isCacheLimited,
    });
};

/**
 * Send a sentry report for when ES is too slow
 */
export const sendSlowSearchReport = async (userID: string) => {
    const numMessagesIndexed = await getNumMessagesDB(userID);

    // Random number of seconds between 1 second and 3 minutes, expressed in milliseconds
    await wait(1000 * Math.floor(180 * Math.random() + 1));

    esSentryReport('Search is taking too long, showing warning banner', { numMessagesIndexed });
};

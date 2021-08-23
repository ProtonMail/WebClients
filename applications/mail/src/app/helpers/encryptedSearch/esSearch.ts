import { IDBPDatabase, openDB } from 'idb';
import { endOfDay, endOfToday, startOfMonth, sub } from 'date-fns';
import { getRecipients } from '@proton/shared/lib/mail/messages';
import { wait } from '@proton/shared/lib/helpers/promise';
import { Filter, SearchParameters, Sort } from '../../models/tools';
import { Element } from '../../models/element';
import {
    CachedMessage,
    EncryptedSearchDB,
    ESCache,
    GetUserKeys,
    LastEmail,
    MessageForSearch,
    NormalisedSearchParams,
    StoredCiphertext,
    UncachedSearchOptions,
} from '../../models/encryptedSearch';
import { ES_MAX_MESSAGES_PER_BATCH, PAGE_SIZE } from '../../constants';
import { getOldestTime } from './esUtils';
import { decryptFromDB } from './esSync';
import { getIndexKey } from './esBuild';
/**
 * Normalise keyword
 */
const normaliseKeyword = (keyword: string) => {
    return keyword
        .toLocaleLowerCase()
        .split(' ')
        .filter((s) => s);
};

/**
 * Remove milliseconds from numeric value of a date
 */
const roundMilliseconds = (time: number) => Math.floor(time / 1000);

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
        ...otherParams,
        labelID,
        end: roundedEnd,
        normalisedKeywords,
        from: from ? from.toLocaleLowerCase() : undefined,
        to: to ? to.toLocaleLowerCase() : undefined,
        filter: filter || {},
        sort: sort || { sort: 'Time', desc: true },
    };

    return normalisedSearchParams;
};

/**
 * Check if keywords are in subject, Sender, body, ToList, CCList or BCCList
 */
const testKeyword = (normalisedKeywords: string[], messageToSearch: CachedMessage) => {
    const { Subject, Sender, decryptedBody, decryptedSubject, ToList, CCList, BCCList } = messageToSearch;
    const subject = decryptedSubject || Subject;

    let result = true;
    let index = 0;
    while (result && index !== normalisedKeywords.length) {
        const keyword = normalisedKeywords[index];
        result =
            result &&
            (subject.toLocaleLowerCase().includes(keyword) ||
                Sender.Address.toLocaleLowerCase().includes(keyword) ||
                Sender.Name.toLocaleLowerCase().includes(keyword) ||
                ToList.map((recipient) => recipient.Address)
                    .join(' ')
                    .toLocaleLowerCase()
                    .includes(keyword) ||
                CCList.map((recipient) => recipient.Address)
                    .join(' ')
                    .toLocaleLowerCase()
                    .includes(keyword) ||
                BCCList.map((recipient) => recipient.Address)
                    .join(' ')
                    .toLocaleLowerCase()
                    .includes(keyword) ||
                ToList.map((recipient) => recipient.Name)
                    .join(' ')
                    .toLocaleLowerCase()
                    .includes(keyword) ||
                CCList.map((recipient) => recipient.Name)
                    .join(' ')
                    .toLocaleLowerCase()
                    .includes(keyword) ||
                BCCList.map((recipient) => recipient.Name)
                    .join(' ')
                    .toLocaleLowerCase()
                    .includes(keyword) ||
                (!!decryptedBody && decryptedBody.toLocaleLowerCase().includes(keyword)));
        index++;
    }

    return result;
};

/**
 * Apply advanced search filters and search for keywords
 */
export const applySearch = (
    normalisedSearchParams: NormalisedSearchParams,
    messageToSearch: CachedMessage,
    incrementMessagesSearched?: () => void
) => {
    const { address, from, to, normalisedKeywords, begin, end, attachments, labelID, decryptionError, filter } =
        normalisedSearchParams;

    if (
        !messageToSearch.LabelIDs.includes(labelID) ||
        (address && messageToSearch.AddressID !== address) ||
        (begin && messageToSearch.Time < begin) ||
        (end && messageToSearch.Time > end) ||
        (from &&
            !messageToSearch.Sender.Address.toLocaleLowerCase().includes(from) &&
            !messageToSearch.Sender.Name.toLocaleLowerCase().includes(from)) ||
        (typeof attachments !== 'undefined' &&
            ((attachments === 0 && messageToSearch.NumAttachments > 0) ||
                (attachments === 1 && messageToSearch.NumAttachments === 0))) ||
        (typeof decryptionError !== 'undefined' && decryptionError !== messageToSearch.decryptionError) ||
        (typeof filter?.Unread !== 'undefined' && filter?.Unread !== messageToSearch.Unread)
    ) {
        return false;
    }

    if (to) {
        let keywordFound = false;
        for (const recipient of getRecipients(messageToSearch)) {
            keywordFound =
                keywordFound ||
                recipient.Address.toLocaleLowerCase().includes(to) ||
                recipient.Name.toLocaleLowerCase().includes(to);
        }
        if (!keywordFound) {
            return false;
        }
    }

    if (incrementMessagesSearched) {
        incrementMessagesSearched();
    }

    if (!normalisedKeywords) {
        return true;
    }

    return testKeyword(normalisedKeywords, messageToSearch);
};

/**
 * Derive the correct time boundaries to get batches of messages from IndexedDB.
 * Time intervals are around one month long
 */
export const getTimeLimits = (prevStart: number, begin: number | undefined, end: number | undefined) => {
    const endTime = prevStart ? prevStart - 1 : end || roundMilliseconds(endOfToday().getTime());
    const startTime = Math.max(
        begin || 0,
        roundMilliseconds(startOfMonth(sub(endTime * 1000, { months: 1 })).getTime())
    );

    const lower: [number, number] = [startTime, 0];
    const upper: [number, number] = [endTime, Number.MAX_SAFE_INTEGER];

    return {
        lower,
        upper,
    };
};

/**
 * Split a CachedMessage into a MessageForSearch and other fields
 */
export const splitCachedMessage = (cachedMessage: CachedMessage) => {
    const { decryptedSubject, decryptionError, ...otherFields } = cachedMessage;
    const messageForSearch: MessageForSearch = { ...otherFields };
    return messageForSearch;
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
    const esDB = await openDB<EncryptedSearchDB>(`ES:${userID}:DB`);
    const { incrementMessagesSearched, messageLimit, setCache, beginOrder } = options;
    const resultsArray: MessageForSearch[] = [];

    let lastEmail: LastEmail | undefined;
    let lowerBound = [normalisedSearchParams.begin || (await getOldestTime(userID)), beginOrder || 0];

    while (!lastEmail) {
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
                if (!messageToSearch) {
                    return;
                }
                if (applySearch(normalisedSearchParams, messageToSearch, incrementMessagesSearched)) {
                    const messageForSearch = splitCachedMessage(messageToSearch);
                    resultsArray.push(messageForSearch);
                }
            })
        );

        if (messageLimit && resultsArray.length >= messageLimit) {
            const lastCiphertext = storedData[storedData.length - 1];
            lastEmail = { Time: lastCiphertext.Time, Order: lastCiphertext.Order };
        }

        if (normalisedSearchParams.end && storedData[storedData.length - 1].Time > normalisedSearchParams.end) {
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
    const esDB = await openDB<EncryptedSearchDB>(`ES:${userID}:DB`);
    const { incrementMessagesSearched, messageLimit, beginOrder, setCache } = options;
    const resultsArray: MessageForSearch[] = [];

    const queryStart = await initialiseQuery(
        userID,
        beginOrder,
        normalisedSearchParams.begin,
        normalisedSearchParams.end
    );
    const { getTimes, initialTime } = queryStart;
    let { lower, upper, startingOrder } = queryStart;
    let lastEmail: LastEmail | undefined;

    while (!lastEmail) {
        let storedData: StoredCiphertext[];
        ({ lower, upper, startingOrder, storedData } = await queryNewData(getTimes, lower, upper, startingOrder, esDB));

        await Promise.all(
            storedData.map(async (storedCiphertext) => {
                if (!storedCiphertext.LabelIDs.includes(normalisedSearchParams.labelID)) {
                    return;
                }
                const messageToSearch = await decryptFromDB(storedCiphertext, indexKey);
                if (!messageToSearch) {
                    return;
                }
                if (applySearch(normalisedSearchParams, messageToSearch, incrementMessagesSearched)) {
                    const messageForSearch = splitCachedMessage(messageToSearch);
                    resultsArray.push(messageForSearch);
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
    esCache: CachedMessage[],
    normalisedSearchParams: NormalisedSearchParams,
    incrementMessagesSearched: () => void
) => {
    const searchResults: MessageForSearch[] = [];

    esCache.forEach((messageToSearch: CachedMessage) => {
        if (applySearch(normalisedSearchParams, messageToSearch, incrementMessagesSearched)) {
            const messageForSearch = splitCachedMessage(messageToSearch);
            searchResults.push(messageForSearch);
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
            { ...normalisedSearchParams, end: lastEmailTime || normalisedSearchParams.end },
            options
        );
    }

    return uncachedSearchAsc(
        indexKey,
        userID,
        { ...normalisedSearchParams, begin: lastEmailTime || normalisedSearchParams.begin },
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
    incrementMessagesSearched: () => void,
    setCache: (Elements: Element[]) => void
) => {
    let searchResults: MessageForSearch[] = [];
    let isSearchPartial = false;
    let lastEmail: LastEmail | undefined;
    const isDescending = normalisedSearchParams.sort.desc;

    // Messages in cache are the most recent ones, therefore if the cache is not ready and full and the search
    // is in descending order, we cannot used cached messages
    if (isDescending || (esCacheRef.current.isCacheReady && !esCacheRef.current.isCacheLimited)) {
        // searchResults is initialised with the first portion of cached results
        let lastLength = esCacheRef.current.esCache.length;
        searchResults = cachedSearch(esCacheRef.current.esCache, normalisedSearchParams, incrementMessagesSearched);
        let resultsCounter = searchResults.length;

        // The first batch of results (if any) are shown only if the cache is still being built, or if it has finished
        // but it's limited. Otherwise we want to show all results at the end
        if (resultsCounter !== 0 && (!esCacheRef.current.isCacheReady || esCacheRef.current.isCacheLimited)) {
            setCache(searchResults);
        }

        // If the cache is still being built, incremental portions of cache are searched
        while (!esCacheRef.current.isCacheReady) {
            const newLastLength = esCacheRef.current.esCache.length;
            searchResults.push(
                ...cachedSearch(
                    esCacheRef.current.esCache.slice(lastLength),
                    normalisedSearchParams,
                    incrementMessagesSearched
                )
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
            ...cachedSearch(
                esCacheRef.current.esCache.slice(lastLength),
                normalisedSearchParams,
                incrementMessagesSearched
            )
        );

        // Once caching has terminated, if the cache turns out to be not limited, we stop searching
        if (!esCacheRef.current.isCacheLimited) {
            return {
                searchResults,
                isSearchPartial,
                lastEmail,
            };
        }

        // If enough messages to fill two pages were already found, we don't continue the search
        if (searchResults.length >= 2 * PAGE_SIZE) {
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
    let shouldKeepSearching = true;
    let beginOrder: number | undefined;
    if (isDescending) {
        // The remaining messages are searched from DB, but only if the indicated timespan
        // hasn't been already covered by cache. The cache is ordered such that the last message is the oldest
        const { Time: startCache, Order } = esCacheRef.current.esCache[esCacheRef.current.esCache.length - 1];
        beginOrder = Order;
        const intervalEnd = Math.min(startCache, normalisedSearchParams.end || Number.MAX_SAFE_INTEGER);
        const intervalStart = normalisedSearchParams.begin || 0;
        shouldKeepSearching = intervalStart < startCache;
        normalisedSearchParams = {
            ...normalisedSearchParams,
            begin: intervalStart,
            end: intervalEnd,
        };
    }

    if (shouldKeepSearching) {
        const remainingMessages = 2 * PAGE_SIZE - searchResults.length;

        const setCacheIncremental = (newResults: MessageForSearch[]) => {
            setCache(searchResults.concat(newResults));
        };

        const indexKey = cachedIndexKey || (await getIndexKey(getUserKeys, userID));
        if (!indexKey) {
            throw new Error('Key not found');
        }

        const uncachedResult = await uncachedSearch(userID, indexKey, normalisedSearchParams, {
            incrementMessagesSearched,
            messageLimit: remainingMessages,
            setCache: setCacheIncremental,
            beginOrder,
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
    const { labelID, filter, address, from, to, begin, end, attachments, normalisedKeywords, decryptionError } =
        normalisedSearchParams;
    const {
        labelID: prevLabelID,
        filter: prevFilter,
        address: prevAddress,
        from: prevFrom,
        to: prevTo,
        begin: prevBegin,
        end: prevEnd,
        attachments: prevAttachments,
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

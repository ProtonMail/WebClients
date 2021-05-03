import { Recipient } from 'proton-shared/lib/interfaces';
import { openDB } from 'idb';
import { endOfDay, endOfToday, startOfMonth, sub } from 'date-fns';
import { SearchParameters } from '../../models/tools';
import {
    CachedMessage,
    EncryptedSearchDB,
    GetUserKeys,
    MessageForSearch,
    NormalisedSearchParams,
    StoredCiphertext,
} from '../../models/encryptedSearch';
import { ES_MAX_CACHE } from '../../constants';
import { getNumMessagesDB, getOldestTime } from './esUtils';
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
export const normaliseSearchParams = (searchParams: SearchParameters, labelID: string) => {
    const { wildcard, keyword, end, ...otherParams } = searchParams;
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
                (!!decryptedBody && decryptedBody.includes(keyword)));
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
    const {
        address,
        from,
        to,
        normalisedKeywords,
        begin,
        end,
        attachments,
        labelID,
        decryptionError,
    } = normalisedSearchParams;

    const reducer = (accumulator: boolean, currentValue: Recipient) => {
        return accumulator || currentValue.Address === to;
    };

    if (
        !messageToSearch.LabelIDs.includes(labelID) ||
        (address && messageToSearch.AddressID !== address) ||
        (begin && messageToSearch.Time < begin) ||
        (end && messageToSearch.Time > end) ||
        (from && (messageToSearch.Sender.Address !== from || messageToSearch.Sender.Name !== from)) ||
        (to && !messageToSearch.ToList.reduce(reducer, false)) ||
        (typeof attachments !== 'undefined' &&
            ((attachments === 0 && messageToSearch.NumAttachments > 0) ||
                (attachments === 1 && messageToSearch.NumAttachments === 0))) ||
        (typeof decryptionError !== 'undefined' && decryptionError !== messageToSearch.decryptionError)
    ) {
        return false;
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
 * Time intervals are around 6 months long
 */
export const getTimeLimits = (prevStart: number, begin: number | undefined, end: number | undefined) => {
    const endTime = prevStart ? prevStart - 1 : end || roundMilliseconds(endOfToday().getTime());
    const startTime = Math.max(
        begin || 0,
        roundMilliseconds(startOfMonth(sub(endTime * 1000, { months: 6 })).getTime())
    );

    const lower: [number, number] = [startTime, 0];
    const upper: [number, number] = [endTime, Number.MAX_SAFE_INTEGER];

    return {
        lower,
        upper,
    };
};

/**
 * Fetches messages from IndexedDB, either for searching or just caching
 */
export const queryDB = async <T>(
    indexKey: CryptoKey,
    userID: string,
    postDecryptionCallback: (cachedMessage: CachedMessage) => T | undefined,
    recordProgressLocal?: (progress: number) => void,
    preDecryptionCallback?: (storedCiphertext: StoredCiphertext) => boolean,
    begin?: number,
    end?: number
) => {
    const resultsArray: T[] = [];

    const esIteratee = async (storedCiphertext: StoredCiphertext) => {
        if (preDecryptionCallback && !preDecryptionCallback(storedCiphertext)) {
            return;
        }
        const messageToSearch = await decryptFromDB(storedCiphertext, indexKey);
        if (!messageToSearch) {
            return;
        }
        const messageToReturn = postDecryptionCallback(messageToSearch);
        if (messageToReturn) {
            resultsArray.push(messageToReturn);
        }
    };

    const esDB = await openDB<EncryptedSearchDB>(`ES:${userID}:DB`);

    // Data is retrieved in batches, in such a way that decryption of earlier batches
    // can start before fetching later batches. Messages are retrieved in reverse chronological order.
    // Initial time represents the oldest moment in time the search has to go back to. It is
    // "begin" if specified, otherwise it's the oldest date in IndexedDB
    const initialTime = begin || (await getOldestTime(userID));
    const getTimes = (start: number) => getTimeLimits(start, initialTime, end);

    const tx = esDB.transaction('messages', 'readonly');
    const index = tx.store.index('byTime');

    let storedData: StoredCiphertext[];
    const promiseArray: Promise<void>[] = [];

    let lower: [number, number] = [0, 0];
    let upper: [number, number] = [0, 0];

    const keepQuerying = true;
    while (keepQuerying) {
        const bounds = getTimes(lower[0]);
        lower = bounds.lower;
        upper = bounds.upper;

        storedData = await index.getAll(IDBKeyRange.bound(lower, upper));

        for (let index = storedData.length - 1; index >= 0; index--) {
            promiseArray.push(esIteratee(storedData[index]));
        }

        if (recordProgressLocal) {
            recordProgressLocal(storedData.length);
        }

        if (lower[0] === initialTime) {
            break;
        }
    }

    await Promise.all(promiseArray);
    await tx.done;

    esDB.close();

    return resultsArray;
};

/**
 * Split a CachedMessage into a MessageForSearch and other fields
 */
export const splitCachedMessage = (cachedMessage: CachedMessage) => {
    const { decryptedBody, decryptedSubject, decryptionError, ...otherFields } = cachedMessage;
    const messageForSearch: MessageForSearch = { ...otherFields };
    return {
        decryptedBody,
        decryptedSubject,
        decryptionError,
        messageForSearch,
    };
};

/**
 * Perfom an uncached search, i.e. fetching and searching messages from IndexedDB
 */
export const uncachedSearch = async (
    indexKey: CryptoKey,
    userID: string,
    normalisedSearchParams: NormalisedSearchParams,
    recordProgressLocal?: (progress: number) => void,
    incrementMessagesSearched?: () => void
) => {
    const searchMessage = (messageToSearch: CachedMessage) => {
        if (applySearch(normalisedSearchParams, messageToSearch, incrementMessagesSearched)) {
            const { messageForSearch } = splitCachedMessage(messageToSearch);
            return messageForSearch;
        }
    };

    const filterMessage = (storedMessage: StoredCiphertext) =>
        storedMessage.LabelIDs.includes(normalisedSearchParams.labelID);

    return queryDB<MessageForSearch>(
        indexKey,
        userID,
        searchMessage,
        recordProgressLocal,
        filterMessage,
        normalisedSearchParams.begin,
        normalisedSearchParams.end
    );
};

/**
 * Estimate the size of a CachedMessage object
 */
export const sizeOfCachedMessage = (cachedMessage: CachedMessage) => {
    const sizeOfRecipient = (recipient: Recipient) => {
        let innerBytes = 0;
        let innerKey: keyof typeof recipient;
        for (innerKey in recipient) {
            if (Object.prototype.hasOwnProperty.call(recipient, innerKey)) {
                const innerValue = recipient[innerKey];
                if (!innerValue) {
                    continue;
                }
                innerBytes += (innerKey.length + innerValue.length) * 2;
            }
        }
        return innerBytes;
    };

    let bytes = 0;
    let key: keyof typeof cachedMessage;

    for (key in cachedMessage) {
        if (Object.prototype.hasOwnProperty.call(cachedMessage, key)) {
            const value = cachedMessage[key];
            if (!value) {
                continue;
            }

            bytes += key.length * 2;

            if (typeof value === 'boolean') {
                bytes += 4;
            } else if (typeof value === 'string') {
                bytes += value.length * 2;
            } else if (typeof value === 'number') {
                bytes += 8;
            } else if (Array.isArray(value)) {
                for (let i = 0; i < value.length; i++) {
                    const innerValue = value[i];
                    if (typeof innerValue === 'string') {
                        bytes += innerValue.length * 2;
                    } else {
                        bytes += sizeOfRecipient(innerValue);
                    }
                }
            } else {
                bytes += sizeOfRecipient(value);
            }
        }
    }

    return bytes;
};

/**
 * Cache IndexedDB
 */
export const cacheDB = async (indexKey: CryptoKey, userID: string, recordProgressLocal: (progress: number) => void) => {
    let cacheSize = 0;
    let isCacheLimited = false;

    const cacheMessage = (cachedMessage: CachedMessage) => {
        cacheSize += sizeOfCachedMessage(cachedMessage);
        if (cacheSize < ES_MAX_CACHE) {
            return cachedMessage;
        }
        isCacheLimited = true;
    };

    let cachedMessages = await queryDB<CachedMessage>(indexKey, userID, cacheMessage, recordProgressLocal);

    if (isCacheLimited && cachedMessages.length) {
        // Sort the cached messages by time, such that the first element is the oldest
        cachedMessages.sort((firstEl, secondEl) => {
            return firstEl.Time - secondEl.Time;
        });
        // Remove all messages with the same Time as the oldest, to avoid that the
        // set of messages with that same Time but different Order was not fully
        // included in the cache
        const oldestTime = cachedMessages[0].Time;
        let cutIndex = 0;
        for (let index = 0; index < cachedMessages.length; index++) {
            if (cachedMessages[index].Time !== oldestTime) {
                cutIndex = index;
                break;
            }
        }
        cachedMessages = cachedMessages.slice(cutIndex);
    }

    return {
        cachedMessages,
        isCacheLimited,
    };
};

/**
 * Estimate the size of the entire cache
 */
export const sizeOfCache = (esCache: CachedMessage[]) => {
    let size = 0;
    esCache.forEach((cachedMessage) => {
        size += sizeOfCachedMessage(cachedMessage);
    });
    return size;
};

/**
 * Perfom an cached search, i.e. over the given messages only
 */
export const cachedSearch = async (
    esCache: CachedMessage[],
    normalisedSearchParams: NormalisedSearchParams,
    incrementMessagesSearched: () => void
) => {
    const searchResults: MessageForSearch[] = [];

    esCache.forEach((messageToSearch: CachedMessage) => {
        if (applySearch(normalisedSearchParams, messageToSearch, incrementMessagesSearched)) {
            const { messageForSearch } = splitCachedMessage(messageToSearch);
            searchResults.push(messageForSearch);
        }
    });

    return searchResults;
};

/**
 * Perform a search by switching between cached and uncached search when necessary
 */
export const hybridSearch = async (
    esCache: CachedMessage[],
    normalisedSearchParams: NormalisedSearchParams,
    isCacheLimited: boolean,
    getUserKeys: GetUserKeys,
    userID: string,
    recordProgress: (progress: number, total: number) => void,
    incrementMessagesSearched: () => void
) => {
    let searchResults: MessageForSearch[] = [];
    if (esCache.length) {
        searchResults = await cachedSearch(esCache, normalisedSearchParams, incrementMessagesSearched);

        if (isCacheLimited) {
            // The remaining messages are searched from DB, but only if the indicated timespan
            // hasn't been already covered by cache. If isCacheLimited is true, the cache is
            // ordered such that the first message is the oldest
            const startCache = esCache[0].Time;
            const endCache = esCache[esCache.length - 1].Time;
            const intervalEnd = Math.min(endCache, normalisedSearchParams.end || Number.MAX_SAFE_INTEGER);
            const intervalStart = Math.min(startCache, normalisedSearchParams.begin || 0);

            const indexKey = await getIndexKey(getUserKeys, userID);
            if (!indexKey) {
                throw new Error('Key not found');
            }

            const total = (await getNumMessagesDB(userID)) - esCache.length;
            const recordProgressLocal = (progress: number) => {
                recordProgress(progress, total);
            };

            if (!(intervalEnd > startCache && intervalStart >= startCache)) {
                const uncachedResults = await uncachedSearch(
                    indexKey,
                    userID,
                    {
                        ...normalisedSearchParams,
                        begin: intervalStart,
                        end: Math.min(startCache - 1, intervalEnd),
                    },
                    recordProgressLocal,
                    incrementMessagesSearched
                );
                searchResults = searchResults.concat(uncachedResults);
            }
        }
    } else {
        // This is used if the cache is empty
        const indexKey = await getIndexKey(getUserKeys, userID);
        if (!indexKey) {
            throw new Error('Key not found');
        }

        const total = await getNumMessagesDB(userID);
        const recordProgressLocal = (progress: number) => {
            recordProgress(progress, total);
        };

        searchResults = await uncachedSearch(
            indexKey,
            userID,
            normalisedSearchParams,
            recordProgressLocal,
            incrementMessagesSearched
        );
    }
    return searchResults;
};

/**
 * Estimate the size of IndexedDB in memory. Note that this will be different than the size
 * the browser estimates when the index is on disk
 */
export const sizeOfIDB = async (indexKey: CryptoKey, userID: string) => {
    let idbSize = 0;

    const computeSize = (cachedMessage: CachedMessage) => {
        idbSize += sizeOfCachedMessage(cachedMessage);
        return undefined;
    };

    await queryDB<CachedMessage>(indexKey, userID, computeSize);

    return idbSize;
};

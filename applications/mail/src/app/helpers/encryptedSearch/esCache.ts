import { openDB } from 'idb';
import { Recipient } from '@proton/shared/lib/interfaces';
import { ES_MAX_CACHE } from '../../constants';
import { CachedMessage, EncryptedSearchDB, ESCache, StoredCiphertext } from '../../models/encryptedSearch';
import { initialiseQuery, queryNewData } from './esSearch';
import { decryptFromDB } from './esSync';
import { getNumMessagesDB } from './esUtils';

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
 * Check whether the cache is limited
 */
export const checkIsCacheLimited = async (userID: string, esCacheRef: React.MutableRefObject<ESCache>) => {
    const count = await getNumMessagesDB(userID);
    return esCacheRef.current.esCache.length < count;
};

/**
 * Callback to sort cached messages by Time and Order
 */
export const sortCachedMessages = (firstEl: CachedMessage, secondEl: CachedMessage) => {
    return secondEl.Time - firstEl.Time || secondEl.Order - firstEl.Order;
};

/**
 * Cache IndexedDB
 */
export const cacheDB = async (
    indexKey: CryptoKey,
    userID: string,
    esCacheRef: React.MutableRefObject<ESCache>,
    endTime?: number,
    beginOrder?: number
) => {
    // If IDB is empty, there is nothing to cache
    if ((await getNumMessagesDB(userID)) === 0) {
        esCacheRef.current.isCacheLimited = false;
        return;
    }

    const queryStart = await initialiseQuery(userID, beginOrder, undefined, endTime);
    const { getTimes, initialTime } = queryStart;
    let { lower, upper, startingOrder } = queryStart;

    const esDB = await openDB<EncryptedSearchDB>(`ES:${userID}:DB`);
    let keepCaching = true;
    while (keepCaching) {
        let storedData: StoredCiphertext[];
        ({ lower, upper, startingOrder, storedData } = await queryNewData(getTimes, lower, upper, startingOrder, esDB));

        await Promise.all(
            storedData.map(async (storedCiphertext) => {
                const messageToCache = await decryptFromDB(storedCiphertext, indexKey);
                if (!messageToCache) {
                    return;
                }
                esCacheRef.current.cacheSize += sizeOfCachedMessage(messageToCache);
                esCacheRef.current.esCache.push(messageToCache);
            })
        );

        if (esCacheRef.current.cacheSize >= ES_MAX_CACHE || lower[0] === initialTime) {
            keepCaching = false;
        }
    }

    esDB.close();

    // Sort the cached messages by time, such that the last element is the oldest
    esCacheRef.current.esCache.sort(sortCachedMessages);
    esCacheRef.current.isCacheLimited = await checkIsCacheLimited(userID, esCacheRef);
};

/**
 * Add a single message to cache, depending on whether the size limit has been reached or not
 */
export const addToESCache = (
    messageToCache: CachedMessage,
    esCacheRef: React.MutableRefObject<ESCache>,
    messageSize?: number
) => {
    let messageAdded = false;

    if (esCacheRef.current.cacheSize < ES_MAX_CACHE) {
        esCacheRef.current.esCache.push(messageToCache);
        messageAdded = true;
    } else {
        // It is assumed that the last message is the oldest
        const lastIndex = esCacheRef.current.esCache.length - 1;
        const { Time, Order } = messageToCache;
        const { Time: lastTime, Order: lastOrder } = esCacheRef.current.esCache[lastIndex];

        if (Time < lastTime || (Time === lastTime && Order < lastOrder)) {
            esCacheRef.current.cacheSize -= sizeOfCachedMessage(esCacheRef.current.esCache[lastIndex]);
            esCacheRef.current.esCache[lastIndex] = messageToCache;
            messageAdded = true;
        }
    }

    if (messageAdded) {
        esCacheRef.current.cacheSize += messageSize || sizeOfCachedMessage(messageToCache);
        // Sort the cached messages by time, such that the last element is the oldest
        esCacheRef.current.esCache.sort(sortCachedMessages);
    }
};

/**
 * Remove a single message from cache
 */
export const removeFromESCache = (ID: string, esCacheRef: React.MutableRefObject<ESCache>, messageSize?: number) => {
    const index = esCacheRef.current.esCache.findIndex((cachedMessage) => cachedMessage.ID === ID);
    if (index !== -1) {
        esCacheRef.current.cacheSize -= messageSize || sizeOfCachedMessage(esCacheRef.current.esCache[index]);
        esCacheRef.current.esCache.splice(index, 1);
    }
};

/**
 * Update an existing message in cache with a given one. Since this is an update, the old and
 * new messages are supposed to have the same ID
 */
export const replaceInESCache = (
    messageToCache: CachedMessage,
    esCacheRef: React.MutableRefObject<ESCache>,
    isDraftUpdate: boolean,
    sizeDelta?: number
) => {
    const { ID } = messageToCache;
    const index = esCacheRef.current.esCache.findIndex((cachedMessage) => cachedMessage.ID === ID);
    if (index !== -1) {
        esCacheRef.current.cacheSize +=
            sizeDelta || sizeOfCachedMessage(messageToCache) - sizeOfCachedMessage(esCacheRef.current.esCache[index]);
        esCacheRef.current.esCache.splice(index, 1, messageToCache);

        // The Time and Order of a message can change only if it was a draft being updated.
        // In this case we sort again
        if (isDraftUpdate) {
            esCacheRef.current.esCache.sort(sortCachedMessages);
        }
    }
};

/**
 * Add more messages to a limited cache in case many were removed
 */
export const refreshESCache = async (
    userID: string,
    indexKey: CryptoKey,
    esCacheRef: React.MutableRefObject<ESCache>
) => {
    const { cacheSize, isCacheReady } = esCacheRef.current;
    const isCachePartial = await checkIsCacheLimited(userID, esCacheRef);

    // Perform this operation only if there is space left in cache but not all messages are cached, and if the initial
    // caching operation had succeeded
    if (cacheSize < ES_MAX_CACHE && isCachePartial && isCacheReady) {
        // The last message is assumed to be the oldest one
        const { Time, Order } = esCacheRef.current.esCache[esCacheRef.current.esCache.length - 1];
        await cacheDB(indexKey, userID, esCacheRef, Time, Order);
    }

    // Update the cache status after the above change
    esCacheRef.current.isCacheLimited = await checkIsCacheLimited(userID, esCacheRef);
};

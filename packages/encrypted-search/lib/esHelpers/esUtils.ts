import { add } from 'date-fns';
import { IDBPDatabase, deleteDB, openDB } from 'idb';

import { serverTime } from '@proton/crypto';
import { MINUTE } from '@proton/shared/lib/constants';
import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';

import { DIACRITICS_REGEXP, ES_MAX_PARALLEL_ITEMS } from '../constants';
import { ESProgressBlob, RetryObject } from '../models';

/**
 * Helpers to work with ES blobs in localStorage
 */
const getESItem = (userID: string, blobName: string) => getItem(`ES:${userID}:${blobName}`);
const setESItem = (userID: string, blobName: string, blobValue: string) =>
    setItem(`ES:${userID}:${blobName}`, blobValue);
const removeESItem = (userID: string, blobName: string) => removeItem(`ES:${userID}:${blobName}`);
export const removeESFlags = (userID: string) => {
    Object.keys(window.localStorage).forEach((key) => {
        const chunks = key.split(':');
        if (chunks[0] === 'ES' && chunks[1] === userID) {
            removeItem(key);
        }
    });
};
// Getters
export const getES = {
    Key: (userID: string) => getESItem(userID, 'Key'),
    Event: (userID: string) => getESItem(userID, 'Event'),
    Progress: (userID: string): ESProgressBlob | null => JSON.parse(getESItem(userID, 'BuildProgress') || 'null'),
    Size: (userID: string) => parseInt(getESItem(userID, 'SizeIDB') || '0', 10) || 0,
    Pause: (userID: string) => getESItem(userID, 'Pause') === 'true',
    Enabled: (userID: string) => getESItem(userID, 'ESEnabled') === 'true',
    Retries: (userID: string): Map<string, RetryObject> => new Map(JSON.parse(getESItem(userID, 'Retries') || '[]')),
};
// Removers
export const removeES = {
    Key: (userID: string) => removeESItem(userID, 'Key'),
    Event: (userID: string) => removeESItem(userID, 'Event'),
    Progress: (userID: string) => removeESItem(userID, 'BuildProgress'),
    Size: (userID: string) => removeESItem(userID, 'SizeIDB'),
    Pause: (userID: string) => removeESItem(userID, 'Pause'),
    Enabled: (userID: string) => removeESItem(userID, 'ESEnabled'),
    Retries: (userID: string) => removeESItem(userID, 'Retries'),
};
// Setters
export const setES = {
    Key: (userID: string, armoredKey: string) => setESItem(userID, 'Key', armoredKey),
    Event: (userID: string, eventID: string) => setESItem(userID, 'Event', eventID),
    Progress: (userID: string, esProgressBlob: ESProgressBlob) =>
        setESItem(userID, 'BuildProgress', JSON.stringify(esProgressBlob)),
    Size: (userID: string, size: number) => setESItem(userID, 'SizeIDB', `${size}`),
    Pause: (userID: string) => setESItem(userID, 'Pause', 'true'),
    Enabled: (userID: string) => setESItem(userID, 'ESEnabled', 'true'),
    Retries: (userID: string, retries: Map<string, RetryObject> | [string, RetryObject][]) => {
        const arrayRetries = Array.from(retries);
        if (arrayRetries.length) {
            setESItem(userID, 'Retries', JSON.stringify(arrayRetries));
        } else {
            removeES.Retries(userID);
        }
    },
};

/**
 * @returns three helpers to get, set or remove blobs in local storage related to ES.
 * The accessible blobs are the following.
 * @var Key the LS blob storing the symmetric index key
 * @var Event the LS blob storing the last event ID to which the IDB was synced
 * @var Progress the LS blob storing an object describing the progress of indexing
 * @var Size the LS blob storing an estimated size in bytes of IDB
 * @var Pause the LS blob storing whether a paused indexing exists
 * @var Enabled the LS blob storing whether ES is enabled or disabled
 */
export const esStorageHelpers = () => ({
    getES,
    setES,
    removeES,
});

/**
 * @param userID the user ID
 * @return whether the symmetric index key under which IDB is encrypted exists
 */
export const indexKeyExists = (userID: string) => !!getES.Key(userID);

/**
 * @param userID the user ID
 * @returns whether a previously started indexing process has terminated successfully
 */
export const isDBReadyAfterBuilding = (userID: string) => !getES.Progress(userID);

/**
 * @param userID the user ID
 * @returns whether a key exists and the corresponding indexing process has terminated successfully
 */
export const wasIndexingDone = (userID: string) => indexKeyExists(userID) && isDBReadyAfterBuilding(userID);

/**
 * Open and delete the ES IndexedDB
 */
export const openESDB = async (userID: string) => openDB(`ES:${userID}:DB`);
export const deleteESDB = async (userID: string) => deleteDB(`ES:${userID}:DB`);
/**
 * Create an instance of the ES IndexedDB.
 * @param userID The ID of the user, which is used to identify the DB as ES:{userID}:DB
 * @param storeName The name of the object store, i.e. the table, containing items
 * @param indexName The name of the temporal index, i.e. the one that is used to search in
 * (reverse) chronological order
 * @param primaryKeyName The name of the parameter of stored items which is to be used as
 * a primary key for the database
 * @param indexKeyNames The names of the parameters of stored items which are to be used as
 * primary keys for the temporal index. They must refer to two numerical values, the first
 * being the time of the item, the second being a unique numerical identifier, e.g. computed
 * from the ID
 * @returns An empy instance of the ES IndexedDB
 */
export const createESDB = (
    userID: string,
    storeName: string,
    indexName: string,
    primaryKeyName: string,
    indexKeyNames: [string, string]
) =>
    openDB(`ES:${userID}:DB`, 1, {
        upgrade(esDB) {
            esDB.createObjectStore(storeName, { keyPath: primaryKeyName }).createIndex(indexName, indexKeyNames, {
                unique: true,
            });
        },
    });

/**
 * Fetch the oldest item from IDB
 */
export const getOldestItem = async (esDB: IDBPDatabase, storeName: string, indexName: string) => {
    const oldestList = await esDB.getAllFromIndex(storeName, indexName, undefined, 1);
    if (!oldestList.length) {
        return;
    }
    return oldestList[0];
};

/**
 * Fetch Time and Order of the oldest item from IDB
 */
export const getOldestTimePoint = async <ESCiphertext>(
    userID: string,
    storeName: string,
    indexName: string,
    getTimePoint: (item: ESCiphertext) => [number, number]
) => {
    const esDB = await openESDB(userID);
    const oldestMessage = await getOldestItem(esDB, storeName, indexName);
    esDB.close();
    if (oldestMessage) {
        return getTimePoint(oldestMessage);
    }
};

/**
 * Get the time of the oldest item from IDB, eventually corrected by a given factor
 * @param userID the user ID
 * @param storeName the name of the object store
 * @param indexName the name of the temporal index
 * @param getTimePoint a callback to extract the timepoint from an encrypted item
 * @param correctionFactor a multiplicative factor
 * @returns time of the oldest item in IDB, potentially corrected
 */
export const getOldestTime = async <ESCiphertext>(
    userID: string,
    storeName: string,
    indexName: string,
    getTimePoint: (item: ESCiphertext) => [number, number],
    correctionFactor?: number
) => {
    const timePoint = await getOldestTimePoint<ESCiphertext>(userID, storeName, indexName, getTimePoint);
    return timePoint ? timePoint[0] * (correctionFactor || 1) : 0;
};

/**
 * Fetch Time of the most recent item from IDB
 */
export const getMostRecentTime = async <ESCiphertext>(
    userID: string,
    storeName: string,
    indexName: string,
    getTimePoint: (item: ESCiphertext) => [number, number]
) => {
    const esDB = await openESDB(userID);
    const cursor = await esDB.transaction(storeName).store.index(indexName).openCursor(undefined, 'prev');
    const mostRecentMessage = cursor?.value;
    esDB.close();
    return mostRecentMessage ? getTimePoint(mostRecentMessage)[0] : 0;
};

/**
 * Fetch the number of items in IDB
 */
export const getNumItemsDB = async (userID: string, storeName: string) => {
    const esDB = await openESDB(userID);
    const count = await esDB.count(storeName);
    esDB.close();
    return count;
};

/**
 * @param userID the user ID
 * @returns the number of items in the account when indexing had started, i.e.
 * excluding those that have changed since then
 */
export const getESTotal = (userID: string) => {
    return getES.Progress(userID)?.totalItems || 0;
};

/**
 * Overwrites the BuildProgress blob in localStorage
 */
const setESProgress = (userID: string, newProperties: Partial<ESProgressBlob>) => {
    const progressBlob = getES.Progress(userID);
    if (!progressBlob) {
        return;
    }
    setES.Progress(userID, {
        ...progressBlob,
        ...newProperties,
    });
};

/**
 * Set the number of items already indexed in BuildProgress and save it to localStorage
 */
export const setESCurrent = (userID: string, currentItems: number) => {
    // Since items are stored to IDB in batches, we only store up the current
    // number modulo the batch size
    setESProgress(userID, {
        currentItems: Math.floor(currentItems / ES_MAX_PARALLEL_ITEMS) * ES_MAX_PARALLEL_ITEMS,
    });
};

/**
 * Increase by 1 the locally cached number of times the user has paused indexing
 */
export const increaseNumPauses = (userID: string) => {
    setESProgress(userID, {
        numPauses: (getES.Progress(userID)?.numPauses || 0) + 1,
    });
};

/**
 * Remove milliseconds from numeric value of a date
 */
export const roundMilliseconds = (time: number) => Math.floor(time / 1000);

/**
 * Add a timestamp to the locally cached set of indexing timestamps
 */
export const addESTimestamp = (userID: string, type: 'start' | 'step' | 'stop') => {
    const progressBlob = getES.Progress(userID);
    if (!progressBlob) {
        return;
    }

    const { timestamps } = progressBlob;
    timestamps.push({ type, time: roundMilliseconds(Date.now()) });

    setESProgress(userID, {
        timestamps,
    });
};

/**
 * Store the initial estimate in seconds, but only if it's the first of such predictions
 */
export const setOriginalEstimate = (userID: string, inputEstimate: number) => {
    const progressBlob = getES.Progress(userID);
    if (!progressBlob) {
        return;
    }

    if (progressBlob.originalEstimate === 0) {
        setESProgress(userID, {
            originalEstimate: inputEstimate,
        });
    }
};

/**
 * @param userID the user ID
 * @returns the indexing progress expressed as a number between 0 and 100 from BuildProgress
 */
export const getESCurrentProgress = (userID: string) => {
    const progressBlob = getES.Progress(userID);
    if (!progressBlob) {
        return 0;
    }
    const { currentItems, totalItems } = progressBlob;
    return Math.ceil(((currentItems || 0) / totalItems) * 100);
};

/**
 * Update the rolling estimated size of IDB
 */
export const updateSizeIDB = (userID: string, addend: number) => {
    const sizeIDB = getES.Size(userID);
    const newSize = sizeIDB + addend;
    setES.Size(userID, newSize);
};

/**
 * Check whether ES can be used not just because the index key exists in localStorage
 * but also because IDB is not corrupt, i.e. the object store exists
 */
export const canUseES = async (userID: string, storeName: string) => {
    if (!indexKeyExists(userID)) {
        return false;
    }
    const esDB = await openESDB(userID);
    const isIntact = esDB.objectStoreNames.contains(storeName);
    esDB.close();
    return isIntact;
};

/**
 * Request storage persistence to prevent the ES database from being evicted
 */
export const requestPersistence = async () => {
    if (window.navigator.storage && window.navigator.storage.persist) {
        await window.navigator.storage.persist();
    }
};

/**
 * Remove diacritics and apply other transforms to the NFKD decomposed string
 */
export const normalizeString = (str: string, format: 'NFD' | 'NFKD' = 'NFKD') =>
    str.toLocaleLowerCase().normalize(format).replace(DIACRITICS_REGEXP, '');

/**
 * Increase the number of retries by one and set a new retryTime accordingly
 */
export const updateRetryObject = (retry: RetryObject): RetryObject => ({
    retryTime: +serverTime() + 2 ** (retry.numberRetries + 1) * MINUTE,
    numberRetries: retry.numberRetries + 1,
});

/**
 * Add a new item ID to the list of retries
 */
export const addRetry = (userID: string, retryID: string) => {
    const retryMap = getES.Retries(userID);
    const retryObject = retryMap.get(retryID);
    const now = +serverTime();

    if (!!retryObject) {
        const { retryTime } = retryObject;
        if (retryTime < now) {
            retryMap.set(retryID, updateRetryObject(retryObject));
        }
    } else {
        const defaultRetryObject: RetryObject = { retryTime: now, numberRetries: 0 };
        retryMap.set(retryID, defaultRetryObject);
    }

    setES.Retries(userID, retryMap);
};

/**
 * Get all items to be retried. If an item has reached a
 * retry time of one year, we remove it from the list
 */
export const getRetries = (userID: string) => {
    const retryMap = getES.Retries(userID);

    for (const [retryID, { retryTime }] of retryMap) {
        if (retryTime > +add(serverTime(), { years: 1 })) {
            retryMap.delete(retryID);
        }
    }

    setES.Retries(userID, retryMap);

    return retryMap;
};

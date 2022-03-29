import { IDBPDatabase, openDB, deleteDB } from 'idb';
import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';
import { wait } from '@proton/shared/lib/helpers/promise';
import { destroyOpenPGP, loadOpenPGP } from '@proton/shared/lib/openpgp';
import { Api } from '@proton/shared/lib/interfaces';
import { ESIndexMetrics, ESProgressBlob, ESSearchMetrics } from './interfaces';
import { DIACRITICS_REGEXP, ES_MAX_PARALLEL_ITEMS } from './constants';
import { apiHelper, indexKeyExists } from './esHelpers';

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
};
// Removers
export const removeES = {
    Key: (userID: string) => removeESItem(userID, 'Key'),
    Event: (userID: string) => removeESItem(userID, 'Event'),
    Progress: (userID: string) => removeESItem(userID, 'BuildProgress'),
    Size: (userID: string) => removeESItem(userID, 'SizeIDB'),
    Pause: (userID: string) => removeESItem(userID, 'Pause'),
    Enabled: (userID: string) => removeESItem(userID, 'ESEnabled'),
};

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
 * Destroy and load openpgp workers back again
 */
export const refreshOpenpgp = async () => {
    const { openpgp } = window as any;
    // In case the workers are performing some operations, wait until they are done
    const openpgpWorkers = openpgp.getWorker();
    if (!openpgpWorkers) {
        return;
    }
    while (openpgpWorkers.workers.some((worker: any) => worker.requests)) {
        await wait(200);
    }
    await destroyOpenPGP();
    await loadOpenPGP();
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
 * Delay an operation by a random number of seconds between 1 second and 3 minutes, expressed in milliseconds
 */
export const deferSending = async () => {
    await wait(1000 * Math.floor(180 * Math.random() + 1));
};

/**
 * Send metrics about encrypted search
 */
export const sendESMetrics = async (api: Api, Title: string, Data: ESSearchMetrics | ESIndexMetrics) => {
    await deferSending();
    return apiHelper<{ Code: number }>(
        api,
        undefined,
        {
            method: 'post',
            url: 'metrics',
            data: { Log: 'encrypted_search', Title, Data },
        },
        'metrics'
    );
};

/**
 * Remove diacritics and apply other transforms to the NFKD decomposed string
 */
export const normalizeString = (str: string, format: 'NFD' | 'NFKD' = 'NFKD') =>
    str.toLocaleLowerCase().normalize(format).replace(DIACRITICS_REGEXP, '');

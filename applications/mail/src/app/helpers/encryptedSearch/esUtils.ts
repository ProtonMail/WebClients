import { getItem, setItem, removeItem } from '@proton/shared/lib/helpers/storage';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { LabelCount } from '@proton/shared/lib/interfaces';
import { destroyOpenPGP, loadOpenPGP } from '@proton/shared/lib/openpgp';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { wait } from '@proton/shared/lib/helpers/promise';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { IDBPDatabase, openDB, deleteDB } from 'idb';
import { Location, History } from 'history';
import { EncryptedSearchDB, ESProgressBlob, GetUserKeys } from '../../models/encryptedSearch';
import { ES_MAX_PARALLEL_MESSAGES } from '../../constants';
import { decryptIndexKey } from './esBuild';
import { extractSearchParameters, filterFromUrl, pageFromUrl, setSortInUrl, sortFromUrl } from '../mailboxUrl';
import { isSearch } from '../elements';
import { roundMilliseconds } from './esSearch';

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
 * Helpers to work with ES IndexedDB
 */
export const openESDB = async (userID: string) => openDB<EncryptedSearchDB>(`ES:${userID}:DB`);
export const deleteESDB = async (userID: string) => deleteDB(`ES:${userID}:DB`);
export const createESDB = async (userID: string) => {
    return openDB<EncryptedSearchDB>(`ES:${userID}:DB`, 1, {
        upgrade(esDB) {
            esDB.createObjectStore('messages', { keyPath: 'ID' }).createIndex('byTime', ['Time', 'Order'], {
                unique: true,
            });
        },
    });
};

/**
 * Helper to send ES-related sentry reports
 */
export const esSentryReport = (errorMessage: string, extra?: any) => {
    captureMessage(`[EncryptedSearch] ${errorMessage}`, { extra });
};

/**
 * Check whether the index key exists
 */
export const indexKeyExists = (userID: string) => !!getES.Key(userID);

/**
 * Check whether a previously started indexing process has terminated successfully
 */
export const isDBReadyAfterBuilding = (userID: string) => !getES.Progress(userID);

/**
 * Check whether a key exists and the corresponding indexing process has terminated successfully
 */
export const wasIndexingDone = (userID: string) => indexKeyExists(userID) && isDBReadyAfterBuilding(userID);

/**
 * Fetch the oldest message from IDB
 */
export const getOldestMessage = async (esDB: IDBPDatabase<EncryptedSearchDB>) => {
    return esDB.getFromIndex('messages', 'byTime', IDBKeyRange.lowerBound([0, 0]));
};

/**
 * Fetch Time and Order of the oldest message from IDB
 */
export const getOldestTimePoint = async (userID: string) => {
    const esDB = await openESDB(userID);
    const oldestMessage = await getOldestMessage(esDB);
    esDB.close();
    return [oldestMessage?.Time || 0, oldestMessage?.Order || 0] as [number, number];
};

/**
 * Fetch Time of the oldest message from IDB, eventually corrected by a given factor
 */
export const getOldestTime = async (userID: string, correctionFactor?: number) => {
    const timePoint = await getOldestTimePoint(userID);
    return timePoint[0] * (correctionFactor || 1);
};

/**
 * Fetch the number of messages in IDB
 */
export const getNumMessagesDB = async (userID: string) => {
    const esDB = await openESDB(userID);
    const count = await esDB.count('messages');
    esDB.close();
    return count;
};

/**
 * Fetch the number of messages in the mailbox when indexing had started, i.e.
 * excluding those that have changed since then
 */
export const getESTotal = (userID: string) => {
    return getES.Progress(userID)?.totalMessages || 0;
};

/**
 * Fetch the indexing progress from BuildProgress
 */
export const getESCurrentProgress = (userID: string) => {
    const progressBlob = getES.Progress(userID);
    if (!progressBlob) {
        return 0;
    }
    const { currentMessages, totalMessages } = progressBlob;
    return Math.ceil(((currentMessages || 0) / totalMessages) * 100);
};

/**
 * Overwrites the BuildProgress blob in localStorage
 */
export const setESProgress = (userID: string, newProperties: Partial<ESProgressBlob>) => {
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
 * Set the number of messages already indexed in BuildProgress and save it to localStorage
 */
export const setESCurrent = (userID: string, currentMessages: number) => {
    // Since messages are stored to IDB in batches, we only store up the current
    // number modulo the batch size
    setESProgress(userID, {
        currentMessages: Math.floor(currentMessages / ES_MAX_PARALLEL_MESSAGES) * ES_MAX_PARALLEL_MESSAGES,
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
 * Stores the initial estimate in seconds, but only if it's the first of such predictions
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
 * Read the current total amount of messages
 */
export const getTotalMessages = async (messageCounts: LabelCount[]) => {
    return messageCounts.find((labelCount) => labelCount?.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL)?.Total || 0;
};

/**
 * Check whether ES can be used not just because the index key exists in localStorage
 * but also because IDB is not corrupt, i.e. the object store exists
 */
export const canUseES = async (userID: string) => {
    if (!indexKeyExists) {
        return false;
    }
    const esDB = await openESDB(userID);
    const isIntact = esDB.objectStoreNames.contains('messages');
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
 * Return index keys from legacy blobs and associated user IDs
 */
export const checkNewUserID = async (getUserKeys: GetUserKeys) => {
    return (
        await Promise.all(
            Object.keys(window.localStorage).map(async (key) => {
                const chunks = key.split(':');
                if (chunks[0] === 'ES' && chunks[2] === 'Key') {
                    const userID = chunks[1];
                    try {
                        const indexKey = await decryptIndexKey(getUserKeys, getItem(key));
                        if (indexKey) {
                            return { userID, indexKey };
                        }
                    } catch (error: any) {
                        // Ignore errors in this instance as there could be indexes not
                        // belonging to the current user
                    }
                }
            })
        )
    ).filter(isTruthy);
};

/**
 * Parse search parameters from URL
 */
export const parseSearchParams = (location: Location) => {
    const searchParameters = extractSearchParameters(location);
    return {
        filterParameter: filterFromUrl(location),
        sortParameter: sortFromUrl(location),
        isSearch: isSearch(searchParameters),
        page: pageFromUrl(location),
        searchParameters,
    };
};

/**
 * Reset sort in URL, e.g because ES doesn't support SIZE sort
 */
export const resetSort = (history: History) => {
    history.push(setSortInUrl(history.location, { sort: 'Time', desc: true }));
};

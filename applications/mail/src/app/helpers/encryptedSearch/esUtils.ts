import { getItem, setItem, removeItem } from '@proton/shared/lib/helpers/storage';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { Api } from '@proton/shared/lib/interfaces';
import { getMessageCountsModel } from '@proton/shared/lib/models/messageCountsModel';
import { destroyOpenPGP, loadOpenPGP } from '@proton/shared/lib/openpgp';
import { wait } from '@proton/shared/lib/helpers/promise';
import { IDBPDatabase, openDB, deleteDB } from 'idb';
import { EncryptedSearchDB } from '../../models/encryptedSearch';
import { ES_MAX_PARALLEL_MESSAGES } from '../../constants';

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
    Progress: (userID: string) => getESItem(userID, 'BuildProgress'),
    Size: (userID: string) => getESItem(userID, 'SizeIDB'),
    Pause: (userID: string) => getESItem(userID, 'Pause'),
    Enabled: (userID: string) => getESItem(userID, 'ESEnabled'),
};
// Setters
export const setES = {
    Key: (userID: string, blobValue: string) => setESItem(userID, 'Key', blobValue),
    Event: (userID: string, blobValue: string) => setESItem(userID, 'Event', blobValue),
    Progress: (userID: string, blobValue: string) => setESItem(userID, 'BuildProgress', blobValue),
    Size: (userID: string, blobValue: string) => setESItem(userID, 'SizeIDB', blobValue),
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
 * Check whether the index key exists
 */
export const indexKeyExists = (userID: string) => !!getES.Key(userID);

/**
 * Check whether indexing is paused
 */
export const isPaused = (userID: string) => !!getES.Pause(userID);

/**
 * Check whether a recovery point exists
 */
export const isRecoveryNeeded = (userID: string) => !!getES.Progress(userID);

/**
 * Check whether a previously started indexing process has terminated successfully
 */
export const isDBReadyAfterBuilding = (userID: string) => !isRecoveryNeeded(userID);

/**
 * Check whether a key exists and the corresponding indexing process has terminated successfully
 */
export const wasIndexingDone = (userID: string) => indexKeyExists(userID) && isDBReadyAfterBuilding(userID);

/**
 * Check whether the user has enabled encrypted search
 */
export const isESEnabled = (userID: string) => !!getES.Enabled(userID);

/**
 * Fetch the oldest message from IDB
 */
export const getOldestMessage = async (esDB: IDBPDatabase<EncryptedSearchDB>) => {
    return esDB.getAllFromIndex('messages', 'byTime', undefined, 1).then((array) => {
        if (array.length === 1) {
            return array[0];
        }
    });
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
export const getTotalFromBuildProgress = (userID: string) => {
    const buildBlob = getES.Progress(userID);
    if (!buildBlob) {
        return 0;
    }
    const { totalMessages }: { totalMessages: number } = JSON.parse(buildBlob);
    return totalMessages;
};

/**
 * Fetch the indexing progress from BuildProgress
 */
export const getProgressFromBuildProgress = (userID: string) => {
    const buildBlob = getES.Progress(userID);
    if (!buildBlob) {
        return 0;
    }
    const { currentMessages, totalMessages }: { currentMessages: number | undefined; totalMessages: number } =
        JSON.parse(buildBlob);

    return Math.ceil(((currentMessages || 0) / totalMessages) * 100);
};

/**
 * Set the number of messages already indexed in BuildProgress and save it to localStorage
 */
export const setCurrentToBuildProgress = (userID: string, currentMessages: number) => {
    const buildBlob = getES.Progress(userID);
    if (!buildBlob) {
        return;
    }
    const { totalMessages }: { totalMessages: number } = JSON.parse(buildBlob);
    // Since messages are stored to IDB in batches, we only store up the current
    // number modulo the batch size
    setES.Progress(
        userID,
        JSON.stringify({
            totalMessages,
            currentMessages: Math.floor(currentMessages / ES_MAX_PARALLEL_MESSAGES) * ES_MAX_PARALLEL_MESSAGES,
        })
    );
};

/**
 * Read the rolling estimated size of IDB
 */
export const getSizeIDB = (userID: string) => {
    const sizeBlob = getES.Size(userID);
    if (!sizeBlob) {
        return 0;
    }
    const sizeIDB = parseInt(sizeBlob, 10);
    if (Number.isNaN(sizeIDB)) {
        return 0;
    }
    return sizeIDB;
};

/**
 * Update the rolling estimated size of IDB
 */
export const updateSizeIDB = (userID: string, addend: number) => {
    const sizeIDB = getSizeIDB(userID);
    const newSize = sizeIDB + addend;
    setES.Size(userID, `${newSize}`);
};

/**
 * Read the current total amount of messages
 */
export const getTotalMessages = async (inputMessageCounts: any, api: Api) => {
    // If messageCounts hasn't been loaded, we fetch the information directly
    const messageCounts = inputMessageCounts || (await getMessageCountsModel(api));
    const { Total }: { Total: number } = messageCounts.find(
        ({ LabelID }: { LabelID: string }) => LabelID === MAILBOX_LABEL_IDS.ALL_MAIL
    );
    return Total;
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

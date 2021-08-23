import { getItem, setItem } from '@proton/shared/lib/helpers/storage';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { Api } from '@proton/shared/lib/interfaces';
import { getMessageCountsModel } from '@proton/shared/lib/models/messageCountsModel';
import { destroyOpenPGP, loadOpenPGP } from '@proton/shared/lib/openpgp';
import { wait } from '@proton/shared/lib/helpers/promise';
import { IDBPDatabase, openDB } from 'idb';
import { EncryptedSearchDB, StoredCiphertext } from '../../models/encryptedSearch';
import { getMessageFromDB } from './esSync';
import { sizeOfCachedMessage } from './esSearch';

/**
 * Check whether the index key exists
 */
export const indexKeyExists = (userID: string) => !!getItem(`ES:${userID}:Key`);

/**
 * Check whether indexing is paused
 */
export const isPaused = (userID: string) => !!getItem(`ES:${userID}:Pause`);

/**
 * Check whether a recovery point exists
 */
export const isRecoveryNeeded = (userID: string) => !!getItem(`ES:${userID}:Recover`);

/**
 * Check whether a previously started indexing process has terminated successfully
 */
export const isDBReadyAfterBuilding = (userID: string) =>
    !getItem(`ES:${userID}:BuildProgress`) && !getItem(`ES:${userID}:Recover`);

/**
 * Check whether a key exists and the corresponding indexing process has terminated successfully
 */
export const wasIndexingDone = (userID: string) => indexKeyExists(userID) && isDBReadyAfterBuilding(userID);

/**
 * Check whether the user has enabled encrypted search
 */
export const isESEnabled = (userID: string) => !!getItem(`ES:${userID}:ESEnabled`);

/**
 * Fetch the oldest message from IDB
 */
export const getOldestMessage = async (esDB: IDBPDatabase<EncryptedSearchDB>) => {
    const oldestMessage: StoredCiphertext = (await esDB.getAllFromIndex('messages', 'byTime', undefined, 1))[0];
    return oldestMessage;
};

/**
 * Fetch Time and Order of the oldest message from IDB
 */
export const getOldestTimePoint = async (userID: string) => {
    const esDB = await openDB<EncryptedSearchDB>(`ES:${userID}:DB`);
    const oldestMessage = await getOldestMessage(esDB);
    esDB.close();
    return [oldestMessage.Time, oldestMessage.Order] as [number, number];
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
    const esDB = await openDB(`ES:${userID}:DB`);
    const count = await esDB.count('messages');
    esDB.close();
    return count;
};

/**
 * Fetch the number of messages in the mailbox when indexing had started, i.e.
 * excluding those that have changed since then
 */
export const getTotalFromBuildProgress = (userID: string) => {
    const buildBlob = getItem(`ES:${userID}:BuildProgress`);
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
    const buildBlob = getItem(`ES:${userID}:BuildProgress`);
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
export const setCurrentFromBuildProgress = (userID: string, currentMessages: number) => {
    const buildBlob = getItem(`ES:${userID}:BuildProgress`);
    if (!buildBlob) {
        return;
    }
    const { totalMessages }: { totalMessages: number } = JSON.parse(buildBlob);
    setItem(`ES:${userID}:BuildProgress`, JSON.stringify({ totalMessages, currentMessages }));
};

/**
 * Read the rolling estimated size of IDB
 */
export const getSizeIDB = (userID: string) => {
    const sizeBlob = getItem(`ES:${userID}:SizeIDB`);
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
    setItem(`ES:${userID}:SizeIDB`, `${newSize}`);
};

/**
 * Remove a single message's size from the rolling estimated size of IDB
 */
export const removeMessageSize = async (
    userID: string,
    esDB: IDBPDatabase<EncryptedSearchDB>,
    ID: string,
    indexKey: CryptoKey
) => {
    const message = await getMessageFromDB(ID, indexKey, esDB);
    if (!message) {
        return 0;
    }
    const size = sizeOfCachedMessage(message);
    updateSizeIDB(userID, -size);
    return size;
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
    const esDB = await openDB<EncryptedSearchDB>(`ES:${userID}:DB`);
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

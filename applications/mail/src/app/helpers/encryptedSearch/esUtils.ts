import { getItem, setItem } from 'proton-shared/lib/helpers/storage';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
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
    !getItem(`ES:${userID}:BuildEvent`) && !getItem(`ES:${userID}:Recover`);

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
export const getTotalFromBuildEvent = (userID: string) => {
    const buildBlob = getItem(`ES:${userID}:BuildEvent`);
    if (!buildBlob) {
        return;
    }
    const { totalMessages }: { totalMessages: number } = JSON.parse(buildBlob);
    return totalMessages;
};

/**
 * Fetch the last event before the start of indexing
 */
export const getBuildEvent = (userID: string) => {
    const buildBlob = getItem(`ES:${userID}:BuildEvent`);
    if (!buildBlob) {
        return;
    }
    const { event }: { event: string } = JSON.parse(buildBlob);
    return event;
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
export const getTotalMessages = (messageCounts: any) => {
    const { Total }: { Total: number } = messageCounts.find(
        ({ LabelID }: { LabelID: string }) => LabelID === MAILBOX_LABEL_IDS.ALL_MAIL
    );
    return Total;
};

/**
 * Read whether a previous event catching up failed
 */
export const getCatchUpFail = (userID: string) => {
    const catchUpFail = getItem(`ES:${userID}:CatchUpFail`);
    if (!catchUpFail) {
        return false;
    }
    return catchUpFail === 'true';
};

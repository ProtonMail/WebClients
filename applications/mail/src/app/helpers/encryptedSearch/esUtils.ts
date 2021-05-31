import { getItem, setItem } from 'proton-shared/lib/helpers/storage';
import { IDBPDatabase, openDB } from 'idb';
import { EncryptedSearchDB, StoredCiphertext } from '../../models/encryptedSearch';
import { getMessageFromDB } from './esSync';
import { sizeOfCachedMessage } from './esSearch';

export const indexKeyExists = (userID: string) => !!getItem(`ES:${userID}:Key`);

export const isPaused = (userID: string) => !!getItem(`ES:${userID}:Pause`);

export const isRecoveryNeeded = (userID: string) => !!getItem(`ES:${userID}:Recover`);

export const isDBReadyAfterBuilding = (userID: string) =>
    !getItem(`ES:${userID}:BuildEvent`) && !getItem(`ES:${userID}:Recover`);

export const wasIndexingDone = (userID: string) => indexKeyExists(userID) && isDBReadyAfterBuilding(userID);

export const isESEnabled = (userID: string) => !!getItem(`ES:${userID}:ESEnabled`);

export const getOldestMessage = async (esDB: IDBPDatabase<EncryptedSearchDB>) => {
    const oldestMessage: StoredCiphertext = (await esDB.getAllFromIndex('messages', 'byTime', undefined, 1))[0];
    return oldestMessage;
};

export const getOldestTimePoint = async (userID: string) => {
    const esDB = await openDB<EncryptedSearchDB>(`ES:${userID}:DB`);
    const oldestMessage = await getOldestMessage(esDB);
    esDB.close();
    return [oldestMessage.Time, oldestMessage.Order] as [number, number];
};

export const getOldestTime = async (userID: string, correctionFactor?: number) => {
    const timePoint = await getOldestTimePoint(userID);
    return timePoint[0] * (correctionFactor || 1);
};

export const getNumMessagesDB = async (userID: string) => {
    const esDB = await openDB(`ES:${userID}:DB`);
    const count = await esDB.count('messages');
    esDB.close();
    return count;
};

export const getTotalFromBuildEvent = (userID: string) => {
    const buildBlob = getItem(`ES:${userID}:BuildEvent`);
    if (!buildBlob) {
        return;
    }
    const { totalMessages }: { totalMessages: number } = JSON.parse(buildBlob);
    return totalMessages;
};

export const getBuildEvent = (userID: string) => {
    const buildBlob = getItem(`ES:${userID}:BuildEvent`);
    if (!buildBlob) {
        return;
    }
    const { event }: { event: string } = JSON.parse(buildBlob);
    return event;
};

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

export const updateSizeIDB = (userID: string, addend: number) => {
    const sizeIDB = getSizeIDB(userID);
    const newSize = sizeIDB + addend;
    setItem(`ES:${userID}:SizeIDB`, `${newSize}`);
};

export const removeMessageSize = async (
    userID: string,
    esDB: IDBPDatabase<EncryptedSearchDB>,
    ID: string,
    indexKey: CryptoKey
) => {
    const message = await getMessageFromDB(ID, indexKey, esDB);
    if (!message) {
        return;
    }
    updateSizeIDB(userID, -sizeOfCachedMessage(message));
};

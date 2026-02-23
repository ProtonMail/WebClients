import { INDEXING_STATUS, TIMESTAMP_TYPE, defaultESProgress } from '../constants';
import { roundMilliseconds } from '../esHelpers';
import type { ESProgress } from '../models';
import { openESDB, safelyWriteToIDBAbsolutely } from './indexedDB';

export type IndexedDBRow = 'metadata' | 'content';

/**
 * Read the indexing progress of the given type from the indexingProgress table
 */
const read = async (userID: string, row: IndexedDBRow) => {
    const esDB = await openESDB(userID);
    if (!esDB) {
        return;
    }

    const result = await esDB.get('indexingProgress', row);
    esDB.close();
    return result;
};

/**
 * Read the recovery point of the given type from the indexingProgress table
 */
const readRecoveryPoint = async (userID: string, row: IndexedDBRow) => {
    const progress = await read(userID, row);
    if (!progress) {
        return;
    }
    return progress.recoveryPoint;
};

/**
 * Write the indexing progress for metadata to the indexingProgress table
 */
const write = async (userID: string, progress: ESProgress, row: IndexedDBRow) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('indexingProgress')) {
        return;
    }

    await safelyWriteToIDBAbsolutely({ value: progress, key: row, storeName: 'indexingProgress', esDB });

    esDB.close();
};

/**
 * Increment by one the number of times the user has paused indexing
 */
const incrementNumPauses = async (userID: string, row: IndexedDBRow) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('indexingProgress')) {
        return;
    }

    const progress = await esDB.get('indexingProgress', row);
    if (!progress) {
        return;
    }

    progress.numPauses += 1;

    await safelyWriteToIDBAbsolutely({ value: progress, key: row, storeName: 'indexingProgress', esDB });

    esDB.close();
};

/**
 * Add a timestamp to the set of indexing timestamps for indexing
 */
const addTimestamp = async (userID: string, type: TIMESTAMP_TYPE = TIMESTAMP_TYPE.STEP, row: IndexedDBRow) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('indexingProgress')) {
        return;
    }

    const progress = await esDB.get('indexingProgress', row);
    if (!progress) {
        return;
    }

    const { timestamps } = progress;
    timestamps.push({ type, time: roundMilliseconds(Date.now()) });

    await safelyWriteToIDBAbsolutely({
        value: { ...progress, timestamps },
        key: row,
        storeName: 'indexingProgress',
        esDB,
    });

    esDB.close();
};

/**
 * Set the initial estimate in seconds, but only if it's the first of such predictions,
 * for the indexing process
 */
const setOriginalEstimate = async (userID: string, inputEstimate: number, row: IndexedDBRow) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('indexingProgress')) {
        return;
    }

    const progress = await esDB.get('indexingProgress', row);
    if (!progress) {
        return;
    }

    const { originalEstimate } = progress;
    if (originalEstimate === 0) {
        await safelyWriteToIDBAbsolutely({
            value: { ...progress, originalEstimate: inputEstimate },
            key: row,
            storeName: 'indexingProgress',
            esDB,
        });
    }

    esDB.close();
};

/**
 * Overwrite the indexing process data with the given properties
 */
const set = async (userID: string, newProperties: Partial<ESProgress>, row: IndexedDBRow) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('indexingProgress')) {
        return;
    }

    const progress = await esDB.get('indexingProgress', row);
    if (!progress) {
        return;
    }

    await safelyWriteToIDBAbsolutely({
        value: { ...progress, ...newProperties },
        key: row,
        storeName: 'indexingProgress',
        esDB,
    });

    esDB.close();
};

/**
 * Set the recovery point of the indexing process
 */
const setRecoveryPoint = (userID: string, recoveryPoint: unknown, row: IndexedDBRow) =>
    set(userID, { recoveryPoint }, row);

/**
 * Set the status of the indexing process
 */
const setStatus = (userID: string, status: INDEXING_STATUS, row: IndexedDBRow) => set(userID, { status }, row);

/**
 * Checks whether the indexing process is stopped or not
 */
const isIndexingPaused = async (userID: string, row: IndexedDBRow) => {
    const progress = await read(userID, row);
    if (!progress) {
        return false;
    }

    return progress.status === INDEXING_STATUS.PAUSED;
};

/**
 * Checks whether the indexing process is done or not
 */
const isIndexingDone = async (userID: string, row: IndexedDBRow) => {
    const progress = await read(userID, row);
    if (!progress) {
        return false;
    }

    return progress.status === INDEXING_STATUS.ACTIVE;
};

/**
 * Set the status of the indexing process
 * to ACTIVE, i.e. for when indexing is done, and reset to default
 * all other properties since they are no longer relevant
 */
const setActiveStatus = async (userID: string, row: IndexedDBRow) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('indexingProgress')) {
        return;
    }

    await safelyWriteToIDBAbsolutely({
        value: {
            ...defaultESProgress,
            status: INDEXING_STATUS.ACTIVE,
        },
        key: row,
        storeName: 'indexingProgress',
        esDB,
    });

    esDB.close();
};

export const getIndexingProgressQueryHelpers = (row: IndexedDBRow) => {
    return {
        read: (userID: string) => read(userID, row),
        readRecoveryPoint: (userID: string) => readRecoveryPoint(userID, row),
        write: (userID: string, progress: ESProgress) => write(userID, progress, row),
        incrementNumPauses: (userID: string) => incrementNumPauses(userID, row),
        addTimestamp: (userID: string, type?: TIMESTAMP_TYPE) => addTimestamp(userID, type, row),
        setOriginalEstimate: (userID: string, inputEstimate: number) => setOriginalEstimate(userID, inputEstimate, row),
        set: (userID: string, newProperties: Partial<ESProgress>) => set(userID, newProperties, row),
        setRecoveryPoint: (userID: string, recoveryPoint: unknown) => setRecoveryPoint(userID, recoveryPoint, row),
        setStatus: (userID: string, status: INDEXING_STATUS) => setStatus(userID, status, row),
        setActiveStatus: (userID: string) => setActiveStatus(userID, row),
        isIndexingPaused: (userID: string) => isIndexingPaused(userID, row),
        isIndexingDone: (userID: string) => isIndexingDone(userID, row),
    };
};

export const metadataIndexingProgress = getIndexingProgressQueryHelpers('metadata');
export const contentIndexingProgress = getIndexingProgressQueryHelpers('content');

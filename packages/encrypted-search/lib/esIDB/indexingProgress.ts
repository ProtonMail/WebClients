import { INDEXING_STATUS, TIMESTAMP_TYPE, defaultESProgress } from '../constants';
import { roundMilliseconds } from '../esHelpers';
import { ESProgress } from '../models';
import { openESDB, safelyWriteToIDBAbsolutely } from './indexedDB';

type IndexedDBRow = 'metadata' | 'content';

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

    await safelyWriteToIDBAbsolutely(progress, row, 'indexingProgress', esDB);

    esDB.close();
};

/**
 * Increment by one the number of times the user has paused content indexing
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

    await safelyWriteToIDBAbsolutely(progress, row, 'indexingProgress', esDB);

    esDB.close();
};

/**
 * Add a timestamp to the set of indexing timestamps for content indexing
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

    await safelyWriteToIDBAbsolutely({ ...progress, timestamps }, row, 'indexingProgress', esDB);

    esDB.close();
};

/**
 * Set the initial estimate in seconds, but only if it's the first of such predictions,
 * for the content indexing process
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
        await safelyWriteToIDBAbsolutely(
            { ...progress, originalEstimate: inputEstimate },
            row,
            'indexingProgress',
            esDB
        );
    }

    esDB.close();
};

/**
 * Overwrite the content indexing process data with the given properties
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

    await safelyWriteToIDBAbsolutely({ ...progress, ...newProperties }, row, 'indexingProgress', esDB);

    esDB.close();
};

/**
 * Set the recovery point of the content indexing process
 */
const setRecoveryPoint = (userID: string, recoveryPoint: unknown, row: IndexedDBRow) =>
    set(userID, { recoveryPoint }, row);

/**
 * Set the status of the content indexing process
 */
const setStatus = (userID: string, status: INDEXING_STATUS, row: IndexedDBRow) => set(userID, { status }, row);

/**
 * Set the status of the indexing process for content
 * to ACTIVE, i.e. for when indexing is done, and reset to default
 * all other properties since they are no longer relevant
 */
const setActiveStatus = async (userID: string, row: IndexedDBRow) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('indexingProgress')) {
        return;
    }

    await safelyWriteToIDBAbsolutely(
        {
            ...defaultESProgress,
            status: INDEXING_STATUS.ACTIVE,
        },
        row,
        'indexingProgress',
        esDB
    );

    esDB.close();
};

const getIndexingProgressQueryHelpers = (row: IndexedDBRow) => {
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
        isIndexingDone: (userID: string) =>
            read(userID, row).then((progress) => progress?.status === INDEXING_STATUS.ACTIVE),
    };
};

export const metadataIndexingProgress = getIndexingProgressQueryHelpers('metadata');
export const contentIndexingProgress = getIndexingProgressQueryHelpers('content');

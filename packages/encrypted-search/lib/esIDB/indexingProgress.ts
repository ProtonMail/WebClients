import { INDEXING_STATUS, TIMESTAMP_TYPE, defaultESProgress } from '../constants';
import { roundMilliseconds } from '../esHelpers';
import { ESProgress } from '../models';
import { openESDB, safelyWriteToIDBAbsolutely } from './indexedDB';

/**
 * Read the indexing progress of the given type from the indexingProgress table
 */
const readProgress = async (userID: string, row: 'metadata' | 'content') => {
    const esDB = await openESDB(userID);
    if (!esDB) {
        return;
    }

    const result = await esDB.get('indexingProgress', row);
    esDB.close();
    return result;
};

/**
 * Read the indexing progress of metadata from the indexingProgress table
 */
export const readMetadataProgress = async (userID: string) => readProgress(userID, 'metadata');

/**
 * Read the indexing progress of content from the indexingProgress table
 */
export const readContentProgress = async (userID: string) => readProgress(userID, 'content');

/**
 * Check whether content indexing is completed
 */
export const isContentIndexingDone = async (userID: string) =>
    readContentProgress(userID).then((progress) => progress?.status === INDEXING_STATUS.ACTIVE);

/**
 * Read the recovery point of the given type from the indexingProgress table
 */
const readRecoveryPoint = async (userID: string, row: 'metadata' | 'content') => {
    const progress = await readProgress(userID, row);
    if (!progress) {
        return;
    }
    return progress.recoveryPoint;
};

/**
 * Read the recovery point for metadata from the indexingProgress table
 */
export const readMetadataRecoveryPoint = async (userID: string) => readRecoveryPoint(userID, 'metadata');

/**
 * Write the indexing progress for metadata to the indexingProgress table
 */
export const writeMetadataProgress = async (userID: string, progress: ESProgress) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('indexingProgress')) {
        return;
    }

    await safelyWriteToIDBAbsolutely(progress, 'metadata', 'indexingProgress', esDB);

    esDB.close();
};

/**
 * Write the indexing progress for content to the indexingProgress table
 */
export const writeContentProgress = async (userID: string, progress: ESProgress) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('indexingProgress')) {
        return;
    }

    await safelyWriteToIDBAbsolutely(progress, 'content', 'indexingProgress', esDB);

    esDB.close();
};

/**
 * Increment by one the number of times the user has paused content indexing
 */
export const incrementNumPauses = async (userID: string) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('indexingProgress')) {
        return;
    }

    const progress = await esDB.get('indexingProgress', 'content');
    if (!progress) {
        return;
    }

    progress.numPauses += 1;

    await safelyWriteToIDBAbsolutely(progress, 'content', 'indexingProgress', esDB);

    esDB.close();
};

/**
 * Add a timestamp to the set of indexing timestamps for content indexing
 */
export const addTimestamp = async (userID: string, type: TIMESTAMP_TYPE = TIMESTAMP_TYPE.STEP) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('indexingProgress')) {
        return;
    }

    const progress = await esDB.get('indexingProgress', 'content');
    if (!progress) {
        return;
    }

    const { timestamps } = progress;
    timestamps.push({ type, time: roundMilliseconds(Date.now()) });

    await safelyWriteToIDBAbsolutely({ ...progress, timestamps }, 'content', 'indexingProgress', esDB);

    esDB.close();
};

/**
 * Set the initial estimate in seconds, but only if it's the first of such predictions,
 * for the content indexing process
 */
export const setOriginalEstimate = async (userID: string, inputEstimate: number) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('indexingProgress')) {
        return;
    }

    const progress = await esDB.get('indexingProgress', 'content');
    if (!progress) {
        return;
    }

    const { originalEstimate } = progress;
    if (originalEstimate === 0) {
        await safelyWriteToIDBAbsolutely(
            { ...progress, originalEstimate: inputEstimate },
            'content',
            'indexingProgress',
            esDB
        );
    }
    esDB.close();
};

/**
 * Overwrite the content indexing process data with the given properties
 */
const setContentProgress = async (userID: string, newProperties: Partial<ESProgress>) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('indexingProgress')) {
        return;
    }

    const progress = await esDB.get('indexingProgress', 'content');
    if (!progress) {
        return;
    }

    await safelyWriteToIDBAbsolutely({ ...progress, ...newProperties }, 'content', 'indexingProgress', esDB);

    esDB.close();
};

/**
 * Set the recovery point of the content indexing process
 */
export const setContentRecoveryPoint = async (userID: string, recoveryPoint: any) =>
    setContentProgress(userID, { recoveryPoint });

/**
 * Set the recovery point of the metadata indexing process, which is allowed to have
 * any type, as it's specified by each product
 */
export const setMetadataRecoveryPoint = async (userID: string, recoveryPoint: any) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('indexingProgress')) {
        return;
    }

    const progress = await esDB.get('indexingProgress', 'metadata');
    if (!progress) {
        return;
    }

    await safelyWriteToIDBAbsolutely({ ...progress, recoveryPoint }, 'metadata', 'indexingProgress', esDB);

    esDB.close();
};

/**
 * Set the status of the content indexing process
 */
export const setProgressStatus = async (userID: string, status: INDEXING_STATUS) =>
    setContentProgress(userID, { status });

/**
 * Set the status of the indexing process for metadata
 * to ACTIVE, i.e. for when indexing is done, and reset to default
 * all other properties since they are no longer relevant
 */
export const setMetadataActiveProgressStatus = async (userID: string) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('indexingProgress')) {
        return;
    }

    await safelyWriteToIDBAbsolutely(
        { ...defaultESProgress, status: INDEXING_STATUS.ACTIVE },
        'metadata',
        'indexingProgress',
        esDB
    );

    esDB.close();
};

/**
 * Set the status of the indexing process for content
 * to ACTIVE, i.e. for when indexing is done, and reset to default
 * all other properties since they are no longer relevant
 */
export const setContentActiveProgressStatus = async (userID: string) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('indexingProgress')) {
        return;
    }

    await safelyWriteToIDBAbsolutely(
        {
            ...defaultESProgress,
            status: INDEXING_STATUS.ACTIVE,
        },
        'content',
        'indexingProgress',
        esDB
    );

    esDB.close();
};

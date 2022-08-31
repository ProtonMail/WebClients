import { INDEXING_STATUS, TIMESTAMP_TYPE, defaultESProgress } from '../constants';
import { roundMilliseconds } from '../esHelpers';
import { CachedItem, ESItemInfo, ESProgress, ProgressObject } from '../models';
import { openESDB, safelyWriteToIDB } from './indexedDB';

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
 * Read indexing progress of both metadata and content from the indexingProgress table
 */
export const readAllIndexingProgress = async (userID: string): Promise<ProgressObject | undefined> => {
    const metadata = await readMetadataProgress(userID);
    if (!metadata) {
        return;
    }
    return {
        metadata,
        content: await readContentProgress(userID),
    };
};

/**
 * Verify that a given recovery point is of type [number, number]
 */
export const checkRecoveryFormat = (recoveryPoint: any): recoveryPoint is [number, number] =>
    Array.isArray(recoveryPoint) &&
    recoveryPoint.length === 2 &&
    typeof recoveryPoint[0] === 'number' &&
    typeof recoveryPoint[1] === 'number';

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
 * Read the recovery point for content from the indexingProgress table
 */
export const readContentRecoveryPoint = async (userID: string) => {
    const rp = await readRecoveryPoint(userID, 'content');
    if (!checkRecoveryFormat(rp)) {
        throw new Error('Recovery point of content indexing progress must be of type [number, number]');
    }
    return rp;
};

/**
 * Write the indexing progress for metadata to the indexingProgress table
 */
export const writeMetadataProgress = async (userID: string, progress: ESProgress) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('indexingProgress')) {
        throw new Error('ESDB not initialised');
    }

    await esDB.put('indexingProgress', progress, 'metadata');

    esDB.close();
};

/**
 * Write the indexing progress for content to the indexingProgress table
 */
export const writeContentProgress = async <ESItemMetadata>(
    userID: string,
    progress: ESProgress,
    esCache: Map<string, CachedItem<ESItemMetadata, unknown>>,
    getItemInfo: (item: ESItemMetadata) => ESItemInfo
) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('indexingProgress')) {
        throw new Error('ESDB not initialised');
    }

    await safelyWriteToIDB<ESItemMetadata>(progress, 'content', 'indexingProgress', esDB, esCache, getItemInfo);

    esDB.close();
};

/**
 * Increment by one the number of times the user has paused content indexing
 */
export const incrementNumPauses = async <ESItemMetadata>(
    userID: string,
    esCache: Map<string, CachedItem<ESItemMetadata, unknown>>,
    getItemInfo: (item: ESItemMetadata) => ESItemInfo
) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('indexingProgress')) {
        throw new Error('ESDB not initialised');
    }

    const progress = await esDB.get('indexingProgress', 'content');
    if (!progress) {
        throw new Error('Content progress not found');
    }

    progress.numPauses += 1;

    await safelyWriteToIDB<ESItemMetadata>(progress, 'content', 'indexingProgress', esDB, esCache, getItemInfo);

    esDB.close();
};

/**
 * Add a timestamp to the set of indexing timestamps for content indexing
 */
export const addTimestamp = async <ESItemMetadata>(
    userID: string,
    esCache: Map<string, CachedItem<ESItemMetadata, unknown>>,
    getItemInfo: (item: ESItemMetadata) => ESItemInfo,
    type: TIMESTAMP_TYPE = TIMESTAMP_TYPE.STEP
) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('indexingProgress')) {
        throw new Error('ESDB not initialised');
    }

    const progress = await esDB.get('indexingProgress', 'content');
    if (!progress) {
        throw new Error('Content progress not found');
    }

    const { timestamps } = progress;
    timestamps.push({ type, time: roundMilliseconds(Date.now()) });

    await safelyWriteToIDB<ESItemMetadata>(
        { ...progress, timestamps },
        'content',
        'indexingProgress',
        esDB,
        esCache,
        getItemInfo
    );

    esDB.close();
};

/**
 * Set the initial estimate in seconds, but only if it's the first of such predictions,
 * for the content indexing process
 */
export const setOriginalEstimate = async (userID: string, inputEstimate: number) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('indexingProgress')) {
        throw new Error('ESDB not initialised');
    }

    const progress = await esDB.get('indexingProgress', 'content');
    if (!progress) {
        throw new Error('Content progress not found');
    }

    const { originalEstimate } = progress;
    if (originalEstimate === 0) {
        await esDB.put('indexingProgress', { ...progress, originalEstimate: inputEstimate }, 'content');
    }
    esDB.close();
};

/**
 * Overwrite the content indexing process data with the given properties
 */
const setContentProgress = async <ESItemMetadata>(
    userID: string,
    newProperties: Partial<ESProgress>,
    esCache: Map<string, CachedItem<ESItemMetadata, unknown>>,
    getItemInfo: (item: ESItemMetadata) => ESItemInfo
) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('indexingProgress')) {
        throw new Error('ESDB not initialised');
    }

    const progress = await esDB.get('indexingProgress', 'content');
    if (!progress) {
        throw new Error('Content progress not found');
    }

    await safelyWriteToIDB<ESItemMetadata>(
        { ...progress, ...newProperties },
        'content',
        'indexingProgress',
        esDB,
        esCache,
        getItemInfo
    );

    esDB.close();
};

/**
 * Set the recovery point of the content indexing process.
 * The metadata indexing progress is allowed to have any type, as it's specified
 * by each product. On the other hand, other content types must have [number, number]
 * as recovery point since that's the key type of the temporalIndex
 */
export const setContentRecoveryPoint = async <ESItemMetadata>(
    userID: string,
    recoveryPoint: [number, number],
    esCache: Map<string, CachedItem<ESItemMetadata, unknown>>,
    getItemInfo: (item: ESItemMetadata) => ESItemInfo
) => {
    if (!checkRecoveryFormat(recoveryPoint)) {
        throw new Error('Recovery point of content indexing progress must be of type [number, number]');
    }
    return setContentProgress<ESItemMetadata>(userID, { recoveryPoint }, esCache, getItemInfo);
};

/**
 * Set the recovery point of the metadata indexing process, which is allowed to have
 * any type, as it's specified by each product
 */
export const setMetadataRecoveryPoint = async (userID: string, recoveryPoint: any) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('indexingProgress')) {
        throw new Error('ESDB not initialised');
    }

    const progress = await esDB.get('indexingProgress', 'metadata');
    if (!progress) {
        throw new Error('Content progress not found');
    }

    await esDB.put('indexingProgress', { ...progress, recoveryPoint }, 'metadata');

    esDB.close();
};

/**
 * Set the status of the content indexing process
 */
export const setProgressStatus = async <ESItemMetadata>(
    userID: string,
    status: INDEXING_STATUS,
    esCache: Map<string, CachedItem<ESItemMetadata, unknown>>,
    getItemInfo: (item: ESItemMetadata) => ESItemInfo
) => setContentProgress<ESItemMetadata>(userID, { status }, esCache, getItemInfo);

/**
 * Set the status of the indexing process for metadata
 * to ACTIVE, i.e. for when indexing is done, and reset to default
 * all other properties since they are no longer relevant
 */
export const setMetadataActiveProgressStatus = async (userID: string) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('indexingProgress')) {
        throw new Error('ESDB not initialised');
    }

    await esDB.put(
        'indexingProgress',
        {
            ...defaultESProgress,
            status: INDEXING_STATUS.ACTIVE,
        },
        'metadata'
    );

    esDB.close();
};

/**
 * Set the status of the indexing process for content
 * to ACTIVE, i.e. for when indexing is done, and reset to default
 * all other properties since they are no longer relevant
 */
export const setContentActiveProgressStatus = async <ESItemMetadata>(
    userID: string,
    esCache: Map<string, CachedItem<ESItemMetadata, unknown>>,
    getItemInfo: (item: ESItemMetadata) => ESItemInfo
) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('indexingProgress')) {
        throw new Error('ESDB not initialised');
    }

    await safelyWriteToIDB<ESItemMetadata>(
        {
            ...defaultESProgress,
            status: INDEXING_STATUS.ACTIVE,
        },
        'content',
        'indexingProgress',
        esDB,
        esCache,
        getItemInfo
    );

    esDB.close();
};

/**
 * Check whether all indexing processes currently stored in IDB are over
 */
export const areAllIndexingDone = async (userID: string) => {
    const progresses = await readAllIndexingProgress(userID);
    if (!progresses) {
        return false;
    }

    let wasIndexingDone = progresses.metadata.status === INDEXING_STATUS.ACTIVE;
    if (progresses.content) {
        wasIndexingDone &&= progresses.content.status === INDEXING_STATUS.ACTIVE;
    }

    return wasIndexingDone;
};

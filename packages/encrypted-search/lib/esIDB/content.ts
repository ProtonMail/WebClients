import { IDBPDatabase } from 'idb';

import isTruthy from '@proton/utils/isTruthy';

import { STORING_OUTCOME } from '../constants';
import { CachedItem, CiphertextToStore, ESItemInfo, EncryptedSearchDB } from '../models';
import { openESDB, safelyWriteToIDB } from './indexedDB';

/**
 * Read an item from the items table
 */
export const readContentItem = async (userID: string, itemID: string) => {
    const esDB = await openESDB(userID);
    if (!esDB) {
        return;
    }

    const item = await esDB.get('content', itemID);
    esDB.close();
    return item;
};

/**
 * Fetch a batch of items specified by an array of item IDs
 */
export const readContentItemsBatch = async (
    userID: string,
    itemIDs: string[]
): Promise<CiphertextToStore[] | undefined> => {
    const esDB = await openESDB(userID);
    if (!esDB) {
        return;
    }

    const tx = esDB.transaction('content', 'readonly');

    const storedData = await Promise.all(itemIDs.map(async (itemID) => tx.store.get(itemID)));

    await tx.done;
    esDB.close();

    return storedData.filter(isTruthy).map((value, index) => ({ itemID: itemIDs[index], aesGcmCiphertext: value }));
};

/**
 * Fetch the number of items from the content table
 */
export const readNumContent = async (userID: string) => {
    const esDB = await openESDB(userID);
    if (!esDB) {
        return;
    }
    const count = await esDB.count('content');
    esDB.close();
    return count;
};

/**
 * Get the IDs of content items from the content table of IDB and
 * given the cache keys, which are assumed to be sorted in chronological
 * order, sort the IDs in chronological order. This is needed to
 * infer the oldest content in IDB
 */
export const getSortedInfo = async <ESItemMetadata>(
    esDB: IDBPDatabase<EncryptedSearchDB>,
    esCache: Map<string, CachedItem<ESItemMetadata, unknown>>,
    getItemInfo: (item: ESItemMetadata) => ESItemInfo
) => {
    const itemIDs = new Set(await esDB.getAllKeys('content'));
    const result: ESItemInfo[] = [];

    esCache.forEach((value, key) => {
        if (itemIDs.has(key)) {
            result.push({
                ID: key,
                timepoint: getItemInfo(value.metadata).timepoint,
            });
        }
    });

    return result;
};

/**
 * Remove the row from the content table corresponding to the oldest
 * item. This is needed to make room for newer content or for new metadata.
 * The sorted IDs are returned to avoid recomputing them every time, should
 * multiple items need to be deleted
 */
export const removeOldestContent = async <ESItemMetadata>(
    esDB: IDBPDatabase<EncryptedSearchDB>,
    esCache: Map<string, CachedItem<ESItemMetadata, unknown>>,
    getItemInfo: (item: ESItemMetadata) => ESItemInfo,
    inputSortedInfo?: ESItemInfo[]
) => {
    const sortedInfo = inputSortedInfo || (await getSortedInfo<ESItemMetadata>(esDB, esCache, getItemInfo));
    const oldestKey = sortedInfo.shift();
    if (!oldestKey) {
        return;
    }

    await esDB.delete('content', oldestKey.ID);

    return sortedInfo;
};

/**
 * Write the given items to IDB's content table
 */
export const writeContentItems = async <ESItemMetadata>(
    userID: string,
    itemsToAdd: CiphertextToStore[],
    esCache: Map<string, CachedItem<ESItemMetadata, unknown>>,
    getItemInfo: (item: ESItemMetadata) => ESItemInfo,
    abortIndexingRef: React.MutableRefObject<AbortController>
) => {
    const esDB = await openESDB(userID);
    if (!esDB) {
        if (abortIndexingRef.current.signal.aborted) {
            return;
        }
        throw new Error('ESDB is not initialised');
    }
    for (const itemToAdd of itemsToAdd) {
        const storingOutcome = await safelyWriteToIDB<ESItemMetadata>(
            itemToAdd.aesGcmCiphertext,
            itemToAdd.itemID,
            'content',
            esDB,
            esCache,
            getItemInfo
        );
        if (storingOutcome === STORING_OUTCOME.FAILURE || storingOutcome === STORING_OUTCOME.QUOTA) {
            // In case a specific item fails, or we've hit the quota, we immediately abort
            esDB.close();
            return storingOutcome;
        }
    }
    esDB.close();
    return STORING_OUTCOME.SUCCESS;
};

/**
 * Remove items from and write items to the content table of IDB. Note
 * that this function will throw if the IDB quota is exceeded, therefore
 * a check needs to happen in advance to verify all items to add do fit
 */
export const executeContentOperations = async <ESItemMetadata>(
    userID: string,
    itemsToRemove: string[],
    itemsToAdd: CiphertextToStore[],
    esCache: Map<string, CachedItem<ESItemMetadata, unknown>>,
    getItemInfo: (item: ESItemMetadata) => ESItemInfo
) => {
    const esDB = await openESDB(userID);
    if (!esDB) {
        throw new Error('Cannot access ESDB for metadata operations');
    }

    const tx = esDB.transaction('content', 'readwrite');

    // Firstly, all items that were deleted are removed from IDB
    if (itemsToRemove.length) {
        for (const ID of itemsToRemove) {
            void tx.store.delete(ID);
        }
    }
    await tx.done;

    const storingOutcomes: STORING_OUTCOME[] = [];

    // Then all items to add are inserted
    for (const itemToAdd of itemsToAdd) {
        storingOutcomes.push(
            await safelyWriteToIDB<ESItemMetadata>(
                itemToAdd.aesGcmCiphertext,
                itemToAdd.itemID,
                'content',
                esDB,
                esCache,
                getItemInfo
            )
        );
    }

    esDB.close();

    if (storingOutcomes.some((storingOutcome) => storingOutcome === STORING_OUTCOME.QUOTA)) {
        return STORING_OUTCOME.QUOTA;
    }
    return STORING_OUTCOME.SUCCESS;
};

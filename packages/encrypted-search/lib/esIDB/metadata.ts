import { IDBPDatabase } from 'idb';

import { STORING_OUTCOME } from '../constants';
import { CachedItem, CiphertextToStore, ESItemInfo, EncryptedSearchDB } from '../models';
import { openESDB, safelyWriteToIDB } from './indexedDB';

/**
 * Read all ciphertexts stored in the metadata table. Since we
 * assume that metadata always fit in cache completely, we can
 * read all ciphertexts in memory
 */
export const readMetadata = async (userID: string) => {
    const esDB = await openESDB(userID);
    if (!esDB) {
        return;
    }

    const metadata = await esDB.getAll('metadata');
    esDB.close();
    return metadata;
};

/**
 * Write items' metadata to the metadata table of IDB. Note that
 * this function should only be used during metadata indexing, as
 * we don't check for quota being reached
 */
export const writeMetadata = async (esDB: IDBPDatabase<EncryptedSearchDB>, ciphertexts: CiphertextToStore[]) => {
    const tx = esDB.transaction('metadata', 'readwrite');
    await Promise.all(ciphertexts.map(async ({ itemID, aesGcmCiphertext }) => tx.store.put(aesGcmCiphertext, itemID)));
    await tx.done;
};

/**
 * Fetch the number of items from the metadata table
 */
export const readNumMetadata = async (userID: string) => {
    const esDB = await openESDB(userID);
    if (!esDB) {
        return;
    }
    const count = await esDB.count('metadata');
    esDB.close();
    return count;
};

/**
 * Remove metadata from and write metadata to the metatadata table of IDB
 */
export const executeMetadataOperations = async <ESItemMetadata>(
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

    const tx = esDB.transaction('metadata', 'readwrite');

    // First, all items that were deleted are removed from IDB
    if (itemsToRemove.length) {
        for (const ID of itemsToRemove) {
            void tx.store.delete(ID);
        }
    }

    const storingOutcomes: STORING_OUTCOME[] = [];

    // Then all items to add are inserted
    for (const itemToAdd of itemsToAdd) {
        storingOutcomes.push(
            await safelyWriteToIDB<ESItemMetadata>(
                itemToAdd.aesGcmCiphertext,
                itemToAdd.itemID,
                'metadata',
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

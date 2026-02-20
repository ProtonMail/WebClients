import type { IDBPDatabase } from 'idb';

import type { IndexKey } from '@proton/crypto/lib/subtle/ad-hoc/encryptedSearch';

import { STORING_OUTCOME } from '../constants';
import { ciphertextSize, decryptFromDB } from '../esHelpers';
import type { ESItemInfo, ESTimepoint, EncryptedItemWithInfo, EncryptedSearchDB } from '../models';
import { updateSize } from './configObjectStore';
import { openESDB, safelyWriteToIDBConditionally } from './indexedDB';

/**
 * Get a decrypted metadata item from IndexedDB
 */
export const readMetadataItem = async <ESItemMetadata>(userID: string, itemID: string, indexKey: IndexKey) => {
    const esDB = await openESDB(userID);
    if (!esDB) {
        return;
    }

    const encryptedMetadataItem = await esDB.get('metadata', itemID);
    esDB.close();

    if (!encryptedMetadataItem) {
        return;
    }

    return decryptFromDB<ESItemMetadata>({
        aesGcmCiphertext: encryptedMetadataItem.aesGcmCiphertext,
        indexKey,
        source: 'readMetadataItem',
    });
};

/**
 * Read a batch of metadata items specified by their IDs
 */
export const readMetadataBatch = async (
    userID: string,
    IDs: string[]
): Promise<(EncryptedItemWithInfo | undefined)[] | undefined> => {
    const esDB = await openESDB(userID);
    if (!esDB) {
        return;
    }

    const tx = esDB.transaction('metadata', 'readonly');
    const metadata = await Promise.all(
        IDs.map((ID) =>
            tx.store
                .get(ID)
                .then((value) =>
                    !!value ? { ID, timepoint: value.timepoint, aesGcmCiphertext: value.aesGcmCiphertext } : undefined
                )
        )
    );

    await tx.done;
    esDB.close();
    return metadata;
};

/**
 * Read all IDs of stored metadata, sorted according to the temporal index.
 * @param checkpoint is the timepoint from which to search items
 * @param reverse indicates whether to return items in reverse chronological order
 */
export const readSortedIDs = async (userID: string, reverse: boolean, checkpoint?: ESTimepoint) => {
    const esDB = await openESDB(userID);
    if (!esDB) {
        return;
    }

    let range: IDBKeyRange | undefined;
    if (!!checkpoint) {
        range = reverse ? IDBKeyRange.upperBound(checkpoint, true) : IDBKeyRange.lowerBound(checkpoint, true);
    }

    const IDs = await esDB.getAllKeysFromIndex('metadata', 'temporal', range);
    esDB.close();

    if (reverse) {
        IDs.reverse();
    }

    return IDs;
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
 * Retrieve the ID of the oldest item's metadata
 */
export const getOldestID = async (esDB: IDBPDatabase<EncryptedSearchDB>) =>
    esDB.getKeyFromIndex('metadata', 'temporal', IDBKeyRange.lowerBound([0, 0]));

/**
 * Retrieve the ID and timepoint of the oldest item's metadata
 */
export const getOldestInfo = async (esDB: IDBPDatabase<EncryptedSearchDB>): Promise<ESItemInfo | undefined> =>
    getOldestID(esDB).then((ID) =>
        ID
            ? esDB.get('metadata', ID).then((item) => (!!item ? { ID, timepoint: item.timepoint } : undefined))
            : undefined
    );

/**
 * Wrapper for getOldestInfo that internally opens an instance of esDB
 */
export const wrappedGetOldestInfo = async (userID: string): Promise<ESItemInfo | undefined> => {
    const esDB = await openESDB(userID);
    if (!esDB) {
        return;
    }
    const oldestInfo = await getOldestInfo(esDB);
    esDB.close();
    return oldestInfo;
};

/**
 * Remove metadata from and write metadata to the metatadata table of IDB
 */
export const executeMetadataOperations = async (
    userID: string,
    itemsToRemove: string[],
    itemsToAdd: EncryptedItemWithInfo[]
) => {
    const esDB = await openESDB(userID);
    if (!esDB) {
        return;
    }

    const tx = esDB.transaction('metadata', 'readwrite');

    const removeSizes = await Promise.all(
        itemsToRemove.map((ID) =>
            tx.store.get(ID).then((item) => {
                void tx.store.delete(ID);
                return ciphertextSize(item?.aesGcmCiphertext);
            })
        )
    );
    await tx.done;

    await updateSize(esDB, -1 * removeSizes.reduce((p, c) => p + c, 0));

    const storingOutcomes: STORING_OUTCOME[] = [];

    // Then all items to add are inserted
    for (const itemToAdd of itemsToAdd) {
        storingOutcomes.push(await safelyWriteToIDBConditionally({ value: itemToAdd, storeName: 'metadata', esDB }));
    }

    esDB.close();

    if (storingOutcomes.some((storingOutcome) => storingOutcome === STORING_OUTCOME.QUOTA)) {
        return STORING_OUTCOME.QUOTA;
    }
    return STORING_OUTCOME.SUCCESS;
};

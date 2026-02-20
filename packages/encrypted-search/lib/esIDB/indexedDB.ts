import type { IDBPDatabase } from 'idb';
import { deleteDB, openDB } from 'idb';

import type { ESCiphertext } from '@proton/crypto/lib/subtle/ad-hoc/encryptedSearch';
import { detectStorageCapabilities } from '@proton/shared/lib/helpers/browser';
import noop from '@proton/utils/noop';

import { INDEXEDDB_VERSION, STORING_OUTCOME } from '../constants';
import { ciphertextSize, esSentryReport, isTimepointSmaller, removeESFlags } from '../esHelpers';
import type { EncryptedItemWithInfo, EncryptedMetadataItem, EncryptedSearchDB } from '../models';
import { updateSize } from './configObjectStore';
import { getOldestID, getOldestInfo } from './metadata';

/**
 * Format the name of the ES database for the given user ID
 */
const getDBName = (userID: string) => `ES:${userID}:DB`;

/**
 * Delete the given user's IDB
 */
export const deleteESDB = async (userID: string) => deleteDB(getDBName(userID)).catch(noop);

async function cleanupESDB(esDB: IDBPDatabase<EncryptedSearchDB>, userID: string) {
    esDB.close();
    // Flags are removed from local storage in case this code
    // is called due to an update from an outdated version of IDB
    removeESFlags(userID);
    await deleteESDB(userID);
}

/**
 * Open an existing IDB for the given user. If the DB hadn't already existed,
 * undefined is returned instead. WARNING: this function will delete an old
 * version of IDB if it exists
 */
export const openESDB = async (userID: string) => {
    let esDB: IDBPDatabase<EncryptedSearchDB> | undefined;
    try {
        /** Perhaps in Lockdown mode, the browser does not support IndexedDB, so we need to check for that */
        const { isAccessible, hasIndexedDB } = await detectStorageCapabilities();
        if (!isAccessible || !hasIndexedDB) {
            esSentryReport('openESDB: indexedDB not accessible', { isAccessible, hasIndexedDB });
            return;
        }
        esDB = await openDB<EncryptedSearchDB>(getDBName(userID), INDEXEDDB_VERSION);
        // return esDB if the esDB contains a metadata and content table
        if (esDB?.objectStoreNames.contains('metadata') && esDB.objectStoreNames.contains('content')) {
            return esDB;
        }
        await cleanupESDB(esDB, userID);
        return;
    } catch (error: any) {
        if (esDB) {
            await cleanupESDB(esDB, userID);
        }
        // Currently our openESDB usage expects undefined in case a db was never there (see !dbExisted conditional above)
        return;
    }
};

/**
 * Check whether the current version of IDB exists. WARNING: this function
 * will delete an old version of IDB if it exists
 */
export const checkVersionedESDB = async (userID: string) => {
    const esDB = await openESDB(userID);
    const check = !!esDB;
    esDB?.close();
    return check;
};

/**
 * Create an up-to-date IDB for the given user
 */
export const createESDB = async (userID: string) => {
    // Remove the database first, in case there is an old stale version that
    // might arise when removing it and creating a new one immediately after
    await deleteESDB(userID);
    return openDB<EncryptedSearchDB>(getDBName(userID), INDEXEDDB_VERSION, {
        upgrade: (esDB) => {
            // The object store containing the content of items, indexed by their ID.
            // Out-of-line keys are used
            esDB.createObjectStore('content');

            // The object store containing all metadata of items, indexed by their ID
            // In-line keys are used, defined by the ID property. A temporal index
            // is created as well
            const metadataOS = esDB.createObjectStore('metadata');
            metadataOS.createIndex('temporal', 'timepoint', { unique: true, multiEntry: false });

            // The config object store contains ES-wide values (e.g. the encrypted index key),
            // configuration (e.g. whether ES is enabled) and information (e.g. an estimate
            // of the size)
            esDB.createObjectStore('config');

            // The events object store contains the last event ID according to which the index has
            // been updated for every component of the product
            esDB.createObjectStore('events');

            // The indexingProgress object store contains metadata information on indexing. It always
            // will contain a 'metadata' row, for items metadata to either search those exclusively or
            // to enable ES for free users, as well as a row for content in case a product decides to
            // have any
            esDB.createObjectStore('indexingProgress');
        },
    });
};

/**
 * Delete the oldest item from ESDB, both from the metadata table and the content table
 */
const deleteOldestItem = async (ID: string, esDB: IDBPDatabase<EncryptedSearchDB>) => {
    let removeSize = 0;
    await Promise.all([
        esDB.get('metadata', ID).then((item) => {
            removeSize += ciphertextSize(item?.aesGcmCiphertext);
            return esDB.delete('metadata', ID);
        }),
        esDB.get('content', ID).then((aesGcmCiphertext) => {
            removeSize += ciphertextSize(aesGcmCiphertext);
            return esDB.delete('content', ID);
        }),
    ]);

    return updateSize(esDB, -removeSize);
};

/**
 * Return whether an item fetched from either the metadata table or the content table is of type ESCiphertext
 */
const discriminateItem = (item: EncryptedMetadataItem | ESCiphertext): item is ESCiphertext =>
    Object.hasOwn(item, 'iv');

/**
 * Compute the size of an item from either the metadata or content table
 */
const getItemSize = async (ID: string, storeName: 'metadata' | 'content', esDB: IDBPDatabase<EncryptedSearchDB>) => {
    const item = await esDB.get(storeName, ID);
    if (!item) {
        return 0;
    }

    if (discriminateItem(item)) {
        return ciphertextSize(item);
    }

    return ciphertextSize(item.aesGcmCiphertext);
};

/**
 * Write to the ES IDB and manage the case of running out of disk space.
 * If we do run out of space we must remove the oldest item to make space
 */
export const safelyWriteToIDBConditionally = async ({
    value,
    storeName,
    esDB,
    inputStoringOutcome,
}: {
    value: EncryptedItemWithInfo;
    storeName: 'metadata' | 'content';
    esDB: IDBPDatabase<EncryptedSearchDB>;
    inputStoringOutcome?: STORING_OUTCOME;
}): Promise<STORING_OUTCOME> => {
    const valueToStore: EncryptedMetadataItem | ESCiphertext =
        storeName === 'metadata'
            ? { aesGcmCiphertext: value.aesGcmCiphertext, timepoint: value.timepoint }
            : value.aesGcmCiphertext;

    try {
        const oldSize = await getItemSize(value.ID, storeName, esDB);

        const tx = esDB.transaction(storeName, 'readwrite');
        await tx.store.put(valueToStore, value.ID);
        await tx.done;

        // We always update the size if we are storing to the content table.
        // If we are storing to the metadata table, we do so only if the item
        // was flagged to update the size
        if (storeName === 'content' || !value.keepSize) {
            const newSize = ciphertextSize(value.aesGcmCiphertext);
            await updateSize(esDB, newSize - oldSize);
        }

        return inputStoringOutcome ?? STORING_OUTCOME.SUCCESS;
    } catch (error: any) {
        if (error.name === 'QuotaExceededError') {
            // We check wheter the present item is newer than the oldest one,
            // in which case we remove the latter to make space for the former
            const oldestItemInfo = await getOldestInfo(esDB);
            if (!oldestItemInfo) {
                // If there is no such oldest item, it means IDB is empty,
                // which is a rather peculiar state to throw a quota error
                esSentryReport('safelyWriteToIDBConditionally: quota reached with empty IDB', { error });
                return STORING_OUTCOME.FAILURE;
            }

            if (isTimepointSmaller(value.timepoint, oldestItemInfo.timepoint)) {
                return STORING_OUTCOME.QUOTA;
            }

            await deleteOldestItem(oldestItemInfo.ID, esDB);

            return safelyWriteToIDBConditionally({
                value,
                storeName,
                esDB,
                inputStoringOutcome: STORING_OUTCOME.QUOTA,
            });
        } else {
            // Any other error should be interpreted as a failure
            esSentryReport('safelyWriteToIDBConditionally: put failed', { error });
            return STORING_OUTCOME.FAILURE;
        }
    }
};

/**
 * Write to the ES IDB and always remove the oldest item to make space for this write
 * in case we run out of it
 */
export const safelyWriteToIDBAbsolutely = async ({
    value,
    key,
    storeName,
    esDB,
}: {
    value: any;
    key: string;
    storeName: 'config' | 'events' | 'indexingProgress';
    esDB: IDBPDatabase<EncryptedSearchDB>;
}): Promise<void> => {
    try {
        await esDB.put(storeName, value, key);
    } catch (error: any) {
        if (error.name === 'QuotaExceededError') {
            // Since the data we're trying to store to IDB has absolute
            // precedence over content, we simply remove the oldest item
            // and retry
            const oldestItemID = await getOldestID(esDB);
            if (!oldestItemID) {
                // If there is no such oldest item, it means IDB is empty,
                // which is a rather peculiar state to throw a quota error
                esSentryReport('safelyWriteToIDBAbsolutely: quota reached with empty IDB', { error });
                throw error;
            }

            await deleteOldestItem(oldestItemID, esDB);

            return safelyWriteToIDBAbsolutely({ value, key, storeName, esDB });
        } else {
            // Any other error should be interpreted as a failure
            esSentryReport('safelyWriteToIDBAbsolutely: put failed', { error });
            throw error;
        }
    }
};

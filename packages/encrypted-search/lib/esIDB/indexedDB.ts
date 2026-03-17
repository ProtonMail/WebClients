import type { IDBPDatabase } from 'idb';
import { deleteDB, openDB } from 'idb';

import type { ESCiphertext } from '@proton/crypto/lib/subtle/ad-hoc/encryptedSearch';
import { detectStorageCapabilities } from '@proton/shared/lib/helpers/browser';
import { SentryCommonInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

import { INDEXEDDB_VERSION, STORING_OUTCOME } from '../constants';
import { ciphertextSize, esSentryReport, isTimepointSmaller } from '../esHelpers';
import type { EncryptedItemWithInfo, EncryptedMetadataItem, EncryptedSearchDB } from '../models';
import { updateSize } from './configObjectStore';
import { upgrade } from './indexedDBUpgrade';
import { getOldestID, getOldestInfo } from './metadata';

/**
 * Format the name of the ES database for the given user ID
 */
const getDBName = (userID: string) => `ES:${userID}:DB`;

/**
 * Delete the given user's IDB
 */
export const deleteESDB = async (userID: string) =>
    deleteDB(getDBName(userID)).catch((e) => traceInitiativeError(SentryCommonInitiatives.ENCRYPTED_SEARCH, e));

async function cleanupESDB(esDB: IDBPDatabase<EncryptedSearchDB>, userID: string) {
    esDB.close();
    await deleteESDB(userID);
}

/**
 * Checks if the given user's IDB exists
 * @param userID
 * @returns true if the IDB exists, false otherwise
 */
export const hasESDB = async (userID: string) => {
    try {
        const dbName = getDBName(userID);
        // indexedDB.databases() is unsupported on Firefox < 126
        const databases = await indexedDB.databases();
        return databases.some(({ name }) => name === dbName);
    } catch {
        return false;
    }
};

/**
 * Open an existing IDB for the given user. If the DB hadn't already existed,
 * undefined is returned instead.
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

        const dbName = getDBName(userID);
        esDB = await openDB<EncryptedSearchDB>(dbName, INDEXEDDB_VERSION, {
            upgrade,
        });
        return esDB;
    } catch (error: any) {
        if (esDB) {
            await cleanupESDB(esDB, userID);
        }
        return;
    }
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

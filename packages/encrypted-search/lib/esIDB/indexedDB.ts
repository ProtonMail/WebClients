import type { ESCiphertext } from '@protontech/crypto/subtle/ad-hoc/encryptedSearch.ts';
import type { IDBPDatabase, StoreNames } from 'idb';
import { deleteDB, openDB } from 'idb';

import { detectStorageCapabilities } from '@proton/shared/lib/helpers/browser';
import { SentryCommonInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

import { ES_DELETE_DB_BLOCKED_TIMEOUT, INDEXEDDB_VERSION, STORING_OUTCOME } from '../constants';
import { getESLogger } from '../esHelpers/esLogger';
import { esErrorReport, esSentryReport } from '../esHelpers/esReporting';
import { ciphertextSize, isTimepointSmaller } from '../esHelpers/esUtils';
import type { EncryptedItemWithInfo, EncryptedMetadataItem, EncryptedSearchDB } from '../models';
import { upgrade } from './indexedDBUpgrade';
import { getOldestID, getOldestInfo } from './metadataOldest';

/**
 * Format the name of the ES database for the given user ID
 */
const getDBName = (userID: string) => `ES:${userID}:DB`;

/**
 * Delete the given user's IDB. deleteDatabase() never settles while another connection to the
 * same DB is still open (another tab, or any other in-flight openESDB() call in this same tab),
 * so this gives up waiting after ES_DELETE_DB_BLOCKED_TIMEOUT instead of hanging forever; the
 * underlying deletion still completes on its own once every other connection closes.
 */
export const deleteESDB = async (userID: string) => {
    const dbName = getDBName(userID);
    let wasBlocked = false;

    const deletion = deleteDB(dbName, {
        blocked: () => {
            wasBlocked = true;
            esSentryReport('deleteESDB: blocked by another open connection', { dbName });
        },
    }).catch((e) => traceInitiativeError(SentryCommonInitiatives.ENCRYPTED_SEARCH, e));

    const timeout = new Promise<void>((resolve) => setTimeout(resolve, ES_DELETE_DB_BLOCKED_TIMEOUT));

    await Promise.race([deletion, timeout]);

    if (wasBlocked) {
        esSentryReport('deleteESDB: gave up waiting for blocked delete to complete', { dbName });
    }
};

async function cleanupESDB(esDB: IDBPDatabase<EncryptedSearchDB>, userID: string) {
    esDB.close();
    await deleteESDB(userID);
}

const ALL_OBJECT_STORES: StoreNames<EncryptedSearchDB>[] = [
    'config',
    'events',
    'indexingProgress',
    'metadata',
    'content',
];

/**
 * A DB can report the current INDEXEDDB_VERSION while missing one or more of its object stores
 * (e.g. the browser evicts/corrupts the backing storage without resetting the version metadata).
 * Since `upgrade()` only runs when the browser considers the DB's version older than the one we
 * request, this state can't be repaired in place: IndexedDB never calls `onupgradeneeded` when
 * the reported version already matches. The only way out is to detect it here and start over.
 */
const getMissingObjectStores = (esDB: IDBPDatabase<EncryptedSearchDB>) =>
    ALL_OBJECT_STORES.filter((store) => !esDB.objectStoreNames.contains(store));

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
 * `detectStorageCapabilities()` races a real `indexedDB.databases()` enumeration against a fixed
 * timeout; that enumeration gets slower as this DB accumulates data and connections cycle through
 * it over a long indexing run, so it increasingly loses the race under sustained load and wrongly
 * reports storage as inaccessible. Browser capability doesn't flip-flop within a session, so a
 * successful check is cached for the session instead of re-probing on every single openESDB()
 * call (which happens many times per indexing batch). A failed check is not cached, so we keep
 * retrying in case it was itself a fluke.
 */
let cachedStorageCapabilities: Promise<{ isAccessible: boolean; hasIndexedDB: boolean }> | undefined;

const getStorageCapabilities = async () => {
    if (!cachedStorageCapabilities) {
        cachedStorageCapabilities = detectStorageCapabilities().catch((error) => {
            // A rejection would otherwise stay cached forever, unlike a resolved !isAccessible
            // result below - clear it so the next call retries instead of being stuck for good.
            cachedStorageCapabilities = undefined;
            throw error;
        });
    }

    const capabilities = await cachedStorageCapabilities;
    if (!capabilities.isAccessible) {
        // Not cached as a failure: clear it so the next call retries instead of being stuck.
        cachedStorageCapabilities = undefined;
    }

    return capabilities;
};

/** Tracks which users' `openDB()` failures have already been reported to Sentry this session. */
const reportedOpenDBFailures = new Set<string>();

/**
 * Open an existing IDB for the given user. If the DB hadn't already existed,
 * undefined is returned instead.
 */
export const openESDB = async (userID: string) => {
    let esDB: IDBPDatabase<EncryptedSearchDB> | undefined;
    try {
        /** Perhaps in Lockdown mode, the browser does not support IndexedDB, so we need to check for that */
        const { isAccessible, hasIndexedDB } = await getStorageCapabilities();
        if (!isAccessible || !hasIndexedDB) {
            esSentryReport('openESDB: indexedDB not accessible', { isAccessible, hasIndexedDB });
            return;
        }

        const dbName = getDBName(userID);
        esDB = await openDB<EncryptedSearchDB>(dbName, INDEXEDDB_VERSION, {
            upgrade,
        });

        const missingObjectStores = getMissingObjectStores(esDB);
        if (missingObjectStores.length) {
            // Close the connection, consumers already treat a missing config/index key as "not available".
            // Deleting the database here could cause a zombie database issue where in-memory or in-flight
            // operations would still be using the old, corrupted DB.
            esSentryReport('openESDB: corrupted schema detected', { missingObjectStores });
            esDB.close();
            return;
        }

        return esDB;
    } catch (error: any) {
        // Unlike the two checks above, openDB() itself throwing (blocked version-change,
        // native corruption, quota exceeded during upgrade, etc.) was previously swallowed
        // here with no report at all, making it invisible in both Sentry and the local logs.
        // These failure modes tend to be sticky, and openESDB() runs many times per indexing
        // batch, so reporting every occurrence to Sentry could flood it with hundreds of
        // identical events in a single bad session. The local log stays complete regardless;
        // Sentry gets at most one report per user for this session.
        if (reportedOpenDBFailures.has(userID)) {
            getESLogger().error('[EncryptedSearch] openESDB: openDB failed', error);
        } else {
            reportedOpenDBFailures.add(userID);
            esErrorReport('openESDB: openDB failed', { error });
        }
        if (esDB) {
            await cleanupESDB(esDB, userID);
        }
        return;
    }
};

/* eslint-disable @typescript-eslint/no-use-before-define -- mutually recursive IDB quota helpers */
/**
 * Update the estimated size by a given amount in the config object store,
 * but without opening a new instance of ESDB
 */
export async function updateSize(esDB: IDBPDatabase<EncryptedSearchDB>, sizeDelta: number) {
    if (sizeDelta === 0) {
        return;
    }

    const oldSize: number | undefined = await esDB.get('config', 'size');
    if (typeof oldSize === 'undefined') {
        return;
    }

    return writeConfigSize(esDB, oldSize + sizeDelta);
}

async function writeConfigSize(esDB: IDBPDatabase<EncryptedSearchDB>, size: number) {
    try {
        await esDB.put('config', size, 'size');
    } catch (error: any) {
        if (error.name === 'QuotaExceededError') {
            const oldestItemID = await getOldestID(esDB);
            if (!oldestItemID) {
                esSentryReport('writeConfigSize: quota reached with empty IDB', { error });
                throw error;
            }

            await deleteOldestItem(oldestItemID, esDB);

            return writeConfigSize(esDB, size);
        }

        esSentryReport('writeConfigSize: put failed', { error });
        throw error;
    }
}

async function deleteOldestItem(ID: string, esDB: IDBPDatabase<EncryptedSearchDB>) {
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
}
/* eslint-enable @typescript-eslint/no-use-before-define */

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

import { IDBPDatabase, StoreKey, StoreNames, StoreValue, deleteDB, openDB } from 'idb';

import { INDEXEDDB_VERSION, STORING_OUTCOME } from '../constants';
import { esSentryReport, isTimepointSmaller, removeESFlags } from '../esHelpers';
import { CachedItem, ESItemInfo, EncryptedSearchDB } from '../models';
import { getSortedInfo, removeOldestContent } from './content';

/**
 * Format the name of the ES database for the given user ID
 */
const getDBName = (userID: string) => `ES:${userID}:DB`;

/**
 * Delete the given user's IDB
 */
export const deleteESDB = async (userID: string) => deleteDB(getDBName(userID));

/**
 * Open an existing IDB for the given user. If the DB hadn't already existed,
 * undefined is returned instead. WARNING: this function will delete an old
 * version of IDB if it exists
 */
export const openESDB = async (userID: string) => {
    let esDB: IDBPDatabase<EncryptedSearchDB> | undefined;
    try {
        let dbExisted = true;
        esDB = await openDB<EncryptedSearchDB>(getDBName(userID), INDEXEDDB_VERSION, {
            upgrade() {
                dbExisted = false;
            },
        });
        if (!dbExisted) {
            esDB.close();
            // Flags are removed from local storage in case this code
            // is called due to an update from an outdated version of IDB
            removeESFlags(userID);
            await deleteESDB(userID);
            return;
        }
    } catch (error: any) {
        return;
    }
    return esDB;
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
export const createESDB = (userID: string) =>
    openDB<EncryptedSearchDB>(getDBName(userID), INDEXEDDB_VERSION, {
        upgrade: (esDB) => {
            // The object store containing the content of items, indexed by their ID
            esDB.createObjectStore('content');

            // The object store containing all metadata of items, indexed by their ID
            esDB.createObjectStore('metadata');

            // The config object store contains the encrypted index key, an estimate of the size
            // of the main object store and whether ES is enabled or not. Note that keys will be
            // 'indexKey', 'size' and 'enabled'
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

/**
 * Write to the ES IDB and manage the case of running out of disk space.
 * Under the assumption that metadata and any configuration will always
 * fit on disk, if we do run out of space we must remove oldest content
 * to make space
 */
export const safelyWriteToIDB = async <ESItemMetadata>(
    value: StoreValue<EncryptedSearchDB, StoreNames<EncryptedSearchDB>>,
    key: StoreKey<EncryptedSearchDB, StoreNames<EncryptedSearchDB>>,
    storeName: StoreNames<EncryptedSearchDB>,
    esDB: IDBPDatabase<EncryptedSearchDB>,
    esCache: Map<string, CachedItem<ESItemMetadata, unknown>>,
    getItemInfo: (item: ESItemMetadata) => ESItemInfo,
    inputSortedInfo?: ESItemInfo[],
    inputStoringOutcome?: STORING_OUTCOME
): Promise<STORING_OUTCOME> => {
    try {
        await esDB.put(storeName, value, key);
        return inputStoringOutcome || STORING_OUTCOME.SUCCESS;
    } catch (error: any) {
        if (error.name === 'QuotaExceededError') {
            // In case the data we're trying to store to IDB has absolute
            // precedence over content, we simply remove the oldest content
            // and retry, otherwise we check wheter the the present content
            // is newer than the oldest one
            if (storeName === 'content') {
                // Remove the oldest content and re-try adding this content, but only if
                // the content we're adding is more recent than the oldest indexed content
                let sortedInfo: ESItemInfo[] | undefined =
                    inputSortedInfo || (await getSortedInfo(esDB, esCache, getItemInfo));

                const itemMetadata = esCache.get(value.itemID)?.metadata;
                const itemTimepoint: [number, number] = !!itemMetadata ? getItemInfo(itemMetadata).timepoint : [0, 0];

                if (sortedInfo && isTimepointSmaller(sortedInfo[0].timepoint, itemTimepoint)) {
                    return STORING_OUTCOME.QUOTA;
                }

                sortedInfo = await removeOldestContent<ESItemMetadata>(esDB, esCache, getItemInfo, sortedInfo);
                return safelyWriteToIDB<ESItemMetadata>(
                    value,
                    key,
                    storeName,
                    esDB,
                    esCache,
                    getItemInfo,
                    sortedInfo,
                    STORING_OUTCOME.QUOTA
                );
            } else {
                const sortedInfo = await removeOldestContent(esDB, esCache, getItemInfo, inputSortedInfo);
                return safelyWriteToIDB<ESItemMetadata>(
                    value,
                    key,
                    storeName,
                    esDB,
                    esCache,
                    getItemInfo,
                    sortedInfo,
                    STORING_OUTCOME.QUOTA
                );
            }
        } else {
            // Any other error should be interpreted as a failure
            esSentryReport('safelyWriteToIDB: put failed', { error });
            throw error;
        }
    }
};

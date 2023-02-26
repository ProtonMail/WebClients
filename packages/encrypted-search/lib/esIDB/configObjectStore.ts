import { IDBPDatabase } from 'idb';

import noop from '@proton/utils/noop';

import { ConfigKeys, ConfigValues, EncryptedSearchDB, RetryObject } from '../models';
import { openESDB, safelyWriteToIDBAbsolutely } from './indexedDB';

/**
 * Initialize the config object store in IDB
 */
export const initializeConfig = async (userID: string, indexKey: string) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('config')) {
        return;
    }

    const tx = esDB.transaction('config', 'readwrite');
    void tx.store.put(indexKey, 'indexKey');
    void tx.store.put(0, 'size');
    void tx.store.put(false, 'enabled');
    void tx.store.put(false, 'limited');
    await tx.done;
    esDB.close();
};

/**
 * Read a row in the config object store
 */
const readConfigProperty = async (userID: string, configID: ConfigKeys) => {
    const esDB = await openESDB(userID);
    if (!esDB) {
        return;
    }

    const result = await esDB.get('config', configID);
    esDB.close();
    return result;
};

/**
 * Read from the config table whether IDB was migrated after the latest
 * version upgrade, in case it had been created before. If so, the migrated
 * row contains some product-specific information to perform the migration.
 * Note that if no such row exists, it means IDB was created after the
 * migration and is therefore considered already migrated
 */
export const readMigrated = async (userID: string) => readConfigProperty(userID, 'migrated');

/**
 * Read the index key from the config table
 */
export const readIndexKey = async (userID: string): Promise<string | undefined> =>
    readConfigProperty(userID, 'indexKey');

/**
 * Read the estimated size from the config table
 */
export const readSize = async (userID: string): Promise<number | undefined> => readConfigProperty(userID, 'size');

/**
 * Read whether ES in enabled from the config table
 */
export const readEnabled = async (userID: string): Promise<boolean | undefined> =>
    readConfigProperty(userID, 'enabled');

/**
 * Read from the config table whether there wasn't enough disk space
 */
export const readLimited = async (userID: string): Promise<boolean | undefined> =>
    readConfigProperty(userID, 'limited');

/**
 * Read from the config table which IDs to retry
 */
export const readRetries = async (userID: string): Promise<Map<string, RetryObject>> => {
    const retries = await readConfigProperty(userID, 'retries');
    if (typeof retries === 'string') {
        return new Map(JSON.parse(retries));
    }
    return new Map();
};

/**
 * Overwrites a row in the config object store
 */
const writeConfigProperty = async (userID: string, configID: ConfigKeys, value: ConfigValues[ConfigKeys]) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('config')) {
        return;
    }

    await safelyWriteToIDBAbsolutely(value, configID, 'config', esDB);

    esDB.close();
};

/**
 * Update the estimated size by a given amount in the config object store,
 * but without opening a new instance of ESDB
 */
export const updateSize = async (esDB: IDBPDatabase<EncryptedSearchDB>, sizeDelta: number) => {
    if (sizeDelta === 0) {
        return;
    }

    const oldSize: number | undefined = await esDB.get('config', 'size');
    if (typeof oldSize === 'undefined') {
        return;
    }

    return safelyWriteToIDBAbsolutely(oldSize + sizeDelta, 'size', 'config', esDB);
};

/**
 * Store whether IDB is limited in terms of number of content indexed
 */
export const setLimited = async (userID: string, isLimited: boolean) =>
    writeConfigProperty(userID, 'limited', isLimited).catch(noop);

/**
 * Switch value to the enabled property in the config object store
 */
export const toggleEnabled = async (userID: string) => {
    const oldEnabled = await readEnabled(userID);
    const newEnabled = !oldEnabled;
    return writeConfigProperty(userID, 'enabled', newEnabled).catch(noop);
};

/**
 * Remove the migrated row once migration is done
 */
export const setMigrated = async (userID: string) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('config')) {
        return;
    }

    await esDB.delete('config', 'migrated');
    esDB.close();
};

/**
 * Store IDs of items that failed to be fetched for later retry
 */
export const setRetries = async (userID: string, retries: Map<string, RetryObject> | [string, RetryObject][]) => {
    const arrayRetries = Array.from(retries);
    if (arrayRetries.length) {
        return writeConfigProperty(userID, 'retries', JSON.stringify(arrayRetries)).catch(noop);
    }

    const esDB = await openESDB(userID);
    if (!esDB) {
        return;
    }
    await esDB.delete('config', 'retries');
    esDB.close();
};

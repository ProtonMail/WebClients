import { CachedItem, ConfigKeys, ConfigValues, ESItemInfo } from '../models';
import { openESDB, safelyWriteToIDB } from './indexedDB';

/**
 * Initialize the config object store in IDB
 */
export const initializeConfig = async (userID: string, indexKey: string) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('config')) {
        throw new Error('ESDB not initialised');
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
export const readIndexKey = async (userID: string) => {
    const indexKey = await readConfigProperty(userID, 'indexKey');
    if (typeof indexKey === 'string') {
        return indexKey;
    }
    throw new Error('Index key type mismatch');
};

/**
 * Read the estimated size from the config table
 */
export const readSize = async (userID: string) => {
    const size = await readConfigProperty(userID, 'size');
    if (typeof size === 'number') {
        return size;
    }
    throw new Error('Size type mismatch');
};

/**
 * Read whether ES in enabled from the config table
 */
export const readEnabled = async (userID: string) => {
    const enabled = await readConfigProperty(userID, 'enabled');
    if (typeof enabled === 'boolean') {
        return enabled;
    }
    throw new Error('Enabled type mismatch');
};

/**
 * Read from the config table whether there wan't enough disk space for all content
 */
export const readLimited = async (userID: string) => {
    const limited = await readConfigProperty(userID, 'limited');
    if (typeof limited === 'boolean') {
        return limited;
    }
    throw new Error('Limited type mismatch');
};

/**
 * Overwrites a row in the config object store
 */
const writeConfigProperty = async <ESItemMetadata>(
    userID: string,
    configID: ConfigKeys,
    value: ConfigValues[ConfigKeys],
    esCache: Map<string, CachedItem<ESItemMetadata, unknown>>,
    getItemInfo: (item: ESItemMetadata) => ESItemInfo
) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('config')) {
        throw new Error('ESDB not initialised');
    }

    await safelyWriteToIDB<ESItemMetadata>(value, configID, 'config', esDB, esCache, getItemInfo);

    esDB.close();
};

/**
 * Update the estimated size by a given amount in the config object store
 */
export const updateSize = async <ESItemMetadata>(
    userID: string,
    sizeDelta: number,
    esCache: Map<string, CachedItem<ESItemMetadata, unknown>>,
    getItemInfo: (item: ESItemMetadata) => ESItemInfo
) => {
    if (sizeDelta === 0) {
        return;
    }

    const oldSize = await readSize(userID);
    const newSize = oldSize + sizeDelta;
    return writeConfigProperty<ESItemMetadata>(userID, 'size', newSize, esCache, getItemInfo);
};

/**
 * Store whether IDB is limited in terms of number of content indexed
 */
export const setLimited = async <ESItemMetadata>(
    userID: string,
    isLimited: boolean,
    esCache: Map<string, CachedItem<ESItemMetadata, unknown>>,
    getItemInfo: (item: ESItemMetadata) => ESItemInfo
) => writeConfigProperty<ESItemMetadata>(userID, 'limited', isLimited, esCache, getItemInfo);

/**
 * Switch value to the enabled property in the config object store
 */
export const toggleEnabled = async <ESItemMetadata>(
    userID: string,
    esCache: Map<string, CachedItem<ESItemMetadata, unknown>>,
    getItemInfo: (item: ESItemMetadata) => ESItemInfo
) => {
    const oldEnabled = await readEnabled(userID);
    const newEnabled = !oldEnabled;
    return writeConfigProperty<ESItemMetadata>(userID, 'enabled', newEnabled, esCache, getItemInfo);
};

/**
 * Remove the migrated row once migration is done
 */
export const setMigrated = async (userID: string) => {
    const esDB = await openESDB(userID);
    if (!esDB || !esDB.objectStoreNames.contains('config')) {
        throw new Error('ESDB not initialised');
    }

    await esDB.delete('config', 'migrated');
    esDB.close();
};

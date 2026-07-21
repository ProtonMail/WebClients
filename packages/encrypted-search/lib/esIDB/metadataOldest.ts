import type { IDBPDatabase } from 'idb';

import type { ESItemInfo, EncryptedSearchDB } from '../models';

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

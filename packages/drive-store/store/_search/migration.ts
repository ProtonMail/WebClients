/**
 * This file contains all the code necessary to handle migration from
 * the previous version of IndexedDB (version 1) to the new one (verson 2).
 * This will ensure that all existing indexing will be migrated to the
 * new format, hopefully without loss of data. Note that we have a neat
 * upper bound for when to remove the migration code, and that is three
 * weeks. All users who login before three weeks will have their IDB
 * migrated, while all those who don't would anyway receive a refresh
 * flag from the BE, thus once this migration code no longer exists
 * the checkVersionedESDB will remove the old index
 */
import type { IDBPTransaction } from 'idb';
import { openDB } from 'idb';

import type { PrivateKeyReference } from '@proton/crypto';
import { ES_MAX_ITEMS_PER_BATCH, INDEXING_STATUS, defaultESProgress } from '@proton/encrypted-search/constants';
import { decryptIndexKey, removeESFlags } from '@proton/encrypted-search/esHelpers';
import { getItem } from '@proton/shared/lib/helpers/storage';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';

/**
 * Interface of the old progress blob as we used to store in local
 * storage, which includes the possibility for totalMessages still
 * being there instead of totalItems
 */
/**
 * Helpers to read old ES blobs in localStorage
 */
const getESBlobs = (userID: string) => ({
    armoredIndexKey: getItem(`ES:${userID}:Key`),
    lastEventID: getItem(`ES:${userID}:Event`),
    progressBlob: JSON.parse(getItem(`ES:${userID}:BuildProgress`) || 'null'),
    size: parseInt(getItem(`ES:${userID}:SizeIDB`) || '0', 10) || 0,
    isPaused: getItem(`ES:${userID}:Pause`) === 'true',
    isEnabled: getItem(`ES:${userID}:ESEnabled`) === 'true',
});

const moveCiphertexts = async (tx: IDBPTransaction<unknown, string[], 'versionchange'>) => {
    const filesOS = tx.objectStore('files');
    const metadataOS = tx.objectStore('metadata');
    const count = await filesOS.count();

    let recoveryPoint: string | undefined;
    for (let batch = 0; batch < count; batch += ES_MAX_ITEMS_PER_BATCH) {
        const storedData = await filesOS.getAll(
            !!recoveryPoint ? IDBKeyRange.lowerBound(recoveryPoint, true) : undefined,
            ES_MAX_ITEMS_PER_BATCH
        );
        await Promise.all(
            storedData.map(({ aesGcmCiphertext, id, createTime, order }) =>
                metadataOS.put({ aesGcmCiphertext, timepoint: [createTime, order] }, id)
            )
        );
        recoveryPoint = storedData[storedData.length - 1].id;
    }
};

/**
 * There are three possible states of the old version of ES:
 *   1. ES was never activated. A reliable way for checking
 *      this is if the index key in local storage doesn't exist.
 *      In this case nothing should be done;
 *   2. ES was fully activated. A reliable way for checking
 *      this is if the index key exists in local storage and the
 *      progress blob doesn't, meaning that indexing completed.
 *      In this case we migrate old IDB and local storage to new
 *      IDB and then proceed with normal operations (i.e. catching
 *      up from last events);
 *   3. ES was indexing. In this case we just act as if the migration
 *      failed, since drive doesn't allow recovering indexing
 */
export const migrate = async (
    userID: string,
    userKeys: DecryptedKey<PrivateKeyReference>[],
    promiseShareID: Promise<string>
) => {
    const { armoredIndexKey, progressBlob, lastEventID, size, isEnabled } = getESBlobs(userID);

    // Case 1. ES was never activated
    if (!armoredIndexKey) {
        return true;
    }

    // We need the last event ID to be stored in the events
    // table to then sync IDB from that point
    if (!lastEventID) {
        return false;
    }

    // Retrieve the encrypted key, which is needed in both the next two
    // cases. If this operation fails, ES is in a corrupt state and
    // should be deactivated
    try {
        await decryptIndexKey(userKeys, armoredIndexKey);
    } catch (error: any) {
        return false;
    }

    const shareID = await promiseShareID;

    let success = true;
    await openDB(`ES:${userID}:DB`, 2, {
        upgrade: async (...args) => {
            const [newESDB, , , tx] = args;

            // Create the new object stores and fill them accordingly
            const configOS = newESDB.createObjectStore('config');
            await configOS.put(armoredIndexKey, 'indexKey');
            await configOS.put(size, 'size');
            await configOS.put(isEnabled, 'enabled');
            await configOS.put(false, 'limited');

            const eventsOS = newESDB.createObjectStore('events');
            await eventsOS.put(lastEventID, shareID);

            const indexingProgressOS = newESDB.createObjectStore('indexingProgress');
            if (!progressBlob) {
                // Case 2. ES was fully activated
                await indexingProgressOS.put(
                    {
                        ...defaultESProgress,
                        status: INDEXING_STATUS.ACTIVE,
                    },
                    'metadata'
                );
            } else {
                // Case 3. ES was indexing
                success = false;
                return;
            }

            // Create the metadata and content object stored and move all ciphertexts
            // from "files" into the former, such that "files" can be removed
            const metadataOS = newESDB.createObjectStore('metadata');
            metadataOS.createIndex('temporal', 'timepoint', { unique: true, multiEntry: false });
            newESDB.createObjectStore('content');
            await moveCiphertexts(tx);
            newESDB.deleteObjectStore('files');
        },
    });

    removeESFlags(userID);
    return success;
};

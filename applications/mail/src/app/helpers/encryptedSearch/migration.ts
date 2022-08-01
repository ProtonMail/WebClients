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
import { IDBPDatabase, IDBPTransaction, openDB } from 'idb';

import {
    CiphertextToStore,
    ES_MAX_ITEMS_PER_BATCH,
    EncryptedSearchDB,
    GetUserKeys,
    INDEXING_STATUS,
    TIMESTAMP_TYPE,
    decryptFromDB,
    defaultESProgress,
    encryptItem,
    getIndexKey,
    openESDB,
    readMetadataRecoveryPoint,
    readMigrated,
    removeESFlags,
    setMetadataActiveProgressStatus,
    setMetadataRecoveryPoint,
    setMigrated,
} from '@proton/encrypted-search';
import { getItem } from '@proton/shared/lib/helpers/storage';

import { MAIL_EVENTLOOP_NAME } from '../../constants';
import { ESBaseMessage, ESMessage } from '../../models/encryptedSearch';
import { getBaseMessage } from './esBuild';

/**
 * Interface of the old progress blob as we used to store in local
 * storage, which includes the possibility for totalMessages still
 * being there instead of totalItems
 */
interface OldESProgressBlob {
    totalItems: number;
    totalMessages?: number;
    numPauses: number;
    isRefreshed: boolean;
    timestamps: {
        type: 'start' | 'step' | 'stop';
        time: number;
    }[];
    originalEstimate: number;
}

/**
 * Helpers to read old ES blobs in localStorage
 */
const getESBlobs = (userID: string) => ({
    armoredIndexKey: getItem(`ES:${userID}:Key`),
    lastEventID: getItem(`ES:${userID}:Event`),
    progressBlob: JSON.parse(getItem(`ES:${userID}:BuildProgress`) || 'null') as OldESProgressBlob | null,
    size: parseInt(getItem(`ES:${userID}:SizeIDB`) || '0', 10) || 0,
    isPaused: getItem(`ES:${userID}:Pause`) === 'true',
    isEnabled: getItem(`ES:${userID}:ESEnabled`) === 'true',
});

/**
 * Metadata indexing routine to complete a metadata indexing
 */
const completeMetadataIndexing = async (
    esDB: IDBPDatabase<EncryptedSearchDB>,
    indexKey: CryptoKey,
    queryItemsMetadata: () => Promise<{
        resultMetadata?: ESBaseMessage[] | undefined;
        setRecoveryPoint?: (() => Promise<void>) | undefined;
    }>
) => {
    let { resultMetadata, setRecoveryPoint } = await queryItemsMetadata();
    if (!resultMetadata) {
        return false;
    }

    while (resultMetadata.length) {
        try {
            const ciphertexts: CiphertextToStore[] = await Promise.all(
                resultMetadata.map(async (metadata) => ({
                    itemID: metadata.ID,
                    aesGcmCiphertext: await encryptItem(metadata, indexKey),
                }))
            );

            const tx = esDB.transaction('metadata', 'readwrite');
            await Promise.all(
                ciphertexts.map((ciphertext) => tx.store.put(ciphertext.aesGcmCiphertext, ciphertext.itemID))
            );
            await tx.done;
        } catch (error: any) {
            return false;
        }

        if (setRecoveryPoint) {
            await setRecoveryPoint();
        }

        ({ resultMetadata, setRecoveryPoint } = await queryItemsMetadata());
        if (!resultMetadata) {
            return false;
        }
    }

    return true;
};

/**
 * Move ciphertexts from the messages table to the metadata one
 */
const moveCiphertexts = async (tx: IDBPTransaction<unknown, string[], 'versionchange'>) => {
    const messagesOS = tx.objectStore('messages');
    const metadataOS = tx.objectStore('metadata');
    const count = await messagesOS.count();

    let recoveryPoint: string | undefined;
    for (let batch = 0; batch < count; batch += ES_MAX_ITEMS_PER_BATCH) {
        const storedData = await messagesOS.getAll(
            !!recoveryPoint ? IDBKeyRange.lowerBound(recoveryPoint, true) : undefined,
            ES_MAX_ITEMS_PER_BATCH
        );
        await Promise.all(storedData.map(({ aesGcmCiphertext, ID }) => metadataOS.put(aesGcmCiphertext, ID)));
        recoveryPoint = storedData[storedData.length - 1].ID;
    }
};

/**
 * Conclude a potentially pending migration by splitting the full
 * ciphertexts that are now stored in the metadata table to the
 * two tables, metadata and content.
 */
export const finalizeMigration = async (
    userID: string,
    getUserKeys: GetUserKeys,
    queryItemsMetadata: () => Promise<{
        resultMetadata?: ESBaseMessage[] | undefined;
        setRecoveryPoint?: (() => Promise<void>) | undefined;
    }>
) => {
    const migrated = await readMigrated(userID);
    if (!migrated) {
        return true;
    }

    const indexKey = await getIndexKey(getUserKeys, userID);
    if (!indexKey) {
        return false;
    }

    const esDB = await openESDB(userID);
    if (!esDB) {
        return false;
    }

    // In case splitting metadata and content hasn't happened yet,
    // we perform it now. We check whether that's the case by
    // looking at the metadata recoverPoint point. If it's undefined,
    // splitting hasn't started yet. If it's a string, then it has
    // started and we should use that string as the ID of the message
    // from which to continue. Otherwise, the recoveryPoint actually
    // refers to metadata indexing itself, i.e. splitting had already
    // occured
    let splittingRP = await readMetadataRecoveryPoint(userID);
    if (typeof splittingRP === 'undefined' || typeof splittingRP === 'string') {
        let storedData = await esDB.getAll(
            'metadata',
            !!splittingRP ? IDBKeyRange.lowerBound(splittingRP, true) : undefined,
            ES_MAX_ITEMS_PER_BATCH
        );

        while (storedData.length) {
            const messages = await Promise.all(
                storedData.map(async (aesGcmCiphertext) => decryptFromDB<ESMessage>(aesGcmCiphertext, indexKey))
            );

            await Promise.all(
                messages.map((message) =>
                    Promise.all([
                        encryptItem(getBaseMessage(message), indexKey).then((metadata) =>
                            esDB.put('metadata', metadata, message.ID)
                        ),
                        typeof message.decryptedBody === 'string' || typeof message.decryptedSubject === 'string'
                            ? encryptItem(
                                  {
                                      decryptedBody: message.decryptedBody,
                                      decryptedSubject: message.decryptedSubject,
                                  },
                                  indexKey
                              ).then((content) => esDB.put('content', content, message.ID))
                            : undefined,
                    ])
                )
            );

            splittingRP = messages[messages.length - 1].ID;
            await setMetadataRecoveryPoint(userID, splittingRP);
            storedData = await esDB.getAll(
                'metadata',
                IDBKeyRange.lowerBound(splittingRP, true),
                ES_MAX_ITEMS_PER_BATCH
            );
        }
    }

    // Conclude metadata indexing if needed, then set content
    // indexing progress as appropriate
    const { progressBlob, isPaused } = getESBlobs(userID);

    if (!progressBlob) {
        // Case 2. ES was fully activated
        await setMetadataActiveProgressStatus(userID);
        await esDB.put(
            'indexingProgress',
            {
                ...defaultESProgress,
                status: INDEXING_STATUS.ACTIVE,
            },
            'content'
        );
    } else {
        // Case 3. ES was indexing

        // We need to complete metadata indexing first, which is considered part of the
        // migration, then leave a recoveryPoint for content indexing to resume from there.
        // The starting point of metadata indexing should be the recovery point in its
        // progress blob, if it's in the right format, or the one from the migrated row
        // of the config table
        let metadataRP = await readMetadataRecoveryPoint(userID);
        if (!metadataRP.End || !metadataRP.EndID) {
            // Read reacovery point from the config table
            const { ID, Time } = migrated;
            metadataRP = { End: Time, EndID: ID };
            await setMetadataRecoveryPoint(userID, metadataRP);
        }

        const success = await completeMetadataIndexing(esDB, indexKey, queryItemsMetadata);

        // Fetching metadata retries in case of a network error,
        // which means that if the above didn't succeed it must
        // be for a permanent error
        if (!success) {
            return false;
        }

        // Finally we set the metadata indexing as completed and the content
        // indexing where it left off in the old version
        await setMetadataActiveProgressStatus(userID);

        const {
            totalItems: oldTotalItems,
            totalMessages,
            numPauses,
            isRefreshed,
            timestamps: oldTimestamps,
            originalEstimate,
        } = progressBlob;

        const totalItems = totalMessages || oldTotalItems;
        const timestamps = oldTimestamps.map((oldTimestamp) => {
            const { type: oldType, time } = oldTimestamp;
            let type: TIMESTAMP_TYPE;
            switch (oldType) {
                case 'start':
                    type = TIMESTAMP_TYPE.START;
                    break;
                case 'step':
                    type = TIMESTAMP_TYPE.STEP;
                    break;
                case 'stop':
                    type = TIMESTAMP_TYPE.STOP;
                    break;
            }
            return { type, time };
        });

        const { Time, Order } = migrated;
        const contentRP = [Time, Order];

        await esDB.put(
            'indexingProgress',
            {
                totalItems,
                numPauses,
                isRefreshed,
                timestamps,
                originalEstimate,
                recoveryPoint: contentRP,
                status: isPaused ? INDEXING_STATUS.PAUSED : INDEXING_STATUS.INDEXING,
            },
            'content'
        );
    }

    await setMigrated(userID);
    removeESFlags(userID);

    esDB.close();

    return true;
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
 *   3. ES was indexing. This is the trickiest case because the old
 *      version of ES indexed metadata and content together, while
 *      now we rely on metadata already being there when indexing
 *      content. In this case we want to complete the indexing of
 *      metadata first but in such a way that previously indexed
 *      content stays there (therefore we cannot use the
 *      buildMetadataDB helper as that would overwrite existing items)
 *      and then set the status of content indexing where it was left
 *      off.
 * Note that both points 2. and 3. require to go through the existing
 * data in IDB (be it full or partial), decrypt it and split it in two
 * tables. This means that such an operation should be done irrespectively
 */
export const migrate = async (
    userID: string,
    getUserKeys: GetUserKeys,
    queryItemsMetadata: () => Promise<{
        resultMetadata?: ESBaseMessage[] | undefined;
        setRecoveryPoint?: (() => Promise<void>) | undefined;
    }>,
    getTotalItems: () => Promise<number>
) => {
    const { armoredIndexKey, lastEventID, size, isEnabled, progressBlob } = getESBlobs(userID);

    // Case 1. ES was never activated
    if (!armoredIndexKey) {
        return true;
    }

    // We need the last event ID to be stored in the events
    // table to then sync IDB from that point
    if (!lastEventID) {
        return false;
    }

    const totalItems = await getTotalItems();

    await openDB(`ES:${userID}:DB`, 2, {
        upgrade: async (...args) => {
            const [newESDB, , , tx] = args;

            // Create the new config object store and fill it accordingly
            const configOS = newESDB.createObjectStore('config');
            await configOS.put(armoredIndexKey, 'indexKey');
            await configOS.put(size, 'size');
            await configOS.put(isEnabled, 'enabled');
            // We need to store the oldest message indexed in case
            // indexing was in progress, in order to complete it
            const { ID, Time, Order } = (await tx.objectStore('messages').index('byTime').getAll(undefined, 1))[0];
            await configOS.put({ ID, Time, Order }, 'migrated');

            // We store whether the DB was limited
            let limited = false;
            if (!!progressBlob) {
                const count = await tx.objectStore('messages').count();
                limited = count < totalItems;
            }
            await configOS.put(limited, 'limited');

            // Create the new events object store and fill it accordingly
            const eventsOS = newESDB.createObjectStore('events');
            await eventsOS.put(lastEventID, MAIL_EVENTLOOP_NAME);

            // Create the new indexingProgress object store. We save a placeholder
            // value inside the "metadata" row of this table, since its recoveryPoint
            // will be used by this very same migration to split metadata and content
            // in two tables. The default value is undefined, which signals to the
            // rest of the migration code that the split has yet to happen
            const indexingProgressOS = newESDB.createObjectStore('indexingProgress');
            await indexingProgressOS.put(defaultESProgress, 'metadata');

            // Create the metadata and content object stored and move all ciphertexts
            // from "messages" into the former, such that "messages" can be removed
            newESDB.createObjectStore('metadata');
            newESDB.createObjectStore('content');
            await moveCiphertexts(tx);
            newESDB.deleteObjectStore('messages');
        },
    });

    return finalizeMigration(userID, getUserKeys, queryItemsMetadata);
};

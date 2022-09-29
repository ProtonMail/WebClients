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
    AesGcmCiphertext,
    CiphertextToStore,
    ES_MAX_ITEMS_PER_BATCH,
    EncryptedSearchDB,
    GetUserKeys,
    INDEXING_STATUS,
    TIMESTAMP_TYPE,
    decryptFromDB,
    defaultESProgress,
    encryptItem,
    esSentryReport,
    getIndexKey,
    openESDB,
    readMetadataRecoveryPoint,
    readMigrated,
    removeESFlags,
    setMetadataActiveProgressStatus,
    setMetadataRecoveryPoint,
    setMigrated,
    sizeOfESItem,
} from '@proton/encrypted-search';
import { queryMessageMetadata } from '@proton/shared/lib/api/messages';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import { getItem } from '@proton/shared/lib/helpers/storage';
import { Api } from '@proton/shared/lib/interfaces';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import isTruthy from '@proton/utils/isTruthy';

import { MAIL_EVENTLOOP_NAME } from '../../constants';
import { GetMessageKeys } from '../../hooks/message/useGetMessageKeys';
import { ESBaseMessage, ESMessage } from '../../models/encryptedSearch';
import { fetchMessage, getBaseMessage } from './esBuild';

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

const updateSize = async (sizeDelta: number, esDB: IDBPDatabase<EncryptedSearchDB>) => {
    const oldSize: number = await esDB.get('config', 'size');
    const newSize = oldSize + sizeDelta;
    return esDB.put('config', newSize, 'size');
};

const recoverIndex = async (
    indexKey: CryptoKey,
    esDB: IDBPDatabase<EncryptedSearchDB>,
    api: Api,
    getMessageKeys: GetMessageKeys,
    queryItemsMetadata: () => Promise<{
        resultMetadata?: ESBaseMessage[] | undefined;
        setRecoveryPoint?: ((setIDB?: boolean) => Promise<void>) | undefined;
    }>
) => {
    let { resultMetadata, setRecoveryPoint } = await queryItemsMetadata();
    if (!resultMetadata) {
        throw new Error('Metadata could not be fetched');
    }

    while (resultMetadata.length) {
        // We check whether a batch of messages' metadata is already
        // present in IDB one by one. If we find a missing one, metadata
        // are stored directly, while content is fetched later
        const contentToStore: string[] = (
            await Promise.all(
                resultMetadata.map(async (metadata) => {
                    if ((await esDB.count('metadata', metadata.ID)) === 0) {
                        await esDB.put('metadata', await encryptItem(metadata, indexKey), metadata.ID);
                        await updateSize(sizeOfESItem(metadata), esDB);
                        return metadata.ID;
                    }
                })
            )
        ).filter(isTruthy);

        if (contentToStore.length) {
            for (const messageID of contentToStore) {
                const itemToStore = await fetchMessage(messageID, api, getMessageKeys);
                if (!itemToStore) {
                    continue;
                }
                await esDB.put('content', await encryptItem(itemToStore, indexKey), messageID);
                await updateSize(sizeOfESItem(itemToStore), esDB);
            }
        }

        if (setRecoveryPoint) {
            await setRecoveryPoint(false);
        }

        ({ resultMetadata, setRecoveryPoint } = await queryItemsMetadata());
        if (!resultMetadata) {
            throw new Error('Metadata could not be fetched');
        }
    }
};

const checkIndexCorruption = async (userID: string, api: Api, esDB: IDBPDatabase<EncryptedSearchDB>) => {
    // In order to establish whether IDB is limited or not, we check
    // whether the oldest message in the mailbox is contained. This
    // is not definitive, as there is the chance that the mistakenly
    // missing message (in case of a corrupted IDB) is precisely that
    // one. This possibility seems remote enough
    const {
        Messages: [mailboxOldestMessage],
    } = await api<{ Messages: Message[] }>({
        ...queryMessageMetadata({
            PageSize: 1,
            Limit: 1,
            Location: MAILBOX_LABEL_IDS.ALL_MAIL,
            Sort: 'Time',
            Desc: 0,
        }),
    });

    const isDBLimited = !mailboxOldestMessage || (await esDB.count('metadata', mailboxOldestMessage.ID)) === 0;
    await esDB.put('config', isDBLimited, 'limited');

    // In order to establish whether IDB is corrupted or not, we check
    // whether the number of messages older than most recent message is
    // the same in IDB and in the mailbox. Note that if IDB is also
    // limited, we need to set a lower bound on the messages' age
    // in order to count consistently

    const {
        oldestMessage,
        mostRecentMessage: { ID: EndID, Time: End },
    } = await readMigrated(userID);

    const { Total } = await api<{ Total: number }>({
        ...queryMessageMetadata({
            Location: MAILBOX_LABEL_IDS.ALL_MAIL,
            End,
            EndID,
            Begin: isDBLimited ? oldestMessage.Time : undefined,
            BeginID: isDBLimited ? oldestMessage.ID : undefined,
        }),
    });

    // Note that Total excludes the EndID message, therefore
    // we add back 1
    return Total + 1 !== (await esDB.count('metadata'));
};

const completeMetadataIndexing = async (
    userID: string,
    indexKey: CryptoKey,
    esDB: IDBPDatabase<EncryptedSearchDB>,
    queryItemsMetadata: () => Promise<{
        resultMetadata?: ESBaseMessage[] | undefined;
        setRecoveryPoint?: ((setIDB?: boolean) => Promise<void>) | undefined;
    }>
) => {
    let { resultMetadata, setRecoveryPoint } = await queryItemsMetadata();
    if (!resultMetadata) {
        throw new Error('Metadata could not be fetched');
    }

    while (resultMetadata.length) {
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

        if (setRecoveryPoint) {
            await setRecoveryPoint();
        }

        ({ resultMetadata, setRecoveryPoint } = await queryItemsMetadata());
        if (!resultMetadata) {
            throw new Error('Metadata could not be fetched');
        }
    }

    // Finally we set the metadata indexing as completed and the content
    // indexing where it left off in the old version
    await setMetadataActiveProgressStatus(userID);

    const { progressBlob, isPaused } = getESBlobs(userID);

    // The progress blob must exist since the decision to continue
    // indexing was off it
    const {
        totalItems: oldTotalItems,
        totalMessages,
        numPauses,
        isRefreshed,
        timestamps: oldTimestamps,
        originalEstimate,
    } = progressBlob!;

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

    // The oldest message indexed is the one to resume from for content indexing
    const {
        oldestMessage: { Time, Order },
    } = await readMigrated(userID);
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
};

const checkPreviousIndexing = async (userID: string, esDB: IDBPDatabase<EncryptedSearchDB>) => {
    const { progressBlob } = getESBlobs(userID);

    if (!progressBlob) {
        // ES was fully activated
        await setMetadataActiveProgressStatus(userID);

        // We don't use the equivalent helper as that requires cache
        // for safe storing, which is not an issue at this point
        await esDB.put(
            'indexingProgress',
            {
                ...defaultESProgress,
                status: INDEXING_STATUS.ACTIVE,
            },
            'content'
        );

        return false;
    }

    // ES was indexing. We need to complete metadata indexing first, which is considered
    // part of the migration, then leave a recoveryPoint for content indexing to resume
    // from there. The starting point of metadata indexing should be the recovery point
    // in its progress row, if it's in the right format, or the one from the migrated
    // row of the config table
    const metadataRP = await readMetadataRecoveryPoint(userID);
    if (!metadataRP.End || !metadataRP.EndID) {
        // Read reacovery point from the config table
        const {
            oldestMessage: { ID, Time },
        } = await readMigrated(userID);
        await setMetadataRecoveryPoint(userID, { End: Time, EndID: ID });
    }

    return true;
};

const splitTables = async (indexKey: CryptoKey, esDB: IDBPDatabase<EncryptedSearchDB>) => {
    const maxConcurrent = navigator.hardwareConcurrency || 2;

    // In case splitting metadata and content hasn't happened yet,
    // we perform it now. We check whether that's the case by
    // looking at the metadata recoverPoint point. If it's undefined,
    // splitting hasn't started yet. If it's a string, then it has
    // started and we should use that string as the ID of the message
    // from which to continue. Otherwise, the recoveryPoint actually
    // refers to metadata indexing itself, i.e. splitting had already
    // occured
    const progress = await esDB.get('indexingProgress', 'metadata');
    if (!progress) {
        throw new Error('Metadata progress could not be fetched');
    }

    // In case the status is already ACTIVE, it means that tables have
    // already been split, and the migration has been triggered again for
    // another reason, e.g. a previously failed index recovery
    if (progress.status == INDEXING_STATUS.ACTIVE) {
        return;
    }

    let splittingRP = progress.recoveryPoint;

    if (typeof splittingRP === 'undefined' || typeof splittingRP === 'string') {
        let storedData = await esDB.getAll(
            'metadata',
            !!splittingRP ? IDBKeyRange.lowerBound(splittingRP, true) : undefined,
            ES_MAX_ITEMS_PER_BATCH
        );

        while (storedData.length) {
            const esIteratee = async (aesGcmCiphertext: AesGcmCiphertext) => {
                const message = await decryptFromDB<ESMessage>(aesGcmCiphertext, indexKey);

                const [metadata, content] = await Promise.all([
                    encryptItem(getBaseMessage(message), indexKey),
                    typeof message.decryptedBody === 'string' || typeof message.decryptedSubject === 'string'
                        ? encryptItem(
                              {
                                  decryptedBody: message.decryptedBody,
                                  decryptedSubject: message.decryptedSubject,
                              },
                              indexKey
                          )
                        : undefined,
                ]);

                return {
                    ID: message.ID,
                    metadata,
                    content,
                };
            };

            const encrypted = await runInQueue(
                storedData.map((aesGcmCiphertext) => () => esIteratee(aesGcmCiphertext)),
                maxConcurrent
            );

            const txContent = esDB.transaction('content', 'readwrite');
            const txMetadata = esDB.transaction('metadata', 'readwrite');

            encrypted.forEach(({ ID, metadata, content }) => {
                if (!!content) {
                    void txContent.store.put(content, ID);
                }
                void txMetadata.store.put(metadata, ID);
            });

            await txContent.done;
            await txMetadata.done;

            splittingRP = encrypted[encrypted.length - 1].ID;
            esDB.put('indexingProgress', { ...progress, recoveryPoint: splittingRP }, 'metadata');

            storedData = await esDB.getAll(
                'metadata',
                IDBKeyRange.lowerBound(splittingRP, true),
                ES_MAX_ITEMS_PER_BATCH
            );
        }
    }
};

const moveCiphertexts = async (tx: IDBPTransaction<unknown, string[], 'versionchange'>) => {
    const messagesOS = tx.objectStore('messages');
    const metadataOS = tx.objectStore('metadata');

    let storedData = await messagesOS.getAll(undefined, ES_MAX_ITEMS_PER_BATCH);

    while (storedData.length) {
        await Promise.all(storedData.map(({ aesGcmCiphertext, ID }) => metadataOS.put(aesGcmCiphertext, ID)));

        storedData = await messagesOS.getAll(
            IDBKeyRange.lowerBound(storedData[storedData.length - 1].ID, true),
            ES_MAX_ITEMS_PER_BATCH
        );
    }
};

const structuralMigration = async (userID: string) => {
    const { armoredIndexKey, lastEventID, size, isEnabled } = getESBlobs(userID);

    // We need the last event ID to be stored in the events
    // table to then sync IDB from that point
    if (!lastEventID) {
        throw new Error('Last event ID is not defined');
    }

    // Note that if a structural migration had already been performed
    // the version change callback is not invoked therefore its code
    // is not executed
    await openDB(`ES:${userID}:DB`, 2, {
        upgrade: async (...args) => {
            const [newESDB, , , tx] = args;

            // Create the new config object store and fill it accordingly
            const configOS = newESDB.createObjectStore('config');
            await configOS.put(armoredIndexKey, 'indexKey');
            await configOS.put(size, 'size');
            await configOS.put(isEnabled, 'enabled');
            await configOS.put(false, 'limited');

            // We store both the most recent and the oldest message since
            // both are needed at various steps of the migration
            const old = (await tx.objectStore('messages').index('byTime').openCursor(null, 'next'))?.value;
            const recent = (await tx.objectStore('messages').index('byTime').openCursor(null, 'prev'))?.value;
            await configOS.put(
                {
                    oldestMessage: { ID: old.ID, Time: old.Time, Order: old.Order },
                    mostRecentMessage: { ID: recent.ID, Time: recent.Time, Order: recent.Order },
                },
                'migrated'
            );

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

            // Create the metadata and content object stores
            newESDB.createObjectStore('content');
            newESDB.createObjectStore('metadata');
            await moveCiphertexts(tx);
            newESDB.deleteObjectStore('messages');
        },
    });
};

/**
 * MIGRATION STEPS:
 *   1. Check whether ES had ever been initialised.
 *   2. Perform the "structural" migration, i.e. inside the version change transaction.
 *     2a. Open IDB with the new version to trigger the version change.
 *     2b. Create and populate the "config", "events" and "indexingProgress" tables.
 *     2c. Extract oldest and newest messages from the "messages" table.
 *     2d. Create the "content" and "metadata" tables, move the content of the "message"
 *         table to "metadata" and remove it.
 *   3. Split old content into "metadata" and "content" tables.
 *   4. Check whether indexing was in progress prior to the migration and set the
 *      metadata recovery point accordingly.
 *   5. If it was, conclude metadata indexing, set flags for content indexing and exit.
 *   6. If it wasn't, check whether IDB was incomplete or corrupt.
 *   7. If IDB was corrupt, recover it.
 */
export const migrate = async (
    userID: string,
    api: Api,
    getUserKeys: GetUserKeys,
    getMessageKeys: GetMessageKeys,
    queryItemsMetadata: () => Promise<{
        resultMetadata?: ESBaseMessage[] | undefined;
        setRecoveryPoint?: ((setIDB?: boolean) => Promise<void>) | undefined;
    }>
) => {
    const { armoredIndexKey } = getESBlobs(userID);

    // STEP 1
    if (!armoredIndexKey) {
        // ES was never activated or it's already been migrated, since
        // in that case there would be no more blobs in LS
        return true;
    }

    // STEP 2
    await structuralMigration(userID);

    const indexKey = await getIndexKey(getUserKeys, userID);
    if (!indexKey) {
        return false;
    }

    const esDB = await openESDB(userID);
    if (!esDB) {
        throw new Error('ES IDB could not be opened');
    }

    // STEP 3
    await splitTables(indexKey, esDB);

    // STEP 4
    const shouldCompleteIndexing = await checkPreviousIndexing(userID, esDB);
    if (shouldCompleteIndexing) {
        // STEP 5
        await completeMetadataIndexing(userID, indexKey, esDB, queryItemsMetadata);
    } else {
        // STEP 6
        const shouldRecoverIndex = await checkIndexCorruption(userID, api, esDB);
        if (shouldRecoverIndex) {
            // STEP 7
            try {
                await recoverIndex(indexKey, esDB, api, getMessageKeys, queryItemsMetadata);
            } catch (error: any) {
                // Recovery is the only step which is allowed to fail without compromising
                // the migration. Since we don't remove flags in LS nor the "migrated" row
                // from the "config" table, migration will be retried but all previous
                // steps will account to nothing, therefore recovery will be retried.
                esSentryReport(`migration>recoverIndex: ${error.message}`, error);
                esDB.close();
                return true;
            }
        }
    }

    esDB.close();

    await setMigrated(userID);
    removeESFlags(userID);

    return true;
};

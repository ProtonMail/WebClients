import type { IDBPDatabase } from 'idb';

import { CryptoProxy } from '@proton/crypto';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import isTruthy from '@proton/utils/isTruthy';

import {
    AesKeyGenParams,
    ES_BACKGROUND_CONCURRENT,
    ES_MAX_CONCURRENT,
    ES_MAX_PARALLEL_ITEMS,
    INDEXING_STATUS,
    KeyUsages,
    STORING_OUTCOME,
    TIMESTAMP_TYPE,
    defaultESProgress,
} from '../constants';
import {
    contentIndexingProgress,
    createESDB,
    executeContentOperations,
    executeMetadataOperations,
    initializeConfig,
    metadataIndexingProgress,
    openESDB,
    readIndexKey,
    readLimited,
    readMetadataBatch,
    readSortedIDs,
    setLimited,
    wrappedGetOldestInfo,
    writeAllEvents,
} from '../esIDB';
import type {
    AesGcmCiphertext,
    ESCache,
    ESItemInfo,
    ESProgress,
    ESTimepoint,
    EncryptedItemWithInfo,
    EncryptedSearchDB,
    EventsObject,
    GetItemInfo,
    GetUserKeys,
    InternalESCallbacks,
} from '../models';
import { esErrorReport, esSentryReport } from './esAPI';
import { sizeOfESItem } from './esCache';
import { isObjectEmpty } from './esUtils';

/**
 * Execute the initial steps of a new metadata indexing, i.e. generating an index key and the DB itself
 */
export const initializeEncryptedSearch = async (
    userID: string,
    getUserKeys: GetUserKeys,
    previousEventIDs: EventsObject,
    isRefreshed: boolean,
    totalItems: number
) => {
    let esDB: IDBPDatabase<EncryptedSearchDB>;
    let indexKey: CryptoKey;
    try {
        esDB = await createESDB(userID);
        indexKey = await crypto.subtle.generateKey(AesKeyGenParams, true, KeyUsages);
    } catch (error: any) {
        // In case IndexedDB cannot be initialised, or something is wrong with the index key,
        // we still want to continue the indexing process without any permanent
        // storage but only keeping the cache in memory
        return { indexKey: undefined, esDB: undefined };
    }

    // The index key is encrypted using the primary user key, the resulting ciphertext
    // is kept in binary form since IndexedDB allows this format
    const userKeysList = await getUserKeys();
    const primaryUserKey = userKeysList[0];
    const keyToEncrypt = await crypto.subtle.exportKey('jwk', indexKey);
    const { message: encryptedKey } = await CryptoProxy.encryptMessage({
        textData: JSON.stringify(keyToEncrypt),
        encryptionKeys: [primaryUserKey.publicKey],
        signingKeys: [primaryUserKey.privateKey],
    });

    const initialProgress: ESProgress = {
        ...defaultESProgress,
        totalItems,
        isRefreshed,
        status: INDEXING_STATUS.INDEXING,
    };

    await initializeConfig(userID, encryptedKey);
    await writeAllEvents(userID, previousEventIDs);
    await metadataIndexingProgress.write(userID, initialProgress);

    return { indexKey, esDB };
};

/**
 * Decrypt the given encrypted index key.
 */
export const decryptIndexKey = async (getUserKeys: GetUserKeys, encryptedKey: string) => {
    const userKeysList = await getUserKeys();
    const decryptionResult = await CryptoProxy.decryptMessage({
        armoredMessage: encryptedKey,
        verificationKeys: userKeysList.map(({ publicKey }) => publicKey),
        decryptionKeys: userKeysList.map(({ privateKey }) => privateKey),
    });

    const { data: decryptedKey } = decryptionResult;

    const importedKey = await crypto.subtle.importKey(
        'jwk',
        JSON.parse(decryptedKey),
        { name: AesKeyGenParams.name },
        true,
        KeyUsages
    );

    if ((importedKey as CryptoKey).algorithm) {
        return importedKey;
    }

    throw new Error('Importing key failed');
};

/**
 * Retrieve and decrypt the index key. Return undefined if something goes wrong
 * or if there is no key.
 */
export const getIndexKey = async (getUserKeys: GetUserKeys, userID: string) => {
    try {
        const encrypted = await readIndexKey(userID);
        if (!encrypted) {
            throw new Error('Reading index key error');
        }
        return await decryptIndexKey(getUserKeys, encrypted);
    } catch (error: any) {
        esSentryReport('getIndexKey', { error });
    }
};

/**
 * Create the encrypted object to store in IndexedDB
 */
export const encryptItem = async (itemToStore: Object, indexKey: CryptoKey): Promise<AesGcmCiphertext> => {
    const itemToEncrypt = JSON.stringify(itemToStore);
    const textEncoder = new TextEncoder();

    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);

    const ciphertext = await crypto.subtle.encrypt(
        { iv, name: AesKeyGenParams.name },
        indexKey,
        textEncoder.encode(itemToEncrypt)
    );

    return { ciphertext, iv };
};

/**
 * Store one batch of items metadata to IndexedDB
 */
export const storeItemsMetadata = async <ESItemMetadata extends Object>(
    userID: string,
    resultMetadata: ESItemMetadata[],
    esSupported: boolean,
    indexKey: CryptoKey | undefined,
    getItemInfo: GetItemInfo<ESItemMetadata>,
    esCacheRef?: React.MutableRefObject<ESCache<ESItemMetadata, unknown>>
) => {
    const batchSize = resultMetadata.reduce((sum, item) => sum + sizeOfESItem(item), 0);

    // If either indexKey or esDB are undefined, we still want to index all metadata
    // and store them in cache only
    if (esSupported && indexKey) {
        const itemsToAdd: EncryptedItemWithInfo[] = await Promise.all(
            resultMetadata.map(async (itemToStore) => ({
                ID: getItemInfo(itemToStore).ID,
                timepoint: getItemInfo(itemToStore).timepoint,
                aesGcmCiphertext: await encryptItem(itemToStore, indexKey),
            }))
        );

        await executeMetadataOperations(userID, [], itemsToAdd);
    } else if (esCacheRef) {
        resultMetadata.forEach((metadataItem) => {
            esCacheRef.current.esCache.set(getItemInfo(metadataItem).ID, { metadata: metadataItem });
        });
        esCacheRef.current.cacheSize += batchSize;
    }

    return true;
};

/**
 * Start metadata indexing
 * @returns true when process is gracefully stopped (or paused)
 */
export const buildMetadataDB = async <ESItemMetadata extends Object>({
    userID,
    esSupported,
    indexKey,
    esCacheRef,
    queryItemsMetadata,
    getItemInfo,
    abortIndexingRef,
    recordProgress,
    isInitialIndexing = true,
    isBackgroundIndexing,
}: {
    userID: string;
    esSupported: boolean;
    indexKey: CryptoKey | undefined;
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, unknown>>;
    queryItemsMetadata: InternalESCallbacks<ESItemMetadata, unknown>['queryItemsMetadata'];
    getItemInfo: GetItemInfo<ESItemMetadata>;
    abortIndexingRef: React.MutableRefObject<AbortController>;
    recordProgress: () => Promise<void>;
    isInitialIndexing?: boolean;
    isBackgroundIndexing?: boolean;
}) => {
    if (isInitialIndexing) {
        await metadataIndexingProgress.addTimestamp(userID, TIMESTAMP_TYPE.START);
    }
    let { resultMetadata, setRecoveryPoint } = await queryItemsMetadata(
        abortIndexingRef.current.signal,
        isBackgroundIndexing
    );

    // If it's undefined, it means an error occurred
    if (!resultMetadata) {
        return false;
    }

    while (resultMetadata.length) {
        const success = await storeItemsMetadata<ESItemMetadata>(
            userID,
            resultMetadata,
            esSupported,
            indexKey,
            getItemInfo,
            esCacheRef
        ).catch((error: any) => {
            if (
                !(error.message && error.message === 'Operation aborted') &&
                !(error.name && error.name === 'AbortError')
            ) {
                esSentryReport('storeItemsBatches: storeItems', { error });
            }

            return false;
        });

        if (!success) {
            return false;
        }

        await recordProgress();

        if (setRecoveryPoint) {
            await setRecoveryPoint();
        }

        /**
         * If process gets aborted, we shut it down right before next fetch batch
         */
        if (abortIndexingRef.current.signal.aborted) {
            return true;
        }

        ({ resultMetadata, setRecoveryPoint } = await queryItemsMetadata(
            abortIndexingRef.current.signal,
            isBackgroundIndexing
        ));

        if (!resultMetadata) {
            return false;
        }
    }

    if (!esSupported) {
        esCacheRef.current.isCacheReady = true;
    }

    return true;
};

/**
 * Add content to an existing metadata DB
 */
export const buildContentDB = async <ESItemContent>(
    userID: string,
    indexKey: CryptoKey,
    abortIndexingRef: React.MutableRefObject<AbortController>,
    recordProgress: (progress: number) => void,
    fetchESItemContent: Required<InternalESCallbacks<unknown, unknown, ESItemContent>>['fetchESItemContent'],
    inputrecoveryPoint: ESTimepoint | undefined,
    isInitialIndexing: boolean = true,
    isBackgroundIndexing?: boolean
): Promise<STORING_OUTCOME> => {
    let counter = 0;

    if (isInitialIndexing) {
        await contentIndexingProgress.addTimestamp(userID, TIMESTAMP_TYPE.START);
    }

    let abortFetching = new AbortController();

    const esIteratee = async (
        ID: string,
        timepoint: ESTimepoint
    ): Promise<{
        ID: string;
        timepoint: ESTimepoint;
        aesGcmCiphertext?: AesGcmCiphertext;
    }> => {
        // In case any other parallel executions of this function fails, abortFetching
        // is triggered such that all others stop as well
        if (abortIndexingRef.current.signal.aborted || abortFetching.signal.aborted) {
            throw new Error('Operation aborted');
        }

        try {
            const result = await fetchESItemContent(ID, abortIndexingRef.current.signal);
            if (!result) {
                esSentryReport('Item fetch failed', { ID, timepoint });
                throw new Error('Item fetching failed');
            }

            const { content: itemToStore, error } = result;
            if (error) {
                // Check if this is a NOT_FOUND (2501) error, which is expected when messages are deleted/inaccessible
                if (error.data?.Code === API_CUSTOM_ERROR_CODES.NOT_FOUND) {
                    // Just skip it without reporting to Sentry since this is expected
                    recordProgress(++counter);
                    return { ID, timepoint };
                }
                // Other errors should still be reported
                esSentryReport('Item fetch failed', { ID, timepoint, error });
                throw error;
            }

            if (!itemToStore || isObjectEmpty(itemToStore)) {
                esSentryReport('Empty item fetched', { ID, timepoint });
                // If decryption fails, we want to anyway count the item
                recordProgress(++counter);
                return { ID, timepoint };
            }

            const aesGcmCiphertext = await encryptItem(itemToStore, indexKey);
            recordProgress(++counter);
            return { ID, timepoint, aesGcmCiphertext };
        } catch (error) {
            esErrorReport('Item processing error', {
                error,
                counter,
            });
            throw error;
        }
    };

    let indexingOutcome = STORING_OUTCOME.SUCCESS;

    let sortedIDs = await readSortedIDs(userID, true, inputrecoveryPoint);
    if (!sortedIDs) {
        throw new Error('IDB caching cannot read sorted IDs');
    }

    /**
     * If we are recovering, e.g. after a password reset, we don't
     * want to re-index content items that are already present in IDB
     *
     * TODO: improve decryption error correction to handle cases like:
     *  - user refreshes browser during correction (remaining undecrypted item won't be processed)
     */
    if (!isInitialIndexing) {
        const esDB = await openESDB(userID);
        if (!esDB) {
            throw new Error('ESDB not available during content indexing');
        }

        const maybeSortedIDsWithoutContent = await Promise.all(
            sortedIDs.map(async (ID) => ((await esDB.count('content', ID)) === 1 ? undefined : ID))
        );

        sortedIDs = maybeSortedIDsWithoutContent.filter(isTruthy);
        esDB.close();
    }

    let recoveryPoint: ESItemInfo | undefined;
    let IDs = sortedIDs.slice(0, ES_MAX_PARALLEL_ITEMS);

    while (IDs.length) {
        if (abortIndexingRef.current.signal.aborted) {
            return STORING_OUTCOME.FAILURE;
        }

        const infoMap = new Map(
            await readMetadataBatch(userID, IDs).then((encryptedMetadata) => {
                if (!encryptedMetadata) {
                    return;
                }
                return encryptedMetadata
                    .map((metadata): [string, ESTimepoint] | undefined =>
                        !!metadata ? [metadata.ID, metadata.timepoint] : undefined
                    )
                    .filter(isTruthy);
            })
        );

        if (infoMap.size !== IDs.length) {
            throw new Error('Metadata not available to index content');
        }

        // In case any of the parallel execution fails, we want all other to stop but still
        // retain the outcome of those which had succeeded in order to index at least those and
        // to set the recovery point accordingly
        let fetchingFailure = false;
        const maxProcessing = isBackgroundIndexing ? ES_BACKGROUND_CONCURRENT : ES_MAX_CONCURRENT;
        const encryptedContent = await runInQueue(
            IDs.map(
                // eslint-disable-next-line @typescript-eslint/no-loop-func
                (ID) => () =>
                    esIteratee(ID, infoMap.get(ID)!).catch(() => {
                        fetchingFailure = true;
                        abortFetching.abort();
                    })
            ),
            maxProcessing
        );

        // Later fetches can finish later than earlier ones. To be on the safe side we consider as
        // valid anything before the first undefined is found, but only in case of a failure (because
        // legitimate undefined can exist)
        const firstUndefined = fetchingFailure ? encryptedContent.indexOf(undefined) : -1;
        const itemsToAdd = (
            firstUndefined === -1 ? encryptedContent : encryptedContent.slice(0, firstUndefined)
        ).filter(isTruthy);

        if (itemsToAdd.length) {
            const last = itemsToAdd[itemsToAdd.length - 1];
            recoveryPoint = { ID: last.ID, timepoint: last.timepoint };

            const storingOutcome = await executeContentOperations(
                userID,
                [],
                itemsToAdd.filter((item): item is EncryptedItemWithInfo => !!item.aesGcmCiphertext)
            );

            if (storingOutcome === STORING_OUTCOME.SUCCESS) {
                // In case the batch was successfully stored, we keep on with the following batch
                if (isInitialIndexing) {
                    await contentIndexingProgress.setRecoveryPoint(userID, recoveryPoint.timepoint);
                }
            } else if (storingOutcome === STORING_OUTCOME.QUOTA) {
                // If we have reached the quota, we need to stop indexing
                esErrorReport('Storage quota reached', {
                    totalProcessed: counter,
                    batchSize: itemsToAdd.length,
                });
                indexingOutcome = STORING_OUTCOME.QUOTA;
                break;
            }
        }

        if (abortIndexingRef.current.signal.aborted) {
            return STORING_OUTCOME.FAILURE;
        }

        abortFetching = new AbortController();
        if (isInitialIndexing) {
            await contentIndexingProgress.addTimestamp(userID);
        }

        const index = !!recoveryPoint ? sortedIDs.indexOf(recoveryPoint.ID) + 1 : 0;
        IDs = sortedIDs.slice(index, index + ES_MAX_PARALLEL_ITEMS);
    }

    return indexingOutcome;
};

/**
 * In case IDB is limited, trigger a new content indexing by using
 * the oldest indexed content as recovery point. This is done in case
 * items are removed after a syncing operation, therefore we might have
 * some space left to index more content
 */
export const retryContentIndexing = async <ESItemMetadata, ESSearchParameters, ESItemContent>(
    userID: string,
    indexKey: CryptoKey,
    esCallbacks: InternalESCallbacks<ESItemMetadata, ESSearchParameters, ESItemContent>,
    abortIndexingRef: React.MutableRefObject<AbortController>
) => {
    const isDBLimited = await readLimited(userID);
    if (!isDBLimited) {
        return;
    }

    const itemInfo = await wrappedGetOldestInfo(userID);
    if (!itemInfo) {
        return;
    }

    const { fetchESItemContent } = esCallbacks;
    if (!fetchESItemContent) {
        return;
    }

    const storingOutcome = await buildContentDB<ESItemContent>(
        userID,
        indexKey,
        abortIndexingRef,
        () => {},
        fetchESItemContent,
        itemInfo.timepoint,
        false
    );

    // In case we have recovered, we set the flag accordingly
    if (storingOutcome === STORING_OUTCOME.SUCCESS) {
        await setLimited(userID, false);
    }
};

/**
 * Compute the total indexing time based on locally cached timestamps
 */
export const estimateIndexingDuration = (
    timestamps: {
        type: TIMESTAMP_TYPE;
        time: number;
    }[]
) => {
    let indexTime = 0;
    let totalInterruptions = 0;

    for (let index = 0; index < timestamps.length - 1; index++) {
        const [timestamp1, timestamp2] = timestamps.slice(index, index + 2);

        if (timestamp1.type !== TIMESTAMP_TYPE.STOP && timestamp2.type !== TIMESTAMP_TYPE.START) {
            indexTime += timestamp2.time - timestamp1.time;
        } else if (timestamp1.type !== TIMESTAMP_TYPE.STOP || timestamp2.type !== TIMESTAMP_TYPE.STOP) {
            totalInterruptions++;
        }
    }

    return { indexTime, totalInterruptions };
};

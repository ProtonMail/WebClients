import { IDBPDatabase } from 'idb';

import { CryptoProxy } from '@proton/crypto';
import { MINUTE, SECOND } from '@proton/shared/lib/constants';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import isTruthy from '@proton/utils/isTruthy';

import {
    AesKeyGenParams,
    ES_MAX_CACHE,
    ES_MAX_CONCURRENT,
    ES_MAX_PARALLEL_ITEMS,
    INDEXING_STATUS,
    KeyUsages,
    STORING_OUTCOME,
    TIMESTAMP_TYPE,
    defaultESProgress,
} from '../constants';
import {
    addTimestamp,
    createESDB,
    getSortedInfo,
    initializeConfig,
    openESDB,
    readIndexKey,
    readLimited,
    setContentRecoveryPoint,
    setLimited,
    setOriginalEstimate,
    updateSize,
    writeAllEvents,
    writeContentItems,
    writeMetadata,
    writeMetadataProgress,
} from '../esIDB';
import {
    AesGcmCiphertext,
    CiphertextToStore,
    ESCache,
    ESIndexingState,
    ESProgress,
    EncryptedSearchDB,
    EventsObject,
    GetItemInfo,
    GetUserKeys,
    InternalESHelpers,
} from '../models';
import { esSentryReport } from './esAPI';
import { extractBatch, reorderCache, sizeOfESItem } from './esCache';

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
    await writeMetadataProgress(userID, initialProgress);

    return { indexKey, esDB };
};

/**
 * Decrypt the given encrypted index key.
 */
export const decryptIndexKey = async (getUserKeys: GetUserKeys, encryptedKey: string) => {
    const userKeysList = await getUserKeys();
    const primaryUserKey = userKeysList[0];
    const decryptionResult = await CryptoProxy.decryptMessage({
        armoredMessage: encryptedKey,
        verificationKeys: [primaryUserKey.publicKey],
        decryptionKeys: [primaryUserKey.privateKey],
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
const storeItemsMetadata = async <ESItemMetadata>(
    userID: string,
    resultMetadata: ESItemMetadata[],
    esDB: IDBPDatabase<EncryptedSearchDB> | undefined,
    indexKey: CryptoKey | undefined,
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, unknown>>,
    getItemInfo: GetItemInfo<ESItemMetadata>
) => {
    const batchSize = resultMetadata.reduce((sum, item) => sum + sizeOfESItem(item), 0);

    // If either indexKey or esDB are undefined, we still want to index all metadata
    // and store them in cache only
    if (esDB && indexKey) {
        const itemsToAdd: CiphertextToStore[] = await Promise.all(
            resultMetadata.map(async (itemToStore) => ({
                itemID: getItemInfo(itemToStore).ID,
                aesGcmCiphertext: await encryptItem(itemToStore, indexKey),
            }))
        );

        await writeMetadata(esDB, itemsToAdd);
        await updateSize<ESItemMetadata>(userID, batchSize, esCacheRef.current.esCache, getItemInfo);
    }

    resultMetadata.forEach((metadataItem) => {
        esCacheRef.current.esCache.set(getItemInfo(metadataItem).ID, { metadata: metadataItem });
    });
    esCacheRef.current.cacheSize += batchSize;

    return true;
};

/**
 * Start metadata indexing
 */
export const buildMetadataDB = async <ESItemMetadata>(
    userID: string,
    esDB: IDBPDatabase<EncryptedSearchDB> | undefined,
    indexKey: CryptoKey | undefined,
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, unknown>>,
    queryItemsMetadata: (signal: AbortSignal) => Promise<{
        resultMetadata?: ESItemMetadata[];
        setRecoveryPoint?: () => Promise<void>;
    }>,
    getItemInfo: GetItemInfo<ESItemMetadata>,
    abortIndexingRef: React.MutableRefObject<AbortController>,
    recordProgress: (progress: number) => void
) => {
    let { resultMetadata, setRecoveryPoint } = await queryItemsMetadata(abortIndexingRef.current.signal);

    // If it's undefined, it means an error occured
    if (!resultMetadata) {
        return false;
    }

    let batchSize = 0;
    while (resultMetadata.length) {
        const success = await storeItemsMetadata<ESItemMetadata>(
            userID,
            resultMetadata,
            esDB,
            indexKey,
            esCacheRef,
            getItemInfo
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

        if (setRecoveryPoint) {
            await setRecoveryPoint();
        }

        batchSize += resultMetadata.length;
        recordProgress(batchSize);

        ({ resultMetadata, setRecoveryPoint } = await queryItemsMetadata(abortIndexingRef.current.signal));
        if (!resultMetadata) {
            return false;
        }
    }

    esDB?.close();
    esCacheRef.current.isCacheReady = true;

    // Since we cache metadata while indexing them, and indexing proceeds in
    // reverse chronological order, we need to reorder the cache at the end
    // of metadata indexing to make sure it is in chronological order
    reorderCache(esCacheRef, getItemInfo);

    return true;
};

/**
 * Add content to an existing metadata DB
 */
export const buildContentDB = async <ESItemMetadata, ESSearchParameters, ESItemContent>(
    userID: string,
    indexKey: CryptoKey,
    abortIndexingRef: React.MutableRefObject<AbortController>,
    recordProgress: (progress: number) => void,
    esHelpers: InternalESHelpers<ESItemMetadata, ESSearchParameters, ESItemContent>,
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, unknown>>,
    inputrecoveryPoint: [number, number] | undefined,
    cacheWhileIndexing: boolean = true,
    batchLimit: number = ES_MAX_PARALLEL_ITEMS
): Promise<STORING_OUTCOME> => {
    const { getItemInfo, fetchESItem } = esHelpers;
    let batchSize = 0;
    let counter = 0;
    let limitedCache = false;

    if (!fetchESItem) {
        throw new Error('Cannot index content without fetching helper');
    }

    await addTimestamp<ESItemMetadata>(userID, esCacheRef.current.esCache, getItemInfo, TIMESTAMP_TYPE.START);

    let abortFetching = new AbortController();

    const esIteratee = async (itemID: string, itemMetadata: ESItemMetadata) => {
        // In case any other parallel executions of this function fails, abortFetching
        // is triggered such that all others stop as well
        if (abortIndexingRef.current.signal.aborted || abortFetching.signal.aborted) {
            throw new Error('Operation aborted');
        }

        const itemToStore = await fetchESItem(itemID, abortIndexingRef.current.signal, esCacheRef);

        let aesGcmCiphertext: AesGcmCiphertext | undefined;
        if (itemToStore) {
            const size = sizeOfESItem(itemToStore);
            batchSize += size;

            if (cacheWhileIndexing) {
                if (esCacheRef.current.cacheSize < ES_MAX_CACHE) {
                    esCacheRef.current.esCache.set(itemID, {
                        metadata: itemMetadata,
                        content: itemToStore,
                    });
                    esCacheRef.current.cacheSize += size;
                } else {
                    // In case the limit is reached, the content is not added, the metadata is already
                    // present, therefore we simply flag that the content in cache is limited
                    limitedCache = true;
                }
            }

            aesGcmCiphertext = await encryptItem(itemToStore, indexKey);
        }

        recordProgress(++counter);

        return { itemID, aesGcmCiphertext, itemMetadata };
    };

    let indexingOutcome = STORING_OUTCOME.SUCCESS;
    let recoveryPoint = inputrecoveryPoint;
    while (true) {
        const storedData = extractBatch<ESItemMetadata>(esCacheRef, getItemInfo, recoveryPoint, batchLimit);
        if (!storedData.length) {
            break;
        }

        if (abortIndexingRef.current.signal.aborted) {
            return STORING_OUTCOME.FAILURE;
        }

        // In case any of the parallel execution fails, we want all other to stop but still
        // retain the outcome of those which had succeeded in order to index at least those and
        // to set the recovery point accordingly
        const encryptedContent = await runInQueue(
            storedData.map(
                // eslint-disable-next-line @typescript-eslint/no-loop-func
                ([itemID, { metadata }]) =>
                    () =>
                        esIteratee(itemID, metadata).catch(() => {
                            abortFetching.abort();
                        })
            ),
            ES_MAX_CONCURRENT
        );

        // Later fetches can finish later than earlier ones. To be on the safe side we consider as
        // valid anything before the first undefined is found
        const firstUndefined = encryptedContent.indexOf(undefined);
        const itemsToAdd = (
            firstUndefined === -1 ? encryptedContent : encryptedContent.slice(0, firstUndefined)
        ).filter(isTruthy);

        if (itemsToAdd.length) {
            ({ timepoint: recoveryPoint } = getItemInfo(itemsToAdd[itemsToAdd.length - 1].itemMetadata));

            const storingOutcome = await writeContentItems<ESItemMetadata>(
                userID,
                itemsToAdd
                    .map((item) => {
                        if (!!item.aesGcmCiphertext) {
                            return { itemID: item.itemID, aesGcmCiphertext: item.aesGcmCiphertext };
                        }
                    })
                    .filter(isTruthy),
                esCacheRef.current.esCache,
                getItemInfo,
                abortIndexingRef
            );

            if (storingOutcome === STORING_OUTCOME.SUCCESS) {
                // In case the batch was successfully stored, we keep on with the following batch
                await setContentRecoveryPoint<ESItemMetadata>(
                    userID,
                    recoveryPoint,
                    esCacheRef.current.esCache,
                    getItemInfo
                );
                await updateSize<ESItemMetadata>(userID, batchSize, esCacheRef.current.esCache, getItemInfo);
            } else if (storingOutcome === STORING_OUTCOME.QUOTA) {
                // If we have reached the quota, we need to stop indexing. Note that
                // in this case the cache might well be not limited, i.e. it contains
                // all content of the limited index
                indexingOutcome = STORING_OUTCOME.QUOTA;
                break;
            }
            // In case the storage fails, the loop will repeat with the previous recovery point

            // Reset for next batch
            batchSize = 0;
        }

        abortFetching = new AbortController();
        await addTimestamp<ESItemMetadata>(userID, esCacheRef.current.esCache, getItemInfo);
    }

    if (cacheWhileIndexing) {
        esCacheRef.current.isCacheLimited = limitedCache;
        esCacheRef.current.isContentCached = true;
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
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, unknown>>,
    esHelpers: InternalESHelpers<ESItemMetadata, ESSearchParameters, ESItemContent>,
    abortIndexingRef: React.MutableRefObject<AbortController>
) => {
    const isDBLimited = await readLimited(userID);
    if (!isDBLimited) {
        return;
    }

    const { getItemInfo } = esHelpers;

    const esDB = await openESDB(userID);
    if (!esDB) {
        return;
    }

    const item = (await getSortedInfo(esDB, esCacheRef.current.esCache, getItemInfo)).shift();
    esDB.close();
    if (!item) {
        return;
    }

    const storingOutcome = await buildContentDB<ESItemMetadata, ESSearchParameters, ESItemContent>(
        userID,
        indexKey,
        abortIndexingRef,
        () => {},
        esHelpers,
        esCacheRef,
        item.timepoint,
        esCacheRef.current.isContentCached,
        10
    );

    // In case we have recovered, we set the flag accordingly
    if (storingOutcome === STORING_OUTCOME.SUCCESS) {
        await setLimited<ESItemMetadata>(userID, false, esCacheRef.current.esCache, getItemInfo);
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

/**
 * Compute the estimated time remaining of indexing
 * @param userID the user ID
 * @param esProgress the number of items processes so far
 * @param esTotal the total number of items to be indexed
 * @param endTime the time when this helper is called
 * @param esState the indexing state, which is a data structure to keep track of
 * indexing progress
 * @returns the number of estimated time to completion and the current progress
 * expressed as a number between 0 and 100
 */
export const estimateIndexingProgress = async (
    userID: string,
    esProgress: number,
    esTotal: number,
    endTime: number,
    esState: ESIndexingState,
    setEstimate: boolean = true
) => {
    let estimatedMinutes = 0;
    let currentProgressValue = 0;

    if (esTotal !== 0 && endTime !== esState.startTime && esProgress !== esState.esPrevProgress) {
        const remainingItems = esTotal - esProgress;

        if (setEstimate) {
            await setOriginalEstimate(
                userID,
                Math.floor(
                    (((endTime - esState.startTime) / (esProgress - esState.esPrevProgress)) * remainingItems) / SECOND
                )
            );
        }

        estimatedMinutes = Math.ceil(
            (((endTime - esState.startTime) / (esProgress - esState.esPrevProgress)) * remainingItems) / MINUTE
        );
        currentProgressValue = Math.ceil((esProgress / esTotal) * 100);
    }

    return { estimatedMinutes, currentProgressValue };
};

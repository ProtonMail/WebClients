import { IDBPDatabase } from 'idb';

import { CryptoProxy } from '@proton/crypto';
import { MINUTE, SECOND } from '@proton/shared/lib/constants';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';

import { AesKeyGenParams, ES_MAX_CONCURRENT, KeyUsages } from '../constants';
import { AesGcmCiphertext, ESIndexingHelpers, ESIndexingState, GetUserKeys } from '../models';
import { esSentryReport } from './esAPI';
import { sizeOfESItem } from './esCache';
import {
    addESTimestamp,
    createESDB,
    deleteESDB,
    getES,
    getOldestItem,
    openESDB,
    removeES,
    setES,
    setOriginalEstimate,
    updateSizeIDB,
} from './esUtils';

/**
 * Decrypt the given armored index key.
 */
export const decryptIndexKey = async (getUserKeys: GetUserKeys, armoredKey: string) => {
    const userKeysList = await getUserKeys();
    const primaryUserKey = userKeysList[0];
    const decryptionResult = await CryptoProxy.decryptMessage({
        armoredMessage: armoredKey,
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
 * Retrieve and decrypt the index key from localStorage. Return undefined if something goes wrong
 * or if there is no key in local storage.
 */
export const getIndexKey = async (getUserKeys: GetUserKeys, userID: string) => {
    try {
        const armoredKey = getES.Key(userID);
        if (!armoredKey) {
            return;
        }

        return await decryptIndexKey(getUserKeys, armoredKey);
    } catch (error: any) {
        esSentryReport('getIndexKey', { error });
    }
};

/**
 * Create the encrypted object to store in IndexedDB
 */
export const encryptToDB = async <ESItem, ESCiphertext>(
    itemToStore: ESItem,
    indexKey: CryptoKey,
    prepareCiphertext: (itemToStore: ESItem, aesGcmCiphertext: AesGcmCiphertext) => ESCiphertext
) => {
    const itemToEncrypt = JSON.stringify(itemToStore);
    const textEncoder = new TextEncoder();

    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);

    const ciphertext = await crypto.subtle.encrypt(
        { iv, name: AesKeyGenParams.name },
        indexKey,
        textEncoder.encode(itemToEncrypt)
    );

    return prepareCiphertext(itemToStore, { ciphertext, iv });
};

/**
 * Store one batch of items to IndexedDB
 */
const storeItems = async <ESItemMetadata, ESItem, ESCiphertext>(
    resultMetadata: ESItemMetadata[],
    esDB: IDBPDatabase,
    indexKey: CryptoKey,
    abortIndexingRef: React.MutableRefObject<AbortController>,
    storeName: string,
    recordLocalProgress: (localProgress: number) => void,
    esIndexingHelpers: ESIndexingHelpers<ESItemMetadata, ESItem, ESCiphertext>
): Promise<{ lastStoredItem: ESCiphertext; batchSize: number }> => {
    const { fetchESItem, getItemID, prepareCiphertext } = esIndexingHelpers;

    let batchSize = 0;
    let counter = 0;

    const esIteratee = async (itemMetadata: ESItemMetadata) => {
        if (abortIndexingRef.current.signal.aborted) {
            throw new Error('Operation aborted');
        }

        // Since itemMetadata is given, fetchESItem doesn't return undefined
        const itemToStore = (await fetchESItem(
            getItemID(itemMetadata),
            itemMetadata,
            abortIndexingRef.current.signal
        ))!;

        recordLocalProgress(++counter);
        batchSize += sizeOfESItem(itemToStore);
        return encryptToDB<ESItem, ESCiphertext>(itemToStore, indexKey, prepareCiphertext);
    };

    // ciphertexts is a list of symmetrically encrypted items in reverse chronological order
    const ciphertexts = await runInQueue<ESCiphertext>(
        resultMetadata.map((item) => () => esIteratee(item)),
        ES_MAX_CONCURRENT
    );

    if (abortIndexingRef.current.signal.aborted) {
        throw new Error('Operation aborted');
    }

    const tx = esDB.transaction(storeName, 'readwrite');
    await Promise.all(ciphertexts.map(async (ciphertext) => tx.store.put(ciphertext)));
    await tx.done;

    // Since transactions are atomic, i.e. either all ciphertexts are stored or
    // none of them is, it's safe to take the last ciphertext as recovery point
    return { lastStoredItem: ciphertexts[ciphertexts.length - 1], batchSize };
};

/**
 * Fetch and store items in batches starting from the given one, if any
 */
const storeItemsBatches = async <ESItemMetadata, ESItem, ESCiphertext>(
    userID: string,
    esDB: IDBPDatabase,
    indexKey: CryptoKey,
    abortIndexingRef: React.MutableRefObject<AbortController>,
    oldestItem: ESCiphertext | undefined,
    storeName: string,
    recordProgress: (progress: number) => void,
    esIndexingHelpers: ESIndexingHelpers<ESItemMetadata, ESItem, ESCiphertext>
) => {
    const { queryItemsMetadata } = esIndexingHelpers;
    let lastStoredItem = oldestItem;
    let resultMetadata = await queryItemsMetadata(oldestItem, abortIndexingRef.current.signal);

    if (!resultMetadata) {
        return false;
    }

    let batchSize = 0;
    let progress = 0;
    while (resultMetadata.length) {
        const inloopProgress = progress;
        const recordLocalProgress = (localProgress: number) => {
            recordProgress(inloopProgress + localProgress);
        };

        let quotaExceededError = false;
        const storeOutput: {
            lastStoredItem: ESCiphertext;
            batchSize: number;
        } | void = await storeItems<ESItemMetadata, ESItem, ESCiphertext>(
            resultMetadata,
            esDB,
            indexKey,
            abortIndexingRef,
            storeName,
            recordLocalProgress,
            esIndexingHelpers
        ).catch((error: any) => {
            if (
                !(error.message && error.message === 'Operation aborted') &&
                !(error.name && error.name === 'AbortError')
            ) {
                // This happens when the user pauses indexing, for which we don't need a sentry report
                esSentryReport('storeItemsBatches: storeItems', { error });
            }

            if (error.name === 'QuotaExceededError') {
                quotaExceededError = true;
            }
        });

        if (abortIndexingRef.current.signal.aborted) {
            return false;
        }

        if (!storeOutput) {
            // If the quota has been reached, indexing is considered to be successful. Since
            // items are fetched in chronological order, IndexedDB is guaranteed to contain
            // the most recent items only
            return quotaExceededError;
        }

        ({ lastStoredItem, batchSize } = storeOutput);

        updateSizeIDB(userID, batchSize);
        progress += resultMetadata.length;

        resultMetadata = await queryItemsMetadata(lastStoredItem, abortIndexingRef.current.signal);

        if (!resultMetadata) {
            return false;
        }

        addESTimestamp(userID, 'step');
    }

    return true;
};

/**
 * Opens the DB and starts indexing
 */
export const buildDB = async <ESItemMetadata, ESItem, ESCiphertext>(
    userID: string,
    indexKey: CryptoKey,
    abortIndexingRef: React.MutableRefObject<AbortController>,
    recordProgress: (progress: number) => void,
    storeName: string,
    indexName: string,
    esIndexingHelpers: ESIndexingHelpers<ESItemMetadata, ESItem, ESCiphertext>
) => {
    addESTimestamp(userID, 'start');
    const esDB = await openESDB(userID);

    // Use the oldest item stored as recovery point
    const oldestItem = await getOldestItem(esDB, storeName, indexName);

    // Start fetching messages from the last stored message
    // or from scratch if a recovery point was not found
    const success = await storeItemsBatches<ESItemMetadata, ESItem, ESCiphertext>(
        userID,
        esDB,
        indexKey,
        abortIndexingRef,
        oldestItem,
        storeName,
        recordProgress,
        esIndexingHelpers
    );

    esDB.close();

    return success;
};

/**
 * Store an existing index key to local storage
 */
const storeIndexKey = async (indexKey: CryptoKey, userID: string, getUserKeys: GetUserKeys) => {
    const userKeysList = await getUserKeys();
    const primaryUserKey = userKeysList[0];
    const keyToEncrypt = await crypto.subtle.exportKey('jwk', indexKey);
    const { message: encryptedKey } = await CryptoProxy.encryptMessage({
        textData: JSON.stringify(keyToEncrypt),
        stripTrailingSpaces: true,
        encryptionKeys: [primaryUserKey.publicKey],
        signingKeys: [primaryUserKey.privateKey],
    });
    setES.Key(userID, encryptedKey);
};

/**
 * Execute the initial steps of a new indexing, i.e. generating an index key and the DB itself
 */
export const initializeDB = async (
    userID: string,
    getUserKeys: GetUserKeys,
    isRefreshed: boolean,
    totalItems: number,
    storeName: string,
    indexName: string,
    primaryKeyName: string,
    indexKeyNames: [string, string],
    getPreviousEventID: () => Promise<string>
) => {
    const result: { notSupported: boolean; indexKey: CryptoKey | undefined } = {
        notSupported: false,
        indexKey: undefined,
    };

    // Remove IndexedDB in case there is a corrupt leftover
    try {
        await deleteESDB(userID);
    } catch (error: any) {
        if (error.name !== 'InvalidStateError') {
            esSentryReport('initializeDB: deleteESDB', { error });
        }

        return {
            ...result,
            notSupported: true,
        };
    }

    // Save the event before starting building IndexedDB. The number of items
    // before indexing aims to show progress, as new items will be synced only
    // after indexing has completed
    try {
        const previousEventID = await getPreviousEventID();
        setES.Event(userID, previousEventID);
    } catch (error: any) {
        return result;
    }

    setES.Progress(userID, {
        totalItems,
        isRefreshed,
        numPauses: 0,
        timestamps: [],
        originalEstimate: 0,
    });

    // Set up DB
    let esDB: IDBPDatabase;
    try {
        esDB = await createESDB(userID, storeName, indexName, primaryKeyName, indexKeyNames);
    } catch (error: any) {
        if (error.name !== 'InvalidStateError') {
            esSentryReport('initializeDB: createESDB', { error });
        }

        removeES.Event(userID);
        removeES.Progress(userID);
        return {
            ...result,
            notSupported: true,
        };
    }
    esDB.close();

    // Create an index key and save it to localStorage in encrypted form
    let indexKey: CryptoKey;
    try {
        indexKey = await crypto.subtle.generateKey(AesKeyGenParams, true, KeyUsages);
        await storeIndexKey(indexKey, userID, getUserKeys);
    } catch (error: any) {
        esSentryReport('initializeDB: key generation', { error });

        removeES.Event(userID);
        removeES.Progress(userID);
        await deleteESDB(userID);
        return result;
    }

    setES.Size(userID, 0);

    return {
        ...result,
        indexKey,
    };
};

/**
 * Compute the total indexing time based on locally cached timestamps
 */
export const estimateIndexingDuration = (
    timestamps: {
        type: 'start' | 'step' | 'stop';
        time: number;
    }[]
) => {
    let indexTime = 0;
    let totalInterruptions = 0;

    for (let index = 0; index < timestamps.length - 1; index++) {
        const [timestamp1, timestamp2] = timestamps.slice(index, index + 2);

        if (timestamp1.type !== 'stop' && timestamp2.type !== 'start') {
            indexTime += timestamp2.time - timestamp1.time;
        } else if (timestamp1.type !== 'stop' || timestamp2.type !== 'stop') {
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
export const estimateIndexingProgress = (
    userID: string,
    esProgress: number,
    esTotal: number,
    endTime: number,
    esState: ESIndexingState
) => {
    let estimatedMinutes = 0;
    let currentProgressValue = 0;

    if (esTotal !== 0 && endTime !== esState.startTime && esProgress !== esState.esPrevProgress) {
        const remainingMessages = esTotal - esProgress;

        setOriginalEstimate(
            userID,
            Math.floor(
                (((endTime - esState.startTime) / (esProgress - esState.esPrevProgress)) * remainingMessages) / SECOND
            )
        );

        estimatedMinutes = Math.ceil(
            (((endTime - esState.startTime) / (esProgress - esState.esPrevProgress)) * remainingMessages) / MINUTE
        );
        currentProgressValue = Math.ceil((esProgress / esTotal) * 100);
    }

    return { estimatedMinutes, currentProgressValue };
};

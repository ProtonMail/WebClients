import { IDBPDatabase } from 'idb';

import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import { ES_MAX_PARALLEL_ITEMS } from '../constants';
import { ESCache, ESItemEvent, ESSyncingHelpers } from '../models';
import { esSentryReport } from './esAPI';
import { encryptToDB } from './esBuild';
import { addToESCache, findItemIndex, removeFromESCache, replaceInESCache, sizeOfESItem } from './esCache';
import { decryptFromDB, uncachedSearch } from './esSearch';
import { getNumItemsDB, getOldestItem, openESDB, updateSizeIDB } from './esUtils';

/**
 * Check whether the DB is limited, either after indexing or if it became so
 * after an update
 */
export const checkIsDBLimited = async (userID: string, storeName: string, getTotalItems: () => Promise<number>) => {
    const count = await getNumItemsDB(userID, storeName);
    const totalItems = await getTotalItems();
    return count < totalItems;
};

/**
 * Get item from IndexedDB
 */
const getItemFromDB = async <ESItem, ESCiphertext>(
    ID: string,
    indexKey: CryptoKey,
    esDB: IDBPDatabase,
    storeName: string
) => {
    const storedCiphertext: ESCiphertext = await esDB.get(storeName, ID);
    if (!storedCiphertext) {
        return;
    }

    return decryptFromDB<ESItem, ESCiphertext>(storedCiphertext, indexKey);
};

/**
 * Check whether a time point is less than an other one. Return true if
 * esTimeBound1 < esTimeBound2 or false if esTimeBound1 > esTimeBound2
 * Time points are supposed to be unique, therefore no other output is possible
 */
const isTimePointLessThan = (esTimeBound1: [number, number], esTimeBound2: [number, number]) =>
    esTimeBound1 < esTimeBound2;

/**
 * Stores an item to IndexedDB. If there is not enough space, older items are
 * removed in favour of new ones
 */
const storeToDB = async <ESCiphertext>(
    newCiphertextToStore: ESCiphertext,
    esDB: IDBPDatabase,
    storeName: string,
    indexName: string,
    getTimePoint: (storedItem: ESCiphertext) => [number, number],
    getItemID: (storedItem: ESCiphertext) => string
) => {
    const retryStoring = true;
    while (retryStoring) {
        try {
            await esDB.put(storeName, newCiphertextToStore);
            return true;
        } catch (error: any) {
            esSentryReport('storeToDB: put failed', { error });

            if (error.name === 'QuotaExceededError') {
                // If there is no space left an error is thrown. If the message w\e are trying to
                // save is older than the oldest message present, then it should be discarded. Otherwise,
                // the oldest message is deleted in favour of the newer one
                const oldestMessage = await getOldestItem(esDB, storeName, indexName);
                if (!oldestMessage) {
                    return false;
                }

                const oldestTime = getTimePoint(oldestMessage);
                const currentTime = getTimePoint(newCiphertextToStore);

                if (isTimePointLessThan(currentTime, oldestTime)) {
                    // The message is treated as succesfully stored
                    return true;
                }

                // The oldest message is deleted, the function then loops to
                // check whether enough spaces has been freed
                await esDB.delete(storeName, getItemID(oldestMessage));
            } else {
                // Any other error should be interpreted as a failure
                return false;
            }
        }
    }
};

/**
 * Remove messages from and add messages to IDB
 */
const executeIDBOperations = async <ESCiphertext>(
    esDB: IDBPDatabase,
    itemsToRemove: string[],
    itemsToAdd: ESCiphertext[],
    storeName: string,
    indexName: string,
    getTimePoint: (storedItem: ESCiphertext) => [number, number],
    getItemID: (storedItem: ESCiphertext) => string
) => {
    const tx = esDB.transaction(storeName, 'readwrite');

    // Firstly, all items that were deleted are removed from IDB
    if (itemsToRemove.length) {
        for (const ID of itemsToRemove) {
            void tx.store.delete(ID);
        }
    }

    // Then all items to add are inserted, if an item fails
    // it is saved for retry
    try {
        if (itemsToAdd.length) {
            for (const ciphertext of itemsToAdd) {
                void tx.store.put(ciphertext);
            }
        }
        await tx.done;
    } catch (error: any) {
        // The most likely cause for failure is the quota being exceeded,
        // therefore we use the storeToDB routine which inserts newer items by
        // removing older ones, or discards the item if it's too old
        if (error.name === 'QuotaExceededError') {
            for (const ciphertext of itemsToAdd) {
                if (!(await storeToDB<ESCiphertext>(ciphertext, esDB, storeName, indexName, getTimePoint, getItemID))) {
                    throw new Error('Sync of some items failed');
                }
            }
        } else {
            // Otherwise the same error is thrown
            throw error;
        }
    }
};

/**
 * Synchronise IDB (and optionally cache and search results) with new ES events
 */
export const syncMessageEvents = async <ESItem, ESItemMetadata, ESItemChanges, ESCiphertext, ESSearchParameters>(
    Items: ESItemEvent<ESItemChanges>[],
    userID: string,
    esCacheRef: React.MutableRefObject<ESCache<ESItem>>,
    permanentResults: ESItem[],
    indexKey: CryptoKey,
    esSearchParams: ESSearchParameters | undefined,
    storeName: string,
    indexName: string,
    esSyncingHelpers: ESSyncingHelpers<ESItemMetadata, ESItem, ESItemChanges, ESCiphertext, ESSearchParameters>,
    recordProgressLocal?: () => void
) => {
    const { applySearch, updateESItem, getItemID, prepareCiphertext, fetchESItem, getTimePoint } = esSyncingHelpers;

    const esDB = await openESDB(userID);
    let searchChanged = false;

    // In case something happens while displaying search results, this function keeps
    // the results in sync live (e.g. by creating or removing items from the results)
    const updatePermanentResults = ({
        resultIndex = -1,
        itemToCache,
    }: {
        resultIndex?: number;
        itemToCache?: ESItem;
    }) => {
        if (itemToCache) {
            if (resultIndex !== -1) {
                permanentResults.splice(resultIndex, 1, itemToCache);
            } else {
                permanentResults.push(itemToCache);
            }
        } else {
            permanentResults.splice(resultIndex as number, 1);
        }
        searchChanged = true;
    };

    // Any interaction with IDB is postponed
    const itemsToRemove: string[] = [];
    const itemsToAdd: ESCiphertext[] = [];

    // We speed up item syncing by first fetching in parallel all items that are
    // required and then syncing them all
    for (let batch = 0; batch < Items.length; batch += ES_MAX_PARALLEL_ITEMS) {
        const itemEventsBatch = Items.slice(batch, Math.min(Items.length, batch + ES_MAX_PARALLEL_ITEMS));
        const prefetchedItems = (
            await Promise.all(
                itemEventsBatch.map(async (itemEvent) => {
                    const { ID, Action } = itemEvent;
                    if (Action === EVENT_ACTIONS.CREATE || Action === EVENT_ACTIONS.UPDATE_DRAFT) {
                        return fetchESItem(ID);
                    }
                })
            )
        ).filter(isTruthy);

        for (const itemEvent of itemEventsBatch) {
            const { ID, Action, ItemEvent } = itemEvent;

            // If an item is deleted:
            //   - if a cache exists and has it, delete it from there
            //   - if results are being shown, delete it from there too
            if (Action === EVENT_ACTIONS.DELETE) {
                itemsToRemove.push(ID);
                const size = removeFromESCache<ESItem>(ID, esCacheRef, getItemID) || 0;
                updateSizeIDB(userID, -size);

                const resultIndex = findItemIndex(ID, permanentResults, getItemID);
                if (!!esSearchParams && resultIndex !== -1) {
                    updatePermanentResults({ resultIndex });
                }
            }

            // If an item is created:
            //   - if a cache exists, add it to there
            //   - if results are being shown and the new tem fulfills, add it there too
            if (Action === EVENT_ACTIONS.CREATE) {
                // Fetch the whole item since the event only contains metadata
                const resultIndex = findItemIndex(ID, prefetchedItems, getItemID);
                const itemToCache = resultIndex !== -1 ? prefetchedItems[resultIndex] : undefined;
                if (!itemToCache) {
                    // If a permanent error occured while fetching, we ignore the update
                    continue;
                }

                const newCiphertextToStore = await encryptToDB<ESItem, ESCiphertext>(
                    itemToCache,
                    indexKey,
                    prepareCiphertext
                );

                itemsToAdd.push(newCiphertextToStore);

                const size = sizeOfESItem(itemToCache);
                updateSizeIDB(userID, size);
                addToESCache(itemToCache, esCacheRef, getTimePoint, size);

                if (!!esSearchParams && applySearch(esSearchParams, itemToCache)) {
                    updatePermanentResults({ itemToCache });
                }
            }

            // If an item is modified, what to do depends whether it's been prefetched or not
            if (Action === EVENT_ACTIONS.UPDATE_DRAFT || Action === EVENT_ACTIONS.UPDATE_FLAGS) {
                if (!ItemEvent) {
                    continue;
                }

                // If the item is not in IndexedDB, it means the latter is only partial for
                // space constraints and the item was too old to fit. In this case, the update
                // is ignored
                const oldItem = await getItemFromDB<ESItem, ESCiphertext>(ID, indexKey, esDB, storeName);
                if (!oldItem) {
                    continue;
                }

                let newItemToCache: ESItem | undefined;
                // If the modification is a prefetch update, fetch from server so to have the new content...
                if (Action === EVENT_ACTIONS.UPDATE_DRAFT) {
                    const resultIndex = findItemIndex(ID, prefetchedItems, getItemID);
                    const fetchedItemToCache = resultIndex !== -1 ? prefetchedItems[resultIndex] : undefined;
                    if (!fetchedItemToCache) {
                        // If a permanent error occured while fetching, we ignore the update
                        continue;
                    }
                    newItemToCache = fetchedItemToCache;
                }

                // ...otherwise modify the old item only.
                if (Action === EVENT_ACTIONS.UPDATE_FLAGS) {
                    newItemToCache = updateESItem(ItemEvent, oldItem);
                }
                if (!newItemToCache) {
                    throw new Error('Plaintext to store is undefined');
                }

                const newCiphertextToStore = await encryptToDB<ESItem, ESCiphertext>(
                    newItemToCache,
                    indexKey,
                    prepareCiphertext
                );

                itemsToAdd.push(newCiphertextToStore);

                const sizeDelta = sizeOfESItem(newItemToCache) - sizeOfESItem(oldItem);
                updateSizeIDB(userID, sizeDelta);

                // If a cache exists, update the item there too
                replaceInESCache<ESItem>(
                    newItemToCache,
                    esCacheRef,
                    getItemID,
                    getTimePoint,
                    Action === EVENT_ACTIONS.UPDATE_DRAFT,
                    sizeDelta
                );

                // If results are being shown:
                //   - if the old item was part of the search and the new one still is, update it;
                //   - if the old item was part of the search and the new one shouldn't be, delete it;
                //   - if the old item wasn't part of the search and the new one should be, add it;
                if (!!esSearchParams) {
                    if (applySearch(esSearchParams, oldItem)) {
                        const resultIndex = findItemIndex(ID, permanentResults, getItemID);

                        if (applySearch(esSearchParams, newItemToCache)) {
                            updatePermanentResults({ resultIndex, itemToCache: newItemToCache });
                        } else {
                            updatePermanentResults({ resultIndex });
                        }
                    } else if (applySearch(esSearchParams, newItemToCache)) {
                        updatePermanentResults({ itemToCache: newItemToCache });
                    }
                }
            }

            if (recordProgressLocal) {
                recordProgressLocal();
            }
        }
    }

    await executeIDBOperations(esDB, itemsToRemove, itemsToAdd, storeName, indexName, getTimePoint, getItemID);

    esDB.close();

    return searchChanged;
};

/**
 * When an old key is activated, try to correct any previous decryption errors
 */
export const correctDecryptionErrors = async <ESItemMetadata, ESItem, ESItemChanges, ESCiphertext, ESSearchParameters>(
    userID: string,
    indexKey: CryptoKey,
    storeName: string,
    indexName: string,
    esSyncingHelpers: Required<
        ESSyncingHelpers<ESItemMetadata, ESItem, ESItemChanges, ESCiphertext, ESSearchParameters>
    >,
    recordProgress: (progress: number, total: number) => void,
    esCacheRef?: React.MutableRefObject<ESCache<ESItem>>
) => {
    const { fetchESItem, getDecryptionErrorParams, getItemID, prepareCiphertext, getTimePoint } = esSyncingHelpers;

    const searchParameters = getDecryptionErrorParams();

    if (!searchParameters) {
        return 0;
    }

    const { resultsArray: searchResults } = await uncachedSearch<ESItem, ESCiphertext, ESSearchParameters>(
        userID,
        indexKey,
        searchParameters,
        storeName,
        indexName,
        esSyncingHelpers
    );

    if (!searchResults.length) {
        // There are no items for which decryption failed
        return 0;
    }

    recordProgress(0, searchResults.length);

    let counter = 0;
    const itemsToAdd = (
        await Promise.all(
            searchResults.map(async (item) => {
                const newItem = await fetchESItem(getItemID(item));
                if (!newItem) {
                    // Message still fails decryption
                    return;
                }

                const newCiphertextToStore = await encryptToDB<ESItem, ESCiphertext>(
                    newItem,
                    indexKey,
                    prepareCiphertext
                );

                const size = sizeOfESItem(newItem);
                updateSizeIDB(userID, size);
                if (esCacheRef) {
                    addToESCache<ESItem>(newItem, esCacheRef, getTimePoint, size);
                }
                recordProgress(++counter, searchResults.length);

                return newCiphertextToStore;
            })
        )
    ).filter(isTruthy);

    const newItemsFound = itemsToAdd.length;

    if (newItemsFound) {
        const esDB = await openESDB(userID);
        await executeIDBOperations(esDB, [], itemsToAdd, storeName, indexName, getTimePoint, getItemID);
        esDB.close();
    }

    return newItemsFound;
};

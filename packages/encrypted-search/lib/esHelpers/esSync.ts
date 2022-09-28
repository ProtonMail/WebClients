import { IDBPDatabase } from 'idb';

import isTruthy from '@proton/utils/isTruthy';

import { ES_MAX_PARALLEL_ITEMS, ES_SYNC_ACTIONS, STORING_OUTCOME } from '../constants';
import {
    executeContentOperations,
    executeMetadataOperations,
    openESDB,
    readContentItem,
    readLimited,
    setLimited,
    updateSize,
} from '../esIDB';
import {
    CachedItem,
    CiphertextToStore,
    ESCache,
    ESItem,
    ESItemEvent,
    EncryptedSearchDB,
    InternalESHelpers,
} from '../models';
import { encryptItem } from './esBuild';
import { addToESCache, removeFromESCache, sizeOfESItem } from './esCache';
import { applySearch, decryptFromDB } from './esSearch';
import { findItemIndex } from './esUtils';

/**
 * Get content item from IndexedDB
 */
const getContentFromIDB = async <Plaintext>(userID: string, itemID: string, indexKey: CryptoKey) => {
    const aesGcmCiphertext = await readContentItem(userID, itemID);
    if (!aesGcmCiphertext) {
        return;
    }

    return decryptFromDB<Plaintext>(aesGcmCiphertext, indexKey);
};

/**
 * Synchronise IDB (and optionally cache and search results) with new ES events
 */
export const syncItemEvents = async <ESItemContent, ESItemMetadata, ESSearchParameters>(
    Items: ESItemEvent<ESItemMetadata>[],
    userID: string,
    contentIndexingDone: boolean,
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, ESItemContent>>,
    permanentResults: ESItem<ESItemMetadata, ESItemContent>[],
    indexKey: CryptoKey | undefined,
    esSearchParams: ESSearchParameters | undefined,
    esHelpers: InternalESHelpers<ESItemMetadata, ESSearchParameters, ESItemContent>,
    recordProgressLocal?: () => void
) => {
    const { searchMetadata, searchContent, getItemInfo, fetchESItem } = esHelpers;

    let esDB: IDBPDatabase<EncryptedSearchDB> | undefined;
    if (!!indexKey) {
        esDB = await openESDB(userID);
    }

    const permanentStorage = !!esDB && !!indexKey;
    const useContent = !!fetchESItem && contentIndexingDone;

    esDB?.close();

    // In case something happens while displaying search results, this function keeps
    // the results in sync live (e.g. by creating or removing items from the results)
    let searchChanged = false;
    const updatePermanentResults = ({
        resultIndex = -1,
        itemToCache,
    }: {
        resultIndex?: number;
        itemToCache?: ESItem<ESItemMetadata, ESItemContent>;
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
    const metadataToRemove: string[] = [];
    const contentToRemove: string[] = [];
    const metadataToAdd: CiphertextToStore[] = [];
    const contentToAdd: CiphertextToStore[] = [];

    for (let batch = 0; batch < Items.length; batch += ES_MAX_PARALLEL_ITEMS) {
        const itemEventsBatch = Items.slice(batch, Math.min(Items.length, batch + ES_MAX_PARALLEL_ITEMS));

        // We speed up item syncing by first fetching in parallel all items that are
        // required and then syncing them all. In case fetchESItem is not defined or
        // no content is required, then the metadata contained in the itemEvents suffice
        // to sync the items
        const prefetchedContent: Map<string, ESItemContent | undefined> = new Map();
        if (useContent) {
            await Promise.all(
                itemEventsBatch.map(async (itemEvent) => {
                    const { ID, Action } = itemEvent;
                    if (Action === ES_SYNC_ACTIONS.CREATE || Action === ES_SYNC_ACTIONS.UPDATE_CONTENT) {
                        prefetchedContent.set(ID, await fetchESItem(ID, undefined, esCacheRef));
                    }
                })
            );
        }

        for (const itemEvent of itemEventsBatch) {
            const { ID, Action, ItemMetadata } = itemEvent;

            // If an item is deleted:
            //   - queue it to remove it from IDB
            //   - delete it from cache
            //   - if results are being shown, delete it from there too
            if (Action === ES_SYNC_ACTIONS.DELETE) {
                metadataToRemove.push(ID);
                if (useContent) {
                    contentToRemove.push(ID);
                }

                const size = removeFromESCache<ESItemMetadata, ESItemContent>(ID, esCacheRef, false);

                if (permanentStorage) {
                    await updateSize<ESItemMetadata>(userID, -size, esCacheRef.current.esCache, getItemInfo);
                }

                const resultIndex = findItemIndex<ESItemMetadata>(ID, permanentResults, getItemInfo);
                if (!!esSearchParams && resultIndex !== -1) {
                    updatePermanentResults({ resultIndex });
                }
            }

            // For any other type of action, the metadata of the modified
            // item should exist
            if (!ItemMetadata) {
                continue;
            }

            // If an item is created:
            //   - queue it to add it to IDB
            //   - add it to cache
            //   - if results are being shown and the new term fulfills, add it there too
            if (Action === ES_SYNC_ACTIONS.CREATE) {
                const itemToCache: CachedItem<ESItemMetadata, ESItemContent> = {
                    metadata: ItemMetadata,
                    content: prefetchedContent.get(ID),
                };

                if (permanentStorage) {
                    metadataToAdd.push({
                        itemID: ID,
                        aesGcmCiphertext: await encryptItem(itemToCache.metadata, indexKey),
                    });

                    if (itemToCache.content) {
                        contentToAdd.push({
                            itemID: ID,
                            aesGcmCiphertext: await encryptItem(itemToCache.content, indexKey),
                        });
                    }

                    await updateSize<ESItemMetadata>(
                        userID,
                        sizeOfESItem(itemToCache),
                        esCacheRef.current.esCache,
                        getItemInfo
                    );
                }

                addToESCache<ESItemMetadata, ESItemContent>(itemToCache, esCacheRef, getItemInfo);

                if (
                    !!esSearchParams &&
                    applySearch(esSearchParams, itemToCache, searchMetadata, searchContent, contentIndexingDone)
                ) {
                    updatePermanentResults({ itemToCache: { ...itemToCache.metadata, ...itemToCache.content } });
                }
            }

            if (Action === ES_SYNC_ACTIONS.UPDATE_CONTENT || Action === ES_SYNC_ACTIONS.UPDATE_METADATA) {
                // We need the old item in order to correctly update the search results, if shown, and the
                // estimated sizes
                const oldItem = esCacheRef.current.esCache.get(ID);
                // Note that the item must exist, at the very least its metadata, in cache
                if (!oldItem) {
                    continue;
                }

                const itemToCache: CachedItem<ESItemMetadata, ESItemContent> = {
                    metadata: ItemMetadata,
                    // If we have new content, it will be among those prefetched,
                    // otherwise we take the content of the old item
                    content: prefetchedContent.get(ID) || oldItem.content,
                };

                if (Action === ES_SYNC_ACTIONS.UPDATE_CONTENT) {
                    // In case content was not already cached, we get it from IDB if possible. In case
                    // content is active but this still yields no content, it means the IDB is only partial for
                    // space constraints and the content was too old to fit. In this case, the content update
                    // is ignored
                    if (useContent && permanentStorage && !oldItem.content) {
                        oldItem.content = await getContentFromIDB<ESItemContent>(userID, ID, indexKey);
                    }
                }

                const oldSize = sizeOfESItem(oldItem);
                const newSize = sizeOfESItem(itemToCache);

                if (permanentStorage) {
                    metadataToAdd.push({
                        itemID: ID,
                        aesGcmCiphertext: await encryptItem(itemToCache.metadata, indexKey),
                    });

                    if (itemToCache.content) {
                        contentToAdd.push({
                            itemID: ID,
                            aesGcmCiphertext: await encryptItem(itemToCache.content, indexKey),
                        });
                    }

                    await updateSize<ESItemMetadata>(
                        userID,
                        newSize - oldSize,
                        esCacheRef.current.esCache,
                        getItemInfo
                    );
                }

                // We only remove the old size because the new one is added by addToESCache
                esCacheRef.current.cacheSize -= oldSize;
                addToESCache<ESItemMetadata, ESItemContent>(itemToCache, esCacheRef, getItemInfo);

                // If results are being shown:
                //   - if the old item was part of the search and the new one still is, update it;
                //   - if the old item was part of the search and the new one shouldn't be, delete it;
                //   - if the old item wasn't part of the search and the new one should be, add it;
                if (!!esSearchParams) {
                    if (applySearch(esSearchParams, oldItem, searchMetadata, searchContent, contentIndexingDone)) {
                        const resultIndex = findItemIndex(ID, permanentResults, getItemInfo);

                        if (
                            applySearch(esSearchParams, itemToCache, searchMetadata, searchContent, contentIndexingDone)
                        ) {
                            updatePermanentResults({
                                resultIndex,
                                itemToCache: { ...itemToCache.metadata, ...itemToCache.content },
                            });
                        } else {
                            updatePermanentResults({ resultIndex });
                        }
                    } else if (
                        applySearch(esSearchParams, itemToCache, searchMetadata, searchContent, contentIndexingDone)
                    ) {
                        updatePermanentResults({ itemToCache: { ...itemToCache.metadata, ...itemToCache.content } });
                    }
                }
            }

            if (recordProgressLocal) {
                recordProgressLocal();
            }
        }
    }

    if (permanentStorage) {
        const wasLimited = await readLimited(userID);
        // We assume IDB is limited and revert only if it's not
        if (!wasLimited) {
            await setLimited<ESItemMetadata>(userID, true, esCacheRef.current.esCache, getItemInfo);
        }

        const metadataOutcome = await executeMetadataOperations<ESItemMetadata>(
            userID,
            metadataToRemove,
            metadataToAdd,
            esCacheRef.current.esCache,
            getItemInfo
        );

        const contentOutcome = await executeContentOperations<ESItemMetadata>(
            userID,
            contentToRemove,
            contentToAdd,
            esCacheRef.current.esCache,
            getItemInfo
        );

        if (!wasLimited && metadataOutcome === STORING_OUTCOME.SUCCESS && contentOutcome === STORING_OUTCOME.SUCCESS) {
            await setLimited<ESItemMetadata>(userID, false, esCacheRef.current.esCache, getItemInfo);
        }
    }

    return searchChanged;
};

/**
 * When an old key is activated, try to correct any previous decryption errors
 */
export const correctDecryptionErrors = async <ESItemMetadata, ESSearchParameters, ESItemContent>(
    userID: string,
    indexKey: CryptoKey,
    esHelpers: InternalESHelpers<ESItemMetadata, ESSearchParameters, ESItemContent>,
    recordProgress: (progress: number, total: number) => void,
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, ESItemContent>>
) => {
    const { fetchESItem, getItemInfo } = esHelpers;

    const esDB = await openESDB(userID);

    if (!fetchESItem || !esDB) {
        esDB?.close();
        return 0;
    }

    const contentIDs = new Set(await esDB.getAllKeys('content'));
    const contentRetry: CachedItem<ESItemMetadata, unknown>[] = [];

    esCacheRef.current.esCache.forEach((value, key) => {
        if (!contentIDs.has(key)) {
            contentRetry.push(value);
        }
    });

    if (!contentRetry.length) {
        // There are no items for which decryption failed
        return 0;
    }

    recordProgress(0, contentRetry.length);

    let counter = 0;
    const contentToAdd = (
        await Promise.all(
            contentRetry.map(async (item) => {
                const itemID = getItemInfo(item.metadata).ID;

                const newContent = await fetchESItem(itemID, undefined, esCacheRef);
                if (!newContent) {
                    // Item still fails decryption
                    return;
                }

                const newCiphertextToStore: CiphertextToStore = {
                    itemID,
                    aesGcmCiphertext: await encryptItem(newContent, indexKey),
                };

                const size = sizeOfESItem(newContent);
                await updateSize<ESItemMetadata>(userID, size, esCacheRef.current.esCache, getItemInfo);
                addToESCache<ESItemMetadata, ESItemContent>(
                    { metadata: item.metadata, content: newContent },
                    esCacheRef,
                    getItemInfo
                );
                recordProgress(++counter, contentRetry.length);

                return newCiphertextToStore;
            })
        )
    ).filter(isTruthy);

    const newItemsFound = contentToAdd.length;

    if (newItemsFound) {
        await executeContentOperations<ESItemMetadata>(
            userID,
            [],
            contentToAdd,
            esCacheRef.current.esCache,
            getItemInfo
        );
    }

    esDB.close();

    return newItemsFound;
};

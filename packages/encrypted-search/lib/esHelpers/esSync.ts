import type { IDBPDatabase } from 'idb';

import type { IndexKey } from '@proton/crypto/lib/subtle/ad-hoc/encryptedSearch';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import chunk from '@proton/utils/chunk';

import { ES_MAX_PARALLEL_ITEMS, ES_SYNC_ACTIONS, STORING_OUTCOME } from '../constants';
import { executeContentOperations, executeMetadataOperations, openESDB, readLimited, setLimited } from '../esIDB';
import type {
    CachedItem,
    ESCache,
    ESItem,
    ESItemEvent,
    EncryptedItemWithInfo,
    EncryptedSearchDB,
    InternalESCallbacks,
} from '../models';
import { addToESCache, removeFromESCache } from './esCache';
import { addRetry } from './esRetries';
import { applySearch } from './esSearch';
import { findItemIndex, isObjectEmpty, serializeAndEncryptItem } from './esUtils';

const prefetchContentToSync = async <ESItemMetadata extends object, ESItemContent = void>(
    itemEventsBatch: ESItemEvent<ESItemMetadata>[],
    fetchESItemContent?: (
        itemID: string,
        signal?: AbortSignal | undefined
    ) => Promise<{ content?: ESItemContent; error?: any }>
) => {
    /**
     * We speed up item syncing by first fetching in parallel all items that are
     * required and then syncing them all. In case fetchESItemContent is not defined or
     * no content is required, then the metadata contained in the itemEvents suffice
     * to sync the items
     */
    const prefetchedContent: Map<string, { content?: ESItemContent; error?: any } | undefined> = new Map();

    if (fetchESItemContent) {
        await Promise.all(
            itemEventsBatch.map(async (itemEvent) => {
                const { ID, Action } = itemEvent;
                if (Action === ES_SYNC_ACTIONS.CREATE || Action === ES_SYNC_ACTIONS.UPDATE_CONTENT) {
                    prefetchedContent.set(ID, await fetchESItemContent(ID, undefined));
                }
            })
        );
    }

    return prefetchedContent;
};

/**
 * Synchronise IDB (and optionally cache and search results) with new ES events
 */
export const syncItemEvents = async <ESItemContent, ESItemMetadata extends Object, ESSearchParameters>({
    Items,
    userID,
    esCacheRef,
    permanentResults,
    indexKey,
    esSearchParams,
    esCallbacks,
}: {
    Items: ESItemEvent<ESItemMetadata>[];
    userID: string;
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, ESItemContent>>;
    permanentResults: ESItem<ESItemMetadata, ESItemContent>[];
    indexKey: IndexKey | undefined;
    esSearchParams: ESSearchParameters | undefined;
    esCallbacks: InternalESCallbacks<ESItemMetadata, ESSearchParameters, ESItemContent>;
}) => {
    const { getItemInfo, fetchESItemContent, onContentDeletion, getKeywords } = esCallbacks;

    let esDB: IDBPDatabase<EncryptedSearchDB> | undefined;
    if (!!indexKey) {
        esDB = await openESDB(userID);
    }

    const permanentStorage = !!esDB && !!indexKey;
    const useContent = !!fetchESItemContent;

    esDB?.close();

    /**
     * In case something happens while displaying search results, this function keeps
     * the results in sync live (e.g. by creating or removing items from the results)
     */
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

    /**
     * Any interaction with IDB is postponed
     */
    const metadataToRemove: string[] = [];
    const contentToRemove: string[] = [];
    const metadataToAdd: EncryptedItemWithInfo[] = [];
    const contentToAdd: EncryptedItemWithInfo[] = [];

    const chunks = chunk(Items, ES_MAX_PARALLEL_ITEMS);

    for (const chunk of chunks) {
        const prefetchedContent = await prefetchContentToSync(chunk, fetchESItemContent);

        for (const itemEvent of chunk) {
            const { ID, Action, ItemMetadata } = itemEvent;

            /**
             * If an item is deleted:
             *      - queue it to remove it from IDB
             *      - delete it from cache
             *      - if results are being shown, delete it from there too
             */
            if (Action === ES_SYNC_ACTIONS.DELETE) {
                metadataToRemove.push(ID);
                if (useContent) {
                    if (permanentStorage) {
                        await onContentDeletion(ID, indexKey);
                    }

                    contentToRemove.push(ID);
                }

                removeFromESCache<ESItemMetadata, ESItemContent>({ itemID: ID, esCacheRef, contentOnly: false });

                const resultIndex = findItemIndex<ESItemMetadata>({
                    itemID: ID,
                    itemArray: permanentResults,
                    getItemInfo,
                });
                if (!!esSearchParams && resultIndex !== -1) {
                    updatePermanentResults({ resultIndex });
                }
            }

            /**
             * For any other type of action, the metadata of the modified item should exist
             */
            if (!ItemMetadata) {
                continue;
            }

            /**
             * If an item is created:
             *      - queue it to add it to IDB
             *      - add it to cache
             *      - if results are being shown and the new term fulfills, add it there too
             */
            if (Action === ES_SYNC_ACTIONS.CREATE) {
                const result = prefetchedContent.get(ID);
                if (!result) {
                    // If no result at all, add to retry
                    await addRetry(userID, ID);
                    continue;
                }

                const { content, error } = result;
                // If it's a 2501 (NOT_FOUND), skip it - the item is gone
                if (error?.data?.Code === API_CUSTOM_ERROR_CODES.NOT_FOUND) {
                    continue;
                }

                // For any other error, or if content is missing/empty, add to retry
                if (useContent && permanentStorage && (error || !content || isObjectEmpty(content))) {
                    await addRetry(userID, ID);
                }

                const itemToCache: CachedItem<ESItemMetadata, ESItemContent> = {
                    metadata: ItemMetadata,
                    content,
                };

                if (permanentStorage) {
                    metadataToAdd.push({
                        ID,
                        timepoint: getItemInfo(ItemMetadata).timepoint,
                        aesGcmCiphertext: await serializeAndEncryptItem(indexKey, itemToCache.metadata),
                    });

                    if (itemToCache.content && !isObjectEmpty(itemToCache.content)) {
                        contentToAdd.push({
                            ID,
                            timepoint: getItemInfo(ItemMetadata).timepoint,
                            aesGcmCiphertext: await serializeAndEncryptItem(indexKey, itemToCache.content),
                        });
                    }
                }

                addToESCache<ESItemMetadata, ESItemContent>({ inputItem: itemToCache, esCacheRef, getItemInfo });

                if (!!esSearchParams) {
                    const hasApostrophe = (getKeywords(esSearchParams) || []).some((keyword) => keyword.includes(`'`));
                    if (applySearch({ esSearchParams, item: itemToCache, hasApostrophe, esCallbacks })) {
                        updatePermanentResults({ itemToCache: { ...itemToCache.metadata, ...itemToCache.content } });
                    }
                }
            }

            if (Action === ES_SYNC_ACTIONS.UPDATE_CONTENT || Action === ES_SYNC_ACTIONS.UPDATE_METADATA) {
                let newContent: ESItemContent | undefined;
                if (Action === ES_SYNC_ACTIONS.UPDATE_CONTENT) {
                    const result = prefetchedContent.get(ID);
                    if (!result) {
                        // If no result at all, add to retry
                        await addRetry(userID, ID);
                        continue;
                    }

                    const { content, error } = result;
                    // If it's a 2501 (NOT_FOUND), skip it - the item is gone
                    if (error?.data?.Code === API_CUSTOM_ERROR_CODES.NOT_FOUND) {
                        continue;
                    }

                    // For any other error, or if content is missing/empty, add to retry
                    if (useContent && permanentStorage && (error || !content || isObjectEmpty(content))) {
                        await addRetry(userID, ID);
                    }
                    newContent = content;
                }

                const itemToCache: CachedItem<ESItemMetadata, ESItemContent> = {
                    metadata: ItemMetadata,
                    content: newContent,
                };

                if (permanentStorage) {
                    /**
                     * In case the action is only updating the metadata, we ignore updating the
                     * size estimate since it's likely very similar or exactly the same as the old one
                     */
                    metadataToAdd.push({
                        ID,
                        timepoint: getItemInfo(ItemMetadata).timepoint,
                        aesGcmCiphertext: await serializeAndEncryptItem(indexKey, itemToCache.metadata),
                        keepSize: Action === ES_SYNC_ACTIONS.UPDATE_METADATA,
                    });

                    if (itemToCache.content && !isObjectEmpty(itemToCache.content)) {
                        contentToAdd.push({
                            ID,
                            timepoint: getItemInfo(ItemMetadata).timepoint,
                            aesGcmCiphertext: await serializeAndEncryptItem(indexKey, itemToCache.content),
                        });
                    }
                }

                /**
                 * If I only want to update metadata
                 * AND item have no content
                 * AND cached item has content
                 * THEN I reassign cached content
                 */
                if (Action === ES_SYNC_ACTIONS.UPDATE_METADATA && !itemToCache.content) {
                    const previousCachedItem = esCacheRef.current.esCache.get(getItemInfo(itemToCache.metadata).ID);
                    if (!!previousCachedItem?.content) {
                        itemToCache.content = previousCachedItem?.content;
                    }
                }

                addToESCache<ESItemMetadata, ESItemContent>({ inputItem: itemToCache, esCacheRef, getItemInfo });

                /**
                 * If results are being shown:
                 *      - if the old item was part of the search and the new one still is, update it;
                 *      - if the old item was part of the search and the new one shouldn't be, delete it;
                 *      - if the old item wasn't part of the search and the new one should be, add it;
                 */
                if (!!esSearchParams) {
                    const hasApostrophe = (getKeywords(esSearchParams) || []).some((keyword) => keyword.includes(`'`));
                    const resultIndex = findItemIndex({ itemID: ID, itemArray: permanentResults, getItemInfo });
                    if (resultIndex !== -1) {
                        if (
                            applySearch<ESItemMetadata, ESItemContent, ESSearchParameters>({
                                esSearchParams,
                                item: itemToCache,
                                hasApostrophe,
                                esCallbacks,
                            })
                        ) {
                            updatePermanentResults({
                                resultIndex,
                                itemToCache: { ...itemToCache.metadata, ...itemToCache.content },
                            });
                        } else {
                            updatePermanentResults({ resultIndex });
                        }
                    } else if (
                        applySearch<ESItemMetadata, ESItemContent, ESSearchParameters>({
                            esSearchParams,
                            item: itemToCache,
                            hasApostrophe,
                            esCallbacks,
                        })
                    ) {
                        updatePermanentResults({ itemToCache: { ...itemToCache.metadata, ...itemToCache.content } });
                    }
                }
            }
        }
    }

    if (permanentStorage) {
        const wasLimited = await readLimited(userID);
        // We assume IDB is limited and revert only if it's not
        if (!wasLimited) {
            await setLimited(userID, true);
        }

        const metadataOutcome = await executeMetadataOperations(userID, metadataToRemove, metadataToAdd);

        const contentOutcome = await executeContentOperations({
            userID,
            itemsToRemove: contentToRemove,
            itemsToAdd: contentToAdd,
        });

        if (!wasLimited && metadataOutcome === STORING_OUTCOME.SUCCESS && contentOutcome === STORING_OUTCOME.SUCCESS) {
            await setLimited(userID, false);
        }
    }

    return searchChanged;
};

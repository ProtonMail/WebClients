import { IDBPDatabase } from 'idb';

import { ES_MAX_PARALLEL_ITEMS, ES_SYNC_ACTIONS, STORING_OUTCOME } from '../constants';
import {
    executeContentOperations,
    executeMetadataOperations,
    openESDB,
    readLimited,
    readNumContent,
    setLimited,
} from '../esIDB';
import {
    CachedItem,
    ESCache,
    ESItem,
    ESItemEvent,
    ESTimepoint,
    EncryptedItemWithInfo,
    EncryptedSearchDB,
    InternalESHelpers,
} from '../models';
import { buildContentDB, encryptItem } from './esBuild';
import { addToESCache, removeFromESCache } from './esCache';
import { addRetry } from './esRetries';
import { applySearch } from './esSearch';
import { findItemIndex, isObjectEmpty } from './esUtils';

/**
 * Synchronise IDB (and optionally cache and search results) with new ES events
 */
export const syncItemEvents = async <ESItemContent, ESItemMetadata extends Object, ESSearchParameters>(
    Items: ESItemEvent<ESItemMetadata>[],
    userID: string,
    esCacheRef: React.MutableRefObject<ESCache<ESItemMetadata, ESItemContent>>,
    permanentResults: ESItem<ESItemMetadata, ESItemContent>[],
    indexKey: CryptoKey | undefined,
    esSearchParams: ESSearchParameters | undefined,
    esHelpers: InternalESHelpers<ESItemMetadata, ESSearchParameters, ESItemContent>,
    recordProgressLocal?: () => void
) => {
    const { getItemInfo, fetchESItemContent, onContentDeletion, getKeywords } = esHelpers;

    let esDB: IDBPDatabase<EncryptedSearchDB> | undefined;
    if (!!indexKey) {
        esDB = await openESDB(userID);
    }

    const permanentStorage = !!esDB && !!indexKey;
    const useContent = !!fetchESItemContent;

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
    const metadataToAdd: EncryptedItemWithInfo[] = [];
    const contentToAdd: EncryptedItemWithInfo[] = [];

    for (let batch = 0; batch < Items.length; batch += ES_MAX_PARALLEL_ITEMS) {
        const itemEventsBatch = Items.slice(batch, Math.min(Items.length, batch + ES_MAX_PARALLEL_ITEMS));

        // We speed up item syncing by first fetching in parallel all items that are
        // required and then syncing them all. In case fetchESItemContent is not defined or
        // no content is required, then the metadata contained in the itemEvents suffice
        // to sync the items
        const prefetchedContent: Map<string, ESItemContent | undefined> = new Map();
        if (useContent) {
            await Promise.all(
                itemEventsBatch.map(async (itemEvent) => {
                    const { ID, Action } = itemEvent;
                    if (Action === ES_SYNC_ACTIONS.CREATE || Action === ES_SYNC_ACTIONS.UPDATE_CONTENT) {
                        prefetchedContent.set(ID, await fetchESItemContent(ID, undefined));
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
                    if (permanentStorage) {
                        await onContentDeletion(ID, indexKey);
                    }
                    contentToRemove.push(ID);
                }

                removeFromESCache<ESItemMetadata, ESItemContent>(ID, esCacheRef, false);

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
                const content = prefetchedContent.get(ID);
                if (useContent && permanentStorage && !content) {
                    // If an error occured while fetching, we ignore store
                    // the item's ID for later fetching of the content
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
                        aesGcmCiphertext: await encryptItem(itemToCache.metadata, indexKey),
                    });

                    if (itemToCache.content && !isObjectEmpty(itemToCache.content)) {
                        contentToAdd.push({
                            ID,
                            timepoint: getItemInfo(ItemMetadata).timepoint,
                            aesGcmCiphertext: await encryptItem(itemToCache.content, indexKey),
                        });
                    }
                }

                addToESCache<ESItemMetadata, ESItemContent>(itemToCache, esCacheRef, getItemInfo);

                if (!!esSearchParams) {
                    const hasApostrophe = (getKeywords(esSearchParams) || []).some((keyword) => keyword.includes(`'`));
                    if (applySearch(esSearchParams, itemToCache, hasApostrophe, esHelpers)) {
                        updatePermanentResults({ itemToCache: { ...itemToCache.metadata, ...itemToCache.content } });
                    }
                }
            }

            if (Action === ES_SYNC_ACTIONS.UPDATE_CONTENT || Action === ES_SYNC_ACTIONS.UPDATE_METADATA) {
                let newContent: ESItemContent | undefined;
                if (Action === ES_SYNC_ACTIONS.UPDATE_CONTENT) {
                    newContent = prefetchedContent.get(ID);
                    if (useContent && permanentStorage && !newContent) {
                        // If an error occured while fetching, we store
                        // the item's ID for later fetching of the content
                        await addRetry(userID, ID);
                    }
                }

                const itemToCache: CachedItem<ESItemMetadata, ESItemContent> = {
                    metadata: ItemMetadata,
                    content: newContent,
                };

                if (permanentStorage) {
                    // In case the action is only updating the metadata, we ignore updating the
                    // size estimate since it's likely very similar or exactly the same as the old one
                    metadataToAdd.push({
                        ID,
                        timepoint: getItemInfo(ItemMetadata).timepoint,
                        aesGcmCiphertext: await encryptItem(itemToCache.metadata, indexKey),
                        keepSize: Action === ES_SYNC_ACTIONS.UPDATE_METADATA,
                    });

                    if (itemToCache.content && !isObjectEmpty(itemToCache.content)) {
                        contentToAdd.push({
                            ID,
                            timepoint: getItemInfo(ItemMetadata).timepoint,
                            aesGcmCiphertext: await encryptItem(itemToCache.content, indexKey),
                        });
                    }
                }

                // IF i only want to update metadata
                // AND item have no content
                // AND cached item has content
                // THEN i reassign cached content
                if (Action === ES_SYNC_ACTIONS.UPDATE_METADATA && !itemToCache.content) {
                    const previousCachedItem = esCacheRef.current.esCache.get(getItemInfo(itemToCache.metadata).ID);
                    if (!!previousCachedItem?.content) {
                        itemToCache.content = previousCachedItem?.content;
                    }
                }

                addToESCache<ESItemMetadata, ESItemContent>(itemToCache, esCacheRef, getItemInfo);

                // If results are being shown:
                //   - if the old item was part of the search and the new one still is, update it;
                //   - if the old item was part of the search and the new one shouldn't be, delete it;
                //   - if the old item wasn't part of the search and the new one should be, add it;
                if (!!esSearchParams) {
                    const hasApostrophe = (getKeywords(esSearchParams) || []).some((keyword) => keyword.includes(`'`));
                    const resultIndex = findItemIndex(ID, permanentResults, getItemInfo);
                    if (resultIndex !== -1) {
                        if (
                            applySearch<ESItemMetadata, ESItemContent, ESSearchParameters>(
                                esSearchParams,
                                itemToCache,
                                hasApostrophe,
                                esHelpers
                            )
                        ) {
                            updatePermanentResults({
                                resultIndex,
                                itemToCache: { ...itemToCache.metadata, ...itemToCache.content },
                            });
                        } else {
                            updatePermanentResults({ resultIndex });
                        }
                    } else if (
                        applySearch<ESItemMetadata, ESItemContent, ESSearchParameters>(
                            esSearchParams,
                            itemToCache,
                            hasApostrophe,
                            esHelpers
                        )
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
            await setLimited(userID, true);
        }

        const metadataOutcome = await executeMetadataOperations(userID, metadataToRemove, metadataToAdd);

        const contentOutcome = await executeContentOperations(userID, contentToRemove, contentToAdd);

        if (!wasLimited && metadataOutcome === STORING_OUTCOME.SUCCESS && contentOutcome === STORING_OUTCOME.SUCCESS) {
            await setLimited(userID, false);
        }
    }

    return searchChanged;
};

/**
 * Return the IDs in the metadata table that are not in the content table
 */
export const findRecoveryPoint = async (userID: string) => {
    const esDB = await openESDB(userID);
    if (!esDB) {
        return;
    }

    const contentIDs = new Set(await esDB.getAllKeys('content'));
    const metadataIDs = await esDB.getAllKeysFromIndex('metadata', 'temporal');
    metadataIDs.reverse();

    const result: {
        timepoint?: ESTimepoint;
        contentLen: number;
        metadataLen: number;
    } = {
        contentLen: contentIDs.size,
        metadataLen: metadataIDs.length,
    };

    for (let i = 0; i < metadataIDs.length; i++) {
        if (!contentIDs.has(metadataIDs[i])) {
            if (i === 0) {
                return result;
            }
            // The recoveryPoint that content indexing expects refers to the last
            // indexed content, not the first missing one
            const ciphertext = await esDB.get('metadata', metadataIDs[i - 1]);
            esDB.close();
            if (ciphertext) {
                result.timepoint = ciphertext.timepoint;
                return result;
            }
        }
    }

    esDB.close();
};

/**
 * When an old key is activated, try to correct any previous decryption errors
 */
export const correctDecryptionErrors = async <ESItemMetadata, ESSearchParameters, ESItemContent>(
    userID: string,
    indexKey: CryptoKey,
    esHelpers: InternalESHelpers<ESItemMetadata, ESSearchParameters, ESItemContent>,
    recordProgress: (progress: number, total: number) => void,
    abortIndexingRef: React.MutableRefObject<AbortController>
) => {
    const { fetchESItemContent } = esHelpers;
    if (!fetchESItemContent) {
        return 0;
    }

    const recoveryPoint = await findRecoveryPoint(userID);
    if (!recoveryPoint) {
        // There are no items for which decryption failed
        return 0;
    }

    const { timepoint, contentLen, metadataLen } = recoveryPoint;

    const total = metadataLen - contentLen;
    recordProgress(0, total);

    await buildContentDB(
        userID,
        indexKey,
        abortIndexingRef,
        (progress: number) => recordProgress(progress, total),
        fetchESItemContent,
        timepoint,
        false
    );

    const count = (await readNumContent(userID)) || 0;
    return count - contentLen;
};

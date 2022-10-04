import { useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import useUser from '@proton/components/hooks/useUser';
import { useGetUserKeys } from '@proton/components/hooks/useUserKeys';
import { SECOND } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { isFirefox } from '@proton/shared/lib/helpers/browser';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { wait } from '@proton/shared/lib/helpers/promise';

import { ES_EXTRA_RESULTS_LIMIT, defaultESCache, defaultESHelpers, defaultESStatus } from './constants';
import {
    addESTimestamp,
    buildDB,
    cacheDB,
    canUseES,
    checkIsDBLimited,
    correctDecryptionErrors,
    decryptIndexKey,
    deleteESDB,
    esSentryReport,
    findItemIndex,
    getES,
    getESTotal,
    getIndexKey,
    getNumItemsDB,
    highlightJSX,
    hybridSearch,
    increaseNumPauses,
    indexKeyExists,
    initializeDB,
    insertMarks,
    isDBReadyAfterBuilding,
    refreshESCache,
    removeES,
    removeESFlags,
    requestPersistence,
    sendIndexingMetrics,
    sendSearchingMetrics,
    setES,
    setESCurrent,
    syncMessageEvents,
    uncachedSearch,
    wasIndexingDone,
} from './esHelpers';
import {
    ESCache,
    ESDBStatus,
    ESEvent,
    ESHelpers,
    ESStatus,
    EncryptedSearch,
    EncryptedSearchExecution,
    EncryptedSearchFunctions,
    HighlightMetadata,
    HighlightString,
    ResumeIndexing,
} from './models';

interface Props<ESItemMetadata, ESItem, ESSearchParameters, ESItemChanges, ESCiphertext> {
    storeName: string;
    indexName: string;
    primaryKeyName: string;
    indexKeyNames: [string, string];
    refreshMask: number;
    esHelpers: ESHelpers<ESItemMetadata, ESItem, ESSearchParameters, ESItemChanges, ESCiphertext>;
    successMessage: string;
}

/**
 * Provide the core funcionalities of ES.
 * @param storeName The name of the object store, i.e. the table, containing items
 * @param indexName The name of the temporal index, i.e. the one that is used to search in
 * (reverse) chronological order
 * @param primaryKeyName The name of the parameter of stored items which is to be used as
 * a primary key for the database
 * @param indexKeyNames The names of the parameters of stored items which are to be used as
 * primary keys for the temporal index. They must refer to two numerical values, the first
 * being the time of the item, the second being a unique numerical identifier, e.g. computed
 * from the ID
 * @param refreshMask A number representing the bit the BE sets to REFRESH_ALL on the specific
 * client
 * @param esHelpers All the callbacks that are product-specific and therefore need to be passed
 * to the ES core functions to work
 * @param successMessage The text that is showing in a green notification upon completing indexing
 * @returns An empy instance of the ES IndexedDB
 */
const useEncryptedSearch = <ESItemMetadata, ESItem, ESSearchParameters, ESItemChanges, ESCiphertext>({
    storeName,
    indexName,
    primaryKeyName,
    indexKeyNames,
    refreshMask,
    esHelpers: inputESHelpers,
    successMessage,
}: Props<ESItemMetadata, ESItem, ESSearchParameters, ESItemChanges, ESCiphertext>) => {
    const getUserKeys = useGetUserKeys();
    const api = useApi();
    const [user] = useUser();
    const { ID: userID } = user;
    const { createNotification } = useNotifications();
    const esHelpers: Required<ESHelpers<ESItemMetadata, ESItem, ESSearchParameters, ESItemChanges, ESCiphertext>> = {
        ...defaultESHelpers,
        ...inputESHelpers,
    };
    const { getSearchParams } = esHelpers;
    const { isSearch } = getSearchParams();

    // Keep a state of search results to update in case of new events
    // and information on the status of IndexedDB
    const [esStatus, setESStatus] = useState<ESStatus<ESItem, ESSearchParameters>>(defaultESStatus);
    // Keep a reference to cached items, such that they can be queried at any time
    const esCacheRef = useRef<ESCache<ESItem>>(defaultESCache);
    // Allow to abort indexing
    const abortIndexingRef = useRef<AbortController>(new AbortController());
    // Allow to abort searching
    const abortSearchingRef = useRef<AbortController>(new AbortController());
    // Allow to track progress during indexing or refreshing
    const progressRecorderRef = useRef<[number, number]>([0, 0]);
    // Allow to track progress during syncing
    const syncingEventsRef = useRef<Promise<void>>(Promise.resolve());

    /**
     * Chain several synchronisations to account for events being fired when
     * previous ones are still being processed
     */
    const addSyncing = async (callback: () => Promise<void>) => {
        syncingEventsRef.current = syncingEventsRef.current.then(() => callback());
    };

    /**
     * Wipe all local data related to ES, both from IndexedDB and local storage
     */
    const esDelete = async (inputUserID?: string) => {
        abortIndexingRef.current.abort();
        abortSearchingRef.current.abort();
        const uID = inputUserID || userID;
        esCacheRef.current = { ...defaultESCache };
        removeESFlags(uID);
        setESStatus(() => defaultESStatus);
        return deleteESDB(uID);
    };

    /**
     * Notify the user the DB is deleted. Typically this is needed if the key is no
     * longer usable to decrypt it
     */
    const dbCorruptError = async (inputUserID?: string) => {
        await esDelete(inputUserID);
        createNotification({
            text: c('Error').t`Please activate your content search again`,
            type: 'error',
        });
    };

    /**
     * Store progress of operations
     */
    const recordProgress = (progress: number, total: number) => {
        progressRecorderRef.current = [progress, total];
    };

    /**
     * @returns a reference object to two values related to an IndexedDB operation status.
     * The first number in the returned list is the current number of items processed while
     * the second is the total number of items to process. It is useful to show a progress bar.
     */
    const getProgressRecorderRef = () => {
        return progressRecorderRef;
    };

    /**
     * @returns an object containing boolean variables descrbing the status of the library,
     * which is useful to determine specific UI in certain occasions. The status contains
     * the following variables.
     * @var dbExists whether an instance of IndexedDB exists
     * @var isBuilding whether indexing is ongoing
     * @var isDBLimited whether IndexedDB has fewer than the total amount of items
     * @var esEnabled whether ES is enabled (in case a fallback to server-side search exists)
     * @var isRefreshing whether a refresh of IndexedDB (when correcting decryption errors) is ongoing
     * @var isSearchPartial whether the current search only has partial results. It happens when IndexedDB does not fit in cache
     * @var isSearching whether a search is ongoing
     * @var isCaching whether caching is ongoing
     */
    const getESDBStatus = () => {
        const {
            dbExists,
            isBuilding,
            isDBLimited,
            esEnabled,
            esSupported,
            isRefreshing,
            isSearchPartial,
            isSearching,
            isCaching,
        } = esStatus;
        const { isCacheLimited } = esCacheRef.current;
        const esDBStatus: ESDBStatus<ESItem, ESSearchParameters> = {
            dbExists,
            isBuilding,
            isDBLimited,
            esEnabled,
            esSupported,
            isCacheLimited,
            isRefreshing,
            isSearchPartial,
            isSearching,
            isCaching,
        };
        return esDBStatus;
    };

    /**
     * Reset to default only the parameters of ESStatus that are related to a search
     */
    const resetSearchStatus = (
        esStatus: ESStatus<ESItem, ESSearchParameters>
    ): ESStatus<ESItem, ESSearchParameters> => {
        return {
            ...esStatus,
            permanentResults: defaultESStatus.permanentResults,
            setResultsList: defaultESStatus.setResultsList,
            lastTimePoint: defaultESStatus.lastTimePoint,
            previousESSearchParams: defaultESStatus.previousESSearchParams,
            isSearchPartial: defaultESStatus.isSearchPartial,
            isSearching: defaultESStatus.isSearching,
        };
    };

    /**
     * Deactivates ES. This does not remove anything, and the database keeps being synced.
     * It is used to switch ES temporarily off in cases when server side search is available.
     */
    const toggleEncryptedSearch = () => {
        const currentOption = esStatus.esEnabled;

        setESStatus((esStatus) => {
            return {
                ...esStatus,
                esEnabled: !currentOption,
            };
        });

        if (currentOption) {
            abortSearchingRef.current.abort();
            removeES.Enabled(userID);
        } else {
            // Every time ES is enabled, we reset sorting to avoid carrying on with SIZE sorting in
            // case it was previously used. SIZE sorting is not supported by ES
            const { isSearch } = getSearchParams();
            if (isSearch) {
                esHelpers.resetSort();
            }
            setES.Enabled(userID);
        }

        // If IDB was evicted by the browser in the meantime, we erase everything else too
        void canUseES(userID, storeName).then((isIDBIntact) => {
            if (!isIDBIntact) {
                void dbCorruptError();
            }
        });
    };

    /**
     * Start the caching routine, i.e. fetching and decrypting as many items from the ES
     * database as possible to be stored in memory for quick access
     */
    const cacheIndexedDB = async () => {
        const { esEnabled, dbExists, cachedIndexKey, isCaching } = esStatus;

        if (dbExists && esEnabled) {
            const indexKey = cachedIndexKey || (await getIndexKey(getUserKeys, userID));
            const isIDBIntact = await canUseES(userID, storeName);
            if (!indexKey || !isIDBIntact) {
                return dbCorruptError();
            }

            const { isCacheReady } = esCacheRef.current;
            if (isCaching || isCacheReady) {
                return;
            }

            setESStatus((esStatus) => {
                return {
                    ...esStatus,
                    isCaching: true,
                    cachedIndexKey: indexKey,
                };
            });

            await cacheDB<ESItem, ESCiphertext>(
                indexKey,
                userID,
                esCacheRef,
                storeName,
                indexName,
                esHelpers.getTimePoint
            );

            esCacheRef.current.isCacheReady = true;
            setESStatus((esStatus) => {
                return {
                    ...esStatus,
                    isCaching: false,
                };
            });
        }
    };

    /**
     * Keep IndexedDB in sync with new events
     */
    const syncIndexedDB = async (
        event: ESEvent<ESItemChanges>,
        indexKey: CryptoKey,
        recordProgressLocal?: () => void
    ) => {
        const { Items, attemptReDecryption } = event;
        const isUpdatingMessageContent = typeof recordProgressLocal !== 'undefined';

        // In case a key is reactivated, try to fix any decryption error that might
        // have happened during indexing
        if (attemptReDecryption) {
            recordProgress(0, 0);

            // In case we weren't already showing the refreshing UI, we do now
            if (!isUpdatingMessageContent) {
                setESStatus((esStatus) => {
                    return {
                        ...esStatus,
                        isRefreshing: true,
                    };
                });
            }

            await correctDecryptionErrors<ESItemMetadata, ESItem, ESItemChanges, ESCiphertext, ESSearchParameters>(
                userID,
                indexKey,
                storeName,
                indexName,
                esHelpers,
                recordProgress,
                esCacheRef
            );

            if (!isUpdatingMessageContent) {
                setESStatus((esStatus) => {
                    return {
                        ...esStatus,
                        isRefreshing: false,
                    };
                });
            }
        }

        if (!Items || !Items.length) {
            return;
        }

        // Resetting is necessery to show appropriate UI when syncing immediately after refreshing
        if (attemptReDecryption) {
            recordProgress(0, 0);
        }

        const { permanentResults, setResultsList } = esStatus;
        const { esSearchParams } = getSearchParams();

        const searchChanged = await syncMessageEvents(
            Items,
            userID,
            esCacheRef,
            permanentResults,
            indexKey,
            esSearchParams,
            storeName,
            indexName,
            esHelpers,
            recordProgressLocal
        );

        if (searchChanged) {
            setResultsList(permanentResults);
            setESStatus((esStatus) => {
                return {
                    ...esStatus,
                    permanentResults,
                };
            });
        }
    };

    /**
     * Conclude any type of syncing routine
     */
    const finaliseSyncing = async (eventToStore: string | undefined, indexKey: CryptoKey) => {
        // In case everything goes through, save the last event(s) from which to
        // catch up the next time
        if (eventToStore) {
            setES.Event(userID, eventToStore);
        }

        // In case many items were removed from cache, fill the remaining space
        await refreshESCache<ESItem, ESCiphertext>(
            indexKey,
            userID,
            esCacheRef,
            storeName,
            indexName,
            esHelpers.getTimePoint
        );

        // Check if DB became limited after the update
        const isDBLimited = await checkIsDBLimited(userID, storeName, esHelpers.getTotalItems);
        setESStatus((esStatus) => {
            return {
                ...esStatus,
                isRefreshing: false,
                isDBLimited,
            };
        });
    };

    /**
     * Catch up with all changes contained in the given event
     */
    const catchUpFromEvent = async (indexKey: CryptoKey, currentEvent: ESEvent<ESItemChanges>): Promise<void> => {
        const isIDBIntact = await canUseES(userID, storeName);
        if (!isIDBIntact) {
            return dbCorruptError();
        }

        try {
            await syncIndexedDB(currentEvent, indexKey);
        } catch (error: any) {
            esSentryReport('catchUpFromEvent: syncIndexedDB', { error });
            setESStatus((esStatus) => {
                return {
                    ...esStatus,
                    isRefreshing: false,
                };
            });
            return catchUpFromEvent(indexKey, currentEvent);
        }

        return finaliseSyncing(currentEvent.eventToStore, indexKey);
    };

    /**
     * Fetch all events since a previously stored one
     */
    const catchUpFromLS = async (
        indexKey: CryptoKey,
        newEvents: ESEvent<ESItemChanges>[],
        eventToStore: string | undefined
    ): Promise<void> => {
        const isIDBIntact = await canUseES(userID, storeName);
        if (!isIDBIntact) {
            return dbCorruptError();
        }

        setESStatus((esStatus) => {
            return {
                ...esStatus,
                isRefreshing: true,
            };
        });

        // Resetting is necessery to show appropriate UI when syncing immediately after refreshing
        recordProgress(0, 0);

        const recordProgressLocal = () => {
            const [current] = progressRecorderRef.current;
            recordProgress(current + 1, newEvents.length);
        };

        try {
            // It's important that these events are synced sequentially
            for (const eventToCheck of newEvents) {
                await syncIndexedDB(eventToCheck, indexKey, recordProgressLocal);
            }
        } catch (error: any) {
            esSentryReport('catchUpFromLS: syncIndexedDB', { error });
            setESStatus((esStatus) => {
                return {
                    ...esStatus,
                    isRefreshing: false,
                };
            });
            return catchUpFromLS(indexKey, newEvents, eventToStore);
        }

        return finaliseSyncing(eventToStore, indexKey);
    };

    /**
     * Pause the currently ongoing indexing process, if any
     */
    const pauseIndexing = async () => {
        abortIndexingRef.current.abort();
        setESStatus((esStatus) => {
            return {
                ...esStatus,
                isBuilding: false,
            };
        });
        setES.Pause(userID);
        increaseNumPauses(userID);
        addESTimestamp(userID, 'stop');
        const isIDBIntact = await canUseES(userID, storeName);
        if (!isIDBIntact) {
            return dbCorruptError();
        }
    };

    /**
     * Start indexing for the first time or resume it after the user paused it. It optionally accepts
     * an object with two properties.
     * @param notify specifies whether any pop-up banner will be displayed to the user indicating success
     * or failure of the indexing process
     * @param isRefreshed is only used to be forward to the metrics route for statistical purposes.
     * Whenever the user manually starts indexing, the latter shouldn't be specified (and defaults to false).
     */
    const resumeIndexing: ResumeIndexing = async ({ notify, isRefreshed } = { notify: true, isRefreshed: false }) => {
        const isResumed = getES.Pause(userID);

        // If an indexing instance is already in progress, or if indexing
        // had already been completed, don't start a new one
        const { esEnabled, isBuilding, dbExists } = esStatus;
        if ((!isResumed && esEnabled) || isBuilding || dbExists) {
            return;
        }

        setESStatus((esStatus) => {
            return {
                ...esStatus,
                esEnabled: true,
            };
        });
        setES.Enabled(userID);

        const handleError = (notSupported?: boolean) => {
            if (notify) {
                createNotification({
                    text: notSupported
                        ? c('Error')
                              .t`Content search cannot be enabled in this browser. Please quit private browsing mode or use another browser.`
                        : c('Error').t`A problem occurred, please try again`,
                    type: 'error',
                });
            }
            setESStatus(() => ({ ...defaultESStatus, esSupported: !notSupported }));
        };

        removeES.Pause(userID);
        abortIndexingRef.current = new AbortController();

        let indexKey: CryptoKey;
        if (!indexKeyExists(userID) && !isResumed) {
            const { notSupported, indexKey: newIndexKey } = await initializeDB(
                userID,
                getUserKeys,
                isRefreshed || false,
                await esHelpers.getTotalItems(),
                storeName,
                indexName,
                primaryKeyName,
                indexKeyNames,
                esHelpers.getPreviousEventID
            );
            if (!newIndexKey) {
                return handleError(notSupported);
            }
            indexKey = newIndexKey;
        } else {
            const existingIndexKey = await getIndexKey(getUserKeys, userID);
            if (!existingIndexKey) {
                return dbCorruptError();
            }
            indexKey = existingIndexKey;
        }

        // We request storage persistence to prevent IDB from being evicted. In Firefox this
        // operation will trigger a popup asking the user to grant storage permission. If
        // such a popup appears after the user has explicitly activated ES, then its request
        // should come at no surprise. However, there are cases (e.g. at refresh or during
        // welcome flow for new users) in which indexing starts without a manual input from
        // the user, therefore such a popup will seem unrelated to any actions from the user's
        // perspective. For this reason, only when the browser is Firefox, we don't request
        // permission in cases indexing was not manually triggered.
        if (!isFirefox() || notify) {
            await requestPersistence();
        }

        const totalItems = getESTotal(userID);
        recordProgress(await getNumItemsDB(userID, storeName), totalItems);

        setESStatus((esStatus) => {
            return {
                ...esStatus,
                isBuilding: true,
            };
        });

        let success = totalItems === 0;
        while (!success) {
            const currentMessages = await getNumItemsDB(userID, storeName);
            recordProgress(currentMessages, totalItems);
            const recordProgressLocal = (progress: number) => {
                const newProgress = currentMessages + progress;
                setESCurrent(userID, newProgress);
                recordProgress(newProgress, totalItems);
            };

            success = await buildDB<ESItemMetadata, ESItem, ESCiphertext>(
                userID,
                indexKey,
                abortIndexingRef,
                recordProgressLocal,
                storeName,
                indexName,
                esHelpers
            );

            // Kill switch in case user logs out or pauses
            if (abortIndexingRef.current.signal.aborted || getES.Pause(userID)) {
                return;
            }

            const isIDBIntact = await canUseES(userID, storeName);
            if (!isIDBIntact) {
                return dbCorruptError();
            }

            // In case the procedure failed, wait some time before re-starting
            if (!success) {
                await wait(2 * SECOND);
            }
        }

        void sendIndexingMetrics(api, userID);

        // Finalise IndexedDB building by catching up with new items
        setESStatus((esStatus) => {
            return {
                ...esStatus,
                isBuilding: false,
            };
        });

        // Catch up with events since the last one before indexing, which was set in
        // the Event blob in localStorage during initialization. Note that we finalise
        // indexing even it this step fails, because it will be retried at every new
        // event and refresh
        let newEvents: ESEvent<ESItemChanges>[];
        let shouldRefresh: boolean;
        let eventToStore: string | undefined;
        try {
            ({ newEvents, shouldRefresh, eventToStore } = await esHelpers.getEventFromLS());
        } catch (error: any) {
            return dbCorruptError();
        }

        if (shouldRefresh) {
            return dbCorruptError();
        }

        const catchUpPromise = catchUpFromLS(indexKey, newEvents, eventToStore);
        void addSyncing(() => catchUpPromise);
        await catchUpPromise;

        // Note that it's safe to remove the BuildProgress blob because the event to catch
        // up from is stored in the Event blob and because the metrics report has already been sent
        removeES.Progress(userID);

        setESStatus((esStatus) => {
            return {
                ...esStatus,
                dbExists: true,
            };
        });

        if (notify) {
            createNotification({
                text: successMessage,
            });
        }
    };

    /**
     * Execute an encrypted search
     */
    const newEncryptedSearch: EncryptedSearchExecution<ESItem, ESSearchParameters> = async (
        setResultsList,
        esSearchParams,
        minimumItems
    ) => {
        const t1 = performance.now();
        const {
            previousESSearchParams,
            permanentResults,
            isSearchPartial: wasSearchPartial,
            cachedIndexKey,
            isCaching,
            isFirstSearch,
        } = esStatus;

        const isIDBIntact = await canUseES(userID, storeName);
        if (!isIDBIntact) {
            return dbCorruptError().then(() => false);
        }

        abortSearchingRef.current = new AbortController();

        // Caching needs to be triggered here for when a refresh happens on a search URL
        if (!isCaching && !esCacheRef.current.isCacheReady) {
            void cacheIndexedDB();
        }

        // In case only sorting changed, for complete searches it doesn't make sense to perform a new search
        if (!wasSearchPartial && previousESSearchParams) {
            const shouldSortOnly = esHelpers.shouldOnlySortResults(esSearchParams, previousESSearchParams);
            if (shouldSortOnly) {
                setResultsList(permanentResults);
                return true;
            }
        }

        setESStatus((esStatus) => {
            return {
                ...esStatus,
                isSearching: true,
                isSearchPartial: true,
                isFirstSearch: false,
            };
        });

        const controlledSetResultsList = (items: ESItem[]) => {
            if (!abortSearchingRef.current.signal.aborted) {
                setResultsList(items);
            }
        };

        let searchResults: ESItem[] = [];
        let isSearchPartial = false;
        let lastTimePoint: [number, number] | undefined;
        try {
            ({ searchResults, isSearchPartial, lastTimePoint } = await hybridSearch<
                ESItem,
                ESCiphertext,
                ESSearchParameters
            >(
                esCacheRef,
                esSearchParams,
                cachedIndexKey,
                getUserKeys,
                userID,
                controlledSetResultsList,
                abortSearchingRef,
                storeName,
                indexName,
                esHelpers,
                minimumItems
            ));
        } catch (error: any) {
            esSentryReport('encryptedSearch: hybridSearch', { error });
            // If the key is the problem, then we want to wipe the DB and fall back to
            // server-side search, otherwise we want to show a generic error and still
            // fall back to server-side search
            if (error.message === 'Key not found') {
                return dbCorruptError().then(() => false);
            }
            throw error;
        }

        if (!abortSearchingRef.current.signal.aborted) {
            setESStatus((esStatus) => {
                return {
                    ...esStatus,
                    permanentResults: searchResults,
                    setResultsList: setResultsList,
                    lastTimePoint,
                    previousESSearchParams: esSearchParams,
                    isSearchPartial,
                    isSearching: false,
                };
            });
            setResultsList(searchResults);

            const t2 = performance.now();
            void sendSearchingMetrics(
                api,
                userID,
                esCacheRef.current.cacheSize,
                Math.ceil(t2 - t1),
                isFirstSearch,
                esCacheRef.current.isCacheLimited,
                storeName
            );
        }

        return true;
    };

    /**
     * Increase the number of results in order to reach at least the next multiple of ES_EXTRA_RESULTS_LIMIT,
     * in case the cache is limited and the user wishes more
     */
    const incrementSearch: EncryptedSearchExecution<ESItem, ESSearchParameters> = async (
        setResultsList,
        esSearchParams,
        minimumItems
    ) => {
        const { permanentResults, lastTimePoint, cachedIndexKey } = esStatus;

        const extraItems = Math.max(
            ES_EXTRA_RESULTS_LIMIT * Math.ceil(permanentResults.length / ES_EXTRA_RESULTS_LIMIT) -
                permanentResults.length,
            minimumItems || 0
        );

        setESStatus((esStatus) => {
            return {
                ...esStatus,
                isSearching: true,
            };
        });

        const indexKey = cachedIndexKey || (await getIndexKey(getUserKeys, userID));
        if (!indexKey) {
            await dbCorruptError();
            return false;
        }

        const searchOutput = await uncachedSearch<ESItem, ESCiphertext, ESSearchParameters>(
            userID,
            indexKey,
            esSearchParams,
            storeName,
            indexName,
            esHelpers,
            extraItems,
            undefined,
            lastTimePoint,
            abortSearchingRef
        );

        if (!abortSearchingRef.current.signal.aborted) {
            permanentResults.push(...searchOutput.resultsArray);
            const newIsSearchPartial = !!searchOutput.lastTimePoint;

            setESStatus((esStatus) => {
                return {
                    ...esStatus,
                    permanentResults,
                    lastTimePoint: searchOutput.lastTimePoint,
                    isSearchPartial: newIsSearchPartial,
                    isSearching: false,
                };
            });
            setResultsList(permanentResults);
        }

        return true;
    };

    /**
     * Perform a new encrypted search or increment an existing one.
     * @param setResultsList a callback that will be given the items to show, i.e. those found as search
     * results, and that should handle the UI part of displaying them to the users
     * @param minimumItems is optional and refers to the smallest number of items that the search is
     * expected to produce. If specified this parameter instructs the search to try finding at least
     * this number of items from disk both when performing a new search with limited cache and when
     * incrementing an existing partial search
     * @returns a boolean indicating the success of the search
     */
    const encryptedSearch: EncryptedSearch<ESItem> = async (setResultsList, minimumItems) => {
        const { dbExists, esEnabled, isSearchPartial, previousESSearchParams } = esStatus;

        // In these cases no ES should be performed
        if (!dbExists || !esEnabled) {
            return false;
        }

        const { isSearch, esSearchParams } = getSearchParams();
        if (!isSearch || !esSearchParams) {
            return false;
        }

        const { isCacheLimited } = esCacheRef.current;
        if (
            isSearchPartial &&
            isCacheLimited &&
            previousESSearchParams &&
            isDeepEqual(esSearchParams, previousESSearchParams) &&
            !abortSearchingRef.current.signal.aborted
        ) {
            return incrementSearch(setResultsList, previousESSearchParams, minimumItems);
        }

        // Prevent old searches from interfering with newer ones
        abortSearchingRef.current.abort();
        setESStatus((esStatus) => resetSearchStatus(esStatus));

        return newEncryptedSearch(setResultsList, esSearchParams, minimumItems);
    };

    /**
     * @returns whether some conditions to apply highlighting are met, i.e. whether a search is
     * on and there are keywords. For example in cases where the user only specifies filters
     * and not keywords, this function returns false
     */
    const shouldHighlight = () => {
        const { isSearch, esSearchParams } = getSearchParams();
        if (!isSearch || !esSearchParams) {
            return false;
        }

        const keywords = esHelpers.getKeywords(esSearchParams);

        return typeof keywords !== 'undefined' && !!keywords.length;
    };

    /**
     * Insert the <mark></mark> highlighting markdown in a string and returns a string containing it,
     * which then needs to be displayed in the UI. Note that the keywords to highlight are extracted
     * directly with the parseSearchParams callback
     * @param content the string where to insert the markdown
     * @param setAutoScroll whether to insert the data-auto-scroll attribute to the first istance of
     * the inserted mark tags. The UI should automatically scroll, if possible, to said first tag
     * @returns the string containing the markdown
     */
    const highlightString: HighlightString = (content, setAutoScroll) => {
        const { esSearchParams } = getSearchParams();
        if (!esSearchParams) {
            return content;
        }

        const keywords = esHelpers.getKeywords(esSearchParams);
        if (!keywords) {
            return content;
        }

        return insertMarks(content, keywords, setAutoScroll);
    };

    /**
     * Inserts the <mark></mark> highlighting markdown in a string and returns directly the JSX node
     * to be used in React
     * @param metadata the string where to insert the markdown
     * @param isBold specifies whether the text should also be bolded (e.g. in some headers)
     * @param trim specifies whether to substitute the initial portion of the string by an ellipsis
     * if it's too long
     * @returns an object containing two properties: numOccurrences is the total number of times the
     * markdown tag has been added to the given string, while resultJSX is the actual React node to be
     * displayed
     */
    const highlightMetadata: HighlightMetadata = (metadata, isBold, trim) => {
        const noData = {
            numOccurrences: 0,
            resultJSX: <span>{metadata}</span>,
        };

        const { esSearchParams } = getSearchParams();
        if (!esSearchParams) {
            return noData;
        }

        const keywords = esHelpers.getKeywords(esSearchParams);
        if (!keywords) {
            return noData;
        }

        return highlightJSX(metadata, keywords, isBold, trim);
    };

    /**
     * @returns whether a given item, specified by its ID, is part of the currently shown search results or not.
     * It returns false if a search is not happening on going
     */
    const isSearchResult = (ID: string) => {
        const { dbExists, esEnabled, permanentResults } = esStatus;
        const { isSearch } = getSearchParams();
        if (!(dbExists && esEnabled && isSearch)) {
            return false;
        }

        return findItemIndex(ID, permanentResults, esHelpers.getItemID) !== -1;
    };

    /**
     * Remove the index and restart ES by creating a new one from scratch
     */
    const restartIndexing = async (notify?: boolean) => {
        await esDelete();
        return resumeIndexing({ isRefreshed: true, notify });
    };

    /**
     * Process events (according to the provided callbacks). It should be used in whatever event handling
     * system the product uses to correctly sync the ES database.
     * @param event a single event containing a change to the items stored in the ES database
     */
    const handleEvent = async (event: ESEvent<ESItemChanges>) => {
        const { dbExists, cachedIndexKey } = esStatus;
        if (!dbExists) {
            return;
        }

        const indexKey = cachedIndexKey || (await getIndexKey(getUserKeys, userID));
        const isIDBIntact = await canUseES(userID, storeName);
        if (!indexKey || !isIDBIntact) {
            return dbCorruptError();
        }

        // Every time a new event happens, we simply catch up everything since the last
        // processed event. In case any failure occurs, the event ID stored will not be
        // overwritten
        if (hasBit(event.Refresh, refreshMask)) {
            return restartIndexing();
        }

        void addSyncing(() => catchUpFromEvent(indexKey, event));
    };

    /**
     * Run some initial checks on the status of ES. This must be the first function that
     * the EncryptedSearchProvider runs, as it checks for new events, continues indexing in
     * case a previous one was started, checks whether the index key is still accessible
     */
    const initializeES = async () => {
        // Run whatever custom initialization is needed by the product, potentially
        // returning whether to start a silent indexing
        if (await esHelpers.indexNewUser()) {
            return resumeIndexing({ notify: false });
        }

        // If no ES:*:Key blob can be found, the user has never activated ES.
        const armoredKey = getES.Key(userID);
        if (!armoredKey) {
            return;
        }

        // If the blob can be found but failed decryption, password was reset therefore we
        // index again under the new user key.
        let indexKey: CryptoKey;
        try {
            indexKey = await decryptIndexKey(getUserKeys, armoredKey);
        } catch (error: any) {
            return await restartIndexing(false);
        }

        const isIDBIntact = await canUseES(userID, storeName);
        if (!indexKey || !isIDBIntact) {
            return dbCorruptError();
        }

        setESStatus((esStatus) => {
            return {
                ...esStatus,
                dbExists: wasIndexingDone(userID),
                esEnabled: getES.Enabled(userID),
            };
        });

        // If indexing was not successful, try to recover (unless it was paused).
        // Otherwise, just set the correct parameters to ESDBStatus
        if (!isDBReadyAfterBuilding(userID)) {
            if (!getES.Pause(userID)) {
                await resumeIndexing();
            }
            return;
        }

        // Compare the last event "seen" by the DB (saved in localStorage) and
        // the present one to check whether any event has happened while offline,
        // but only if indexing was successful
        let newEvents: ESEvent<ESItemChanges>[];
        let shouldRefresh: boolean;
        let eventToStore: string | undefined;
        try {
            ({ newEvents, shouldRefresh, eventToStore } = await esHelpers.getEventFromLS());
        } catch (error: any) {
            return await dbCorruptError();
        }

        if (shouldRefresh) {
            return restartIndexing();
        }

        void addSyncing(() => catchUpFromLS(indexKey, newEvents, eventToStore));
    };

    /**
     * Remove previous search data from the status when no longer in search mode
     */
    useEffect(() => {
        if (!isSearch) {
            abortSearchingRef.current.abort();
            setESStatus((esStatus) => resetSearchStatus(esStatus));
        }
    }, [isSearch]);

    const esFunctions: EncryptedSearchFunctions<ESItem, ESSearchParameters, ESItemChanges> = useMemo(
        () => ({
            encryptedSearch,
            cacheIndexedDB,
            getESDBStatus,
            toggleEncryptedSearch,
            resumeIndexing,
            pauseIndexing,
            getProgressRecorderRef,
            highlightString,
            highlightMetadata,
            shouldHighlight,
            isSearchResult,
            esDelete,
            handleEvent,
            initializeES,
        }),
        [userID, esStatus]
    );

    return esFunctions;
};

export default useEncryptedSearch;

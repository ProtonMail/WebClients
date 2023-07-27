import { useEffect, useMemo, useRef, useState } from 'react';

import { IDBPDatabase } from 'idb';
import { c } from 'ttag';

import { useOnLogout } from '@proton/components';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import useUser from '@proton/components/hooks/useUser';
import { useGetUserKeys } from '@proton/components/hooks/useUserKeys';
import { SECOND } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { isFirefox } from '@proton/shared/lib/helpers/browser';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { wait } from '@proton/shared/lib/helpers/promise';

import {
    ES_EXTRA_RESULTS_LIMIT,
    INDEXING_STATUS,
    STORING_OUTCOME,
    TIMESTAMP_TYPE,
    defaultESCache,
    defaultESHelpers,
    defaultESProgress,
    defaultESStatus,
} from './constants';
import {
    buildContentDB,
    buildMetadataDB,
    cacheIDB,
    correctDecryptionErrors,
    esSentryReport,
    findItemIndex,
    getIndexKey,
    highlightJSX,
    hybridSearch,
    initializeEncryptedSearch,
    insertMarks,
    refreshESCache,
    removeESFlags,
    requestPersistence,
    retryAPICalls,
    retryContentIndexing,
    sendIndexingMetrics,
    sendSearchingMetrics,
    syncItemEvents,
    uncachedSearch,
} from './esHelpers';
import {
    checkVersionedESDB,
    contentIndexingProgress,
    deleteESDB,
    metadataIndexingProgress,
    openESDB,
    readAllLastEvents,
    readEnabled,
    readLimited,
    readNumContent,
    readNumMetadata,
    setLimited,
    toggleEnabled,
    writeAllEvents,
} from './esIDB';
import {
    ESCache,
    ESDBStatus,
    ESEvent,
    ESHelpers,
    ESItem,
    ESProgress,
    ESStatus,
    ESTimepoint,
    EnableContentSearch,
    EnableEncryptedSearch,
    EncryptedSearch,
    EncryptedSearchDB,
    EncryptedSearchExecution,
    EncryptedSearchFunctions,
    EventsObject,
    HighlightMetadata,
    HighlightString,
    InternalESHelpers,
} from './models';

interface Props<ESItemMetadata, ESSearchParameters, ESItemContent = void> {
    refreshMask: number;
    esHelpers: ESHelpers<ESItemMetadata, ESSearchParameters, ESItemContent>;
    successMessage: string;
    notifyMetadataIndexed?: boolean;
}

/**
 * Provide the core funcionalities of ES.
 * @param refreshMask A number representing the bit the BE sets to REFRESH_ALL on the specific
 * client
 * @param esHelpers All the callbacks that are product-specific and therefore need to be passed
 * to the ES core functions to work
 * @param successMessage The text that is showing in a green notification upon completing indexing
 * @returns An empy instance of the ES IndexedDB
 */
const useEncryptedSearch = <ESItemMetadata extends Object, ESSearchParameters, ESItemContent = void>({
    refreshMask,
    esHelpers: inputESHelpers,
    successMessage,
    notifyMetadataIndexed = false,
}: Props<ESItemMetadata, ESSearchParameters, ESItemContent>) => {
    const getUserKeys = useGetUserKeys();
    const api = useApi();
    const [user] = useUser();
    const { ID: userID } = user;
    const { createNotification } = useNotifications();
    const esHelpers: InternalESHelpers<ESItemMetadata, ESSearchParameters, ESItemContent> = {
        ...defaultESHelpers,
        ...inputESHelpers,
    };
    const { getSearchParams } = esHelpers;
    const { isSearch } = getSearchParams();

    // Keep a state of search results to update in case of new events
    // and information on the status of IndexedDB
    const [esStatus, setESStatus] =
        useState<ESStatus<ESItemMetadata, ESItemContent, ESSearchParameters>>(defaultESStatus);
    // Keep a reference to cached items, such that they can be queried at any time
    const esCacheRef = useRef<ESCache<ESItemMetadata, ESItemContent>>(defaultESCache);
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
     * Reset the cache to its default empty state
     */
    const resetCache = () => {
        // Note that assigning values from defaultESCache doesn't work
        esCacheRef.current.esCache = new Map();
        esCacheRef.current.cacheSize = 0;
        esCacheRef.current.isCacheLimited = false;
        esCacheRef.current.isCacheReady = false;
    };
    useOnLogout(async () => resetCache());

    /**
     * Wipe all local data related to ES
     */
    const esDelete = async () => {
        abortIndexingRef.current.abort();
        abortSearchingRef.current.abort();
        resetCache();
        // Note that currently no local storage blobs exist,
        // however in a legacy version they did
        removeESFlags(userID);
        setESStatus(() => defaultESStatus);
        return deleteESDB(userID);
    };

    /**
     * Notify the user the DB is deleted. Typically this is needed if the key is no
     * longer usable to decrypt it
     */
    const dbCorruptError = async () => {
        await esDelete();
        createNotification({
            text: c('Error').t`Please activate your search again`,
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
     * the second is the total number of items to process. It is useful to show a progress bar
     */
    const getProgressRecorderRef = () => {
        return progressRecorderRef;
    };

    /**
     * @returns an object containing boolean variables descrbing the status of the library,
     * which is useful to determine specific UI in certain occasions. The status contains
     * the following variables.
     * @var dbExists whether an instance of IndexedDB exists
     * @var isEnablingContentSearch whether indexing is ongoing
     * @var isDBLimited whether IndexedDB has fewer than the total amount of items
     * @var esEnabled whether ES is enabled (in case a fallback to server-side search exists)
     * @var isRefreshing whether a refresh of IndexedDB (when correcting decryption errors) is ongoing
     * @var isSearchPartial whether the current search only has partial results. It happens when IndexedDB does not fit in cache
     * @var isSearching whether a search is ongoing
     * @var isCacheLimited whether the cache is limited, i.e. it doesn't contain all items that are in IndexedDB
     * @var isEnablingEncryptedSearch whether indexing of metadata is ongoing
     * @var isPaused whether content indexing is paused
     * @var contentIndexingDone whether content indexing has completed
     */
    const getESDBStatus = () => {
        const {
            dbExists,
            isEnablingContentSearch,
            isDBLimited,
            esEnabled,
            esSupported,
            isRefreshing,
            isSearchPartial,
            isSearching,
            isEnablingEncryptedSearch,
            isPaused,
            contentIndexingDone,
        } = esStatus;
        const { isCacheLimited, isCacheReady } = esCacheRef.current;
        const esDBStatus: ESDBStatus<ESItemMetadata, ESItemContent, ESSearchParameters> = {
            dbExists,
            isEnablingContentSearch,
            isDBLimited,
            esEnabled,
            esSupported,
            isCacheLimited,
            isCacheReady,
            isRefreshing,
            isSearchPartial,
            isSearching,
            isEnablingEncryptedSearch,
            isPaused,
            contentIndexingDone,
        };
        return esDBStatus;
    };

    /**
     * Reset to default only the parameters of ESStatus that are related to a search
     */
    const resetSearchStatus = (
        esStatus: ESStatus<ESItemMetadata, ESItemContent, ESSearchParameters>
    ): ESStatus<ESItemMetadata, ESItemContent, ESSearchParameters> => {
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
    const toggleEncryptedSearch = async () => {
        const currentOption = esStatus.esEnabled;

        await toggleEnabled(userID);
        setESStatus((esStatus) => ({
            ...esStatus,
            esEnabled: !currentOption,
        }));

        if (currentOption) {
            abortSearchingRef.current.abort();
        } else {
            // Every time ES is enabled, we reset sorting to avoid carrying on with SIZE sorting in
            // case it was previously used. SIZE sorting is not supported by ES
            const { isSearch } = getSearchParams();
            if (isSearch) {
                esHelpers.resetSort();
            }
        }
    };

    /**
     * Start the caching routine, i.e. fetching and decrypting as many items from the ES
     * database as possible to be stored in memory for quick access
     */
    const cacheIndexedDB = async () => {
        const { esEnabled, dbExists, cachedIndexKey } = esStatus;

        if (!dbExists || !esEnabled || esCacheRef.current.isCacheReady) {
            return;
        }

        const indexKey = cachedIndexKey || (await getIndexKey(getUserKeys, userID));
        if (!indexKey) {
            await dbCorruptError();
            return;
        }

        setESStatus((esStatus) => ({
            ...esStatus,
            cachedIndexKey: indexKey,
        }));

        return cacheIDB<ESItemMetadata, ESItemContent>(indexKey, userID, esCacheRef);
    };

    /**
     * Keep IndexedDB in sync with new events
     */
    const syncIndexedDB = async (
        event: ESEvent<ESItemMetadata>,
        indexKey: CryptoKey | undefined,
        recordProgressLocal?: () => void
    ) => {
        const { Items, attemptReDecryption } = event;
        const isUpdatingItemContent = typeof recordProgressLocal !== 'undefined';

        const { permanentResults, setResultsList, contentIndexingDone } = esStatus;

        // In case a key is reactivated, try to fix any decryption error that might
        // have happened during indexing, but only if content indexing is done, otherwise
        // there might not be all content in IDB
        if (contentIndexingDone && attemptReDecryption && !!esHelpers.fetchESItemContent) {
            recordProgress(0, 0);

            // In case we weren't already showing the refreshing UI, we do now
            if (!isUpdatingItemContent) {
                setESStatus((esStatus) => ({
                    ...esStatus,
                    isRefreshing: true,
                }));
            }

            if (indexKey) {
                abortIndexingRef.current = new AbortController();
                const newItemsFound = await correctDecryptionErrors<ESItemMetadata, ESSearchParameters, ESItemContent>(
                    userID,
                    indexKey,
                    esHelpers,
                    recordProgress,
                    abortIndexingRef
                );

                // In case new items were added to ESDB this way, cache should be reset.
                // Next time the user interacts with the searchbar or searches, it will be rebuilt
                if (newItemsFound) {
                    resetCache();
                }
            }

            if (!isUpdatingItemContent) {
                setESStatus((esStatus) => ({
                    ...esStatus,
                    isRefreshing: false,
                }));
            }
        }

        if (!Items || !Items.length) {
            return;
        }

        // Resetting is necessery to show appropriate UI when syncing immediately after refreshing
        if (attemptReDecryption) {
            recordProgress(0, 0);
        }

        const { esSearchParams } = getSearchParams();
        const searchChanged = await syncItemEvents<ESItemContent, ESItemMetadata, ESSearchParameters>(
            Items,
            userID,
            esCacheRef,
            permanentResults,
            indexKey,
            esSearchParams,
            esHelpers,
            recordProgressLocal
        );

        if (searchChanged) {
            setResultsList(permanentResults);
            setESStatus((esStatus) => ({
                ...esStatus,
                permanentResults,
            }));
        }
    };

    /**
     * Conclude any type of syncing routine
     */
    const finaliseSyncing = async (eventsToStore: EventsObject, indexKey: CryptoKey | undefined) => {
        // In case everything goes through, save the last event(s) from which to
        // catch up the next time, but only in case either content is not indexed at all
        // of if it already finished. If content indexing is ongoing, we don't overwrite the
        // last event IDs from IDB because we'll need to catch up from them to update content.
        // In other words, metadata will be re-synced once the latter happens
        const { isEnablingContentSearch, isPaused } = esStatus;
        if (!isEnablingContentSearch && !isPaused) {
            await writeAllEvents(userID, eventsToStore);
        }

        // In case many items were removed from cache, or from IDB, fill the remaining space
        let isDBLimited: boolean | undefined;
        if (!!indexKey) {
            const contentProgress = await contentIndexingProgress.read(userID);
            if (!!contentProgress && contentProgress.status === INDEXING_STATUS.ACTIVE) {
                abortIndexingRef.current = new AbortController();
                await retryContentIndexing(userID, indexKey, esHelpers, abortIndexingRef);
            }
            await refreshESCache<ESItemMetadata, ESItemContent>(indexKey, userID, esCacheRef, esHelpers.getItemInfo);

            await retryAPICalls<ESItemContent>(userID, indexKey, esHelpers.fetchESItemContent);

            // Check if DB became limited or not after the update
            isDBLimited = await readLimited(userID);
        }

        setESStatus((esStatus) => ({
            ...esStatus,
            isRefreshing: false,
            isDBLimited: isDBLimited ?? esStatus.isDBLimited,
        }));
    };

    /**
     * Catch up with all changes contained in the given event
     */
    const catchUpFromEvent = async (indexKey: CryptoKey, currentEvent: ESEvent<ESItemMetadata>): Promise<void> => {
        try {
            await syncIndexedDB(currentEvent, indexKey);
            return await finaliseSyncing(currentEvent.eventsToStore, indexKey);
        } catch (error: any) {
            esSentryReport('catchUpFromEvent: syncIndexedDB', { error });
            setESStatus((esStatus) => ({
                ...esStatus,
                isRefreshing: false,
            }));
            return catchUpFromEvent(indexKey, currentEvent);
        }
    };

    /**
     * Fetch all events since a previously stored one
     */
    const catchUpFromLastEvents = async (
        indexKey: CryptoKey | undefined,
        newEvents: ESEvent<ESItemMetadata>[],
        eventsToStore: EventsObject
    ): Promise<void> => {
        setESStatus((esStatus) => ({
            ...esStatus,
            isRefreshing: true,
        }));

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
            return await finaliseSyncing(eventsToStore, indexKey);
        } catch (error: any) {
            esSentryReport('catchUpFromLastEvents: syncIndexedDB', { error });
            setESStatus((esStatus) => ({
                ...esStatus,
                isRefreshing: false,
            }));
            return catchUpFromLastEvents(indexKey, newEvents, eventsToStore);
        }
    };

    /**
     * Set up the ES IndexedDB and populate it with items metadata. It optionally accepts
     * an object with one property.
     * @param isRefreshed is only used to be forward to the metrics route for statistical purposes.
     * Whenever the user manually starts indexing, the latter shouldn't be specified (and defaults to false).
     */
    const enableEncryptedSearch: EnableEncryptedSearch = async ({
        isRefreshed = false,
        isBackgroundIndexing = false,
        showErrorNotification = true,
    } = {}) => {
        // If indexing instance is already in progress, don't start a new one
        const { isEnablingEncryptedSearch } = esStatus;
        if (isEnablingEncryptedSearch) {
            return false;
        }

        setESStatus((esStatus) => ({
            ...esStatus,
            isEnablingEncryptedSearch: true,
        }));

        const handleError = async (esSupported = true) => {
            if (showErrorNotification) {
                createNotification({
                    text: esSupported
                        ? c('Error').t`A problem occurred, please try again.`
                        : c('Error')
                              .t`Content search cannot be enabled in this browser. Please quit private browsing mode or use another browser.`,
                    type: 'error',
                });
            }
            await esDelete();
            return false;
        };

        const esdbExists = await checkVersionedESDB(userID);

        /*
            There are several cases for this variable:
            - if ESDB exists, it means that a metadata indexing had already been started, therefore
            the "previous event ID", i.e. prior to starting it, was already stored in ESDB. In other
            words, the event ID we're querying now is just a random later one and should therefore be
            overwritten with the one from ESDB.
            - if ESDB doesn't exist and can be created, i.e. IndexedDB is supported by the browser, then
            the event ID we're querying is the one immediately prior to metadata indexing, therefore it
            should be stored in ESDB.
            - if ESDB doesn't exist but cannot be created, e.g. Firefox in incognito mode, then this also
            represents the one immediately prior to metadata indexing. We should keep track of it to sync
            metadata, but we cannot store it to ESDB because the latter can't exist.
        */
        let previousEventID = await esHelpers.getPreviousEventID();

        let indexKey: CryptoKey | undefined;
        let esSupported = true;
        if (esdbExists) {
            const esProgress = await metadataIndexingProgress.read(userID);
            // If indexing was already completed, don't start a new one
            if (esProgress && esProgress.status === INDEXING_STATUS.ACTIVE) {
                return true;
            }

            // By virtue of the first point above about previousEventID, we overwrite it
            // with the one stored in ESDB
            const storedPreviousEventID = await readAllLastEvents(userID);
            if (!storedPreviousEventID) {
                return handleError();
            }
            previousEventID = storedPreviousEventID;

            // Otherwise indexing should resume
            const esDB = await openESDB(userID);
            indexKey = await getIndexKey(getUserKeys, userID);

            esSupported = !!indexKey && !!esDB;
            esDB?.close();

            // Note that at this point esDB nor indexKey can be undefined, and there
            // is a problem if either of them is
            if (!esSupported) {
                return handleError();
            }
        } else {
            try {
                let esDB: IDBPDatabase<EncryptedSearchDB> | undefined;
                ({ indexKey, esDB } = await initializeEncryptedSearch(
                    userID,
                    getUserKeys,
                    previousEventID,
                    isRefreshed,
                    await esHelpers.getTotalItems()
                ));

                esSupported = !!indexKey && !!esDB;

                esDB?.close();
            } catch (error: any) {
                esSentryReport('initializeEncryptedSearch', { error });
                esSupported = false;
            }
        }

        // In case IDB cannot be instantiated, we temporarily don't allow to continue
        // with metadata indexing. However by removing this check alone, memory-only
        // metadata indexing can be supported
        if (!esSupported) {
            return handleError(false);
        }

        // esSupported is false when we can't initialise IndexedDB and therefore ES
        // will be cache only.
        setESStatus((esStatus) => ({
            ...esStatus,
            esSupported,
            cachedIndexKey: indexKey,
            dbExists: true,
        }));

        // Even though this procedure cannot be paused, this is still useful
        // in case of clearing data and logout
        abortIndexingRef.current = new AbortController();

        const currentItems = (await readNumMetadata(userID)) || 0;
        const totalItems = await esHelpers.getTotalItems();
        recordProgress(currentItems, totalItems);
        const recordProgressLocal = (progress: number) => {
            const newProgress = currentItems + progress;
            recordProgress(newProgress, totalItems);
        };

        let success = false;
        while (!success) {
            success = await buildMetadataDB<ESItemMetadata>(
                userID,
                esSupported,
                indexKey,
                esCacheRef,
                esHelpers.queryItemsMetadata,
                esHelpers.getItemInfo,
                abortIndexingRef,
                recordProgressLocal,
                isBackgroundIndexing
            );

            // Kill switch in case user logs out or deletes data
            if (abortIndexingRef.current.signal.aborted) {
                await esDelete();
                return false;
            }

            // In case the procedure failed, wait some time before re-starting
            if (!success) {
                await wait(2 * SECOND);
            }
        }

        // Catch up with events since the last one before indexing, which was set in
        // the Event blob in localStorage during initialization. Note that we finalise
        // indexing even it this step fails, because it will be retried at every new
        // event and refresh
        let newEvents: ESEvent<ESItemMetadata>[];
        let shouldRefresh: boolean;
        let eventsToStore: EventsObject;
        try {
            ({ newEvents, shouldRefresh, eventsToStore } = await esHelpers.getEventFromIDB(previousEventID));
        } catch (error: any) {
            return handleError();
        }

        if (shouldRefresh) {
            return handleError();
        }

        const catchUpPromise = catchUpFromLastEvents(indexKey, newEvents, eventsToStore);
        void addSyncing(() => catchUpPromise);
        await catchUpPromise;

        const wasESDBCreated = await checkVersionedESDB(userID);

        // Paginated indexing has the problem that if the user deletes completely some items
        // in pages that have already been queried, all subsequent items are shifted. Therefore
        // later pages will contain different items than if the deletion had never occured. The
        // end result is that some items are not indexed. Since it's tricky and slow to figure
        // out which ones, we instead just delete everything and notify users
        if (wasESDBCreated) {
            const finalIndexed = await readNumMetadata(userID);
            const finalMailbox = await esHelpers.getTotalItems();
            if (typeof finalIndexed === 'undefined' || finalIndexed < finalMailbox) {
                return handleError();
            }

            await metadataIndexingProgress.setActiveStatus(userID);
            await toggleEnabled(userID);
        }

        setESStatus((esStatus) => ({
            ...esStatus,
            isEnablingEncryptedSearch: false,
            esEnabled: true,
        }));

        if (notifyMetadataIndexed) {
            createNotification({
                text: successMessage,
            });
        }

        // In case this process did not create an IDB, e.g. because it's a memory only
        // metadata index, it cannot be considered succesfull as otherwise content
        // indexing would be tried
        return wasESDBCreated;
    };

    /**
     * Pause the currently ongoing indexing process, if any
     */
    const pauseIndexing = async () => {
        abortIndexingRef.current.abort();
        setESStatus((esStatus) => ({
            ...esStatus,
            isEnablingContentSearch: false,
            isPaused: true,
        }));

        await contentIndexingProgress.setStatus(userID, INDEXING_STATUS.PAUSED);
        await contentIndexingProgress.incrementNumPauses(userID);
        await contentIndexingProgress.addTimestamp(userID, TIMESTAMP_TYPE.STOP);
    };

    /**
     * Start indexing for the first time or resume it after the user paused it. It optionally accepts
     * an object with two properties.
     * @param notify specifies whether any pop-up banner will be displayed to the user indicating success
     * or failure of the indexing process
     * @param isRefreshed is only used to be forward to the metrics route for statistical purposes.
     * Whenever the user manually starts indexing, the latter shouldn't be specified (and defaults to false).
     */
    const enableContentSearch: EnableContentSearch = async ({
        notify = true,
        isRefreshed = false,
        isBackgroundIndexing = false,
    } = {}) => {
        // If there is no fetch content helper, content search cannot be activated at all
        const { fetchESItemContent } = esHelpers;
        if (!fetchESItemContent) {
            console.error('Content search cannot be activated without the fetch content helper');
            return;
        }

        // If an indexing instance is already in progress don't start a new one
        const { isEnablingContentSearch, esSupported } = esStatus;
        if (isEnablingContentSearch) {
            return;
        }

        if (!esSupported) {
            createNotification({
                text: c('Error')
                    .t`Content search cannot be enabled in this browser. Please quit private browsing mode or use another browser.`,
                type: 'error',
            });
            return;
        }

        const indexKey = await getIndexKey(getUserKeys, userID);
        if (!indexKey) {
            return dbCorruptError();
        }

        setESStatus((esStatus) => ({
            ...esStatus,
            isEnablingContentSearch: true,
            isPaused: false,
            esEnabled: false,
        }));

        const previousProgress = await contentIndexingProgress.read(userID);

        const currentItems = (await readNumContent(userID)) || 0;
        let totalItems = 0;
        let recoveryPoint: ESTimepoint | undefined;
        if (!previousProgress) {
            // Save the event before starting building IndexedDB. The number of items
            // before indexing aims to show progress, as new items will be synced only
            // after indexing has completed
            await writeAllEvents(userID, await esHelpers.getPreviousEventID());

            totalItems = await esHelpers.getTotalItems();
            const initialProgress: ESProgress = {
                ...defaultESProgress,
                totalItems,
                isRefreshed,
                status: INDEXING_STATUS.INDEXING,
            };
            await contentIndexingProgress.write(userID, initialProgress);
        } else {
            await contentIndexingProgress.setStatus(userID, INDEXING_STATUS.INDEXING);
            ({ totalItems, recoveryPoint } = previousProgress);
        }

        abortIndexingRef.current = new AbortController();

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

        // We default to having the limited flag to true and
        // only revert if by the end IDB is not limited
        await setLimited(userID, true);

        recordProgress(currentItems, totalItems);

        let indexingOutcome = STORING_OUTCOME.SUCCESS;
        let success = totalItems === 0;
        while (!success) {
            const recordProgressLocal = (progress: number) => {
                const newProgress = currentItems + progress;
                recordProgress(newProgress, totalItems);
            };

            try {
                indexingOutcome = await buildContentDB<ESItemContent>(
                    userID,
                    indexKey,
                    abortIndexingRef,
                    recordProgressLocal,
                    fetchESItemContent,
                    recoveryPoint,
                    true,
                    isBackgroundIndexing
                );
            } catch (error: any) {
                if (abortIndexingRef.current.signal.aborted) {
                    return;
                }
                esSentryReport('buildContentDB', { error });
                return dbCorruptError();
            }

            // Kill switch in case user logs out or pauses
            if (abortIndexingRef.current.signal.aborted) {
                return;
            }

            success = indexingOutcome === STORING_OUTCOME.SUCCESS || indexingOutcome === STORING_OUTCOME.QUOTA;

            // In case the procedure failed, wait some time before re-starting
            if (!success) {
                await wait(2 * SECOND);
            }
        }

        // Since we default to having the limited flag to true in IDB,
        // in case it is not limited we overwrite it
        if (indexingOutcome === STORING_OUTCOME.SUCCESS) {
            await setLimited(userID, false);
        }

        // Catch up with events since the last one before indexing, which was set in
        // the Event blob in localStorage during initialization. Note that we finalise
        // indexing even it this step fails, because it will be retried at every new
        // event and refresh
        let newEvents: ESEvent<ESItemMetadata>[];
        let shouldRefresh: boolean;
        let eventsToStore: EventsObject;
        try {
            ({ newEvents, shouldRefresh, eventsToStore } = await esHelpers.getEventFromIDB());
        } catch (error: any) {
            return dbCorruptError();
        }

        if (shouldRefresh) {
            return dbCorruptError();
        }

        await contentIndexingProgress.setActiveStatus(userID);
        setESStatus((esStatus) => ({
            ...esStatus,
            isEnablingContentSearch: false,
            contentIndexingDone: true,
            esEnabled: true,
        }));

        const catchUpPromise = catchUpFromLastEvents(indexKey, newEvents, eventsToStore);
        void addSyncing(() => catchUpPromise);
        await catchUpPromise;

        await contentIndexingProgress.addTimestamp(userID, TIMESTAMP_TYPE.STOP);
        void sendIndexingMetrics(api, userID);

        if (notify) {
            createNotification({
                text: successMessage,
            });
        }
    };

    /**
     * Execute an encrypted search
     */
    const newEncryptedSearch: EncryptedSearchExecution<ESItemMetadata, ESItemContent, ESSearchParameters> = async (
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
            isFirstSearch,
        } = esStatus;

        abortSearchingRef.current = new AbortController();

        // In case only sorting changed, for complete searches it doesn't make sense to perform a new search
        if (!wasSearchPartial && previousESSearchParams) {
            const shouldSortOnly = esHelpers.shouldOnlySortResults(esSearchParams, previousESSearchParams);
            if (shouldSortOnly) {
                setResultsList(permanentResults);
                return true;
            }
        }

        setESStatus((esStatus) => ({
            ...esStatus,
            isSearching: true,
            isSearchPartial: true,
            isFirstSearch: false,
        }));

        const controlledSetResultsList = (items: ESItem<ESItemMetadata, ESItemContent>[]) => {
            if (!abortSearchingRef.current.signal.aborted) {
                setResultsList(items);
            }
        };

        let searchResults: ESItem<ESItemMetadata, ESItemContent>[] = [];
        let isSearchPartial = false;
        let lastTimePoint: ESTimepoint | undefined;
        try {
            ({ searchResults, isSearchPartial, lastTimePoint } = await hybridSearch<
                ESItemMetadata,
                ESItemContent,
                ESSearchParameters
            >(
                esCacheRef,
                esSearchParams,
                cachedIndexKey,
                getUserKeys,
                userID,
                controlledSetResultsList,
                abortSearchingRef,
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
            setESStatus((esStatus) => ({
                ...esStatus,
                permanentResults: searchResults,
                setResultsList: setResultsList,
                lastTimePoint,
                previousESSearchParams: esSearchParams,
                isSearchPartial,
                isSearching: false,
            }));
            setResultsList(searchResults);

            const t2 = performance.now();
            void sendSearchingMetrics(
                api,
                userID,
                esCacheRef.current.cacheSize,
                Math.ceil(t2 - t1),
                isFirstSearch,
                esCacheRef.current.isCacheLimited
            );
        }

        return true;
    };

    /**
     * Increase the number of results in order to reach at least the next multiple of ES_EXTRA_RESULTS_LIMIT,
     * in case the cache is limited and the user wishes more
     */
    const incrementSearch: EncryptedSearchExecution<ESItemMetadata, ESItemContent, ESSearchParameters> = async (
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

        setESStatus((esStatus) => ({
            ...esStatus,
            isSearching: true,
        }));

        const indexKey = cachedIndexKey || (await getIndexKey(getUserKeys, userID));
        if (!indexKey) {
            await dbCorruptError();
            return false;
        }

        const hasApostrophe = (esHelpers.getKeywords(esSearchParams) || []).some((keyword) => keyword.includes(`'`));
        const { resultsArray, newLastTimePoint } = await uncachedSearch<
            ESItemMetadata,
            ESItemContent,
            ESSearchParameters
        >(
            userID,
            indexKey,
            esSearchParams,
            esHelpers,
            lastTimePoint,
            extraItems,
            hasApostrophe,
            undefined,
            abortSearchingRef
        );

        if (!abortSearchingRef.current.signal.aborted) {
            permanentResults.push(...resultsArray);

            setESStatus((esStatus) => ({
                ...esStatus,
                permanentResults,
                isSearchPartial: !!newLastTimePoint,
                lastTimePoint: newLastTimePoint,
                isSearching: false,
            }));
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
    const encryptedSearch: EncryptedSearch<ESItemMetadata, ESItemContent> = async (setResultsList, minimumItems) => {
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

        return findItemIndex(ID, permanentResults, esHelpers.getItemInfo) !== -1;
    };

    /**
     * Remove the index and restart ES by creating a new one from scratch
     */
    const restartIndexing = async () => {
        // Retrieve whether content was already being indexed and reindex it too
        const contentProgress = await contentIndexingProgress.read(userID);
        const wasContentIndexed = contentProgress && contentProgress.status !== INDEXING_STATUS.INACTIVE;
        await esDelete();
        return enableEncryptedSearch({ isRefreshed: true }).then(() => {
            if (wasContentIndexed) {
                return enableContentSearch({ isRefreshed: true });
            }
        });
    };

    /**
     * Process events (according to the provided callbacks). It should be used in whatever event handling
     * system the product uses to correctly sync the ES database.
     * @param event a single event containing a change to the items stored in the ES database
     */
    const handleEvent = async (event: ESEvent<ESItemMetadata> | undefined) => {
        // An event can be undefined in case of network instability, but since the app doesn't receive
        // the update inside the event it's ok to ignor it
        if (!event) {
            return;
        }

        const { dbExists, cachedIndexKey, isEnablingEncryptedSearch } = esStatus;
        // We want to sync new events while content indexing is ongoing so that metadata search
        // can still be used, therefore we don't check whether content is being indexed
        if (!dbExists || isEnablingEncryptedSearch) {
            return;
        }

        const indexKey = cachedIndexKey || (await getIndexKey(getUserKeys, userID));
        if (!indexKey) {
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
        // Check whether the ES IDB exists for the current user. Nothing else is
        // needed in case it doesn't
        if (!(await checkVersionedESDB(userID))) {
            return;
        }

        // At this point the indexKey must exist
        const indexKey = await getIndexKey(getUserKeys, userID);
        if (!indexKey) {
            return dbCorruptError();
        }

        // If metadata indexing was ongoing, continue it. We only
        // check for the INDEXING status because metadata indexing cannot be
        // PAUSED. Note that if IDB exists and metadata progress doesn't,
        // something is wrong
        const metadataProgress = await metadataIndexingProgress.read(userID);
        if (!metadataProgress) {
            return dbCorruptError();
        }

        if (metadataProgress.status === INDEXING_STATUS.INDEXING) {
            void enableEncryptedSearch();
            return;
        }

        const esEnabled = await readEnabled(userID);
        const isDBLimited = await readLimited(userID);
        if (typeof esEnabled === 'undefined' || typeof isDBLimited === 'undefined') {
            return dbCorruptError();
        }

        setESStatus((esStatus) => ({
            ...esStatus,
            dbExists: true,
            esEnabled,
            isDBLimited,
        }));

        // Check whether content indexing was ongoing
        const contentProgress = await contentIndexingProgress.read(userID);

        const isIndexingContent = !!contentProgress && contentProgress.status === INDEXING_STATUS.INDEXING;
        const isPaused = !!contentProgress && contentProgress.status === INDEXING_STATUS.PAUSED;
        const contentIndexingDone = !!contentProgress && contentProgress.status === INDEXING_STATUS.ACTIVE;

        if (isIndexingContent) {
            return enableContentSearch();
        }

        setESStatus((esStatus) => ({
            ...esStatus,
            cachedIndexKey: indexKey,
            isPaused,
            contentIndexingDone,
        }));

        // Compare the last event "seen" by the DB (saved in localStorage) and
        // the present one to check whether any event has happened while offline,
        // but only if indexing was successful
        let newEvents: ESEvent<ESItemMetadata>[];
        let shouldRefresh: boolean;
        let eventsToStore: EventsObject;
        try {
            ({ newEvents, shouldRefresh, eventsToStore } = await esHelpers.getEventFromIDB());
        } catch (error: any) {
            return await dbCorruptError();
        }

        if (shouldRefresh) {
            return restartIndexing();
        }

        void addSyncing(() => catchUpFromLastEvents(indexKey, newEvents, eventsToStore));
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

    const esFunctions: EncryptedSearchFunctions<ESItemMetadata, ESSearchParameters, ESItemContent> = useMemo(
        () => ({
            encryptedSearch,
            cacheIndexedDB,
            getESDBStatus,
            toggleEncryptedSearch,
            enableEncryptedSearch,
            enableContentSearch,
            pauseIndexing,
            getProgressRecorderRef,
            highlightString,
            highlightMetadata,
            shouldHighlight,
            isSearchResult,
            esDelete,
            handleEvent,
            initializeES,
            resetCache,
        }),
        [userID, esStatus]
    );

    return esFunctions;
};

export default useEncryptedSearch;

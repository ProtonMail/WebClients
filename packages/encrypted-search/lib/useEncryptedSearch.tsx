import { useEffect, useMemo, useRef } from 'react';

import type { IDBPDatabase } from 'idb';
import isDeepEqual from 'lodash/isEqual';
import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import useNotifications from '@proton/components/hooks/useNotifications';
import type { IndexKey } from '@proton/crypto/lib/subtle/ad-hoc/encryptedSearch';
import useSearchTelemetry, { SEARCH_TYPE } from '@proton/encrypted-search/lib/useSearchTelemetry';
import { SECOND } from '@proton/shared/lib/constants';
import { storeESUserChoiceInboxDesktop } from '@proton/shared/lib/desktop/encryptedSearch';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { isFirefox } from '@proton/shared/lib/helpers/browser';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { wait } from '@proton/shared/lib/helpers/promise';

import {
    ES_EXTRA_RESULTS_LIMIT,
    INDEXING_STATUS,
    STORING_OUTCOME,
    TIMESTAMP_TYPE,
    defaultESCache,
    defaultESCallbacks,
    defaultESProgress,
    defaultESStatus,
} from './constants';
import type { IndexingMetrics } from './esHelpers';
import {
    buildContentDB,
    buildMetadataDB,
    cacheIDB,
    esSentryReport,
    estimateIndexingDuration,
    findItemIndex,
    gatherIndexingMetrics,
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
    syncItemEvents,
    uncachedSearch,
} from './esHelpers';
import type { IndexedDBRow } from './esIDB';
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
    readSize,
    setLimited,
    toggleEnabled,
    writeAllEvents,
} from './esIDB';
import type {
    ESCache,
    ESCallbacks,
    ESEvent,
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
    InternalESCallbacks,
} from './models';
import useEncryptedSearchIndexingProgress from './useEncryptedSearchIndexingProgress';
import { useEncryptedSearchStatus } from './useEncryptedSearchStatus';

interface Props<ESItemMetadata, ESSearchParameters, ESItemContent = void> {
    refreshMask: number;
    esCallbacks: ESCallbacks<ESItemMetadata, ESSearchParameters, ESItemContent>;
    contentIndexingSuccessMessage?: string;
    onMetadataIndexed?: (metrics: IndexingMetrics) => void;
}

/**
 * Provide the core functionalities of ES.
 * @param refreshMask A number representing the bit the BE sets to REFRESH_ALL on the specific
 * client
 * @param esCallbacks All the callbacks that are product-specific and therefore need to be passed
 * to the ES core functions to work
 * @param contentIndexingSuccessMessage The text that is showing in a green notification upon completing indexing
 * @returns An empty instance of the ES IndexedDB
 */
const useEncryptedSearch = <ESItemMetadata extends Object, ESSearchParameters, ESItemContent = void>({
    refreshMask,
    esCallbacks: inputESCallbacks,
    contentIndexingSuccessMessage,
    onMetadataIndexed,
}: Props<ESItemMetadata, ESSearchParameters, ESItemContent>) => {
    const getUserKeys = useGetUserKeys();
    const [user] = useUser();
    const { ID: userID } = user;
    const { createNotification } = useNotifications();
    const esCallbacks: InternalESCallbacks<ESItemMetadata, ESSearchParameters, ESItemContent> = {
        ...defaultESCallbacks,
        ...inputESCallbacks,
    };
    const { getSearchParams } = esCallbacks;
    const { isSearch } = getSearchParams();
    const {
        sendDeleteESDataReport,
        sendSwitchSearchTypeReport,
        sendStartESIndexingReport,
        sendEndESIndexingReport,
        sendPauseESIndexingReport,
        sendPerformSearchReport,
        sendESSearchCompleteReport,
    } = useSearchTelemetry();

    // Keep a reference to cached items, such that they can be queried at any time
    const esCacheRef = useRef<ESCache<ESItemMetadata, ESItemContent>>(defaultESCache);
    // Allow to abort indexing
    const abortIndexingRef = useRef<AbortController>(new AbortController());
    // Allow to abort searching
    const abortSearchingRef = useRef<AbortController>(new AbortController());
    // Allow to track progress during syncing
    const syncingEventsRef = useRef<Promise<void>>(Promise.resolve());

    const [esStatus, setESStatus] = useEncryptedSearchStatus<ESItemMetadata, ESSearchParameters, ESItemContent>({
        esCacheRef,
        userID,
        getUserKeys,
    });

    const { esIndexingProgressState, progressRecorderRef, recordProgress } = useEncryptedSearchIndexingProgress();

    const resetProgress = (indexDBRow: IndexedDBRow) => {
        void recordProgress(0, indexDBRow);
    };

    const recordMetadataProgress = async () => {
        const newProgress = (await readNumMetadata(userID)) || 0;
        void recordProgress(newProgress, 'metadata');
    };

    const recordContentProgress = async () => {
        const newProgress = (await readNumContent(userID)) || 0;
        void recordProgress(newProgress, 'content');
    };

    /**
     * Chain several synchronisations to account for events being fired when
     * previous ones are still being processed
     */
    const addSyncing = async (callback: () => Promise<void>) => {
        syncingEventsRef.current = syncingEventsRef.current.then(() => callback());
    };

    /**
     * Return cache
     */
    const getCache = () => {
        return esCacheRef.current.esCache;
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
        setESStatus(() => ({
            ...defaultESStatus,
            isConfigFromESDBLoaded: true,
        }));
        sendDeleteESDataReport();
        return deleteESDB(userID);
    };

    /**
     * Notify the user the DB is deleted. Typically, this is needed if the key is no
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

        storeESUserChoiceInboxDesktop(userID, !currentOption);

        if (currentOption) {
            abortSearchingRef.current.abort();
        } else {
            // Every time ES is enabled, we reset sorting to avoid carrying on with SIZE sorting in
            // case it was previously used. SIZE sorting is not supported by ES
            const { isSearch } = getSearchParams();
            if (isSearch) {
                esCallbacks.resetSort();
            }
        }
        sendSwitchSearchTypeReport(!currentOption);
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

        return cacheIDB<ESItemMetadata, ESItemContent>({ indexKey, userID, esCacheRef });
    };

    const correctDecryptionErrors = async () => {
        const { cachedIndexKey } = esStatus;

        const indexKey = cachedIndexKey || (await getIndexKey(getUserKeys, userID));
        if (!indexKey) {
            await dbCorruptError();
            return 0;
        }

        abortIndexingRef.current = new AbortController();
        const result = await esCallbacks.correctDecryptionErrors(
            userID,
            indexKey,
            abortIndexingRef,
            esStatus,
            recordProgress
        );

        if (result > 0) {
            resetCache();
        }

        return result;
    };

    /**
     * Keep IndexedDB in sync with new events
     */
    const syncIndexedDB = async (event: ESEvent<ESItemMetadata>, indexKey: IndexKey | undefined) => {
        const { Items, attemptReDecryption } = event;

        const { permanentResults, setResultsList } = esStatus;

        // In case a key is reactivated, try to fix any decryption error that might
        // have happened during indexing, but only if content indexing is done, otherwise
        // there might not be all content in IDB
        if (attemptReDecryption) {
            setESStatus((esStatus) => ({
                ...esStatus,
                isRefreshing: true,
            }));

            if (indexKey) {
                abortIndexingRef.current = new AbortController();
                const newItemsFound = await correctDecryptionErrors();

                // In case new items were added to ESDB this way, cache should be reset.
                // Next time the user interacts with the searchbar or searches, it will be rebuilt
                if (newItemsFound) {
                    resetCache();
                }
            }
        }

        if (!Items || !Items.length) {
            return;
        }

        const { esSearchParams } = getSearchParams();
        const searchChanged = await syncItemEvents<ESItemContent, ESItemMetadata, ESSearchParameters>({
            Items,
            userID,
            esCacheRef,
            permanentResults,
            indexKey,
            esSearchParams,
            esCallbacks,
        });

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
    const finaliseSyncing = async (eventsToStore: EventsObject, indexKey: IndexKey | undefined) => {
        // In case everything goes through, save the last event(s) from which to
        // catch up the next time, but only in case either content is not indexed at all
        // of if it already finished. If content indexing is ongoing, we don't overwrite the
        // last event IDs from IDB because we'll need to catch up from them to update content.
        // In other words, metadata will be re-synced once the latter happens
        const { isEnablingContentSearch, isContentIndexingPaused } = esStatus;
        if (!isEnablingContentSearch && !isContentIndexingPaused) {
            await writeAllEvents(userID, eventsToStore);
        }

        // In case many items were removed from cache, or from IDB, fill the remaining space
        let isDBLimited: boolean | undefined;
        if (!!indexKey) {
            const contentProgress = await contentIndexingProgress.read(userID);
            if (!!contentProgress && contentProgress.status === INDEXING_STATUS.ACTIVE) {
                abortIndexingRef.current = new AbortController();
                await retryContentIndexing({ userID, indexKey, esCallbacks, abortIndexingRef });
            }
            await refreshESCache<ESItemMetadata, ESItemContent>({
                indexKey,
                userID,
                esCacheRef,
                getItemInfo: esCallbacks.getItemInfo,
            });

            await retryAPICalls<ESItemContent>({
                userID,
                indexKey,
                fetchESItemContent: esCallbacks.fetchESItemContent,
            });

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
    const catchUpFromEvent = async (indexKey: IndexKey, currentEvent: ESEvent<ESItemMetadata>): Promise<void> => {
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
        indexKey: IndexKey | undefined,
        newEvents: ESEvent<ESItemMetadata>[],
        eventsToStore: EventsObject
    ): Promise<void> => {
        setESStatus((esStatus) => ({
            ...esStatus,
            isRefreshing: true,
        }));

        // Resetting is necessary to show appropriate UI when syncing immediately after refreshing
        void resetProgress('content');

        try {
            // It's important that these events are synced sequentially
            for (const eventToCheck of newEvents) {
                await syncIndexedDB(eventToCheck, indexKey);
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
     * Pause the currently ongoing indexing process, if any
     */
    const pauseMetadataIndexing = async () => {
        abortIndexingRef.current.abort();
        setESStatus((esStatus) => ({
            ...esStatus,
            isEnablingEncryptedSearch: false,
            isMetadataIndexingPaused: true,
        }));

        await metadataIndexingProgress.setStatus(userID, INDEXING_STATUS.PAUSED);
        await metadataIndexingProgress.incrementNumPauses(userID);
        await metadataIndexingProgress.addTimestamp(userID, TIMESTAMP_TYPE.STOP);
    };

    const esErrorMessage = isElectronApp
        ? c('Error').t`Content search cannot be enabled. Please restart the application or clear data.`
        : c('Error')
              .t`Content search cannot be enabled in this browser. Please quit private browsing mode or use another browser.`;

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
        notify = false,
    } = {}) => {
        // If indexing instance is already in progress, don't start a new one
        const { isEnablingEncryptedSearch } = esStatus;
        if (isEnablingEncryptedSearch) {
            return false;
        }

        sendStartESIndexingReport('metadata');

        setESStatus((esStatus) => ({
            ...esStatus,
            isEnablingEncryptedSearch: true,
            isMetadataIndexingPaused: false,
        }));

        const handleError = async (esSupported = true) => {
            if (showErrorNotification) {
                createNotification({
                    text: esSupported ? c('Error').t`A problem occurred, please try again.` : esErrorMessage,
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
        let previousEventID = await esCallbacks.getPreviousEventID();

        const expectedTotalIndexed = await esCallbacks.getTotalItems();

        void recordProgress([esIndexingProgressState.esProgress, expectedTotalIndexed], 'metadata');

        let indexKey: IndexKey | undefined;
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
                ({ indexKey, esDB } = await initializeEncryptedSearch({
                    userID,
                    getUserKeys,
                    previousEventIDs: previousEventID,
                    isRefreshed,
                    totalItems: expectedTotalIndexed,
                }));

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
        // will be cache-only.
        setESStatus((esStatus) => ({
            ...esStatus,
            esSupported,
            cachedIndexKey: indexKey,
            dbExists: true,
        }));

        // Even though this procedure cannot be paused, this is still useful
        // in case of clearing data and logout
        abortIndexingRef.current = new AbortController();

        const previousProgress = await metadataIndexingProgress.read(userID);
        if (previousProgress) {
            await metadataIndexingProgress.setStatus(userID, INDEXING_STATUS.INDEXING);
        }

        let success = false;
        let isInitialIndexing = true;
        while (!success) {
            success = await buildMetadataDB<ESItemMetadata>({
                userID,
                esSupported,
                indexKey,
                esCacheRef,
                queryItemsMetadata: esCallbacks.queryItemsMetadata,
                getItemInfo: esCallbacks.getItemInfo,
                abortIndexingRef,
                recordProgress: recordMetadataProgress,
                isInitialIndexing,
                isBackgroundIndexing,
            });

            // Kill switch in case user logs out or deletes data
            if (abortIndexingRef.current.signal.aborted) {
                return false;
            }

            // In case the procedure failed, wait some time before re-starting
            if (!success) {
                isInitialIndexing = false;
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
            ({ newEvents, shouldRefresh, eventsToStore } = await esCallbacks.getEventFromIDB(previousEventID));
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
        // in pages that have already been queried, all subsequent items are shifted. Therefore,
        // later pages will contain different items than if the deletion had never occurred. The
        // end result is that some items are not indexed. Since it's tricky and slow to figure
        // out which ones, we instead just delete everything and notify users
        let metrics;
        if (wasESDBCreated) {
            const totalIndexed = await readNumMetadata(userID);
            if (typeof totalIndexed === 'undefined' || totalIndexed < expectedTotalIndexed) {
                return handleError();
            }
            await metadataIndexingProgress.addTimestamp(userID, TIMESTAMP_TYPE.STOP);
            metrics = await gatherIndexingMetrics(userID, 'metadata');
            await metadataIndexingProgress.setActiveStatus(userID);
            await toggleEnabled(userID);
        }

        setESStatus((esStatus) => ({
            ...esStatus,
            isEnablingEncryptedSearch: false,
            esEnabled: true,
        }));

        if (metrics) {
            onMetadataIndexed?.(metrics);

            sendEndESIndexingReport({ type: 'metadata', metrics });
        }

        if (notify && contentIndexingSuccessMessage) {
            createNotification({
                text: contentIndexingSuccessMessage,
            });
        }

        // In case this process did not create an IDB, e.g. because it's a memory only
        // metadata index, it cannot be considered successful as otherwise content
        // indexing would be tried
        return wasESDBCreated;
    };

    /**
     * Pause the currently ongoing indexing process, if any
     */
    const pauseContentIndexing = async () => {
        abortIndexingRef.current.abort();
        setESStatus((esStatus) => ({
            ...esStatus,
            isEnablingContentSearch: false,
            isContentIndexingPaused: true,
        }));

        await contentIndexingProgress.setStatus(userID, INDEXING_STATUS.PAUSED);
        await contentIndexingProgress.incrementNumPauses(userID);
        await contentIndexingProgress.addTimestamp(userID, TIMESTAMP_TYPE.STOP);

        sendPauseESIndexingReport();
    };

    const sendIndexingEndReport = async (userID: string) => {
        const progressBlob = await contentIndexingProgress.read(userID);
        if (!progressBlob) {
            return;
        }

        const { totalItems, isRefreshed, numPauses, timestamps, originalEstimate } = progressBlob;
        const { indexTime, totalInterruptions } = estimateIndexingDuration(timestamps);
        const indexSize = (await readSize(userID)) || 0;

        sendEndESIndexingReport({
            type: 'content',
            metrics: {
                numInterruptions: totalInterruptions - numPauses,
                indexSize,
                originalEstimate,
                indexTime,
                // Note: the metrics dashboard expects a variable called "numMessagesIndexed" but
                // it doesn't make too much sense in general to talk about "messages"
                totalItems,
                isRefreshed,
                numPauses,
            },
        });
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
        // If there is no fetch content callback, content search cannot be activated at all
        const { fetchESItemContent } = esCallbacks;
        if (!fetchESItemContent) {
            return;
        }

        // If an indexing instance is already in progress don't start a new one
        const { isEnablingContentSearch, esSupported } = esStatus;
        if (isEnablingContentSearch) {
            return;
        }

        if (!esSupported) {
            createNotification({
                text: esErrorMessage,
                type: 'error',
            });
            return;
        }

        const indexKey = await getIndexKey(getUserKeys, userID);
        if (!indexKey) {
            return dbCorruptError();
        }

        sendStartESIndexingReport('content');

        setESStatus((esStatus) => ({
            ...esStatus,
            isEnablingContentSearch: true,
            isContentIndexingPaused: false,
            esEnabled: false,
        }));

        const previousProgress = await contentIndexingProgress.read(userID);
        const expectedTotalIndexed = await esCallbacks.getTotalItems();

        // In case the user is resuming the indexing process, we want to use the index time stored in the cache
        const isResumingIndexing = previousProgress && previousProgress.timestamps.length > 0;

        void recordProgress(
            [esIndexingProgressState.esProgress, expectedTotalIndexed],
            'content',
            userID,
            isResumingIndexing
        );

        let totalItems = 0;
        let recoveryPoint: ESTimepoint | undefined;
        if (!previousProgress) {
            // Save the event before starting building IndexedDB. The number of items
            // before indexing aims to show progress, as new items will be synced only
            // after indexing has completed
            await writeAllEvents(userID, await esCallbacks.getPreviousEventID());

            totalItems = expectedTotalIndexed;
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

        let indexingOutcome = STORING_OUTCOME.SUCCESS;
        let success = totalItems === 0;
        while (!success) {
            try {
                indexingOutcome = await buildContentDB<ESItemContent>({
                    userID,
                    indexKey,
                    abortIndexingRef,
                    recordProgress: recordContentProgress,
                    fetchESItemContent,
                    inputrecoveryPoint: recoveryPoint,
                    isInitialIndexing: true,
                    isBackgroundIndexing,
                });
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
            ({ newEvents, shouldRefresh, eventsToStore } = await esCallbacks.getEventFromIDB());
        } catch (error: any) {
            return dbCorruptError();
        }

        if (shouldRefresh) {
            return dbCorruptError();
        }

        void sendIndexingEndReport(userID);

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

        if (notify && contentIndexingSuccessMessage) {
            createNotification({
                text: contentIndexingSuccessMessage,
            });
        }
    };

    const sendSearchReport = async ({
        searchTime,
        isFirstSearch,
        isSearchPartial,
        isCacheLimited,
        isDBLimited,
        itemsFound,
        uncachedItemsFound,
    }: {
        searchTime: number;
        isFirstSearch: boolean;
        isSearchPartial: boolean;
        isCacheLimited: boolean;
        isDBLimited: boolean;
        itemsFound: number;
        uncachedItemsFound?: number;
    }) => {
        const indexSize = (await readSize(userID)) || 0;

        sendESSearchCompleteReport({
            searchTime,
            isFirstSearch,
            isSearchPartial,
            isCacheLimited,
            isDBLimited,
            itemsFound,
            indexSize,
            cacheSize: esCacheRef.current.cacheSize,
            uncachedItemsFound,
        });
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
            isDBLimited,
        } = esStatus;

        abortSearchingRef.current = new AbortController();

        // In case only sorting changed, for complete searches it doesn't make sense to perform a new search
        if (!wasSearchPartial && previousESSearchParams) {
            const shouldSortOnly = esCallbacks.shouldOnlySortResults(esSearchParams, previousESSearchParams);
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
            >({
                esCacheRef,
                esSearchParams,
                cachedIndexKey,
                getUserKeys,
                userID,
                setResultsList: controlledSetResultsList,
                abortSearchingRef,
                esCallbacks,
                minimumItems,
            }));
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

            const { isCacheLimited } = esCacheRef.current;

            void sendSearchReport({
                searchTime: Math.ceil(t2 - t1),
                isFirstSearch,
                isSearchPartial,
                itemsFound: searchResults.length,
                isCacheLimited,
                isDBLimited,
            });
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
        const { permanentResults, lastTimePoint, cachedIndexKey, isFirstSearch, isSearchPartial, isDBLimited } =
            esStatus;

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

        const start = performance.now();
        const hasApostrophe = (esCallbacks.getKeywords(esSearchParams) || []).some((keyword) => keyword.includes(`'`));
        const { resultsArray, newLastTimePoint } = await uncachedSearch<
            ESItemMetadata,
            ESItemContent,
            ESSearchParameters
        >({
            userID,
            indexKey,
            esSearchParams,
            esCallbacks,
            lastTimePoint,
            itemLimit: extraItems,
            hasApostrophe,
            abortSearchingRef,
        });

        if (!abortSearchingRef.current.signal.aborted) {
            const end = performance.now();
            permanentResults.push(...resultsArray);

            setESStatus((esStatus) => ({
                ...esStatus,
                permanentResults,
                isSearchPartial: !!newLastTimePoint,
                lastTimePoint: newLastTimePoint,
                isSearching: false,
            }));
            setResultsList(permanentResults);

            const { isCacheLimited } = esCacheRef.current;

            void sendSearchReport({
                searchTime: Math.ceil(end - start),
                isFirstSearch,
                isSearchPartial,
                itemsFound: permanentResults.length,
                uncachedItemsFound: resultsArray.length,
                isCacheLimited,
                isDBLimited,
            });
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
        const { dbExists, esEnabled, isSearchPartial, previousESSearchParams, isDBLimited } = esStatus;

        // In these cases no ES should be performed
        if (!dbExists || !esEnabled) {
            return false;
        }

        const { isSearch, esSearchParams } = getSearchParams();
        if (!isSearch || !esSearchParams) {
            return false;
        }

        const { isCacheLimited } = esCacheRef.current;

        sendPerformSearchReport({
            type: SEARCH_TYPE.ENCRYPTED,
            searchParams: esSearchParams,
            isCacheLimited,
            isSearchPartial,
            isDBLimited,
        });

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

        const keywords = esCallbacks.getKeywords(esSearchParams);

        return typeof keywords !== 'undefined' && !!keywords.length;
    };

    /**
     * Insert the <mark></mark> highlighting markdown in a string and returns a string containing it,
     * which then needs to be displayed in the UI. Note that the keywords to highlight are extracted
     * directly with the parseSearchParams callback
     * @param content the string where to insert the markdown
     * @param setAutoScroll whether to insert the data-auto-scroll attribute to the first instance of
     * the inserted mark tags. The UI should automatically scroll, if possible, to said first tag
     * @returns the string containing the markdown
     */
    const highlightString: HighlightString = (content, setAutoScroll) => {
        const { esSearchParams } = getSearchParams();
        if (!esSearchParams) {
            return content;
        }

        const keywords = esCallbacks.getKeywords(esSearchParams);
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

        const keywords = esCallbacks.getKeywords(esSearchParams);
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

        return findItemIndex({ itemID: ID, itemArray: permanentResults, getItemInfo: esCallbacks.getItemInfo }) !== -1;
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
        // the update inside the event it's ok to ignore it
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

        // If metadata indexing was ongoing, continue it.
        // Note that if IDB exists and metadata progress doesn't,
        // something is wrong
        const metadataProgress = await metadataIndexingProgress.read(userID);
        if (!metadataProgress) {
            return dbCorruptError();
        }

        if (metadataProgress.status === INDEXING_STATUS.PAUSED) {
            return;
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

        const isIndexingContent = contentProgress?.status === INDEXING_STATUS.INDEXING;
        const isContentIndexingPaused = contentProgress?.status === INDEXING_STATUS.PAUSED;
        const contentIndexingDone = contentProgress?.status === INDEXING_STATUS.ACTIVE;

        if (isIndexingContent) {
            return enableContentSearch();
        }

        setESStatus((esStatus) => ({
            ...esStatus,
            cachedIndexKey: indexKey,
            isContentIndexingPaused,
            contentIndexingDone,
        }));

        // Compare the last event "seen" by the DB (saved in localStorage) and
        // the present one to check whether any event has happened while offline,
        // but only if indexing was successful
        let newEvents: ESEvent<ESItemMetadata>[];
        let shouldRefresh: boolean;
        let eventsToStore: EventsObject;
        try {
            ({ newEvents, shouldRefresh, eventsToStore } = await esCallbacks.getEventFromIDB());
        } catch (error: any) {
            return dbCorruptError();
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

    const esFunctions: EncryptedSearchFunctions<ESItemMetadata, ESSearchParameters, ESItemContent> = useMemo(() => {
        return {
            encryptedSearch,
            cacheIndexedDB,
            toggleEncryptedSearch,
            enableEncryptedSearch,
            enableContentSearch,
            pauseContentIndexing,
            pauseMetadataIndexing,
            correctDecryptionErrors,
            highlightString,
            highlightMetadata,
            shouldHighlight,
            isSearchResult,
            esDelete,
            handleEvent,
            initializeES,
            getCache,
            resetCache,
            esStatus,
            esIndexingProgressState,
            progressRecorderRef,
        };
    }, [userID, esStatus, esIndexingProgressState, inputESCallbacks]);

    return esFunctions;
};

export default useEncryptedSearch;

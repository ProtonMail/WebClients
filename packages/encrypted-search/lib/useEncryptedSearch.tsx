import { useState, useEffect, useRef, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { c } from 'ttag';
import { wait } from '@proton/shared/lib/helpers/promise';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { SECOND } from '@proton/shared/lib/constants';
import useApi from '@proton/components/hooks/useApi';
import useUser from '@proton/components/hooks/useUser';
import { useGetUserKeys } from '@proton/components/hooks/useUserKeys';
import useNotifications from '@proton/components/hooks/useNotifications';
import { isFirefox } from '@proton/shared/lib/helpers/browser';
import {
    EncryptedSearch,
    EncryptedSearchFunctions,
    ESCache,
    ESDBStatus,
    ESEvent,
    ESHelpers,
    ESSetResultsList,
    ESStatus,
    HighlightMetadata,
    HighlightString,
    ResumeIndexing,
} from './interfaces';
import { defaultESCache, defaultESHelpers, defaultESStatus, ES_EXTRA_RESULTS_LIMIT } from './constants';
import {
    addESTimestamp,
    canUseES,
    deleteESDB,
    esSentryReport,
    getES,
    getESTotal,
    getNumItemsDB,
    increaseNumPauses,
    indexKeyExists,
    isDBReadyAfterBuilding,
    removeES,
    removeESFlags,
    setES,
    setESCurrent,
    wasIndexingDone,
} from './esUtils';
import { buildDB, decryptIndexKey, getIndexKey, initializeDB, sendIndexingMetrics } from './esBuild';
import { cacheDB, findItemIndex, refreshESCache } from './esCache';
import { checkIsDBLimited, correctDecryptionErrors, syncMessageEvents } from './esSync';
import { hybridSearch, sendSearchingMetrics, uncachedSearch } from './esSearch';
import { highlightJSX, insertMarks } from './esHighlight';
import { requestPersistence } from './esUtils';

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
    const history = useHistory();
    const getUserKeys = useGetUserKeys();
    const api = useApi();
    const [user] = useUser();
    const { ID: userID } = user;
    const { createNotification } = useNotifications();
    const esHelpers: Required<ESHelpers<ESItemMetadata, ESItem, ESSearchParameters, ESItemChanges, ESCiphertext>> = {
        ...defaultESHelpers,
        ...inputESHelpers,
    };
    const { parseSearchParams } = esHelpers;
    const { isSearch } = parseSearchParams(history.location);

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
     * Delete localStorage blobs and IDB
     */
    const esDelete = async (inputUserID?: string) => {
        abortIndexingRef.current.abort();
        abortSearchingRef.current.abort();
        const uID = inputUserID || userID;
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
     * Give access to progress made during operations
     */
    const getProgressRecorderRef = () => {
        return progressRecorderRef;
    };

    /**
     * Report the status of IndexedDB
     */
    const getESDBStatus = () => {
        const { dbExists, isBuilding, isDBLimited, esEnabled, isRefreshing, isSearchPartial, isSearching, isCaching } =
            esStatus;
        const { isCacheLimited } = esCacheRef.current;
        const esDBStatus: ESDBStatus<ESItem, ESSearchParameters> = {
            dbExists,
            isBuilding,
            isDBLimited,
            esEnabled,
            isCacheLimited,
            isRefreshing,
            isSearchPartial,
            isSearching,
            isCaching,
        };
        return esDBStatus;
    };

    /**
     * Once encrypted search is active, allow to switch back to server-side metadata search
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
            const { isSearch } = parseSearchParams(history.location);
            if (isSearch) {
                esHelpers.resetSort(history);
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
     * Cache IndexedDB
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

            await cacheDB<ESItem, ESCiphertext, ESSearchParameters>(
                indexKey,
                userID,
                esCacheRef,
                storeName,
                indexName,
                esHelpers
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
        const { isSearch, esSearchParams } = parseSearchParams(history.location);

        const searchChanged = await syncMessageEvents(
            Items,
            userID,
            esCacheRef,
            permanentResults,
            isSearch,
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
        await refreshESCache<ESItem, ESCiphertext, ESSearchParameters>(
            indexKey,
            userID,
            esCacheRef,
            storeName,
            indexName,
            esHelpers
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
     * Pause a running indexig
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
     * Resume an existing indexing operation or start one anew
     */
    const resumeIndexing: ResumeIndexing = async ({ notify, isRefreshed } = { notify: true, isRefreshed: false }) => {
        const isResumed = getES.Pause(userID);

        setESStatus((esStatus) => {
            return {
                ...esStatus,
                esEnabled: true,
            };
        });
        setES.Enabled(userID);

        const showError = (notSupported?: boolean) => {
            if (notify) {
                createNotification({
                    text: notSupported
                        ? c('Error')
                              .t`Content search cannot be enabled in this browser. Please quit private browsing mode or use another browser.`
                        : c('Error').t`A problem occurred, please try again`,
                    type: 'error',
                });
            }
            setESStatus(() => defaultESStatus);
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
                return showError(notSupported);
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

        const totalMessages = getESTotal(userID);
        const mailboxEmpty = totalMessages === 0;
        recordProgress(await getNumItemsDB(userID, storeName), totalMessages);

        setESStatus((esStatus) => {
            return {
                ...esStatus,
                isBuilding: true,
            };
        });

        let success = mailboxEmpty;
        while (!success) {
            const currentMessages = await getNumItemsDB(userID, storeName);
            recordProgress(currentMessages, totalMessages);
            const recordProgressLocal = (progress: number) => {
                const newProgress = currentMessages + progress;
                setESCurrent(userID, newProgress);
                recordProgress(newProgress, totalMessages);
            };

            success = await buildDB<ESItemMetadata, ESItem, ESCiphertext>(
                userID,
                indexKey,
                abortIndexingRef,
                recordProgressLocal,
                storeName,
                indexName,
                esHelpers,
                esHelpers.sizeOfESItem
            );

            // Kill switch in case user logs out or pauses
            if (abortIndexingRef.current.signal.aborted || getES.Pause(userID)) {
                return;
            }

            const isIDBIntact = await canUseES(userID, storeName);
            if (!isIDBIntact) {
                return dbCorruptError();
            }

            await wait(2 * SECOND);
        }

        await sendIndexingMetrics(api, userID);

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
    const newEncryptedSearch: EncryptedSearch<ESItem> = async (setResultsList) => {
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

        const { esSearchParams } = parseSearchParams(history.location);

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
                esHelpers
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
                    page: 0,
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
     * Increase the number of results in case the cache is limited as the user changes page
     */
    const incrementSearch = async (setResultsList: ESSetResultsList<ESItem>) => {
        const { permanentResults, lastTimePoint, isSearchPartial, cachedIndexKey } = esStatus;

        const lastFilledPage = Math.ceil(permanentResults.length / ES_EXTRA_RESULTS_LIMIT) - 1;

        const { isSearch, esSearchParams } = parseSearchParams(history.location);
        if (!isSearch || !isSearchPartial) {
            return;
        }

        const neededResults = ES_EXTRA_RESULTS_LIMIT * (lastFilledPage + 2);
        let itemLimit = 0;
        if (permanentResults.length < neededResults) {
            itemLimit = neededResults - permanentResults.length + ES_EXTRA_RESULTS_LIMIT;
        } else {
            return;
        }

        setESStatus((esStatus) => {
            return {
                ...esStatus,
                isSearching: true,
            };
        });

        const indexKey = cachedIndexKey || (await getIndexKey(getUserKeys, userID));
        if (!indexKey) {
            return dbCorruptError();
        }

        const searchOutput = await uncachedSearch<ESItem, ESCiphertext, ESSearchParameters>(
            userID,
            indexKey,
            esSearchParams,
            storeName,
            indexName,
            esHelpers,
            itemLimit,
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
    };

    /**
     * Perform a new encrypted search or increment an existing one
     */
    const encryptedSearch: EncryptedSearch<ESItem> = async (setResultsList) => {
        const { dbExists, esEnabled, isSearchPartial } = esStatus;

        // In these cases no ES should be performed
        if (!dbExists || !esEnabled) {
            return false;
        }

        const { isCacheLimited } = esCacheRef.current;
        const shouldIncrementSearch = isSearchPartial && isCacheLimited;

        if (shouldIncrementSearch && !abortSearchingRef.current.signal.aborted) {
            return incrementSearch(setResultsList).then(() => true);
        }

        // Prevent old searches from interfering with newer ones
        abortSearchingRef.current.abort();
        setESStatus((esStatus) => {
            return {
                ...esStatus,
                isSearching: false,
                isSearchPartial: false,
            };
        });

        return newEncryptedSearch(setResultsList);
    };

    /**
     * Check whether to highlight keywords upon opening a result of any search (both server-side and encrypted)
     */
    const shouldHighlight = () => {
        const { isSearch, esSearchParams } = parseSearchParams(history.location);
        if (!isSearch) {
            return false;
        }

        const keywords = esHelpers.getKeywords(esSearchParams);

        return typeof keywords !== 'undefined' && !!keywords.length;
    };

    /**
     * Highlight keywords in body. Return a string with the new body
     */
    const highlightString: HighlightString = (content, setAutoScroll) => {
        const { esSearchParams } = parseSearchParams(history.location);
        const keywords = esHelpers.getKeywords(esSearchParams);
        if (!keywords) {
            return content;
        }

        return insertMarks(content, keywords, setAutoScroll);
    };

    /**
     * Highlight keywords, which should be parsed directly from URL within this function, in metadata.
     * Return the JSX element to be rendered
     */
    const highlightMetadata: HighlightMetadata = (metadata, isBold, trim) => {
        const { esSearchParams } = parseSearchParams(history.location);
        const keywords = esHelpers.getKeywords(esSearchParams);
        if (!keywords) {
            return {
                numOccurrences: 0,
                resultJSX: <span>{metadata}</span>,
            };
        }

        return highlightJSX(metadata, keywords, isBold, trim);
    };

    /**
     * Check whether an item is part of the current search results
     */
    const isSearchResult = (ID: string) => {
        const { dbExists, esEnabled, permanentResults } = esStatus;
        const { isSearch } = parseSearchParams(history.location);
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
     * React to an event happening
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
            setESStatus((esStatus) => {
                return {
                    ...esStatus,
                    permanentResults: defaultESStatus.permanentResults,
                    setResultsList: defaultESStatus.setResultsList,
                    lastTimePoint: defaultESStatus.lastTimePoint,
                    previousESSearchParams: defaultESStatus.previousESSearchParams,
                    isSearchPartial: defaultESStatus.isSearchPartial,
                    isSearching: defaultESStatus.isSearching,
                };
            });
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

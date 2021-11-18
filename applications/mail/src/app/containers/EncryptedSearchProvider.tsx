import { createContext, ReactNode, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { c } from 'ttag';
import {
    FeatureCode,
    useApi,
    useFeatures,
    useGetMessageCounts,
    useGetUserKeys,
    useNotifications,
    useOnLogout,
    useSubscribeEventManager,
    useUser,
    useWelcomeFlags,
} from '@proton/components';
import { wait } from '@proton/shared/lib/helpers/promise';
import { EVENT_ACTIONS, SECOND } from '@proton/shared/lib/constants';
import { EVENT_ERRORS } from '@proton/shared/lib/errors';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import { isPaid } from '@proton/shared/lib/user/helpers';
import { useGetMessageKeys } from '../hooks/message/useGetMessageKeys';
import { Event } from '../models/event';
import { Element } from '../models/element';
import {
    EncryptedSearch,
    EncryptedSearchFunctions,
    ESDBStatus,
    ESStatus,
    IncrementSearch,
    HighlightMetadata,
    HighlightString,
    LastEmail,
    ESMessage,
    IsSearchResult,
    ESCache,
    ResumeIndexing,
} from '../models/encryptedSearch';
import { defaultESCache, defaultESStatus, PAGE_SIZE } from '../constants';
import {
    indexKeyExists,
    getNumMessagesDB,
    wasIndexingDone,
    getESTotal,
    setESCurrent,
    canUseES,
    deleteESDB,
    removeESFlags,
    removeES,
    setES,
    esSentryReport,
    checkNewUserID,
    parseSearchParams,
    resetSort,
    increaseNumPauses,
    addESTimestamp,
    getES,
    isDBReadyAfterBuilding,
} from '../helpers/encryptedSearch/esUtils';
import { buildDB, getIndexKey, initialiseDB, sendIndexingMetrics } from '../helpers/encryptedSearch/esBuild';
import {
    hybridSearch,
    normaliseSearchParams,
    sendSearchingMetrics,
    shouldOnlySortResults,
    uncachedSearch,
} from '../helpers/encryptedSearch/esSearch';
import { cacheDB, refreshESCache } from '../helpers/encryptedSearch/esCache';
import {
    checkIsDBLimited,
    correctDecryptionErrors,
    getEventFromLS,
    syncMessageEvents,
} from '../helpers/encryptedSearch/esSync';
import { queryEvents } from '../helpers/encryptedSearch/esAPI';
import { highlightJSX, insertMarks } from '../helpers/encryptedSearch/esHighlight';

const EncryptedSearchContext = createContext<EncryptedSearchFunctions>(null as any);
export const useEncryptedSearchContext = () => useContext(EncryptedSearchContext);

interface Props {
    children?: ReactNode;
}

const EncryptedSearchProvider = ({ children }: Props) => {
    const location = useLocation();
    const history = useHistory();
    const getUserKeys = useGetUserKeys();
    const getMessageKeys = useGetMessageKeys();
    const api = useApi();
    const [user] = useUser();
    const { ID: userID } = user;
    const { createNotification } = useNotifications();
    const getMessageCounts = useGetMessageCounts();
    const { isSearch, page } = parseSearchParams(location);
    const [{ get: getESFeature }, { update: updateSpotlightES }] = useFeatures([
        FeatureCode.EnabledEncryptedSearch,
        FeatureCode.SpotlightEncryptedSearch,
    ]);
    const [welcomeFlags] = useWelcomeFlags();

    // Keep a state of search results to update in case of new events
    // and information on the status of IndexedDB
    const [esStatus, setESStatus] = useState<ESStatus>(defaultESStatus);
    // Keep a reference to cached messages, such that they can be queried at any time
    const esCacheRef = useRef<ESCache>(defaultESCache);
    // Allow to abort indexing
    const abortIndexingRef = useRef<AbortController>(new AbortController());
    // Allow to abort searching
    const abortSearchingRef = useRef<AbortController>(new AbortController());
    // Allow to track progress during indexing or refreshing
    const progressRecorderRef = useRef<[number, number]>([0, 0]);
    // Allow to track progress during syncing
    const syncingEventsRef = useRef<Promise<void>>(Promise.resolve());
    // Allow to track changes in page to set the elements list accordingly
    const pageRef = useRef<number>(0);

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
     * Abort ongoing operations if the user logs out
     */
    useOnLogout(async () => {
        abortIndexingRef.current.abort();
        abortSearchingRef.current.abort();
    });

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
        const {
            dbExists,
            isBuilding,
            isDBLimited,
            esEnabled,
            isRefreshing,
            isSearchPartial,
            isSearching,
            isCaching,
            dropdownOpened,
        } = esStatus;
        const { isCacheLimited } = esCacheRef.current;
        const esDBStatus: ESDBStatus = {
            dbExists,
            isBuilding,
            isDBLimited,
            esEnabled,
            isCacheLimited,
            isRefreshing,
            isSearchPartial,
            isSearching,
            isCaching,
            dropdownOpened,
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
                resetSort(history);
            }
            setES.Enabled(userID);
        }

        // If IDB was evicted by the browser in the meantime, we erase everything else too
        void canUseES(userID).then((isIDBIntact) => {
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
            const isIDBIntact = await canUseES(userID);
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

            await cacheDB(indexKey, userID, esCacheRef);

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
    const syncIndexedDB = async (event: Event, indexKey: CryptoKey, recordProgressLocal?: () => void) => {
        const { Messages, Addresses } = event;
        const isUpdatingMessageContent = typeof recordProgressLocal !== 'undefined';

        // In case a key is reactivated, try to fix any decryption error that might
        // have happened during indexing
        const attemptReDecryption =
            Addresses && Addresses.some((AddressEvent) => AddressEvent.Action === EVENT_ACTIONS.UPDATE);
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

            await correctDecryptionErrors(userID, indexKey, api, getMessageKeys, recordProgress, esCacheRef);

            if (!isUpdatingMessageContent) {
                setESStatus((esStatus) => {
                    return {
                        ...esStatus,
                        isRefreshing: false,
                    };
                });
            }
        }

        if (!Messages || !Messages.length) {
            return;
        }

        // Resetting is necessery to show appropriate UI when syncing immediately after refreshing
        if (attemptReDecryption) {
            recordProgress(0, 0);
        }

        const { labelID, permanentResults, setElementsCache } = esStatus;

        const { isSearch, searchParameters, filterParameter, sortParameter } = parseSearchParams(history.location);
        const normalisedSearchParams = normaliseSearchParams(searchParameters, labelID, filterParameter, sortParameter);

        const searchChanged = await syncMessageEvents(
            Messages,
            userID,
            esCacheRef,
            permanentResults,
            isSearch,
            api,
            getMessageKeys,
            indexKey,
            normalisedSearchParams,
            recordProgressLocal
        );

        if (searchChanged) {
            setElementsCache(permanentResults, pageRef.current);
            setESStatus((esStatus) => {
                return {
                    ...esStatus,
                    permanentResults,
                };
            });
        }
    };

    /**
     * Check whether a refresh is needed. Temporarily disabled to assess impact
     */
    /* const checkResfresh = async (
        indexKey: CryptoKey,
        eventToCheck: Event,
        wasAlreadyRefreshing: boolean
    ): Promise<Event | undefined> => {

        if (hasBit(eventToCheck.Refresh, EVENT_ERRORS.MAIL)) {
            // Resetting is necessery to show appropriate UI when refreshing immediately after indexing
            recordProgress(0, 0);

            // In case we weren't already showing the refreshing UI, we do now
            if (!wasAlreadyRefreshing) {
                setESStatus((esStatus) => {
                    return {
                        ...esStatus,
                        isRefreshing: true,
                    };
                });
            }

            // Refresh needs to happen and will account for all events, potentially
            // except those that happened since beginning it
            const messageCounts = await getMessageCounts();
            const newEventToCheck = await refreshIndex(
                userID,
                api,
                indexKey,
                getMessageKeys,
                recordProgress,
                messageCounts
            );

            if (!wasAlreadyRefreshing) {
                setESStatus((esStatus) => {
                    return {
                        ...esStatus,
                        isRefreshing: false,
                    };
                });
            }

            return newEventToCheck;
        }
    }; */

    /**
     * Conclude any type of syncing routine
     */
    const finaliseSyncing = async (event: Event, indexKey: CryptoKey) => {
        // In case everything goes through, save the last event ID from which to
        // catch up the next time
        if (event.EventID) {
            setES.Event(userID, event.EventID);
        }

        // In case many messages were removed from cache, fill the remaining space
        await refreshESCache(userID, indexKey, esCacheRef);

        // Check if DB became limited after the update
        const messageCounts = await getMessageCounts();
        const isDBLimited = await checkIsDBLimited(userID, messageCounts);
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
    const catchUpFromEvent = async (indexKey: CryptoKey, currentEvent: Event): Promise<void> => {
        // Temporarily disabled to assess impact. The Refresh flag is checked before calling this function
        /* let refreshEvent: Event | undefined;
        try {
            refreshEvent = await checkResfresh(indexKey, currentEvent, false);
        } catch (error: any) {
            esSentryReport('catchUpFromEvent: checkResfresh', { error });
            setESStatus((esStatus) => {
                return {
                    ...esStatus,
                    isRefreshing: false,
                };
            });
            return catchUpFromEvent(indexKey, currentEvent);
        }

        const eventToCheck = refreshEvent || currentEvent; */

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

        return finaliseSyncing(currentEvent, indexKey);
    };

    /**
     * Fetch all events since a previously stored one
     */
    const catchUpFromLS = async (indexKey: CryptoKey, initialEvent: Event): Promise<void> => {
        const isIDBIntact = await canUseES(userID);
        if (!isIDBIntact) {
            return dbCorruptError();
        }

        setESStatus((esStatus) => {
            return {
                ...esStatus,
                isRefreshing: true,
            };
        });

        // Resetting is necessery to show appropriate UI when refreshing immediately after indexing
        recordProgress(0, 0);

        // Temporarily disabled to assess impact. The Refresh flag is checked before calling this function
        /* let refreshEvent: Event | undefined;
        try {
            refreshEvent = await checkResfresh(indexKey, currentEvent, true);

            // We store the event to check after refresh has happened, such that if anything fails
            // later, the process will continue from after the refresh. Otherwise, a new
            // refresh would be triggered
            if (refreshEvent) {
                if (refreshEvent.EventID) {
                    setES.Event(userID, refreshEvent.EventID);
                } else {
                    throw new Error('Refresh event has no ID');
                }
            }
        } catch (error: any) {
            esSentryReport('catchUpFromLS: checkResfresh', { error });
            setESStatus((esStatus) => {
                return {
                    ...esStatus,
                    isRefreshing: false,
                };
            });
            return catchUpFromLS(indexKey);
        } */

        // Resetting is necessery to show appropriate UI when syncing immediately after refreshing
        recordProgress(0, 0);

        // We want to sync all messages, potentially in multiple batches if the More flag
        // is set. Even it isn't, we still fetch a further batch and, if the event ID hasn't
        // changed, we can be sure nothing else has happened and the syncing process is considered
        // successful
        let keepSyncing = true;
        let index = 0;
        const newEventsToCheck: Event[] = [initialEvent];
        while (keepSyncing) {
            try {
                const nextEventToCheck = newEventsToCheck[index++];

                const newEventToCheck = await queryEvents(api, nextEventToCheck.EventID);
                if (!newEventToCheck || !newEventToCheck.EventID) {
                    throw new Error('No event found');
                }

                keepSyncing = nextEventToCheck.More === 1 || newEventToCheck.EventID !== nextEventToCheck.EventID;
                if (keepSyncing) {
                    newEventsToCheck.push(newEventToCheck);
                }
            } catch (error: any) {
                esSentryReport('catchUpFromLS: queryEvents', { error });
                setESStatus((esStatus) => {
                    return {
                        ...esStatus,
                        isRefreshing: false,
                    };
                });
                return catchUpFromLS(indexKey, initialEvent);
            }
        }

        // Since we are only interested in Message and Address events, they are the only ones used to
        // compute the total
        const Total = newEventsToCheck.reduce((accumulator, event) => {
            const addressEvents = (event.Addresses || []).filter(
                (AddressEvent) => AddressEvent.Action === EVENT_ACTIONS.UPDATE
            ).length;
            return accumulator + (event.Messages?.length || 0) + addressEvents;
        }, 0);
        const recordProgressLocal = () => {
            const [current] = progressRecorderRef.current;
            recordProgress(current + 1, Total);
        };

        try {
            // It's important that these events are synced sequentially
            for (const eventToCheck of newEventsToCheck) {
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
            return catchUpFromLS(indexKey, initialEvent);
        }

        return finaliseSyncing(newEventsToCheck[newEventsToCheck.length - 1], indexKey);
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
        const isIDBIntact = await canUseES(userID);
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
            const { notSupported, indexKey: newIndexKey } = await initialiseDB(
                userID,
                getUserKeys,
                api,
                isRefreshed || false
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

        const totalMessages = getESTotal(userID);
        const mailboxEmpty = totalMessages === 0;
        recordProgress(await getNumMessagesDB(userID), totalMessages);

        setESStatus((esStatus) => {
            return {
                ...esStatus,
                isBuilding: true,
            };
        });

        let success = mailboxEmpty;
        while (!success) {
            const currentMessages = await getNumMessagesDB(userID);
            recordProgress(currentMessages, totalMessages);
            const recordProgressLocal = (progress: number) => {
                const newProgress = currentMessages + progress;
                setESCurrent(userID, newProgress);
                recordProgress(newProgress, totalMessages);
            };

            success = await buildDB(userID, indexKey, getMessageKeys, api, abortIndexingRef, recordProgressLocal);

            // Kill switch in case user logs out or pauses
            if (abortIndexingRef.current.signal.aborted || getES.Pause(userID)) {
                return;
            }

            const isIDBIntact = await canUseES(userID);
            if (!isIDBIntact) {
                return dbCorruptError();
            }

            await wait(2 * SECOND);
        }

        await sendIndexingMetrics(api, userID);

        // Finalise IndexedDB building by catching up with new messages
        setESStatus((esStatus) => {
            return {
                ...esStatus,
                isBuilding: false,
            };
        });

        // Catch up with events since the last one before indexing, which was set in
        // the Event blob in localStorage during initialisation. Note that we finalise
        // indexing even it this step fails, because it will be retried at every new
        // event and refresh
        const currentEvent = await getEventFromLS(userID, api);

        if (!currentEvent || hasBit(currentEvent.Refresh, EVENT_ERRORS.MAIL)) {
            return dbCorruptError();
        }

        const catchUpPromise = catchUpFromLS(indexKey, currentEvent);
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
                text: c('Success').t`Message content search activated`,
            });
        }
    };

    /**
     * Execute an encrypted search
     */
    const encryptedSearch: EncryptedSearch = async (labelID, setCache) => {
        // Prevent old searches from interfering with newer ones
        abortSearchingRef.current.abort();
        setESStatus((esStatus) => {
            return {
                ...esStatus,
                isSearching: false,
                isSearchPartial: false,
            };
        });

        const t1 = performance.now();
        const {
            dbExists,
            esEnabled,
            previousNormSearchParams,
            permanentResults,
            isSearchPartial: wasSearchPartial,
            cachedIndexKey,
            isCaching,
            isFirstSearch,
        } = esStatus;

        if (!dbExists || !esEnabled) {
            return false;
        }

        const isIDBIntact = await canUseES(userID);
        if (!isIDBIntact) {
            return dbCorruptError().then(() => false);
        }

        abortSearchingRef.current = new AbortController();

        // Caching needs to be triggered here for when a refresh happens on a search URL
        if (!isCaching && !esCacheRef.current.isCacheReady) {
            void cacheIndexedDB();
        }

        const { searchParameters, filterParameter, sortParameter } = parseSearchParams(history.location);
        const normalisedSearchParams = normaliseSearchParams(searchParameters, labelID, filterParameter, sortParameter);

        // In case only sorting changed, for complete searches it doesn't make sense to perform a new search
        if (!wasSearchPartial && previousNormSearchParams) {
            const shouldSortOnly = shouldOnlySortResults(normalisedSearchParams, previousNormSearchParams);
            if (shouldSortOnly) {
                setCache(permanentResults, pageRef.current);
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

        const controlledSetCache = (Elements: Element[]) => {
            if (!abortSearchingRef.current.signal.aborted) {
                setCache(Elements, pageRef.current);
            }
        };

        let searchResults: ESMessage[] = [];
        let isSearchPartial = false;
        let lastEmail: LastEmail | undefined;
        try {
            ({ searchResults, isSearchPartial, lastEmail } = await hybridSearch(
                esCacheRef,
                normalisedSearchParams,
                cachedIndexKey,
                getUserKeys,
                userID,
                controlledSetCache,
                abortSearchingRef
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
                    labelID,
                    setElementsCache: setCache,
                    lastEmail,
                    previousNormSearchParams: normalisedSearchParams,
                    page: 0,
                    isSearchPartial,
                    isSearching: false,
                };
            });
            setCache(searchResults, pageRef.current);

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
     * Increase the number of results in case the cache is limited as the user changes page
     */
    const incrementSearch: IncrementSearch = async (page, setElementsCache, shouldLoadMore) => {
        const { isCacheLimited } = esCacheRef.current;
        const {
            dbExists,
            esEnabled,
            labelID,
            permanentResults,
            lastEmail,
            isSearchPartial,
            cachedIndexKey,
            isSearching,
        } = esStatus;
        if (!dbExists || !esEnabled || !isCacheLimited || abortSearchingRef.current.signal.aborted || isSearching) {
            return;
        }

        const lastFilledPage = Math.ceil(permanentResults.length / PAGE_SIZE) - 1;
        if (page <= pageRef.current || page < lastFilledPage - 1) {
            return;
        }

        const { isSearch, searchParameters, filterParameter, sortParameter } = parseSearchParams(history.location);
        if (!isSearch || !isSearchPartial) {
            return;
        }

        const neededResults = PAGE_SIZE * (lastFilledPage + 2);
        let messageLimit = 0;
        if (permanentResults.length < neededResults) {
            messageLimit = neededResults - permanentResults.length;
        } else {
            return;
        }
        // If the user wants to load more, then one page is added such that
        // the page+1 wrt the one the user is visualising is already cached
        if (shouldLoadMore) {
            messageLimit += PAGE_SIZE;
        }

        setESStatus((esStatus) => {
            return {
                ...esStatus,
                isSearching: true,
            };
        });

        const normalisedSearchParams = normaliseSearchParams(searchParameters, labelID, filterParameter, sortParameter);
        const indexKey = cachedIndexKey || (await getIndexKey(getUserKeys, userID));
        if (!indexKey) {
            return dbCorruptError();
        }

        const searchOutput = await uncachedSearch(userID, indexKey, normalisedSearchParams, {
            messageLimit,
            beginOrder: lastEmail?.Order,
            lastEmailTime: lastEmail?.Time,
            abortSearchingRef,
        });

        if (!abortSearchingRef.current.signal.aborted) {
            permanentResults.push(...searchOutput.resultsArray);
            const newIsSearchPartial = !!searchOutput.lastEmail;

            setESStatus((esStatus) => {
                return {
                    ...esStatus,
                    permanentResults,
                    lastEmail: searchOutput.lastEmail,
                    isSearchPartial: newIsSearchPartial,
                    isSearching: false,
                };
            });
            setElementsCache(permanentResults, page);
        }
    };

    /**
     * Check whether to highlight keywords upon opening a result of any search (both server-side and encrypted)
     */
    const shouldHighlight = () => {
        const { isSearch, searchParameters } = parseSearchParams(history.location);
        if (!isSearch) {
            return false;
        }

        const { labelID } = esStatus;
        const { normalisedKeywords } = normaliseSearchParams(searchParameters, labelID);
        if (!normalisedKeywords) {
            return false;
        }

        return true;
    };

    /**
     * Highlight keywords in body. Return a string with the new body
     */
    const highlightString: HighlightString = (content, setAutoScroll) => {
        const { searchParameters } = parseSearchParams(history.location);
        const { labelID } = esStatus;
        const { normalisedKeywords } = normaliseSearchParams(searchParameters, labelID);
        if (!normalisedKeywords) {
            return content;
        }

        return insertMarks(content, normalisedKeywords, setAutoScroll);
    };

    /**
     * Highlight keywords in metadata. Return the JSX element to be rendered
     */
    const highlightMetadata: HighlightMetadata = (metadata, isBold, trim) => {
        const { searchParameters } = parseSearchParams(history.location);
        const { labelID } = esStatus;
        const { normalisedKeywords } = normaliseSearchParams(searchParameters, labelID);
        if (!normalisedKeywords) {
            return {
                numOccurrences: 0,
                resultJSX: <span>{metadata}</span>,
            };
        }

        return highlightJSX(metadata, normalisedKeywords, isBold, trim);
    };

    /**
     * Check whether a message is part of the current search results
     */
    const isSearchResult: IsSearchResult = (ID) => {
        const { dbExists, esEnabled, permanentResults } = esStatus;
        const { isSearch } = parseSearchParams(history.location);
        if (!(dbExists && esEnabled && isSearch)) {
            return false;
        }

        return permanentResults.findIndex((result) => result.ID === ID) !== -1;
    };

    /**
     * Remove the index and restart ES by creating a new one from scratch
     */
    const restartIndexing = async () => {
        await esDelete();
        return resumeIndexing({ isRefreshed: true });
    };

    /**
     * Open the advanced search dropdown
     */
    const openDropdown = () => {
        setESStatus((esStatus) => {
            return {
                ...esStatus,
                dropdownOpened: true,
            };
        });
    };

    /**
     * Close the advanced search dropdown
     */
    const closeDropdown = () => {
        setESStatus((esStatus) => {
            return {
                ...esStatus,
                dropdownOpened: false,
            };
        });
    };

    useSubscribeEventManager(async (event: Event) => {
        const { dbExists, cachedIndexKey } = esStatus;
        if (!dbExists) {
            return;
        }

        const indexKey = cachedIndexKey || (await getIndexKey(getUserKeys, userID));
        const isIDBIntact = await canUseES(userID);
        if (!indexKey || !isIDBIntact) {
            return dbCorruptError();
        }

        // Every time a new event happens, we simply catch up everything since the last
        // processed event. In case any failure occurs, the event ID stored will not be
        // overwritten
        if (hasBit(event.Refresh, EVENT_ERRORS.MAIL)) {
            return restartIndexing();
        }

        void addSyncing(() => catchUpFromEvent(indexKey, event));
    });

    useEffect(() => {
        pageRef.current = page;
    }, [page]);

    // Remove previous search data from the status when no longer in search mode
    useEffect(() => {
        if (!isSearch) {
            abortSearchingRef.current.abort();
            setESStatus((esStatus) => {
                return {
                    ...esStatus,
                    permanentResults: defaultESStatus.permanentResults,
                    setElementsCache: defaultESStatus.setElementsCache,
                    labelID: defaultESStatus.labelID,
                    lastEmail: defaultESStatus.lastEmail,
                    previousNormSearchParams: defaultESStatus.previousNormSearchParams,
                    isSearchPartial: defaultESStatus.isSearchPartial,
                    isSearching: defaultESStatus.isSearching,
                };
            });
        }
    }, [isSearch]);

    useEffect(() => {
        const run = async () => {
            try {
                const esFeature = await getESFeature<boolean>();
                if (
                    welcomeFlags.isWelcomeFlow &&
                    !isMobile() &&
                    !!esFeature.Value &&
                    !indexKeyExists(userID) &&
                    isPaid(user)
                ) {
                    // Start indexing for new users and prevent showing the spotlight on ES to them
                    await updateSpotlightES(false);
                    return resumeIndexing({ notify: false });
                }

                // Check all keys that decrypt under the current user's key
                const indexKeys = await checkNewUserID(getUserKeys);

                // If there is none, the user has never activated ES
                if (indexKeys.length === 0) {
                    return;
                }

                // If there is more than one something is off and it's best to remove them all
                if (indexKeys.length > 1) {
                    await Promise.all(
                        indexKeys.map(async ({ userID }) => {
                            await esDelete(userID);
                        })
                    );
                    return restartIndexing();
                }

                // At this point there is only one key blob. If the stored user ID does not coincide with the
                // current one, the old index is removed and a new one is automatically created
                const { userID: storedUserID, indexKey } = indexKeys[0];
                if (storedUserID !== userID) {
                    await esDelete(storedUserID);
                    return restartIndexing();
                }

                const isIDBIntact = await canUseES(userID);
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
                const currentEvent = await getEventFromLS(userID, api);

                if (!currentEvent) {
                    return dbCorruptError();
                }

                if (hasBit(currentEvent.Refresh, EVENT_ERRORS.MAIL)) {
                    return restartIndexing();
                }

                void addSyncing(() => catchUpFromLS(indexKey, currentEvent));
            } catch (error) {
                console.log('ES effect error', error);
            }
        };

        void run();
    }, []);

    const esFunctions = useMemo(
        () => ({
            encryptedSearch,
            cacheIndexedDB,
            getESDBStatus,
            toggleEncryptedSearch,
            resumeIndexing,
            pauseIndexing,
            getProgressRecorderRef,
            incrementSearch,
            highlightString,
            highlightMetadata,
            shouldHighlight,
            isSearchResult,
            esDelete,
            openDropdown,
            closeDropdown,
        }),
        [userID, esStatus]
    );

    return <EncryptedSearchContext.Provider value={esFunctions}>{children}</EncryptedSearchContext.Provider>;
};

export default EncryptedSearchProvider;

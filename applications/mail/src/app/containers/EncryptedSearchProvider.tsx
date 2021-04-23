import React, { createContext, ReactNode, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { c } from 'ttag';
import {
    useApi,
    useGetUserKeys,
    useNotifications,
    useOnLogout,
    useSubscribeEventManager,
    useUser,
} from 'react-components';
import { getItem, removeItem, setItem } from 'proton-shared/lib/helpers/storage';
import { wait } from 'proton-shared/lib/helpers/promise';
import { openDB, deleteDB } from 'idb';
import { useAttachmentCache } from './AttachmentProvider';
import { useGetMessageKeys } from '../hooks/message/useGetMessageKeys';
import { Event } from '../models/event';
import {
    CachedMessage,
    CacheIndexedDB,
    EncryptedSearch,
    EncryptedSearchDB,
    EncryptedSearchFunctions,
    ESDBStatus,
    ESSearchStatus,
    MessageForSearch,
} from '../models/encryptedSearch';
import { defaultESDBStatus, defaultESSearchStatus } from '../constants';
import { extractSearchParameters } from '../helpers/mailboxUrl';
import { isSearch as testIsSearch } from '../helpers/elements';
import {
    indexKeyExists,
    isPaused,
    isRecoveryNeeded,
    getNumMessagesDB,
    isESEnabled,
    wasIndexingDone,
    getTotalFromBuildEvent,
    getBuildEvent,
} from '../helpers/encryptedSearch/esUtils';
import { buildDB, encryptToDB, fetchMessage, getIndexKey, initialiseDB } from '../helpers/encryptedSearch/esBuild';
import { cacheDB, hybridSearch, normaliseSearchParams, sizeOfCache } from '../helpers/encryptedSearch/esSearch';
import {
    checkIsDBLimited,
    correctDecryptionErrors,
    refreshIndex,
    storeToDB,
    syncMessageEvents,
} from '../helpers/encryptedSearch/esSync';
import { queryEvents, sendESMetrics } from '../helpers/encryptedSearch/esAPI';

const EncryptedSearchContext = createContext<EncryptedSearchFunctions>(null as any);
export const useEncryptedSearchContext = () => useContext(EncryptedSearchContext);

interface Props {
    children?: ReactNode;
}

const EncryptedSearchProvider = ({ children }: Props) => {
    const location = useLocation();
    const getUserKeys = useGetUserKeys();
    const getMessageKeys = useGetMessageKeys();
    const attachmentsCache = useAttachmentCache();
    const api = useApi();
    const [{ ID: userID }] = useUser();
    const { createNotification } = useNotifications();

    // Keep a state of cached messages and search results to update in case of new events
    const [esSearchStatus, setESSearchStatus] = useState<ESSearchStatus>(defaultESSearchStatus);
    // Store information on the status of IndexedDB
    const [esDBStatus, setESDBStatus] = useState<ESDBStatus>(defaultESDBStatus);
    // Allow to abort indexing
    const abortControllerRef = useRef<AbortController>(new AbortController());
    // Allow to track progress during indexing, caching or uncached search
    const progressRecorderRef = useRef<number>(0);

    /**
     * Delete localStorage blobs and IDB
     */
    const esDelete = async () => {
        abortControllerRef.current.abort();
        removeItem(`ES:${userID}:Key`);
        removeItem(`ES:${userID}:Event`);
        removeItem(`ES:${userID}:BuildEvent`);
        removeItem(`ES:${userID}:RefreshEvent`);
        removeItem(`ES:${userID}:Recover`);
        removeItem(`ES:${userID}:SyncFail`);
        removeItem(`ES:${userID}:Pause`);
        removeItem(`ES:${userID}:ESEnabled`);
        return deleteDB(`ES:${userID}:DB`).catch(() => undefined);
    };

    /**
     * Trigger deletion upon signout
     */
    useOnLogout(useCallback(esDelete, [userID]));

    /**
     * Notify the user the DB is deleted. Typically this is needed if the key is no
     * longer usable to decrypt it
     */
    const dbCorruptError = async () => {
        await esDelete();
        setESSearchStatus(() => defaultESSearchStatus);
        setESDBStatus(() => defaultESDBStatus);
        createNotification({
            text: c('Error').t`Please activate your content search again`,
            type: 'error',
        });
    };

    /**
     * Store progress of indexing, caching or uncached search
     */
    const recordProgress = (progress: number, total: number) => {
        progressRecorderRef.current += progress / total;
    };

    /**
     * Give access to progress made during indexing, caching or uncached search
     */
    const getProgressRecorderRef = () => {
        return progressRecorderRef;
    };

    /**
     * Report the status of IndexedDB
     */
    const getESDBStatus = () => {
        return esDBStatus;
    };

    /**
     * Once encrypted search is active, allow to switch back to server-side metadata search
     */
    const toggleEncryptedSearch = () => {
        const currentOption = esDBStatus.esEnabled;
        setESDBStatus((esDBStatus) => {
            return {
                ...esDBStatus,
                esEnabled: !currentOption,
            };
        });
        if (currentOption) {
            removeItem(`ES:${userID}:ESEnabled`);
        } else {
            setItem(`ES:${userID}:ESEnabled`, 'true');
        }
    };

    /**
     * Cache the whole IndexedDB and returns the cache promise
     */
    const cacheIndexedDB: CacheIndexedDB = async (force?: boolean) => {
        const { esEnabled, dbExists } = esDBStatus;
        const esCache = await esSearchStatus.cachePromise;
        const defaultResult = {
            cachedMessages: [],
            isCacheLimited: false,
        };

        if (dbExists && esEnabled && (!esCache.length || force)) {
            const indexKey = await getIndexKey(getUserKeys, userID);
            if (!indexKey) {
                await dbCorruptError();
                return defaultResult;
            }

            progressRecorderRef.current = 0;
            const total = await getNumMessagesDB(userID);
            const recordProgressLocal = (progress: number) => {
                recordProgress(progress, total);
            };

            const cacheDBPromise = cacheDB(indexKey, userID, recordProgressLocal);
            const cachePromise = cacheDBPromise
                .then((result) => {
                    setESDBStatus((esDBStatus) => {
                        return {
                            ...esDBStatus,
                            isCacheReady: true,
                            isCacheLimited: result.isCacheLimited,
                        };
                    });
                    return result.cachedMessages;
                })
                .catch(() => [] as CachedMessage[]);

            setESSearchStatus((esSearchStatus) => {
                return {
                    ...esSearchStatus,
                    cachePromise,
                };
            });
            return cacheDBPromise;
        }
        return defaultResult;
    };

    /**
     * In case a key is reactivated, try to fix any decryption error that might
     * have happened during indexing
     */
    const retryIndexEncryptedSearch = async () => {
        const indexKey = await getIndexKey(getUserKeys, userID);
        if (!indexKey) {
            await dbCorruptError();
            return;
        }

        progressRecorderRef.current = 0;

        setESDBStatus((esDBStatus) => {
            return {
                ...esDBStatus,
                isRefreshing: true,
            };
        });

        const newMessagesFound = await correctDecryptionErrors(
            userID,
            indexKey,
            api,
            getMessageKeys,
            attachmentsCache,
            recordProgress
        );

        setESDBStatus((esDBStatus) => {
            return {
                ...esDBStatus,
                isRefreshing: false,
            };
        });

        if (newMessagesFound) {
            // Check if DB became limited after this update
            const isDBLimited = await checkIsDBLimited(userID, api);
            setESDBStatus((esDBStatus) => {
                return {
                    ...esDBStatus,
                    isDBLimited,
                };
            });
            // Force cache re-build to account for new messages
            if (esDBStatus.isCacheReady) {
                void cacheIndexedDB(true);
            }
        }
    };

    /**
     * Keep IndexedDB in sync with new events
     */
    const syncIndexedDB = async (event: Event, indexKey: CryptoKey) => {
        const { Messages, Addresses } = event;

        if (Addresses) {
            await retryIndexEncryptedSearch();
        }
        if (!Messages || !Messages.length) {
            return;
        }

        const { labelID, permanentResults, setElementsCache, cachePromise } = esSearchStatus;
        const esCache = await cachePromise;

        const searchParameters = extractSearchParameters(location);
        const isSearch = testIsSearch(searchParameters);
        const normalisedSearchParams = normaliseSearchParams(searchParameters, labelID);

        const {
            failedMessageEvents,
            newESCache,
            newPermanentResults,
            cacheChanged,
            searchChanged,
        } = await syncMessageEvents(
            Messages,
            userID,
            esCache,
            permanentResults,
            isSearch,
            api,
            getMessageKeys,
            attachmentsCache,
            indexKey,
            normalisedSearchParams
        );

        // Trigger re-renders only if strictly necessary
        if (cacheChanged && !(cacheChanged && searchChanged)) {
            setESSearchStatus((esSearchStatus) => {
                return {
                    ...esSearchStatus,
                    cachePromise: new Promise((resolve) => resolve(newESCache)),
                };
            });
        } else if (searchChanged && !(cacheChanged && searchChanged)) {
            setESSearchStatus((esSearchStatus) => {
                return {
                    ...esSearchStatus,
                    permanentResults: newPermanentResults,
                };
            });
        } else if (cacheChanged && searchChanged) {
            setESSearchStatus((esSearchStatus) => {
                return {
                    ...esSearchStatus,
                    permanentResults: searchChanged ? newPermanentResults : esSearchStatus.permanentResults,
                    cachePromise: cacheChanged
                        ? new Promise((resolve) => resolve(newESCache))
                        : esSearchStatus.cachePromise,
                };
            });
        }

        if (searchChanged) {
            setElementsCache(newPermanentResults);
        }

        // Check if DB became limited after this update
        const isDBLimited = await checkIsDBLimited(userID, api);
        setESDBStatus((esDBStatus) => {
            return {
                ...esDBStatus,
                isDBLimited,
            };
        });

        // Messages that failed to sync will be re-fetched
        setItem(`ES:${userID}:SyncFail`, JSON.stringify(failedMessageEvents));
    };

    /**
     * Fetch all events since a specified one, check if refresh is needed
     */
    const catchUpWithEvents = async (indexKey: CryptoKey) => {
        const dealWithEvent = async (eventID: string, indexKey: CryptoKey, eventName?: string) => {
            const messageEvent = await queryEvents(api, eventID);
            if (!messageEvent) {
                return;
            }

            if (messageEvent.Refresh) {
                progressRecorderRef.current = 0;

                setESDBStatus((esDBStatus) => {
                    return {
                        ...esDBStatus,
                        isRefreshing: true,
                    };
                });

                await refreshIndex(userID, api, indexKey, getMessageKeys, attachmentsCache, recordProgress);

                // Check if DB became limited after this update
                const isDBLimited = await checkIsDBLimited(userID, api);
                setESDBStatus((esDBStatus) => {
                    return {
                        ...esDBStatus,
                        isRefreshing: false,
                        isDBLimited,
                    };
                });

                // Once the refresh succeeded, the original event can be removed
                if (eventName) {
                    removeItem(eventName);
                }

                // In case a refresh was needed, there is potentially some catch up of events to do
                const refreshEvent = getItem(`ES:${userID}:RefreshEvent`);
                if (refreshEvent) {
                    const refresh = await queryEvents(api, refreshEvent);
                    removeItem(`ES:${userID}:RefreshEvent`);
                    return refresh;
                }
                return;
            }

            if (eventName) {
                removeItem(eventName);
            }

            return messageEvent;
        };

        // The first time indexing is complete, we have to check whether anything changed since BuildEvent
        const buildEvent = getBuildEvent(userID);
        // Otherwise, we catch up from the last "seen" event
        const previousEvent = getItem(`ES:${userID}:Event`);

        let eventToCheck: Event | undefined;
        if (buildEvent) {
            eventToCheck = await dealWithEvent(buildEvent, indexKey, `ES:${userID}:BuildEvent`);
        } else if (previousEvent) {
            eventToCheck = await dealWithEvent(previousEvent, indexKey);
        }
        if (eventToCheck) {
            await syncIndexedDB(eventToCheck, indexKey);
        }
    };

    /**
     * Pause a running indexig
     */
    const pauseIndexing = async () => {
        setItem(`ES:${userID}:Pause`, 'true');
        abortControllerRef.current.abort();
        setESDBStatus((esDBStatus) => {
            return {
                ...esDBStatus,
                isBuilding: false,
            };
        });
    };

    /**
     * Resume an existing indexing operation or start one anew
     */
    const resumeIndexing = async () => {
        const isResumed = isPaused(userID);

        setItem(`ES:${userID}:ESEnabled`, 'true');
        setESDBStatus((esDBStatus) => {
            return {
                ...esDBStatus,
                esEnabled: true,
            };
        });

        const showError = (notSupported?: boolean) => {
            createNotification({
                text: notSupported
                    ? c('Error').t`Content search cannot be enabled in this browser. Please try another browser`
                    : c('Error').t`A problem occurred, please try again`,
                type: 'error',
            });
            setESDBStatus(() => defaultESDBStatus);
        };

        removeItem(`ES:${userID}:Pause`);
        abortControllerRef.current = new AbortController();

        let indexKey: CryptoKey;
        if (!indexKeyExists(userID) && !isResumed) {
            const { notSupported, indexKey: newIndexKey } = await initialiseDB(userID, getUserKeys, api);
            if (!newIndexKey) {
                showError(notSupported);
                return;
            }
            indexKey = newIndexKey;
        } else {
            const existingIndexKey = await getIndexKey(getUserKeys, userID);
            if (!existingIndexKey) {
                await dbCorruptError();
                return;
            }
            indexKey = existingIndexKey;
        }

        const totalMessages = getTotalFromBuildEvent(userID) || 0;
        progressRecorderRef.current = (await getNumMessagesDB(userID)) / totalMessages;
        const recordProgressLocal = (progress: number) => {
            recordProgress(progress, totalMessages);
        };

        setESDBStatus((esDBStatus) => {
            return {
                ...esDBStatus,
                isBuilding: true,
            };
        });

        let success = false;
        while (!success) {
            success = await buildDB(
                userID,
                indexKey,
                getMessageKeys,
                attachmentsCache,
                api,
                abortControllerRef,
                recordProgressLocal
            );

            // Kill switch in case user logs out or pauses
            if (!indexKeyExists(userID) || (!success && isPaused(userID))) {
                return;
            }

            await wait(500);
        }

        // If the process exits but there are no messages in IDB, it means some error has
        // occured and user should ty again
        const totalFromIDB = await getNumMessagesDB(userID);
        if (totalFromIDB === 0) {
            await dbCorruptError();
            return;
        }

        // Finalise IndexedDB building by catching up with new messages
        await catchUpWithEvents(indexKey);

        // The check whether the DB is limited is performed after sync to account for new messages
        const isDBLimited = await checkIsDBLimited(userID, api);
        setESDBStatus((esDBStatus) => {
            return {
                ...esDBStatus,
                dbExists: true,
                isBuilding: false,
                isDBLimited,
            };
        });

        createNotification({
            text: c('Success').t`Message content search activated`,
        });
    };

    /**
     * Execute an encrypted search
     */
    const encryptedSearch: EncryptedSearch = async (searchParams, labelID, setCache) => {
        const t1 = performance.now();
        const { dbExists, esEnabled, isCacheReady } = esDBStatus;

        if (!dbExists || !esEnabled) {
            return false;
        }

        progressRecorderRef.current = 0;
        const normalisedSearchParams = normaliseSearchParams(searchParams, labelID);

        // Wait for the cache to be built, falls back to uncached search if caching fails
        let esCache = await esSearchStatus.cachePromise;
        let { isCacheLimited } = esDBStatus;

        // If encrypted search is enabled while search results (from a previous server-side search) are
        // being shown, the cache will naturally be empty, therefore we trigger it. If, despite this,
        // the cache is still empty, it means an error has occured and that search should fallback to
        // uncached search.
        if (!esCache.length) {
            const cachingResult = await cacheIndexedDB();
            esCache = cachingResult.cachedMessages;
            isCacheLimited = cachingResult.isCacheLimited;
        }

        // Record the number of messages that were actually searched (i.e. not discarded by means of filters)
        let numMessagesSearched = 0;
        const incrementMessagesSearched = () => {
            numMessagesSearched++;
        };

        let searchResults: MessageForSearch[] = [];
        try {
            searchResults = await hybridSearch(
                esCache,
                normalisedSearchParams,
                isCacheLimited,
                getUserKeys,
                userID,
                recordProgress,
                incrementMessagesSearched
            );
        } catch (error) {
            // If the key is the problem, then we want to wipe the DB and fall back to
            // server-side search, otherwise we want to show a generic error and still
            // fall back to server-side search
            if (error.message === 'Key not found') {
                await dbCorruptError();
                return false;
            }
            throw error;
        }

        setESSearchStatus((esSearchStatus) => {
            return {
                ...esSearchStatus,
                permanentResults: searchResults,
                labelID,
                setElementsCache: setCache,
            };
        });
        setCache(searchResults);

        const t2 = performance.now();
        void sendESMetrics(
            getUserKeys,
            api,
            userID,
            sizeOfCache(esCache),
            numMessagesSearched,
            Math.ceil(t2 - t1),
            searchResults.length,
            !isCacheReady,
            isCacheLimited
        );

        return true;
    };

    useSubscribeEventManager(async (event: Event) => {
        const { dbExists, isRefreshing } = esDBStatus;
        // If building is happening, either because of initial indexing or because
        // we got a Refresh=1, new events are not synced
        if (!dbExists || isRefreshing) {
            return;
        }

        const indexKey = await getIndexKey(getUserKeys, userID);
        if (!indexKey) {
            await dbCorruptError();
            return;
        }

        // If a previous sync failed, messages are re-fetched
        const syncBlob = getItem(`ES:${userID}:SyncFail`);
        if (syncBlob) {
            const newSyncFailures: string[] = [];
            const syncFailures: string[] = JSON.parse(syncBlob);

            const esDB = await openDB<EncryptedSearchDB>(`ES:${userID}:DB`);

            await Promise.all(
                syncFailures.map(async (messageID) => {
                    const messageToStore = await fetchMessage(messageID, api, getMessageKeys, attachmentsCache);
                    if (!messageToStore) {
                        newSyncFailures.push(messageID);
                        return;
                    }
                    const newCiphertextToStore = await encryptToDB(messageToStore, indexKey);
                    if (!newCiphertextToStore) {
                        newSyncFailures.push(messageID);
                        return;
                    }
                    if (!storeToDB(newCiphertextToStore, esDB)) {
                        newSyncFailures.push(messageID);
                    }
                })
            );

            esDB.close();

            if (newSyncFailures.length) {
                setItem(`ES:${userID}:SyncFail`, JSON.stringify(newSyncFailures));
                return;
            }

            removeItem(`ES:${userID}:SyncFail`);
        }

        // In case no recovery is needed, sync the DB with the current event only
        const { EventID } = event;
        if (EventID) {
            setItem(`ES:${userID}:Event`, EventID);
        }
        await syncIndexedDB(event, indexKey);
    });

    useEffect(() => {
        // Remove encrypted search DB in case there is a corrupt leftover
        if (!indexKeyExists(userID)) {
            // TODO: Just for jest since it doesn't exist there
            if (window.indexedDB) {
                deleteDB(`ES:${userID}:DB`).catch(() => undefined);
            }
            return;
        }

        const run = async () => {
            const indexKey = await getIndexKey(getUserKeys, userID);
            if (!indexKey) {
                await dbCorruptError();
                return;
            }

            // If indexing was not successful, try to recover (unless it was paused).
            // Otherwise, just set the correct parameters to ESDBStatus
            if (isRecoveryNeeded(userID)) {
                if (!isPaused(userID)) {
                    await resumeIndexing();
                }
                return;
            }

            setESDBStatus((esDBStatus) => {
                return {
                    ...esDBStatus,
                    dbExists: wasIndexingDone(userID),
                    esEnabled: isESEnabled(userID),
                };
            });

            // Refresh of IndexedDB has to be completed in one run, so if this blob
            // is in localStorage it means that something went wrong with a previous
            // run and that it has to start over, which it will at the next event
            removeItem(`ES:${userID}:RefreshEvent`);

            // Compare the last event "seen" by the DB (saved in localStorage) and
            // the present one to check whether any event has happened while offline,
            // but only if indexing was successful
            void catchUpWithEvents(indexKey);
        };

        void run();
    }, []);

    const esFunctions = {
        encryptedSearch,
        cacheIndexedDB,
        getESDBStatus,
        toggleEncryptedSearch,
        resumeIndexing,
        pauseIndexing,
        getProgressRecorderRef,
    };

    return <EncryptedSearchContext.Provider value={esFunctions}>{children}</EncryptedSearchContext.Provider>;
};

export default EncryptedSearchProvider;

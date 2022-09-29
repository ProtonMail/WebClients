import { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import {
    FeatureCode,
    useApi,
    useFeatures,
    useGetMessageCounts,
    useGetUserKeys,
    useNotifications,
    useSubscribeEventManager,
    useUser,
    useWelcomeFlags,
} from '@proton/components';
import {
    ESProgress,
    INDEXING_STATUS,
    cacheMetadata,
    checkRecoveryFormat,
    checkVersionedESDB,
    defaultESCache,
    defaultESProgress,
    esSentryReport,
    getIndexKey,
    getOldestCachedContentTimepoint,
    readContentProgress,
    useEncryptedSearch,
    writeContentProgress,
} from '@proton/encrypted-search';
import { SECOND } from '@proton/shared/lib/constants';
import { EVENT_ERRORS } from '@proton/shared/lib/errors';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import { isPaid } from '@proton/shared/lib/user/helpers';

import { defaultESContextMail, defaultESMailStatus } from '../constants';
import { getESHelpers, getItemInfo } from '../helpers/encryptedSearch/encryptedSearchMailHelpers';
import { convertEventType, getTotal } from '../helpers/encryptedSearch/esSync';
import { parseSearchParams } from '../helpers/encryptedSearch/esUtils';
import { migrate } from '../helpers/encryptedSearch/migration';
import {
    activatePartialES,
    getWindowStart,
    removeOldContent,
    revertPartialESActivation,
} from '../helpers/encryptedSearch/partialES';
import { useGetMessageKeys } from '../hooks/message/useGetMessageKeys';
import {
    ESBaseMessage,
    ESDBStatusMail,
    ESMessageContent,
    EncryptedSearchFunctionsMail,
    NormalizedSearchParams,
} from '../models/encryptedSearch';
import { Event } from '../models/event';

const EncryptedSearchContext = createContext<EncryptedSearchFunctionsMail>(defaultESContextMail);
export const useEncryptedSearchContext = () => useContext(EncryptedSearchContext);

interface Props {
    children?: ReactNode;
}

const EncryptedSearchProvider = ({ children }: Props) => {
    const history = useHistory();
    const getMessageKeys = useGetMessageKeys();
    const getUserKeys = useGetUserKeys();
    const getMessageCounts = useGetMessageCounts();
    const api = useApi();
    const [user] = useUser();
    const [welcomeFlags] = useWelcomeFlags();
    const [{ update: updateSpotlightES }, { get: getPartialES }] = useFeatures([
        FeatureCode.SpotlightEncryptedSearch,
        FeatureCode.PartialEncryptedSearch,
    ]);
    const { createNotification } = useNotifications();
    const { isSearch, page } = parseSearchParams(history.location);

    const [esMailStatus, setESMailStatus] = useState<ESDBStatusMail>(defaultESMailStatus);
    // Allow to track changes in page to set the elements list accordingly
    const pageRef = useRef<number>(0);

    const esHelpers = getESHelpers({
        getMessageKeys,
        getMessageCounts,
        api,
        user,
        history,
    });

    const successMessage = c('Success').t`Message content search activated`;

    const esLibraryFunctions = useEncryptedSearch<ESBaseMessage, NormalizedSearchParams, ESMessageContent>({
        refreshMask: EVENT_ERRORS.MAIL,
        esHelpers,
        successMessage,
    });

    /**
     * Open the advanced search dropdown
     */
    const openDropdown = () => {
        setESMailStatus((esMailStatus) => ({
            ...esMailStatus,
            dropdownOpened: true,
        }));
    };

    /**
     * Close the advanced search dropdown
     */
    const closeDropdown = () => {
        setESMailStatus((esMailStatus) => ({
            ...esMailStatus,
            dropdownOpened: false,
        }));
    };

    /**
     * Temporarily disable ES for times when search is too slow and a server-side
     * search is needed. The toggle is set automatically back on upon exiting search mode
     */
    const setTemporaryToggleOff = () => {
        setESMailStatus((esMailStatus) => ({
            ...esMailStatus,
            temporaryToggleOff: true,
        }));
        void esLibraryFunctions.toggleEncryptedSearch();
    };

    /**
     * Report the status of IndexedDB with the addition of Mail-specific fields
     */
    const getESDBStatus = () => {
        return {
            ...esLibraryFunctions.getESDBStatus(),
            ...esMailStatus,
        };
    };

    /**
     * In case the user doesn't have any form of ES, we want to automatically start indexing
     * metadata (which concurrently caches them). In case an index already exist,
     * then we build the content cache (since the metadata cache will have already been
     * built at page load)
     */
    const cacheMailContent = async () => {
        // Kill switch to control the release of partial ES
        const partialES = await getPartialES();
        if (!isPaid(user) && !!partialES && !partialES.Value) {
            return esLibraryFunctions.esDelete();
        }

        const { dbExists, contentIndexingDone } = getESDBStatus();

        // If content indexing is over, we can cache content
        if (dbExists && contentIndexingDone) {
            return esLibraryFunctions.cacheIndexedDB().then((esCacheRef) => {
                const timepoint = getOldestCachedContentTimepoint<ESBaseMessage, ESMessageContent>(
                    esCacheRef,
                    getItemInfo
                );
                if (timepoint) {
                    setESMailStatus((esMailStatus) => ({
                        ...esMailStatus,
                        lastContentTime: timepoint[0] * SECOND,
                    }));
                }
            });
        }
    };

    /**
     * Activate the full or partial content search depending
     * on whether the user is paid or not
     */
    const activateContentSearch = async () => {
        if (isPaid(user)) {
            return esLibraryFunctions.enableContentSearch();
        }

        setESMailStatus((esMailStatus) => ({
            ...esMailStatus,
            activatingPartialES: true,
        }));

        const esCacheRef = esLibraryFunctions.getESCache();
        try {
            await activatePartialES(api, user, getUserKeys, esHelpers, esCacheRef);

            createNotification({
                text: successMessage,
            });

            // After activating partial ES, initializeES is called to set
            // all the appropriate esDBStatus flags
            await esLibraryFunctions.initializeES(false);
        } catch (error: any) {
            // If something goes wrong, we just need to "clean" the content
            // part of IDB
            await revertPartialESActivation(user.ID, esCacheRef);

            createNotification({
                text: c('Error').t`Something went wrong, please try again`,
                type: 'error',
            });
            void esSentryReport('activatePartialES', error);
        }

        setESMailStatus((esMailStatus) => ({
            ...esMailStatus,
            activatingPartialES: false,
        }));
    };

    /**
     * Initialize ES
     */
    const initializeESMail = async () => {
        // Kill switch to control the release of partial ES
        const partialES = await getPartialES();
        if (!isPaid(user) && !!partialES && !partialES.Value) {
            return esLibraryFunctions.esDelete();
        }

        setESMailStatus((esMailStatus) => ({
            ...esMailStatus,
            isMigrating: true,
        }));

        // Migrate old IDBs
        const success = await migrate(user.ID, api, getUserKeys, getMessageKeys, () =>
            esHelpers.queryItemsMetadata(new AbortController().signal)
        ).catch((error) => {
            esSentryReport(`migration: ${error.message}`, error);
            return false;
        });

        setESMailStatus((esMailStatus) => ({
            ...esMailStatus,
            isMigrating: false,
        }));

        if (!success) {
            createNotification({
                text: c('Error')
                    .t`There was a problem updating your local messages, they will be downloaded again to re-enable content search`,
                type: 'error',
            });

            return esLibraryFunctions
                .esDelete()
                .then(() => esLibraryFunctions.enableEncryptedSearch({ isRefreshed: true }))
                .then(() => esLibraryFunctions.enableContentSearch({ isRefreshed: true }));
        }

        // Enable encrypted search for all new users. For paid users only,
        // automatically enable content search too
        if (welcomeFlags.isWelcomeFlow && !isMobile()) {
            // Prevent showing the spotlight for ES to them
            await updateSpotlightES(false);
            return esLibraryFunctions.enableEncryptedSearch().then(() => {
                if (isPaid(user)) {
                    return esLibraryFunctions.enableContentSearch({ notify: false });
                }
            });
        }

        // Existence of IDB is checked since the following operations interact with it
        if (!(await checkVersionedESDB(user.ID))) {
            return;
        }

        let contentProgress = await readContentProgress(user.ID);
        if (!contentProgress) {
            return esLibraryFunctions.initializeES();
        }

        // We need to cache the metadata directly, since the library is
        // not yet initialised, i.e. the flags in memory are not yet set.
        // The reason for not initialising the library just yet is that
        // in case an upgrade/downgrade is needed, the flags would be set
        // incorrectly due to the way we encode the latter
        const indexKey = await getIndexKey(getUserKeys, user.ID);
        if (!indexKey) {
            return esLibraryFunctions.esDelete();
        }
        const esCacheRef = { current: defaultESCache };
        await cacheMetadata<ESBaseMessage>(user.ID, indexKey, esHelpers.getItemInfo, esCacheRef);

        if (isPaid(user)) {
            // Upgrade comes almost for free since we can turn the previously partial
            // content progress into an indexing one and start from where the time window
            // left off. This should happen in case a user is paid, has an
            // ACTIVE content indexing progress and (which is important to tell apart
            // users with full content search) has a recovery point of the form [number, number]
            if (
                contentProgress.status === INDEXING_STATUS.ACTIVE &&
                checkRecoveryFormat(contentProgress.recoveryPoint)
            ) {
                const newContentProgress: ESProgress = {
                    ...defaultESProgress,
                    totalItems: await getTotal(getMessageCounts)(),
                    recoveryPoint: contentProgress.recoveryPoint,
                    status: INDEXING_STATUS.INDEXING,
                };
                await writeContentProgress(
                    user.ID,
                    newContentProgress,
                    esCacheRef.current.esCache,
                    esHelpers.getItemInfo
                );
            }
        } else {
            // Downgrade is handled by re-encoding the content progress in the way
            // partial ES does (i.e. setting the status to ACTIVE, the recoverPoint to
            // the last message with content, which coincides with the last one for a
            // previously full index, and leaving all other properties to their default)
            // and then let the removeOldContent do its job.
            // This should happen in case a user is not paid, has an
            // ACTIVE content indexing progress and (which is important to tell apart
            // users with only partial ES) has no recovery point in the latter
            if (
                (contentProgress.status === INDEXING_STATUS.ACTIVE && !contentProgress.recoveryPoint) ||
                contentProgress.status === INDEXING_STATUS.INDEXING ||
                contentProgress.status === INDEXING_STATUS.PAUSED
            ) {
                // The first message in cache is the oldest
                const iter = esCacheRef.current.esCache.values().next();
                const lastTimePoint = iter.done ? undefined : [iter.value.metadata.Time, iter.value.metadata.Order];

                // A last item must exist. If it doesn't we consider it a corruption
                // therefore we remove everything and we re-index first metadata, then
                // content only for the last month. Another option is that, in case indexing
                // was in progress or paused prior to the downgrade, it didn't cover enough
                // ground to include all messages in the time window
                if (!lastTimePoint || lastTimePoint[0] > getWindowStart()) {
                    await esLibraryFunctions.esDelete();
                    return esLibraryFunctions.enableEncryptedSearch({ isRefreshed: true }).then(activateContentSearch);
                }

                const lastContentTime = lastTimePoint[0] * SECOND;
                setESMailStatus((esMailStatus) => ({
                    ...esMailStatus,
                    lastContentTime,
                }));

                const newContentProgress = {
                    ...defaultESProgress,
                    recoveryPoint: lastTimePoint,
                    status: INDEXING_STATUS.ACTIVE,
                };
                contentProgress = newContentProgress;

                await writeContentProgress(
                    user.ID,
                    newContentProgress,
                    esCacheRef.current.esCache,
                    esHelpers.getItemInfo
                );
            }

            // If a free user has a partial content index, trim it to the new time window
            if (checkRecoveryFormat(contentProgress.recoveryPoint)) {
                try {
                    await removeOldContent(user.ID, getUserKeys, esCacheRef);
                } catch (error: any) {
                    await revertPartialESActivation(user.ID, esCacheRef);

                    createNotification({
                        text: c('Error').t`Something went wrong, please try again`,
                        type: 'error',
                    });
                    void esSentryReport('removeOldContent', error);
                }
            }
        }

        return esLibraryFunctions.initializeES(false);
    };

    useSubscribeEventManager(async (event: Event) => esLibraryFunctions.handleEvent(convertEventType(event)));

    /**
     * Keep the current page always up to date to avoid pagination glitches
     */
    useEffect(() => {
        pageRef.current = page;
    }, [page]);

    /**
     * In case content indexing finished, we need to update the last content
     * time to show appropriate UI
     */
    useEffect(() => {
        const { dbExists, contentIndexingDone } = getESDBStatus();
        if (dbExists && contentIndexingDone) {
            const esCacheRef = esLibraryFunctions.getESCache();
            const timepoint = getOldestCachedContentTimepoint<ESBaseMessage, ESMessageContent>(esCacheRef, getItemInfo);
            if (timepoint) {
                setESMailStatus((esMailStatus) => ({
                    ...esMailStatus,
                    lastContentTime: timepoint[0] * SECOND,
                }));
            }
        }
    }, [getESDBStatus().contentIndexingDone]);

    /**
     * Re-enable ES in case it was disabled because of a slow search
     */
    useEffect(() => {
        if (!isSearch) {
            const { temporaryToggleOff } = esMailStatus;
            if (temporaryToggleOff) {
                void esLibraryFunctions.toggleEncryptedSearch();
                // Remove the temporary switch-off of ES
                setESMailStatus((esMailStatus) => ({
                    ...esMailStatus,
                    temporaryToggleOff: false,
                }));
            }
        }
    }, [isSearch]);

    useEffect(() => {
        void initializeESMail();
    }, []);

    const esFunctions = {
        ...esLibraryFunctions,
        getESDBStatus,
        openDropdown,
        closeDropdown,
        setTemporaryToggleOff,
        cacheMailContent,
        activateContentSearch,
    };

    return <EncryptedSearchContext.Provider value={esFunctions}>{children}</EncryptedSearchContext.Provider>;
};

export default EncryptedSearchProvider;

import { type ReactNode, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { useWelcomeFlags } from '@proton/account';
import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useSubscribeEventManager } from '@proton/components/hooks/useHandler';
import { useLocalStateSync } from '@proton/components/hooks/useLocalStateSync';
import { getIndexKey, setESLogger } from '@proton/encrypted-search/esHelpers';
import { contentIndexingProgress, hasESDB, wrappedGetOldestInfo } from '@proton/encrypted-search/esIDB';
import type { NormalizedSearchParams } from '@proton/encrypted-search/models';
import { useEncryptedSearch } from '@proton/encrypted-search/useEncryptedSearch';
import { useIndexedDBSupport } from '@proton/encrypted-search/useIndexedDBSupport';
import { logger } from '@proton/logger';
import { useGetMessageCounts } from '@proton/mail/store/counts/messageCountsSlice';
import { SECOND } from '@proton/shared/lib/constants';
import { isESEnabledUserChoiceInboxDesktop } from '@proton/shared/lib/desktop/encryptedSearch';
import { EVENT_ERRORS } from '@proton/shared/lib/errors';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';
import { useFlag } from '@proton/unleash/useFlag';

import { defaultESContextMail, defaultESMailStatus } from '../constants';
import { useContentSearch } from '../contentSearch/integration/useContentSearch';
import { convertEventType, getESCallbacks, getESFreeBlobKey, parseSearchParams } from '../helpers/encryptedSearch';
import ESDeletedConversationsCache from '../helpers/encryptedSearch/ESDeletedConversationsCache';
import { useGetMessageKeys } from '../hooks/message/useGetMessageKeys';
import { useContentSearchReadyNotification } from '../hooks/useContentSearchReadyNotification';
import useISESEnabledElectron from '../hooks/useISESEnabledElectron';
import type {
    ESBaseMessage,
    ESDBStatusMail,
    ESMessageContent,
    EncryptedSearchFunctionsMail,
} from '../models/encryptedSearch';
import type { Event } from '../models/event';
import { selectCategoryIDs } from '../store/elements/elementsSelectors';
import { useMailSelector } from '../store/hooks';

// Encrypted search has no logging implementation of its own (see esLogger.ts) - mail is the one
// that knows about @proton/logger, so this is where that link is made explicit.
setESLogger(logger);

const EncryptedSearchContext = createContext<EncryptedSearchFunctionsMail>(defaultESContextMail);
export const useEncryptedSearchContext = () => useContext(EncryptedSearchContext);

interface Props {
    children?: ReactNode;
}

const EncryptedSearchProvider = ({ children }: Props) => {
    const history = useHistory();
    const [user] = useUser();
    const getMessageKeys = useGetMessageKeys();
    const getUserKeys = useGetUserKeys();
    const getMessageCounts = useGetMessageCounts();
    const api = useApi();
    const { welcomeFlags } = useWelcomeFlags();
    const { isESEnabledInbox } = useISESEnabledElectron();
    const categoryIDs = useMailSelector(selectCategoryIDs);
    const { isSearch, page } = parseSearchParams(history.location, categoryIDs);
    const { isSupported: isIDBSupported } = useIndexedDBSupport();

    const [addresses] = useAddresses();

    const [esMailStatus, setESMailStatus] = useState<ESDBStatusMail>(defaultESMailStatus);
    // Allow to track changes in page to set the elements list accordingly
    const pageRef = useRef<number>(0);

    const esCallbacks = getESCallbacks({
        getMessageKeys,
        getMessageCounts,
        api,
        user,
        history,
        numAddresses: addresses?.length || 0,
        categoryIDs,
    });

    // Both orchestrators are invoked unconditionally (rules of hooks); the active one is
    // selected by the `ContentSearch` flag. `useContentSearch` mirrors `useEncryptedSearch`'s
    // API but resolves results from the content-search-v2 index instead of the legacy ES flow.
    const isContentSearchEnabled = useFlag('ContentSearch');
    const [searchVersion] = useLocalStateSync<'v1' | 'v2'>('v2', 'OVERRIDE_SEARCH_V2');
    // Which engine is in charge this session. The `OVERRIDE_SEARCH_V2` debug toggle reloads the app
    // when it changes (see `ContentSearchVersionToggle`), so this is settled for the session.
    const isV2Active = isContentSearchEnabled && searchVersion === 'v2';

    // No `contentIndexingSuccessMessage`: the library would announce content search when its own
    // indexing ends, which is too early for the v2 path. `useContentSearchReadyNotification` below
    // announces it from the status instead, which is correct for both.
    const esLibraryFunctionsV1 = useEncryptedSearch<ESBaseMessage, NormalizedSearchParams, ESMessageContent>({
        refreshMask: EVENT_ERRORS.MAIL,
        esCallbacks,
    });

    const esLibraryFunctionsV2 = useContentSearch({
        refreshMask: EVENT_ERRORS.MAIL,
        esCallbacks,
        // Keep the legacy ES index in sync while v2 is active by forwarding events to its handler
        esLibraryFunctionsV1,
        isActive: isV2Active,
    });

    const esLibraryFunctions = isV2Active ? esLibraryFunctionsV2 : esLibraryFunctionsV1;

    const enableContentSearch = useContentSearchReadyNotification(
        esLibraryFunctions.esStatus,
        esLibraryFunctions.enableContentSearch
    );

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
    const esStatus = useMemo(
        () => ({
            ...esLibraryFunctions.esStatus,
            ...esMailStatus,
        }),
        [esLibraryFunctions.esStatus, esMailStatus]
    );

    /**
     * Initialize ES
     */
    const initializeESMail = async () => {
        if (isESEnabledInbox) {
            if (!(await hasESDB(user.ID))) {
                // Avoid indexing for incognito users, and users that only log in on a device once
                // If initialIndexing is set, it means that the user is most likely not in incognito mode, since they have persistent storage
                // (or they loaded the page twice in a single incognito session)
                const initialIndexing = getItem(getESFreeBlobKey(user.ID)) === 'true';
                if (initialIndexing) {
                    // Start indexing
                    const success = await esLibraryFunctions.enableEncryptedSearch({ isBackgroundIndexing: true });

                    if (success) {
                        await enableContentSearch({ isBackgroundIndexing: true });
                        removeItem(getESFreeBlobKey(user.ID));
                    }
                    return;
                } else {
                    setItem(getESFreeBlobKey(user.ID), 'true');
                    return;
                }
            }
        }

        // Enable encrypted search for all new users. For paid users only,
        // automatically enable content search too
        const automaticallyEnableForNewUser = welcomeFlags.isWelcomeFlow && !isMobile() && !isElectronMail;
        const automaticallyEnableForElectronMail =
            isElectronMail && isESEnabledInbox && isESEnabledUserChoiceInboxDesktop(user.ID);
        if (automaticallyEnableForNewUser || automaticallyEnableForElectronMail) {
            return esLibraryFunctions.enableEncryptedSearch({ showErrorNotification: false }).then((success) => {
                if (success) {
                    return enableContentSearch({ notify: false });
                }
            });
        }

        // Existence of IDB is checked since the following operations interact with it
        if (!(await hasESDB(user.ID))) {
            return;
        }

        const contentProgress = await contentIndexingProgress.read(user.ID);
        if (!contentProgress) {
            return esLibraryFunctions.initializeES();
        }

        // We need to cache the metadata directly, since the library is
        // not yet initialised, i.e. the flags in memory are not yet set.
        // The reason for not initialising the library just yet is that
        // in case an upgrade/downgrade is needed, the flags would be set
        // incorrectly due to the way we encode the latter
        const userKeys = await getUserKeys();
        const indexKey = await getIndexKey(userKeys, user.ID);
        if (!indexKey) {
            return esLibraryFunctions.esDelete();
        }

        return esLibraryFunctions.initializeES();
    };

    useSubscribeEventManager(async (event: Event) => {
        ESDeletedConversationsCache.listenEvents(event);
        // Events go to v2's handler whenever content search is enabled, even when the debug toggle
        // points searches at v1: v2 forwards every event to v1 first, so v1's index stays in sync
        // either way, and then records which messages changed. That recording is what lets a later
        // v2 session import the updates and deletions it slept through — the import's own src/dst
        // diff only finds messages that were never imported, not ones that changed or went away.
        // Without the flag v2 must not be touched at all: its handler creates the v2 database.
        const handleEvent = isContentSearchEnabled
            ? esLibraryFunctionsV2.handleEvent
            : esLibraryFunctionsV1.handleEvent;
        void handleEvent(convertEventType(event, addresses?.length || 0));
    });

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
        const run = async () => {
            const timepoint = await wrappedGetOldestInfo(user.ID);
            if (timepoint) {
                setESMailStatus((esMailStatus) => ({
                    ...esMailStatus,
                    lastContentTime: timepoint.timepoint[0] * SECOND,
                }));
            }
        };

        const { dbExists, contentIndexingDone } = esStatus;
        if (dbExists && contentIndexingDone) {
            void run();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-EFF153
    }, [esStatus.contentIndexingDone]);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-C90011
    }, [isSearch]);

    useEffect(() => {
        if (isIDBSupported) {
            void initializeESMail();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-617FCE
    }, [isIDBSupported]);

    const esFunctions = {
        ...esLibraryFunctions,
        enableContentSearch,
        esStatus,
        openDropdown,
        closeDropdown,
        setTemporaryToggleOff,
    };

    return <EncryptedSearchContext.Provider value={esFunctions}>{children}</EncryptedSearchContext.Provider>;
};

export default EncryptedSearchProvider;

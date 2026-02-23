import { type ReactNode, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { useWelcomeFlags } from '@proton/account';
import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import { useApi, useSubscribeEventManager } from '@proton/components';
import {
    checkVersionedESDB,
    contentIndexingProgress,
    getIndexKey,
    wrappedGetOldestInfo,
} from '@proton/encrypted-search';
import { useIndexedDBSupport } from '@proton/encrypted-search/lib/hooks/useIndexedDBSupport';
import type { NormalizedSearchParams } from '@proton/encrypted-search/lib/models/mail';
import { useEncryptedSearch } from '@proton/encrypted-search/useEncryptedSearch';
import { useGetMessageCounts } from '@proton/mail/store/counts/messageCountsSlice';
import { SECOND } from '@proton/shared/lib/constants';
import { isESEnabledUserChoiceInboxDesktop } from '@proton/shared/lib/desktop/encryptedSearch';
import { EVENT_ERRORS } from '@proton/shared/lib/errors';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';

import { useCategoriesView } from 'proton-mail/components/categoryView/useCategoriesView';
import ESDeletedConversationsCache from 'proton-mail/helpers/encryptedSearch/ESDeletedConversationsCache';

import { defaultESContextMail, defaultESMailStatus } from '../constants';
import { convertEventType, getESCallbacks, getESFreeBlobKey, parseSearchParams } from '../helpers/encryptedSearch';
import { useGetMessageKeys } from '../hooks/message/useGetMessageKeys';
import useISESEnabledElectron from '../hooks/useISESEnabledElectron';
import type {
    ESBaseMessage,
    ESDBStatusMail,
    ESMessageContent,
    EncryptedSearchFunctionsMail,
} from '../models/encryptedSearch';
import type { Event } from '../models/event';

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
    const categoriesView = useCategoriesView();
    const { isSearch, page } = parseSearchParams(history.location, categoriesView.disabledCategoriesIDs);
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
        disabledCategoriesIDs: categoriesView.disabledCategoriesIDs,
    });

    const contentIndexingSuccessMessage = c('Success').t`Message content search enabled`;

    const esLibraryFunctions = useEncryptedSearch<ESBaseMessage, NormalizedSearchParams, ESMessageContent>({
        refreshMask: EVENT_ERRORS.MAIL,
        esCallbacks,
        contentIndexingSuccessMessage,
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
            if (!(await checkVersionedESDB(user.ID))) {
                // Avoid indexing for incognito users, and users that only log in on a device once
                // If initialIndexing is set, it means that the user is most likely not in incognito mode, since they have persistent storage
                // (or they loaded the page twice in a single incognito session)
                const initialIndexing = getItem(getESFreeBlobKey(user.ID)) === 'true';
                if (initialIndexing) {
                    // Start indexing
                    const success = await esLibraryFunctions.enableEncryptedSearch({ isBackgroundIndexing: true });

                    if (success) {
                        await esLibraryFunctions.enableContentSearch({ isBackgroundIndexing: true });
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
                    return esLibraryFunctions.enableContentSearch({ notify: false });
                }
            });
        }

        // Existence of IDB is checked since the following operations interact with it
        if (!(await checkVersionedESDB(user.ID))) {
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
        const indexKey = await getIndexKey(getUserKeys, user.ID);
        if (!indexKey) {
            return esLibraryFunctions.esDelete();
        }

        return esLibraryFunctions.initializeES();
    };

    useSubscribeEventManager(async (event: Event) => {
        ESDeletedConversationsCache.listenEvents(event);
        void esLibraryFunctions.handleEvent(convertEventType(event, addresses?.length || 0));
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
        esStatus,
        openDropdown,
        closeDropdown,
        setTemporaryToggleOff,
    };

    return <EncryptedSearchContext.Provider value={esFunctions}>{children}</EncryptedSearchContext.Provider>;
};

export default EncryptedSearchProvider;

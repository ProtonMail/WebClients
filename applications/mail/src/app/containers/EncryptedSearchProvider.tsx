import { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import {
    FeatureCode,
    useApi,
    useFeature,
    useGetMessageCounts,
    useGetUserKeys,
    useSubscribeEventManager,
    useUser,
    useWelcomeFlags,
} from '@proton/components';
import { checkVersionedESDB, getOldestCachedContentTimepoint, useEncryptedSearch } from '@proton/encrypted-search';
import { SECOND } from '@proton/shared/lib/constants';
import { EVENT_ERRORS } from '@proton/shared/lib/errors';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import { isPaid } from '@proton/shared/lib/user/helpers';

import { defaultESContextMail, defaultESMailStatus } from '../constants';
import { getESHelpers, getItemInfo } from '../helpers/encryptedSearch/encryptedSearchMailHelpers';
import { convertEventType } from '../helpers/encryptedSearch/esSync';
import { parseSearchParams } from '../helpers/encryptedSearch/esUtils';
import { migrate } from '../helpers/encryptedSearch/migration';
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
    const { update: updateSpotlightES } = useFeature(FeatureCode.SpotlightEncryptedSearch);
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

    const esLibraryFunctions = useEncryptedSearch<ESBaseMessage, NormalizedSearchParams, ESMessageContent>({
        refreshMask: EVENT_ERRORS.MAIL,
        esHelpers,
        successMessage: c('Success').t`Message content search activated`,
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
     * Initialize ES
     */
    const initializeESMail = async () => {
        // Migrate old IDBs
        const success = await migrate(
            user.ID,
            getUserKeys,
            () => esHelpers.queryItemsMetadata(new AbortController().signal),
            esHelpers.getTotalItems
        );
        if (!success) {
            await esLibraryFunctions.esDelete();
        }

        // In case of a downgrade from paid to free, remove everything
        if ((await checkVersionedESDB(user.ID)) && !isPaid(user)) {
            return esLibraryFunctions.esDelete();
        }

        // Enable encrypted search for all new users
        if (welcomeFlags.isWelcomeFlow && !isMobile() && isPaid(user)) {
            // Prevent showing the spotlight for ES to them
            await updateSpotlightES(false);
            return esLibraryFunctions
                .enableEncryptedSearch()
                .then(() => esLibraryFunctions.enableContentSearch({ notify: false }));
        }

        return esLibraryFunctions.initializeES();
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
    };

    return <EncryptedSearchContext.Provider value={esFunctions}>{children}</EncryptedSearchContext.Provider>;
};

export default EncryptedSearchProvider;

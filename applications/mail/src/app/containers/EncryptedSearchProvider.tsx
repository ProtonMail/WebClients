import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { c } from 'ttag';
import {
    FeatureCode,
    useApi,
    useFeatures,
    useGetMessageCounts,
    useSubscribeEventManager,
    useUser,
    useWelcomeFlags,
} from '@proton/components';
import { EVENT_ERRORS } from '@proton/shared/lib/errors';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { useEncryptedSearch } from '@proton/encrypted-search';
import {
    EncryptedSearchFunctionsMail,
    ESDBStatusMail,
    ESItemChangesMail,
    ESMessage,
    NormalizedSearchParams,
    StoredCiphertext,
} from '../models/encryptedSearch';
import { useGetMessageKeys } from '../hooks/message/useGetMessageKeys';
import { getESHelpers } from '../helpers/encryptedSearch/encryptedSearchMailHelpers';
import { Event } from '../models/event';
import { convertEventType } from '../helpers/encryptedSearch/esSync';
import {
    defaultESMailStatus,
    indexKeyNames,
    primaryKeyName,
    storeName,
    indexName,
    defaultESContextMail,
} from '../constants';
import { parseSearchParams } from '../helpers/encryptedSearch/esUtils';

const EncryptedSearchContext = createContext<EncryptedSearchFunctionsMail>(defaultESContextMail);
export const useEncryptedSearchContext = () => useContext(EncryptedSearchContext);

interface Props {
    children?: ReactNode;
}

const EncryptedSearchProvider = ({ children }: Props) => {
    const location = useLocation();
    const getMessageKeys = useGetMessageKeys();
    const getMessageCounts = useGetMessageCounts();
    const api = useApi();
    const [user] = useUser();
    const [welcomeFlags] = useWelcomeFlags();
    const [{ get: getESFeature }, { update: updateSpotlightES }] = useFeatures([
        FeatureCode.EnabledEncryptedSearch,
        FeatureCode.SpotlightEncryptedSearch,
    ]);
    const { isSearch, page } = parseSearchParams(location);

    const [esMailStatus, setESMailStatus] = useState<ESDBStatusMail>(defaultESMailStatus);
    // Allow to track changes in page to set the elements list accordingly
    const pageRef = useRef<number>(0);

    const esHelpers = getESHelpers({
        getMessageKeys,
        getMessageCounts,
        api,
        user,
        welcomeFlags,
        getESFeature,
        updateSpotlightES,
    });

    const {
        handleEvent,
        initializeES,
        toggleEncryptedSearch,
        getESDBStatus: getLibraryStatus,
        ...esLibraryFunctions
    } = useEncryptedSearch<Message, ESMessage, NormalizedSearchParams, ESItemChangesMail, StoredCiphertext>({
        storeName,
        indexName,
        primaryKeyName,
        indexKeyNames,
        refreshMask: EVENT_ERRORS.MAIL,
        esHelpers,
        successMessage: c('Success').t`Message content search activated`,
    });

    /**
     * Open the advanced search dropdown
     */
    const openDropdown = () => {
        setESMailStatus((esMailStatus) => {
            return {
                ...esMailStatus,
                dropdownOpened: true,
            };
        });
    };

    /**
     * Close the advanced search dropdown
     */
    const closeDropdown = () => {
        setESMailStatus((esMailStatus) => {
            return {
                ...esMailStatus,
                dropdownOpened: false,
            };
        });
    };

    /**
     * Temporarily disable ES for times when search is too slow and a server-side
     * search is needed. The toggle is set automatically back on upon exiting search mode
     */
    const setTemporaryToggleOff = () => {
        setESMailStatus((esMailStatus) => {
            return {
                ...esMailStatus,
                temporaryToggleOff: true,
            };
        });
        toggleEncryptedSearch();
    };

    /**
     * Report the status of IndexedDB with the addition of Mail-specific fields
     */
    const getESDBStatus = () => {
        return {
            ...getLibraryStatus(),
            ...esMailStatus,
        };
    };

    useSubscribeEventManager(async (event: Event) => {
        void handleEvent(convertEventType(event));
    });

    /**
     * Keep the current page always up to date to avoid pagination glitches
     */
    useEffect(() => {
        pageRef.current = page;
    }, [page]);

    /**
     * Re-enable ES in case it was disabled because of a slow search
     */
    useEffect(() => {
        if (!isSearch) {
            const { temporaryToggleOff } = esMailStatus;
            if (temporaryToggleOff) {
                toggleEncryptedSearch();
                // Remove the temporary switch-off of ES
                setESMailStatus((esMailStatus) => {
                    return {
                        ...esMailStatus,
                        temporaryToggleOff: false,
                    };
                });
            }
        }
    }, [isSearch]);

    useEffect(() => {
        void initializeES();
    }, []);

    const esFunctions = {
        ...esLibraryFunctions,
        getESDBStatus,
        openDropdown,
        closeDropdown,
        setTemporaryToggleOff,
        toggleEncryptedSearch,
    };

    return <EncryptedSearchContext.Provider value={esFunctions}>{children}</EncryptedSearchContext.Provider>;
};

export default EncryptedSearchProvider;

import { createContext, ReactNode, useContext, useEffect, useRef } from 'react';
import { c } from 'ttag';

import { useEncryptedSearch } from '@proton/encrypted-search';
import { useApi, useUser } from '@proton/components';

import { useDriveEventManager } from '../events';
import { useLink } from '../links';
import { useDefaultShare, useShare } from '../shares';
import convertDriveEventsToSearchEvents from './indexing/processEvent';
import useFetchShareMap from './indexing/useFetchShareMap';
import { TIME_INDEX, STORE_NAME } from './constants';
import {
    EncryptedSearchFunctionsDrive,
    ESDriveSearchParams,
    ESItemChangesDrive,
    ESLink,
    StoredCiphertextDrive,
} from './types';
import { useESHelpers } from './useESHelpers';
import useSearchEnabledFeature from './useSearchEnabledFeature';

const SearchLibraryContext = createContext<EncryptedSearchFunctionsDrive | null>(null);

interface Props {
    children?: ReactNode;
}

export const SearchLibraryProvider = ({ children }: Props) => {
    const fetchShareMap = useFetchShareMap();
    const api = useApi();
    const [user] = useUser();
    const { getLinkPrivateKey, getLink } = useLink();
    const { getSharePrivateKey } = useShare();
    const { getDefaultShare } = useDefaultShare();
    const searchEnabled = useSearchEnabledFeature();

    const handlerId = useRef<string>();
    const driveEventManager = useDriveEventManager();

    const esHelpers = useESHelpers({
        api,
        user,
        fetchShareMap,
        getLink,
        shareId: getDefaultShare().then(({ shareId }) => shareId),
        getSharePrivateKey,
        getLinkPrivateKey,
    });

    const esFunctions = useEncryptedSearch<
        ESLink,
        ESLink,
        ESDriveSearchParams,
        ESItemChangesDrive,
        StoredCiphertextDrive
    >({
        storeName: STORE_NAME,
        indexName: TIME_INDEX,
        primaryKeyName: 'id',
        indexKeyNames: ['createTime', 'order'],
        refreshMask: 1,
        esHelpers,
        successMessage: c('Notification').t`Encrypted search activated`,
    });

    useEffect(() => {
        if (searchEnabled) {
            void esFunctions.initializeES();
        }
    }, []);

    useEffect(() => {
        if (handlerId.current) {
            driveEventManager.unregisterEventHandler(handlerId.current);
        }
        handlerId.current = driveEventManager.registerEventHandler(async (shareId, events) => {
            const searchEvents = await convertDriveEventsToSearchEvents(shareId, events, getLinkPrivateKey);
            await esFunctions.handleEvent(searchEvents);
        });

        return () => {
            if (handlerId.current) {
                driveEventManager.unregisterEventHandler(handlerId.current);
            }
        };
    }, [esFunctions]);

    return <SearchLibraryContext.Provider value={esFunctions}>{children}</SearchLibraryContext.Provider>;
};

export default function useSearchLibrary() {
    const state = useContext(SearchLibraryContext);
    if (!state) {
        throw new Error('Trying to use uninitialized SearchLibraryProvider');
    }
    return state;
}

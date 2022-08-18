import { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useApi, useUser } from '@proton/components';
import { useEncryptedSearch } from '@proton/encrypted-search';
import { getES } from '@proton/encrypted-search';

import { useDriveEventManager } from '../_events';
import { useLink } from '../_links';
import { useDefaultShare, useShare } from '../_shares';
import { STORE_NAME, TIME_INDEX } from './constants';
import convertDriveEventsToSearchEvents from './indexing/processEvent';
import useFetchShareMap from './indexing/useFetchShareMap';
import {
    ESDriveSearchParams,
    ESItemChangesDrive,
    ESLink,
    EncryptedSearchFunctionsDrive,
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

    const [isInitialized, setIsInitialize] = useState(false);
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

    const initializeESDrive = async () => {
        // In case an interrupted indexing process is found, we remove anything ES
        // has built so far since drive needs to finish indexing in one go
        const progress = getES.Progress(user.ID);
        if (!!progress) {
            await esFunctions.esDelete();
        }

        await esFunctions.initializeES();
        setIsInitialize(true);
    };

    useEffect(() => {
        // Feature flags come in asyncronously (false back to `false` initially),
        // thus we need to observe their changes
        if (searchEnabled && !isInitialized) {
            void initializeESDrive();
        }
    }, [searchEnabled, isInitialized]);

    useEffect(() => {
        if (!esFunctions.getESDBStatus().dbExists) {
            return;
        }
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
    }, [esFunctions.handleEvent]);

    return <SearchLibraryContext.Provider value={esFunctions}>{children}</SearchLibraryContext.Provider>;
};

export default function useSearchLibrary() {
    const state = useContext(SearchLibraryContext);
    if (!state) {
        throw new Error('Trying to use uninitialized SearchLibraryProvider');
    }
    return state;
}

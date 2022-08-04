import { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useApi, useGetUserKeys, useUser } from '@proton/components';
import {
    INDEXING_STATUS,
    checkVersionedESDB,
    readMetadataProgress,
    useEncryptedSearch,
} from '@proton/encrypted-search';
import { isPaid } from '@proton/shared/lib/user/helpers';

import { useDriveEventManager } from '../_events';
import { useLink } from '../_links';
import { useDefaultShare, useShare } from '../_shares';
import convertDriveEventsToSearchEvents from './indexing/processEvent';
import useFetchShareMap from './indexing/useFetchShareMap';
import { migrate } from './migration';
import { ESDriveSearchParams, ESLink, EncryptedSearchFunctionsDrive } from './types';
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
    const getUserKeys = useGetUserKeys();
    const { getLinkPrivateKey } = useLink();
    const { getSharePrivateKey } = useShare();
    const { getDefaultShare } = useDefaultShare();
    const searchEnabled = useSearchEnabledFeature();

    const [isInitialized, setIsInitialize] = useState(false);
    const handlerId = useRef<string>();
    const driveEventManager = useDriveEventManager();

    const shareId = getDefaultShare().then(({ shareId }) => shareId);

    const esHelpers = useESHelpers({
        api,
        user,
        fetchShareMap,
        shareId,
        getSharePrivateKey,
        getLinkPrivateKey,
    });

    const esFunctions = useEncryptedSearch<ESLink, ESDriveSearchParams>({
        refreshMask: 1,
        esHelpers,
        successMessage: c('Notification').t`Encrypted search activated`,
        notifyMetadataIndexed: true,
    });

    const initializeESDrive = async () => {
        // Migrate old IDBs
        const success = await migrate(user.ID, getUserKeys, shareId);
        if (!success) {
            return esFunctions.esDelete();
        }

        // In case of a downgrade from paid to free, remove everything
        if ((await checkVersionedESDB(user.ID)) && !isPaid(user)) {
            return esFunctions.esDelete();
        }

        // In case an interrupted indexing process is found, we remove anything ES
        // has built so far since drive needs to finish indexing in one go
        const progress = await readMetadataProgress(user.ID);
        if (!!progress && progress.status !== INDEXING_STATUS.ACTIVE) {
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

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

import { c } from 'ttag';

import { useApi, useGetUserKeys, useNotifications, useUser } from '@proton/components';
import {
    INDEXING_STATUS,
    checkVersionedESDB,
    metadataIndexingProgress,
    useEncryptedSearch,
} from '@proton/encrypted-search';
import { EVENT_TYPES } from '@proton/shared/lib/drive/constants';
import { isPaid } from '@proton/shared/lib/user/helpers';

import isSearchFeatureEnabled from '../../utils/isSearchFeatureEnabled';
import { useDriveEventManager } from '../_events';
import { useLink } from '../_links';
import { useDefaultShare, useShare } from '../_shares';
import convertDriveEventsToSearchEvents from './indexing/processEvent';
import useFetchShareMap from './indexing/useFetchShareMap';
import { migrate } from './migration';
import type { ESDriveSearchParams, ESLink, EncryptedSearchFunctionsDrive } from './types';
import { useESCallbacks } from './useESCallbacks';

const SearchLibraryContext = createContext<EncryptedSearchFunctionsDrive | null>(null);

interface Props {
    children?: ReactNode;
}

export const SearchLibraryProvider = ({ children }: Props) => {
    const fetchShareMap = useFetchShareMap();
    const api = useApi();
    const { createNotification } = useNotifications();
    const [user] = useUser();
    const getUserKeys = useGetUserKeys();
    const { getLinkPrivateKey } = useLink();
    const { getSharePrivateKey } = useShare();
    const { getDefaultShare } = useDefaultShare();
    const searchEnabled = isSearchFeatureEnabled();

    const [isInitialized, setIsInitialize] = useState(false);
    const driveEventManager = useDriveEventManager();

    const defaultShareIdPromise = getDefaultShare().then(({ shareId }) => shareId);

    const esCallbacks = useESCallbacks({
        api,
        user,
        fetchShareMap,
        shareId: defaultShareIdPromise,
        getSharePrivateKey,
        getLinkPrivateKey,
    });

    const handleMetadataIndexed = () => {
        createNotification({
            type: 'success',
            text: c('Notification').t`Encrypted search activated`,
        });
    };

    const esFunctions = useEncryptedSearch<ESLink, ESDriveSearchParams>({
        refreshMask: 1,
        esCallbacks,
        onMetadataIndexed: handleMetadataIndexed,
        sendMetricsOnSearch: true,
    });

    const initializeESDrive = async () => {
        // Migrate old IDBs
        const success = await migrate(user.ID, getUserKeys, defaultShareIdPromise);
        if (!success) {
            return esFunctions.esDelete();
        }

        // In case of a downgrade from paid to free, remove everything
        if ((await checkVersionedESDB(user.ID)) && !isPaid(user)) {
            return esFunctions.esDelete();
        }

        // In case an interrupted indexing process is found, we remove anything ES
        // has built so far since drive needs to finish indexing in one go
        const progress = await metadataIndexingProgress.read(user.ID);
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
        if (!esFunctions.esStatus.dbExists) {
            return;
        }

        const callbackId = driveEventManager.eventHandlers.register(async (volumeId, events, processedEventCounter) => {
            // The store is updated via volume events which includes all shares
            // including my files or devices. Encrypted search works only for
            // my files and thus we need to filter for events affecting only
            // the default share. In case of delete operation, share ID is not
            // known and thus we do a hack and try to guess it is for my files
            // share. There might be a minor problem but before the risk gets
            // big we should be switched to volume-centric cache and not deal
            // with this issue.
            const defaultShareId = await defaultShareIdPromise;
            const defaultShareEvents = {
                ...events,
                events: events.events
                    .map(
                        // Move from one share to another is just simple meta
                        // data update in volume context, but it is delete in
                        // share context.
                        (event) =>
                            !event.originShareId || event.encryptedLink.rootShareId === event.originShareId
                                ? event
                                : {
                                      ...event,
                                      eventType: EVENT_TYPES.DELETE,
                                      encryptedLink: {
                                          ...event.encryptedLink,
                                          rootShareId: event.originShareId,
                                      },
                                  }
                    )
                    .filter(
                        (event) =>
                            event.eventType === EVENT_TYPES.DELETE || event.encryptedLink.rootShareId === defaultShareId
                    ),
            };
            defaultShareEvents.events.forEach((event) => {
                processedEventCounter(events.eventId, event);
            });
            const searchEvents = await convertDriveEventsToSearchEvents(
                defaultShareId,
                defaultShareEvents,
                getLinkPrivateKey
            );
            await esFunctions.handleEvent(searchEvents);
        });

        return () => {
            driveEventManager.eventHandlers.unregister(callbackId);
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

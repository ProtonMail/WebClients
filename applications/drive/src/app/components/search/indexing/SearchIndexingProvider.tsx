import { createContext, ReactNode, useContext, useEffect, useRef } from 'react';

import { ENCRYPTED_SEARCH_ENABLED } from '@proton/shared/lib/drive/constants';
import { useEncryptedSearch } from '@proton/encrypted-search';
import { useApi, useUser } from '@proton/components';

import {
    EncryptedSearchFunctionsDrive,
    ESDriveSearchParams,
    ESItemChangesDrive,
    ESLink,
    StoredCiphertextDrive,
} from '../types';
import { useDriveCache } from '../../DriveCache/DriveCacheProvider';
import { useESHelpers } from './useESHelpers';
import { TIME_INDEX, STORE_NAME } from '../constants';
import { useDriveEventManager } from '../../driveEventManager';
import { convertDriveEventToSearchEvent } from '../processEvent';
import useDrive from '../../../hooks/drive/useDrive';
import { useSearchAPI } from '../useSearchAPI';

const SearchIndexingContext = createContext<EncryptedSearchFunctionsDrive>(null as any);
interface Props {
    children?: ReactNode;
}

export const SearchIndexingProvider = ({ children }: Props) => {
    const { getShareKeys, getLinkMeta } = useDrive();
    const { fetchShareMap } = useSearchAPI();
    const cache = useDriveCache();
    const api = useApi();
    const [user] = useUser();

    const handlerId = useRef<string>();
    const driveEventManager = useDriveEventManager();
    const { getLinkKeys } = useDrive();

    const { defaultShareId } = cache;
    if (!defaultShareId) {
        // TODO
        throw new Error('uninitialized cache');
    }
    const esHelpers = useESHelpers({
        api,
        user,
        fetchShareMap,
        getLinkMeta,
        shareId: defaultShareId,
        getShareKeys,
        getLinkKeys,
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
        // TODO: come up with success message
        successMessage: 'Sync is completed',
    });

    useEffect(() => {
        if (ENCRYPTED_SEARCH_ENABLED) {
            void esFunctions.initializeES();
        }
    }, []);

    useEffect(() => {
        if (handlerId.current) {
            driveEventManager.unregisterEventHandler(handlerId.current);
        }
        handlerId.current = driveEventManager.registerEventHandler(async (events, shareId) => {
            const searchEvents = await convertDriveEventToSearchEvent(shareId, [events], getLinkKeys);

            if (searchEvents[0]) {
                void esFunctions.handleEvent(searchEvents[0]);
            }
        });

        return () => {
            if (handlerId.current) {
                driveEventManager.unregisterEventHandler(handlerId.current);
            }
        };
    }, [esFunctions]);

    return <SearchIndexingContext.Provider value={esFunctions}>{children}</SearchIndexingContext.Provider>;
};

export const useSearchIndexingContext = () => {
    const state = useContext(SearchIndexingContext);
    if (!state) {
        throw new Error('Trying to use uninitialized SearchIndexingProvider');
    }
    return state;
};

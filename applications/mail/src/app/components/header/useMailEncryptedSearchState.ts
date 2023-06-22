import { useEffect } from 'react';

import { useEncryptedSearchState } from '@proton/encrypted-search';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';

export const useMailEncryptedSearchState = (isOpen: boolean) => {
    const { getProgressRecorderRef, getESDBStatus } = useEncryptedSearchContext();
    const { isEnablingContentSearch, isDBLimited, isRefreshing, contentIndexingDone, lastContentTime } =
        getESDBStatus();

    const { setOldestTime, esState } = useEncryptedSearchState({
        isIndexing: isEnablingContentSearch || (contentIndexingDone && isRefreshing),
        getProgressRecorderRef,
        shouldPersistEstimation: true,
    });

    const wrappedSetOldestTime = async () => {
        if (contentIndexingDone && isDBLimited) {
            await setOldestTime(lastContentTime);
        }
    };

    useEffect(() => {
        if (isOpen) {
            void wrappedSetOldestTime();
        }
    }, [isOpen]);

    useEffect(() => {
        void wrappedSetOldestTime();
    }, [isEnablingContentSearch, isRefreshing]);

    return esState;
};

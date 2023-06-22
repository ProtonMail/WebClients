import useEncryptedSearchState from '@proton/encrypted-search/lib/useEncryptedSearchState';

import { useSearchLibrary } from '..';

const useSearchState = () => {
    const { getProgressRecorderRef, getESDBStatus } = useSearchLibrary();
    const { isEnablingEncryptedSearch, isRefreshing } = getESDBStatus();

    const { esState } = useEncryptedSearchState({
        isIndexing: isEnablingEncryptedSearch || isRefreshing,
        getProgressRecorderRef,
    });

    return esState;
};

export default useSearchState;

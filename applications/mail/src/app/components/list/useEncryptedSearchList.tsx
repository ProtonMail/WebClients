import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { EllipsisLoader } from '@proton/components';
import { SECOND } from '@proton/shared/lib/constants';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';

const useEncryptedSearchList = (isSearch: boolean, loading: boolean, page: number, total: number) => {
    const { getESDBStatus } = useEncryptedSearchContext();

    const { dbExists, esEnabled, isSearchPartial, isCacheLimited, isSearching, isCacheReady } = getESDBStatus();
    const [esTimer, setESTimer] = useState<NodeJS.Timeout>(setTimeout(() => {}));
    const [esTimerExpired, setESTimerExpired] = useState<boolean>(false);
    const [ESCacheReady, setESCacheReady] = useState(isCacheReady);

    const isLastPage = page === total;
    const isESLoading = isSearch && loading && dbExists && esEnabled && isSearching;
    const showESSlowToolbar = esTimerExpired && isESLoading;
    const searchLimitedMode = isSearch && !loading && dbExists && esEnabled && isCacheLimited;
    const disableGoToLast = searchLimitedMode && isSearchPartial;
    const useLoadingElement =
        isSearch &&
        esEnabled &&
        isLastPage &&
        (!isCacheReady || searchLimitedMode) &&
        (isSearching || !isSearchPartial);

    const loadingText = isSearching ? c('Info').t`Loading` : c('Info').t`No more results found`;
    const loadingElement = (
        <div className="flex flex-nowrap flex-align-items-center flex-justify-center color-weak my-6">
            {loadingText}
            {isSearching && <EllipsisLoader />}
        </div>
    );

    useEffect(() => {
        if (isESLoading) {
            setESTimer(() =>
                setTimeout(() => {
                    setESTimerExpired(() => true);
                }, 5 * SECOND)
            );
        } else {
            clearTimeout(esTimer);
            setESTimerExpired(() => false);
        }
    }, [isESLoading]);

    useEffect(() => {
        if (!esEnabled || (esEnabled && ESCacheReady)) {
            return;
        }

        // If ES is enabled and cache not ready, wait until it becomes ready
        const interval = setInterval(() => {
            const isCacheReady = getESDBStatus().isCacheReady;

            if (isCacheReady) {
                setESCacheReady(true);
                clearInterval(interval);
            }
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, [esEnabled]);

    return {
        showESSlowToolbar,
        loadingElement,
        disableGoToLast,
        useLoadingElement,
        ESCacheReady,
    };
};

export default useEncryptedSearchList;

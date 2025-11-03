import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { EllipsisLoader } from '@proton/components';
import { SECOND } from '@proton/shared/lib/constants';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';

const useEncryptedSearchList = (isSearch: boolean, loading: boolean, page: number, total: number) => {
    const { esStatus } = useEncryptedSearchContext();

    const { dbExists, esEnabled, isSearchPartial, isSearching, getCacheStatus } = esStatus;
    const [esTimer, setESTimer] = useState<NodeJS.Timeout>(setTimeout(() => {}));
    const [esTimerExpired, setESTimerExpired] = useState<boolean>(false);

    const { isCacheLimited, isCacheReady } = getCacheStatus();
    const [ESCacheReady, setESCacheReady] = useState(isCacheReady);

    const isLastPage = page === total;
    const isESLoading = isSearch && loading && dbExists && esEnabled && isSearching;
    const showESSlowToolbar = esTimerExpired && isESLoading;
    const searchLimitedMode = isSearch && !loading && dbExists && esEnabled && isCacheLimited;
    const useLoadingElement =
        isSearch &&
        esEnabled &&
        isLastPage &&
        (!isCacheReady || searchLimitedMode) &&
        (isSearching || !isSearchPartial);

    const loadingText = isSearching ? c('Info').t`Loading` : c('Info').t`No more results found`;
    const loadingElement = (
        <div className="flex flex-nowrap items-center justify-center color-weak my-6">
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
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-BFFE2C
    }, [isESLoading]);

    useEffect(() => {
        if (!esEnabled || (esEnabled && ESCacheReady)) {
            return;
        }

        // If ES is enabled and cache not ready, wait until it becomes ready
        const interval = setInterval(() => {
            const { isCacheReady } = getCacheStatus();

            if (isCacheReady) {
                setESCacheReady(true);
                clearInterval(interval);
            }
        }, 1000);

        return () => {
            clearInterval(interval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-860367
    }, [esEnabled]);

    return {
        isESLoading,
        showESSlowToolbar,
        loadingElement,
        useLoadingElement,
        ESCacheReady,
    };
};

export default useEncryptedSearchList;

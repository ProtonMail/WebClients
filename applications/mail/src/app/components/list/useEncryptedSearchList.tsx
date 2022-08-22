import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { EllipsisLoader } from '@proton/components';
import { SECOND } from '@proton/shared/lib/constants';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';

const useEncryptedSearchList = (isSearch: boolean, loading: boolean, page: number, total: number) => {
    const { getESDBStatus } = useEncryptedSearchContext();
    const { dbExists, esEnabled, isSearchPartial, isCacheLimited, isSearching } = getESDBStatus();
    const [esTimer, setESTimer] = useState<NodeJS.Timeout>(setTimeout(() => {}));
    const [esTimerExpired, setESTimerExpired] = useState<boolean>(false);

    const isLastPage = page === total;
    const isESLoading = isSearch && loading && dbExists && esEnabled && isSearching;
    const showESSlowToolbar = esTimerExpired && isESLoading;
    const searchLimitedMode = isSearch && !loading && dbExists && esEnabled && isCacheLimited;
    const disableGoToLast = searchLimitedMode && isSearchPartial;
    const useLoadingElement = searchLimitedMode && (isSearching || !isSearchPartial) && isLastPage;

    const loadingText = isSearching ? c('Info').t`Loading` : c('Info').t`No more results found`;
    const loadingElement = (
        <div className="flex flex-nowrap flex-align-items-center flex-justify-center color-weak mt1-5 mb1-5">
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

    return { showESSlowToolbar, loadingElement, disableGoToLast, useLoadingElement };
};

export default useEncryptedSearchList;

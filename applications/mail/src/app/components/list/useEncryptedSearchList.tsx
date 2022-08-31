import { useEffect, useState } from 'react';
import { useStore } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { AppLink, EllipsisLoader, Info, useUser } from '@proton/components';
import { SECOND } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { isPaid } from '@proton/shared/lib/user/helpers';

import { ES_BANNER_REF, PAGE_SIZE } from '../../constants';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { sort } from '../../helpers/elements';
import { parseSearchParams } from '../../helpers/encryptedSearch/esUtils';
import { RootState } from '../../logic/store';
import { ESMessage } from '../../models/encryptedSearch';

interface Props {
    isSearch: boolean;
    loading: boolean;
    page: number;
    total: number;
}

const useEncryptedSearchList = ({ isSearch, loading, page, total }: Props) => {
    const history = useHistory();
    const [user] = useUser();
    const store = useStore<RootState>();
    const { getESDBStatus } = useEncryptedSearchContext();

    const { dbExists, esEnabled, isSearchPartial, isCacheLimited, isSearching, contentIndexingDone } = getESDBStatus();
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

    const { esSearchParams } = parseSearchParams(history.location);
    let showESLimitedContent =
        isSearch &&
        !isESLoading &&
        !isPaid(user) &&
        contentIndexingDone &&
        esEnabled &&
        !!esSearchParams &&
        // Since there are no keywords, a metadata search
        // should never show the banner
        !!esSearchParams.normalizedKeywords &&
        // There is no correct place to show the banner
        // if the order is by size
        esSearchParams.sort.sort === 'Time';

    // Show an element inside the list of ES results to mark the end of messages
    // whose content has been searched for free users with partial ES active
    let limitedContentIndex = -1;
    if (showESLimitedContent) {
        // We find the position where to insert the banner
        const elementsArray = sort(
            Object.values(store.getState().elements.elements),
            esSearchParams!.sort,
            esSearchParams!.labelID
        );

        for (let i = 0; i < elementsArray.length; i++) {
            if (
                esSearchParams!.sort.desc
                    ? !!(elementsArray[i] as ESMessage)?.decryptedBody
                    : !(elementsArray[i] as ESMessage)?.decryptedBody
            ) {
                limitedContentIndex = i;
            }
        }

        // If the banner should be placed in another page, we don't show anything
        const shouldBeInCurrentPage =
            limitedContentIndex === -1 ||
            (limitedContentIndex >= (page - 1) * PAGE_SIZE && limitedContentIndex < page * PAGE_SIZE);
        if (!shouldBeInCurrentPage) {
            showESLimitedContent = false;
        }
    }

    const limitedContentTitle = (
        <div className="mr1 ml1">
            <span className="text-bold mr0-5">
                {limitedContentIndex !== -1
                    ? c('Info').t`End of search results from past 30 days`
                    : c('Info').t`No search results from past 30 days. Searching the rest of your inbox`}
            </span>
            <Info
                questionMark
                title={c('Tooltip')
                    .t`For messages older than 30 days, only the subject line and recipient list is searched`}
            />
        </div>
    );

    const paidPlansButton = (
        <AppLink to={`/dashboard?ref=${ES_BANNER_REF}`} toApp={APPS.PROTONACCOUNT} className="text-bold">
            {
                // translator: sentence appears when a free user has content search available only for most recent messages. Complete sentence example: "Content search of the entire inbox is available for paid plans."
                c('Link').t`paid plan`
            }
        </AppLink>
    );

    const limitedContentText = (
        <div className="mr1 ml1">
            {
                // translator: sentence appears when a free user has content search available only for most recent messages. Complete sentence example: "Content search of the entire inbox is available for paid plans."
                c('Info').jt`Search full content of older messages with a ${paidPlansButton}`
            }
        </div>
    );

    const limitedContentElement = (
        <div
            className="flex flex-nowrap flex-column flex-align-items-center flex-justify-center color-weak pt0-5 pb0-5 bg-strong"
            key="ESLimitedContentElement"
        >
            {limitedContentTitle}
            {limitedContentText}
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

    return {
        showESSlowToolbar,
        loadingElement,
        disableGoToLast,
        useLoadingElement,
        limitedContentElement,
        limitedContentIndex,
        showESLimitedContent,
    };
};

export default useEncryptedSearchList;

import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { SEARCH_TYPE, useSearchTelemetry } from '@proton/encrypted-search/lib/useSearchTelemetry';
import type { Filter, SearchParameters, Sort } from '@proton/shared/lib/mail/search';

import { useCategoriesView } from 'proton-mail/components/categoryView/useCategoriesView';
import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { isSearch } from '../../helpers/elements';
import { parseSearchParams } from '../../helpers/encryptedSearch';
import type { Element } from '../../models/element';
import {
    addESResults,
    load as loadAction,
    manualFulfilled,
    manualPending,
    setParams,
    updatePage,
} from '../../store/elements/elementsActions';
import {
    isES as isESSelector,
    messagesToLoadMoreES as messagesToLoadMoreESSelector,
    shouldLoadElements as shouldSendRequestSelector,
} from '../../store/elements/elementsSelectors';
import type { MailState } from '../../store/store';

export interface EncryptedSearchParams {
    labelID: string;
    page: number;
    pageSize: number;
    sort: Sort;
    filter: Filter;
    search: SearchParameters;
    onPage: (page: number) => void;
}

const MAX_TOTAL_RESULTS = 10000;

export const useApplyEncryptedSearch = ({
    labelID,
    search,
    page,
    pageSize,
    sort,
    filter,
    onPage,
}: EncryptedSearchParams) => {
    const history = useHistory();
    const { createNotification } = useNotifications();
    const dispatch = useMailDispatch();

    const { esStatus, encryptedSearch } = useEncryptedSearchContext();
    const { esEnabled } = esStatus;

    const { sendPerformSearchReport } = useSearchTelemetry();
    const categoriesView = useCategoriesView();

    // Force conversation mode to false in a search context
    const params = { conversationMode: false, sort, filter, search, esEnabled, isSearching: isSearch(search) };

    const isES = useMailSelector((state: MailState) => isESSelector(state, { search, esStatus }));
    const shouldLoadElements = useMailSelector((state: MailState) => shouldSendRequestSelector(state, { page }));
    const messagesToLoadMoreES = useMailSelector((state: MailState) =>
        messagesToLoadMoreESSelector(state, { page, search, esStatus })
    );

    const setEncryptedSearchResults = (elements: Element[]) => {
        dispatch(
            addESResults({
                elements,
                page: parseSearchParams(history.location, categoriesView.disabledCategoriesIDs).page,
                params: { ...params, labelID },
                pageSize,
            })
        );
    };

    const executeSearch = async () => {
        dispatch(manualPending());
        dispatch(setParams({ ...params }));
        try {
            let success = false;
            if (isES) {
                success = await encryptedSearch(setEncryptedSearchResults);
            }
            if (!success) {
                // We limit the number of results to max 10000 items to avoid API issues
                if (page >= MAX_TOTAL_RESULTS / pageSize) {
                    // This block will most likely be called two times
                    // Fortunately notification system use a de-duplication system
                    createNotification({
                        text: c('Error')
                            .t`Your search matched too many results. Please limit your search and try again.`,
                        type: 'error',
                    });
                    dispatch(manualFulfilled());
                    onPage(0);

                    void dispatch(loadAction({ page: 0, pageSize, abortController: undefined }));
                    sendPerformSearchReport({
                        type: SEARCH_TYPE.BACKEND_SIDE,
                        searchParams: {
                            sort: params.sort,
                            filter: params.filter,
                            ...params.search,
                            page,
                            pageSize,
                            labelID,
                        },
                        hasReachedAPILimit: true,
                    });
                } else {
                    void dispatch(loadAction({ page, pageSize, abortController: undefined }));
                    sendPerformSearchReport({
                        type: SEARCH_TYPE.BACKEND_SIDE,
                        searchParams: {
                            sort: params.sort,
                            filter: params.filter,
                            ...params.search,
                            page,
                            pageSize,
                            labelID,
                        },
                    });
                }
            }
        } catch (error: any) {
            createNotification({
                text: c('Error').t`There has been an issue with content search. Default search has been used instead.`,
                type: 'error',
            });
            void dispatch(loadAction({ page, pageSize, abortController: undefined }));
        }
    };

    useEffect(() => {
        if (shouldLoadElements && isSearch(search)) {
            void executeSearch();
        }
        if (isES && messagesToLoadMoreES !== 0) {
            // We navigate directly to the requested page first, because it is always guaranteed
            // to contain some messages, either because it's an already full intermediate page or
            // because it's the partial last page available
            dispatch(updatePage(parseSearchParams(history.location, categoriesView.disabledCategoriesIDs).page));
            void encryptedSearch(setEncryptedSearchResults, messagesToLoadMoreES);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-C75F36
    }, [shouldLoadElements, messagesToLoadMoreES, search]);
};

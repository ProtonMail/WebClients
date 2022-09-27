import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { useApi, useEventManager, useNotifications } from '@proton/components';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { isSearch } from '../../helpers/elements';
import { parseSearchParams } from '../../helpers/encryptedSearch/esUtils';
import {
    addESResults,
    load as loadAction,
    manualFulfilled,
    manualPending,
    updatePage,
} from '../../logic/elements/elementsActions';
import {
    isES as isESSelector,
    messagesToLoadMoreES as messagesToLoadMoreESSelector,
    shouldSendRequest as shouldSendRequestSelector,
} from '../../logic/elements/elementsSelectors';
import { RootState } from '../../logic/store';
import { Element } from '../../models/element';
import { Filter, SearchParameters, Sort } from '../../models/tools';

interface EncryptedSearchParams {
    conversationMode: boolean;
    labelID: string;
    page: number;
    sort: Sort;
    filter: Filter;
    search: SearchParameters;
    onPage: (page: number) => void;
}

export const useApplyEncryptedSearch = ({
    conversationMode,
    labelID,
    search,
    page,
    sort,
    filter,
    onPage,
}: EncryptedSearchParams) => {
    const history = useHistory();
    const api = useApi();
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();
    const { call } = useEventManager();

    const { getESDBStatus, encryptedSearch } = useEncryptedSearchContext();
    const esDBStatus = getESDBStatus();
    const { esEnabled } = esDBStatus;

    const params = { labelID, conversationMode, sort, filter, search, esEnabled };

    const isES = useSelector((state: RootState) => isESSelector(state, { search, esDBStatus }));
    const shouldSendRequest = useSelector((state: RootState) => shouldSendRequestSelector(state, { page, params }));
    const messagesToLoadMoreES = useSelector((state: RootState) =>
        messagesToLoadMoreESSelector(state, { page, search, esDBStatus })
    );

    const setEncryptedSearchResults = (elements: Element[]) => {
        dispatch(addESResults({ elements, page: parseSearchParams(history.location).page }));
    };

    const executeSearch = async () => {
        dispatch(manualPending());
        try {
            let success = false;
            if (isES) {
                success = await encryptedSearch(setEncryptedSearchResults);
            }
            if (!success) {
                if (page >= 200) {
                    // This block will most likely be called two times
                    // Fortunately notification system use a de-duplication system
                    createNotification({
                        text: c('Error')
                            .t`Your search matched too many results. Please limit your search and try again.`,
                        type: 'error',
                    });
                    dispatch(manualFulfilled());
                    onPage(0);
                } else {
                    void dispatch(
                        loadAction({ api, call, conversationMode, page, params, abortController: undefined })
                    );
                }
            }
        } catch (error: any) {
            createNotification({
                text: c('Error').t`There has been an issue with content search. Default search has been used instead.`,
                type: 'error',
            });
            void dispatch(loadAction({ api, call, conversationMode, page, params, abortController: undefined }));
        }
    };

    useEffect(() => {
        if (shouldSendRequest && isSearch(search)) {
            void executeSearch();
        }
        if (isES && messagesToLoadMoreES !== 0) {
            // We navigate directly to the requested page first, because it is always guaranteed
            // to contain some messages, either because it's an already full intermediate page or
            // beacause it's the partial last page available
            dispatch(updatePage(parseSearchParams(history.location).page));
            void encryptedSearch(setEncryptedSearchResults, messagesToLoadMoreES);
        }
    }, [shouldSendRequest, messagesToLoadMoreES, search]);
};

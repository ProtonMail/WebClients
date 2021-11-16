import { c } from 'ttag';
import { useDispatch, useSelector } from 'react-redux';
import { useApi, useNotifications } from '@proton/components';
import { useEffect } from 'react';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { isSearch } from '../../helpers/elements';
import { manualPending, load as loadAction, manualFulfilled, addESResults } from '../../logic/elements/elementsActions';
import { ESSetsElementsCache } from '../../models/encryptedSearch';
import { RootState } from '../../logic/store';
import {
    isES as isESSelector,
    shouldLoadMoreES as shouldLoadMoreESSelector,
    shouldSendRequest as shouldSendRequestSelector,
    shouldUpdatePage as shouldUpdatePageSelector,
} from '../../logic/elements/elementsSelectors';
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

export const useEncryptedSearch = ({
    conversationMode,
    labelID,
    search,
    page,
    sort,
    filter,
    onPage,
}: EncryptedSearchParams) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();

    const { getESDBStatus, encryptedSearch, incrementSearch } = useEncryptedSearchContext();
    const esDBStatus = getESDBStatus();
    const { esEnabled } = esDBStatus;

    const params = { labelID, page, conversationMode, sort, filter, search, esEnabled };

    const isES = useSelector((state: RootState) => isESSelector(state, { search, esDBStatus }));
    const shouldSendRequest = useSelector((state: RootState) => shouldSendRequestSelector(state, { page, params }));
    const shouldUpdatePage = useSelector((state: RootState) => shouldUpdatePageSelector(state, { page }));
    const shouldLoadMoreES = useSelector((state: RootState) =>
        shouldLoadMoreESSelector(state, { page, search, esDBStatus })
    );

    const setEncryptedSearchResults: ESSetsElementsCache = (elements, page) => {
        dispatch(addESResults({ elements, page }));
    };

    const executeSearch = async () => {
        dispatch(manualPending());
        try {
            let success = false;
            if (isES) {
                success = await encryptedSearch(labelID, setEncryptedSearchResults);
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
                    void dispatch(loadAction({ api, conversationMode, page, params, abortController: undefined }));
                }
            }
        } catch (error: any) {
            createNotification({
                text: c('Error').t`There has been an issue with content search. Default search has been used instead.`,
                type: 'error',
            });
            void dispatch(loadAction({ api, conversationMode, page, params, abortController: undefined }));
        }
    };

    useEffect(() => {
        if (shouldSendRequest && isSearch(search)) {
            void executeSearch();
        }
        if (isES && (shouldUpdatePage || shouldLoadMoreES)) {
            if (shouldLoadMoreES) {
                dispatch(manualPending());
            }
            void incrementSearch(page, setEncryptedSearchResults, shouldLoadMoreES);
        }
    }, [shouldSendRequest, shouldUpdatePage, shouldLoadMoreES, search]);
};

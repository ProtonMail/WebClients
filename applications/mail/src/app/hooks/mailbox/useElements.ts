import { useCallback, useEffect, useRef } from 'react';
import { useApi, useCache, useConversationCounts, useMessageCounts } from '@proton/components';
import { omit } from '@proton/shared/lib/helpers/object';
import { ConversationCountsModel, MessageCountsModel } from '@proton/shared/lib/models';
import { LabelCount } from '@proton/shared/lib/interfaces/Label';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { useStore, useDispatch, useSelector } from 'react-redux';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { isSearch } from '../../helpers/elements';
import { Element } from '../../models/element';
import { Filter, Sort, SearchParameters } from '../../models/tools';
import { pageCount } from '../../helpers/paging';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { reset, removeExpired, load as loadAction, updatePage } from '../../logic/elements/elementsActions';
import {
    params as paramsSelector,
    elementsMap as elementsMapSelector,
    elements as elementsSelector,
    elementIDs as elementIDsSelector,
    shouldLoadMoreES as shouldLoadMoreESSelector,
    shouldResetCache as shouldResetCacheSelector,
    shouldSendRequest as shouldSendRequestSelector,
    shouldUpdatePage as shouldUpdatePageSelector,
    dynamicTotal as dynamicTotalSelector,
    placeholderCount as placeholderCountSelector,
    loading as loadingSelector,
    totalReturned as totalReturnedSelector,
    expectingEmpty as expectingEmptySelector,
    loadedEmpty as loadedEmptySelector,
    partialESSearch as partialESSearchSelector,
    stateInconsistency as stateInconsistencySelector,
} from '../../logic/elements/elementsSelectors';
import { useElementsEvents } from '../events/useElementsEvents';
import { RootState } from '../../logic/store';
import { useExpirationCheck } from '../useExpiration';
import { getLocalID, useMessageCache } from '../../containers/MessageProvider';
import { conversationByID } from '../../logic/conversations/conversationsSelectors';

interface Options {
    conversationMode: boolean;
    labelID: string;
    page: number;
    sort: Sort;
    filter: Filter;
    search: SearchParameters;
    onPage: (page: number) => void;
}

interface ReturnValue {
    labelID: string;
    elements: Element[];
    elementIDs: string[];
    placeholderCount: number;
    loading: boolean;
    total: number | undefined;
}

interface UseElements {
    (options: Options): ReturnValue;
}

export const useElements: UseElements = ({ conversationMode, labelID, search, page, sort, filter, onPage }) => {
    const store = useStore();
    const dispatch = useDispatch();

    const api = useApi();
    const abortControllerRef = useRef<AbortController>();

    const [conversationCounts = [], loadingConversationCounts] = useConversationCounts() as [
        LabelCount[],
        boolean,
        Error
    ];
    const [messageCounts = [], loadingMessageCounts] = useMessageCounts() as [LabelCount[], boolean, Error];
    const countValues = conversationMode ? conversationCounts : messageCounts;
    const countsLoading = conversationMode ? loadingConversationCounts : loadingMessageCounts;

    const { getESDBStatus } = useEncryptedSearchContext();
    const esDBStatus = getESDBStatus();
    const { esEnabled } = esDBStatus;

    const globalCache = useCache();

    const params = { labelID, conversationMode, page, sort, filter, search, esEnabled };
    const counts = { counts: countValues, loading: countsLoading };

    const stateParams = useSelector(paramsSelector);
    const elementsMap = useSelector(elementsMapSelector);
    const elements = useSelector(elementsSelector);
    const elementIDs = useSelector(elementIDsSelector);
    const shouldLoadMoreES = useSelector((state: RootState) =>
        shouldLoadMoreESSelector(state, { page, search, esDBStatus })
    );
    const shouldResetCache = useSelector((state: RootState) => shouldResetCacheSelector(state, { page, params }));
    const shouldSendRequest = useSelector((state: RootState) => shouldSendRequestSelector(state, { page, params }));
    const shouldUpdatePage = useSelector((state: RootState) => shouldUpdatePageSelector(state, { page }));
    const dynamicTotal = useSelector((state: RootState) => dynamicTotalSelector(state, { counts }));
    const placeholderCount = useSelector((state: RootState) => placeholderCountSelector(state, { counts }));
    const loading = useSelector((state: RootState) => loadingSelector(state));
    const totalReturned = useSelector((state: RootState) => totalReturnedSelector(state, { counts }));
    const expectingEmpty = useSelector((state: RootState) => expectingEmptySelector(state, { counts }));
    const loadedEmpty = useSelector(loadedEmptySelector);
    const partialESSearch = useSelector((state: RootState) => partialESSearchSelector(state, { search, esDBStatus }));
    const stateInconsistency = useSelector((state: RootState) =>
        stateInconsistencySelector(state, { search, esDBStatus })
    );

    // Remove from cache expired elements
    useExpirationCheck(Object.values(elementsMap), (element) => {
        dispatch(removeExpired(element));

        globalCache.delete(ConversationCountsModel.key);
        globalCache.delete(MessageCountsModel.key);
    });

    // Main effect watching all inputs and responsible to trigger actions on the cache
    useEffect(() => {
        if (shouldResetCache) {
            dispatch(reset({ page, params: { labelID, conversationMode, sort, filter, esEnabled, search } }));
        }
        if (shouldSendRequest && !isSearch(search)) {
            void dispatch(
                loadAction({ api, abortController: abortControllerRef.current, conversationMode, page, params })
            );
        }
        if (shouldUpdatePage && !shouldLoadMoreES) {
            dispatch(updatePage(page));
        }
    }, [shouldResetCache, shouldSendRequest, shouldUpdatePage, shouldLoadMoreES, search]);

    // Move to the last page if the current one becomes empty
    useEffect(() => {
        if (page === 0) {
            return;
        }

        if (!partialESSearch && (expectingEmpty || loadedEmpty)) {
            const count = dynamicTotal ? pageCount(dynamicTotal) : 0;
            if (count === 0) {
                onPage(0);
            } else if (page !== count - 1) {
                onPage(count - 1);
            }
        }
    }, [page, partialESSearch, expectingEmpty, loadedEmpty, dynamicTotal]);

    useEffect(() => {
        if (stateInconsistency) {
            if (!esEnabled) {
                const message = 'Elements list inconsistency error';
                const state = store.getState();
                const context = {
                    conversationMode,
                    labelID,
                    search,
                    page,
                    sort,
                    filter,
                    dynamicTotal,
                    state: omit(state, ['elements']),
                    ...state.elements, // Sentry limit depth in extra data, this optimize our feedback
                };
                console.error(message, context);
                captureMessage(message, { extra: { context } });
            }
            dispatch(
                reset({
                    page,
                    params: { labelID, sort, filter, esEnabled, search },
                    beforeFirstLoad: !esEnabled && isSearch(search),
                })
            );
        }
    }, [stateInconsistency]);

    useElementsEvents(conversationMode, search);

    return {
        labelID: stateParams.labelID,
        elements,
        elementIDs,
        placeholderCount,
        loading,
        total: totalReturned,
    };
};

/**
 * Returns the element in the elements state for the given elementID
 */
export const useGetElementByID = () => {
    const store = useStore<RootState>();

    return useCallback((elementID: string): Element | undefined => {
        return store.getState().elements.elements[elementID];
    }, []);
};

/**
 * This helper will get as much data as we can on the ids whatever the location of the data
 * Don't use this for optimistic for example
 */
export const useGetElementsFromIDs = () => {
    const store = useStore();
    const messageCache = useMessageCache();

    return useCallback((elementIDs: string[]): Element[] => {
        const state = store.getState();
        return elementIDs
            .map((ID: string) => {
                if (state.elements.elements[ID]) {
                    return state.elements.elements[ID];
                }

                const localID = getLocalID(messageCache, ID);

                const conversationFromConversationState = conversationByID(state, { ID });

                return messageCache.get(localID)?.data || conversationFromConversationState?.Conversation;
            })
            .filter(isTruthy);
    }, []);
};

import { useCallback, useEffect, useRef } from 'react';
import { useSelector, useStore } from 'react-redux';

import { useCache, useConversationCounts, useFlag, useMessageCounts } from '@proton/components';
import { omit } from '@proton/shared/lib/helpers/object';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { LabelCount } from '@proton/shared/lib/interfaces/Label';
import { MAIL_PAGE_SIZE } from '@proton/shared/lib/mail/mailSettings';
import { ConversationCountsModel, MessageCountsModel } from '@proton/shared/lib/models';
import isTruthy from '@proton/utils/isTruthy';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { hasAttachmentsFilter, isSearch } from '../../helpers/elements';
import { pageCount } from '../../helpers/paging';
import { conversationByID } from '../../logic/conversations/conversationsSelectors';
import {
    load as loadAction,
    removeExpired,
    reset,
    setPageSize,
    updatePage,
} from '../../logic/elements/elementsActions';
import {
    dynamicTotal as dynamicTotalSelector,
    elementIDs as elementIDsSelector,
    elementsMap as elementsMapSelector,
    elements as elementsSelector,
    expectingEmpty as expectingEmptySelector,
    loadedEmpty as loadedEmptySelector,
    loading as loadingSelector,
    messagesToLoadMoreES as messagesToLoadMoreESSelector,
    params as paramsSelector,
    partialESSearch as partialESSearchSelector,
    pendingActions as pendingActionsSelector,
    placeholderCount as placeholderCountSelector,
    shouldLoadElements as shouldLoadElementsSelector,
    shouldResetElementsState as shouldResetElementsStateSelector,
    shouldUpdatePage as shouldUpdatePageSelector,
    stateInconsistency as stateInconsistencySelector,
    totalReturned as totalReturnedSelector,
} from '../../logic/elements/elementsSelectors';
import { messageByID } from '../../logic/messages/messagesSelectors';
import { RootState, useAppDispatch } from '../../logic/store';
import { Element } from '../../models/element';
import { Filter, SearchParameters, Sort } from '../../models/tools';
import { useElementsEvents } from '../events/useElementsEvents';
import { useExpirationCheck } from '../useExpirationCheck';

interface Options {
    conversationMode: boolean;
    labelID: string;
    page: number;
    pageSize: MAIL_PAGE_SIZE;
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

export const useElements: UseElements = ({
    conversationMode,
    labelID,
    search,
    page,
    pageSize,
    sort,
    filter,
    onPage,
}) => {
    const store = useStore<RootState>();
    const dispatch = useAppDispatch();

    const isPageSizeSettingEnabled = useFlag('WebMailPageSizeSetting');

    const abortControllerRef = useRef<AbortController>();

    const [conversationCounts = [], loadingConversationCounts] = useConversationCounts() as [
        LabelCount[],
        boolean,
        Error,
    ];
    const [messageCounts = [], loadingMessageCounts] = useMessageCounts() as [LabelCount[], boolean, Error];
    const countValues = conversationMode ? conversationCounts : messageCounts;
    const countsLoading = conversationMode ? loadingConversationCounts : loadingMessageCounts;

    const { esStatus } = useEncryptedSearchContext();
    const { esEnabled } = esStatus;

    const globalCache = useCache();

    const params = {
        labelID,
        conversationMode,
        sort,
        filter,
        search,
        esEnabled,
    };
    const counts = { counts: countValues, loading: countsLoading };

    const stateParams = useSelector(paramsSelector);
    const elementsMap = useSelector(elementsMapSelector);
    const pendingActions = useSelector(pendingActionsSelector);
    const elements = useSelector(elementsSelector);
    const elementIDs = useSelector(elementIDsSelector);
    const messagesToLoadMoreES = useSelector((state: RootState) =>
        messagesToLoadMoreESSelector(state, { page, search, esStatus })
    );
    const shouldResetElementsState = useSelector((state: RootState) =>
        shouldResetElementsStateSelector(state, { page, params })
    );
    const shouldLoadElements = useSelector((state: RootState) => shouldLoadElementsSelector(state, { page, params }));
    const shouldUpdatePage = useSelector((state: RootState) => shouldUpdatePageSelector(state, { page }));
    const dynamicTotal = useSelector((state: RootState) => dynamicTotalSelector(state, { counts, labelID }));
    const placeholderCount = useSelector((state: RootState) => placeholderCountSelector(state, { counts, labelID }));
    const loading = useSelector((state: RootState) => loadingSelector(state, { page, params }));
    const totalReturned = useSelector((state: RootState) => totalReturnedSelector(state, { counts, labelID }));
    const expectingEmpty = useSelector((state: RootState) => expectingEmptySelector(state, { counts, labelID }));
    const loadedEmpty = useSelector(loadedEmptySelector);
    const partialESSearch = useSelector((state: RootState) => partialESSearchSelector(state, { search, esStatus }));
    const stateInconsistency = useSelector((state: RootState) =>
        stateInconsistencySelector(state, { search, esStatus })
    );

    // Remove from cache expired elements
    useExpirationCheck(Object.values(elementsMap), (element) => {
        dispatch(removeExpired(element));

        globalCache.delete(ConversationCountsModel.key);
        globalCache.delete(MessageCountsModel.key);
    });

    useEffect(() => {
        if (shouldResetElementsState) {
            dispatch(
                reset({
                    page,
                    pageSize,
                    params: {
                        labelID,
                        conversationMode,
                        sort,
                        filter,
                        esEnabled,
                        search,
                    },
                })
            );
        }
    }, [shouldResetElementsState]);

    useEffect(() => {
        dispatch(setPageSize(isPageSizeSettingEnabled ? pageSize : MAIL_PAGE_SIZE.FIFTY));
    }, [pageSize]);

    // Main effect watching all inputs and responsible to trigger actions on the state
    useEffect(() => {
        /**
         * To more load new elements, the user should either have `shouldLoadElements` true, no pending action AND not be in search,
         * OR change the page size for a bigger one (100 > 200)
         */
        if (shouldLoadElements && pendingActions === 0 && !isSearch(search)) {
            void dispatch(
                loadAction({
                    abortController: abortControllerRef.current,
                    page,
                    pageSize,
                    params,
                })
            );
        }

        if (shouldUpdatePage && messagesToLoadMoreES === 0) {
            dispatch(updatePage(page));
        }
    }, [shouldLoadElements, shouldUpdatePage, messagesToLoadMoreES, pendingActions, search, pageSize]);

    // Move to the last page if the current one becomes empty
    useEffect(() => {
        if (page === 0) {
            return;
        }

        if (!partialESSearch && (expectingEmpty || loadedEmpty)) {
            const count = dynamicTotal ? pageCount(dynamicTotal, pageSize) : 0;
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
                    // @ts-expect-error to fix later
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
                    params: {
                        labelID,
                        sort,
                        filter,
                        esEnabled,
                        search,
                        conversationMode,
                    },
                    beforeFirstLoad: !esEnabled && (isSearch(search) || hasAttachmentsFilter(filter)),
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
    const store = useStore<RootState>();

    return useCallback((elementIDs: string[]): Element[] => {
        const state = store.getState();
        return elementIDs
            .map((ID: string) => {
                if (state.elements.elements[ID]) {
                    return state.elements.elements[ID];
                }

                const messageFromMessageState = messageByID(state, { ID });
                const conversationFromConversationState = conversationByID(state, { ID });

                return messageFromMessageState?.data || conversationFromConversationState?.Conversation;
            })
            .filter(isTruthy);
    }, []);
};

/**
 * Use this helper carefully since it might return a combination of objects from Element state and from Message state.
 * It is used to get messages from a list of IDs. If the object do exist in the Message state, we return it, otherwise the element is returned.
 */
export const useGetMessagesOrElementsFromIDs = () => {
    const store = useStore<RootState>();

    return useCallback((elementIDs: string[]): Element[] => {
        const state = store.getState();
        return elementIDs
            .map((ID: string) => {
                const messageFromMessageState = messageByID(state, { ID });

                return messageFromMessageState?.data || state.elements.elements[ID];
            })
            .filter(isTruthy);
    }, []);
};

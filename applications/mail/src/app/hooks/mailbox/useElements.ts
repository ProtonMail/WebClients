import { useCallback, useEffect, useRef } from 'react';

import { useGetMessageCounts, useMessageCounts } from '@proton/components';
import { useConversationCounts, useGetConversationCounts } from '@proton/mail/counts/conversationCounts';
import { CacheType } from '@proton/redux-utilities';
import { omit } from '@proton/shared/lib/helpers/object';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { MAIL_PAGE_SIZE } from '@proton/shared/lib/mail/mailSettings';
import { useFlag } from '@proton/unleash';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { useMailDispatch, useMailSelector, useMailStore } from 'proton-mail/store/hooks';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { hasAttachmentsFilter, isSearch } from '../../helpers/elements';
import { pageCount } from '../../helpers/paging';
import type { Element } from '../../models/element';
import type { Filter, SearchParameters, Sort } from '../../models/tools';
import { conversationByID } from '../../store/conversations/conversationsSelectors';
import {
    load as loadAction,
    removeExpired,
    reset,
    setPageSize,
    updatePage,
} from '../../store/elements/elementsActions';
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
    taskRunning,
    totalReturned as totalReturnedSelector,
} from '../../store/elements/elementsSelectors';
import { messageByID } from '../../store/messages/messagesSelectors';
import type { MailState } from '../../store/store';
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
    const store = useMailStore();
    const dispatch = useMailDispatch();

    const isPageSizeSettingEnabled = useFlag('WebMailPageSizeSetting');

    const abortControllerRef = useRef<AbortController>();

    const [conversationCounts = [], loadingConversationCounts] = useConversationCounts();
    const [messageCounts = [], loadingMessageCounts] = useMessageCounts();
    const countValues = conversationMode ? conversationCounts : messageCounts;
    const countsLoading = conversationMode ? loadingConversationCounts : loadingMessageCounts;

    const { esStatus } = useEncryptedSearchContext();
    const { esEnabled } = esStatus;

    const params = {
        labelID,
        conversationMode,
        sort,
        filter,
        search,
        esEnabled,
    };
    const counts = { counts: countValues, loading: countsLoading };

    const stateParams = useMailSelector(paramsSelector);
    const elementsMap = useMailSelector(elementsMapSelector);
    const pendingActions = useMailSelector(pendingActionsSelector);
    const tasksRunning = useMailSelector(taskRunning);
    const elements = useMailSelector(elementsSelector);
    const elementIDs = useMailSelector(elementIDsSelector);
    const messagesToLoadMoreES = useMailSelector((state: MailState) =>
        messagesToLoadMoreESSelector(state, { page, search, esStatus })
    );
    const shouldResetElementsState = useMailSelector((state: MailState) =>
        shouldResetElementsStateSelector(state, { page, params })
    );
    const shouldLoadElements = useMailSelector((state: MailState) =>
        shouldLoadElementsSelector(state, { page, params })
    );
    const shouldUpdatePage = useMailSelector((state: MailState) => shouldUpdatePageSelector(state, { page }));
    const dynamicTotal = useMailSelector((state: MailState) => dynamicTotalSelector(state, { counts, labelID }));
    const placeholderCount = useMailSelector((state: MailState) =>
        placeholderCountSelector(state, { counts, labelID })
    );
    const loading = useMailSelector((state: MailState) => loadingSelector(state, { page, params }));
    const totalReturned = useMailSelector((state: MailState) => totalReturnedSelector(state, { counts, labelID }));
    const expectingEmpty = useMailSelector((state: MailState) => expectingEmptySelector(state, { counts, labelID }));
    const loadedEmpty = useMailSelector(loadedEmptySelector);
    const partialESSearch = useMailSelector((state: MailState) => partialESSearchSelector(state, { search, esStatus }));
    const stateInconsistency = useMailSelector((state: MailState) =>
        stateInconsistencySelector(state, { search, esStatus })
    );
    const getConversationCounts = useGetConversationCounts();
    const getMessageCounts = useGetMessageCounts();

    // Remove from cache expired elements
    useExpirationCheck(Object.values(elementsMap), (elements) => {
        if (!elements.length) {
            return;
        }
        elements.forEach((element) => dispatch(removeExpired(element)));
        getConversationCounts({ cache: CacheType.None }).catch(noop);
        getMessageCounts({ cache: CacheType.None }).catch(noop);
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
        // If we have actions pending OR select all actions pending, we don't want to load elements because it would cancel our optimistic updates
        const hasPendingActions = pendingActions > 0 || tasksRunning.labelIDs.includes(labelID);

        /**
         * To more load new elements, the user should either have `shouldLoadElements` true, no pending action AND not be in search,
         * OR change the page size for a bigger one (100 > 200)
         */
        if (shouldLoadElements && !hasPendingActions && !isSearch(search)) {
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
    }, [
        shouldLoadElements,
        shouldUpdatePage,
        messagesToLoadMoreES,
        pendingActions,
        search,
        pageSize,
        labelID,
        tasksRunning,
    ]);

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
    const store = useMailStore();

    return useCallback((elementID: string): Element | undefined => {
        return store.getState().elements.elements[elementID];
    }, []);
};

/**
 * This helper will get as much data as we can on the ids whatever the location of the data
 * Don't use this for optimistic for example
 */
export const useGetElementsFromIDs = () => {
    const store = useMailStore();

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
    const store = useMailStore();

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

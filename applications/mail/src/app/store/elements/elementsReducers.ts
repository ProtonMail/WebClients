import type { PayloadAction } from '@reduxjs/toolkit';
import type { Draft } from 'immer';

import { toMap } from '@proton/shared/lib/helpers/object';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import type { MAIL_PAGE_SIZE } from '@proton/shared/lib/mail/mailSettings';
import diff from '@proton/utils/diff';
import isTruthy from '@proton/utils/isTruthy';
import range from '@proton/utils/range';
import unique from '@proton/utils/unique';

import { getElementContextIdentifier, parseLabelIDsInEvent, isMessage as testIsMessage } from '../../helpers/elements';
import type { Conversation } from '../../models/conversation';
import type { Element } from '../../models/element';
import { newElementsState } from './elementsSlice';
import type {
    ESResults,
    ElementsState,
    ElementsStateParams,
    EventUpdates,
    NewStateParams,
    OptimisticDelete,
    OptimisticUpdates,
    QueryParams,
    QueryResults,
    TaskRunningInfo,
} from './elementsTypes';
import { getElementsToBypassFilter } from './helpers/elementBypassFilters';
import { newRetry } from './helpers/elementQuery';

export const globalReset = (state: Draft<ElementsState>) => {
    Object.assign(state, newElementsState());
};

export const reset = (state: Draft<ElementsState>, action: PayloadAction<NewStateParams>) => {
    Object.assign(
        state,
        newElementsState({
            ...action.payload,
            taskRunning: { labelIDs: state.taskRunning.labelIDs, timeoutID: state.taskRunning.timeoutID },
        })
    );
};

export const updatePage = (state: Draft<ElementsState>, action: PayloadAction<number>) => {
    state.page = action.payload;
};

export const setPageSize = (state: Draft<ElementsState>, action: PayloadAction<MAIL_PAGE_SIZE>) => {
    state.pageSize = action.payload;
};

export const resetByPassFilter = (state: Draft<ElementsState>) => {
    state.bypassFilter = [];
};

export const retry = (
    state: Draft<ElementsState>,
    action: PayloadAction<{ queryParameters: unknown; error: Error | undefined }>
) => {
    state.beforeFirstLoad = false;
    state.invalidated = false;
    state.pendingRequest = false;
    state.retry = newRetry(state.retry, state.params, action.payload.error);
};

export const loadPending = (
    state: Draft<ElementsState>,
    action: PayloadAction<undefined, string, { arg: QueryParams }>
) => {
    const { refetch, page } = action.meta.arg;

    if (!refetch) {
        state.pendingRequest = true;
        state.page = page;
    }
};

export const loadFulfilled = (
    state: Draft<ElementsState>,
    action: PayloadAction<
        { result: QueryResults; taskRunning: TaskRunningInfo; params: ElementsStateParams },
        string,
        { arg: QueryParams }
    >
) => {
    const { page, refetch } = action.meta.arg;
    const {
        result: { Total },
        taskRunning,
        // Always use params from the request, and do not use params from the state
        // Otherwise, concurrent requests will update the wrong "context filter"
        params,
    } = action.payload;

    const contextFilter = getElementContextIdentifier({
        labelID: params.labelID,
        conversationMode: params.conversationMode,
        filter: params.filter,
        sort: params.sort,
        from: params.search.from,
        to: params.search.to,
        address: params.search.address,
        begin: params.search.begin,
        end: params.search.end,
        keyword: params.search.keyword,
    });

    Object.assign(state, {
        beforeFirstLoad: false,
        invalidated: false,
        pendingRequest: false,
        page: refetch ? state.page : page,
        retry: newRetry(state.retry, state.params, undefined),
        taskRunning,
    });

    state.total[contextFilter] = Total;
};

/**
 * This reducer is used to set first loaded elements while loading remaining ones in series
 */
export const showSerializedElements = (
    state: Draft<ElementsState>,
    action: PayloadAction<{ result: QueryResults; page: number; params: ElementsStateParams }, string>
) => {
    // Always use params from the request, and do not use params from the state
    // Otherwise, concurrent requests will update the wrong "context filter"
    const params = action.payload.params;
    const {
        result: { Total, Elements },
        page,
    } = action.payload;

    const contextFilter = getElementContextIdentifier({
        labelID: params.labelID,
        conversationMode: params.conversationMode,
        filter: params.filter,
        sort: params.sort,
        from: params.search.from,
        to: params.search.to,
        address: params.search.address,
        begin: params.search.begin,
        end: params.search.end,
        keyword: params.search.keyword,
    });

    Object.assign(state, {
        elements: { ...state.elements, ...toMap(Elements, 'ID') },
    });
    state.total[contextFilter] = Total;
    state.pages[contextFilter] = state.pages[contextFilter]
        ? unique([...state.pages[contextFilter], page]).sort()
        : [page];
};

export const manualPending = (state: Draft<ElementsState>) => {
    state.pendingRequest = true;
};

export const manualFulfilled = (state: Draft<ElementsState>) => {
    state.pendingRequest = false;
};

export const removeExpired = (state: Draft<ElementsState>, action: PayloadAction<Element>) => {
    delete state.elements[action.payload.ID || ''];
};

export const invalidate = (state: Draft<ElementsState>) => {
    state.invalidated = true;
};

export const eventUpdatesPending = (
    state: Draft<ElementsState>,
    action: PayloadAction<undefined, string, { arg: EventUpdates }>
) => {
    const { toCreate, toUpdate, toDelete } = action.meta.arg;
    toCreate.forEach((element) => {
        state.elements[element.ID || ''] = element;
    });
    toUpdate.forEach((element) => {
        const existingElement = state.elements[element.ID || ''];
        if (existingElement) {
            state.elements[element.ID || ''] = parseLabelIDsInEvent(existingElement, element);
        }
    });
    toDelete.forEach((elementID) => {
        delete state.elements[elementID];
    });
};

export const eventUpdatesFulfilled = (
    state: Draft<ElementsState>,
    action: PayloadAction<(Element | undefined)[], string, { arg: EventUpdates }>
) => {
    action.payload.filter(isTruthy).forEach((element) => {
        state.elements[element.ID || ''] = element;
    });
};

export const addESResults = (state: Draft<ElementsState>, action: PayloadAction<ESResults>) => {
    const total = action.payload.elements.length;
    const pagesArray = range(0, Math.ceil(total / state.pageSize));
    // If the resulting array is empty because no results have been found,
    // cache the page 0, so that we do not trigger additional searches.
    const pages = pagesArray.length === 0 ? [0] : pagesArray;

    const params = action.payload.params;
    const contextFilter = getElementContextIdentifier({
        labelID: params.labelID,
        conversationMode: params.conversationMode,
        filter: params.filter,
        sort: params.sort,
        from: params.search.from,
        to: params.search.to,
        address: params.search.address,
        begin: params.search.begin,
        end: params.search.end,
        keyword: params.search.keyword,
    });

    // Retry is disabled for encrypted search results, to avoid re-triggering the search several times
    // when there are no results
    Object.assign(state, {
        bypassFilter: [],
        beforeFirstLoad: false,
        invalidated: false,
        pendingRequest: false,
        page: action.payload.page,
        elements: { ...state.elements, ...toMap(action.payload.elements, 'ID') },
        retry: { payload: undefined, count: 0, error: undefined },
        params,
    });
    state.total[contextFilter] = total;
    state.pages[contextFilter] = state.pages[contextFilter]
        ? unique([...state.pages[contextFilter], ...pages]).sort()
        : [...pages];
};

export const optimisticUpdates = (state: Draft<ElementsState>, action: PayloadAction<OptimisticUpdates>) => {
    action.payload.elements.forEach((element) => {
        if (element.ID) {
            state.elements[element.ID] = element;
        }
    });
    if (action.payload.isMove) {
        const elementIDs = action.payload.elements.map(({ ID }) => ID || '');
        state.bypassFilter = diff(state.bypassFilter, elementIDs);

        // Can update total only if move and is removing item from the current location (not all sent/all drafts/all mail)
        if (action.payload.elementTotalAdjustment && state.total) {
            const params = state.params;

            const contextFilter = getElementContextIdentifier({
                labelID: params.labelID,
                conversationMode: params.conversationMode,
                filter: params.filter,
                sort: params.sort,
                from: params.search.from,
                to: params.search.to,
                address: params.search.address,
                begin: params.search.begin,
                end: params.search.end,
                keyword: params.search.keyword,
            });

            state.total[contextFilter] = (state.total[contextFilter] || 0) + action.payload.elementTotalAdjustment;
        }
    }

    // If there is a filter applied when marking elements as read or unread, elements might need to bypass filters
    // e.g. filter is unread and marking elements as read, then we want to keep those items in the view
    if (action.payload.bypass && action.payload.markAsStatus) {
        const { conversationMode } = action.payload;
        const unreadFilter = state.params.filter.Unread as number | undefined;

        const { elementsToBypass, elementsToRemove } = getElementsToBypassFilter(
            action.payload.elements,
            action.payload.markAsStatus,
            unreadFilter
        );

        // Add elements in the bypass array if they are not already present
        elementsToBypass.forEach((element) => {
            const isMessage = testIsMessage(element);
            const id = (isMessage && conversationMode ? (element as Message).ConversationID : element.ID) || '';
            if (!state.bypassFilter.includes(id)) {
                state.bypassFilter.push(id);
            }
        });

        // If we are not in a case where we need to bypass filter,
        // we need to remove elements if they are already in the array
        const toRemoveIDs = elementsToRemove.map((element) => {
            const isMessage = testIsMessage(element);
            return (isMessage && conversationMode ? (element as Message).ConversationID : element.ID) || '';
        });

        state.bypassFilter = state.bypassFilter.filter((elementID) => {
            return !toRemoveIDs.includes(elementID);
        });
    }
};

export const optimisticDelete = (state: Draft<ElementsState>, action: PayloadAction<OptimisticDelete>) => {
    action.payload.elementIDs.forEach((elementID) => {
        delete state.elements[elementID];
    });
    if (state.total) {
        const params = state.params;

        const contextFilter = getElementContextIdentifier({
            labelID: params.labelID,
            conversationMode: params.conversationMode,
            filter: params.filter,
            sort: params.sort,
            from: params.search.from,
            to: params.search.to,
            address: params.search.address,
            begin: params.search.begin,
            end: params.search.end,
            keyword: params.search.keyword,
        });

        state.total[contextFilter] = (state.total[contextFilter] || 0) - action.payload.elementIDs.length;
    }
};

export const optimisticEmptyLabel = (state: Draft<ElementsState>) => {
    state.elements = {};
    state.page = 0;
};

export const backendActionStarted = (state: Draft<ElementsState>) => {
    state.pendingActions++;
};

export const backendActionFinished = (state: Draft<ElementsState>) => {
    state.pendingActions--;
};

export const selectAllFulfilled = (
    state: Draft<ElementsState>,
    { payload: { LabelID, timeoutID } }: PayloadAction<{ LabelID: string; timeoutID: NodeJS.Timeout }>
) => {
    if (!state.taskRunning.labelIDs.includes(LabelID)) {
        state.taskRunning.labelIDs.push(LabelID);
    }
    state.taskRunning.timeoutID = timeoutID;
};

export const pollTaskRunningFulfilled = (state: Draft<ElementsState>, { payload }: PayloadAction<TaskRunningInfo>) => {
    state.taskRunning = payload;
};

export const deleteDraft = (state: Draft<ElementsState>, { payload: ID }: PayloadAction<string>) => {
    delete state.elements[ID];
};

const previousExpiration: Record<string, number | undefined> = {};

export const expireElementsPending = (
    state: Draft<ElementsState>,
    action: PayloadAction<
        void,
        string,
        { arg: { IDs: string[]; expirationTime: number | null; conversationID?: string } }
    >
) => {
    const { IDs, expirationTime, conversationID } = action.meta.arg;
    const copyIDs = [...IDs]; // Copy the array to avoid mutating the original one

    // Look to update the Conversation.ExpirationTime that contains the only message
    if (conversationID) {
        const conversation = state.elements[conversationID] as Conversation;

        if (conversation && conversation.NumMessages === 1) {
            copyIDs.push(conversationID);
        }
    }

    copyIDs.forEach((ID) => {
        const element = state.elements[ID];

        if (element) {
            previousExpiration[ID] = element.ExpirationTime;
            element.ExpirationTime = expirationTime ? expirationTime : undefined;
        }
    });
};

export const expireElementsFulfilled = (
    state: Draft<ElementsState>,
    action: PayloadAction<Promise<void>, string, { arg: { IDs: string[]; conversationID?: string } }>
) => {
    const { IDs, conversationID } = action.meta.arg;
    const copyIDs = [...IDs]; // Copy the array to avoid mutating the original one

    // Look to update the Conversation.ExpirationTime that contains the only message
    if (conversationID) {
        const conversation = state.elements[conversationID] as Conversation;

        if (conversation && conversation.NumMessages === 1) {
            copyIDs.push(conversationID);
        }
    }

    copyIDs.forEach((ID) => {
        delete previousExpiration[ID];
    });
};

export const expireElementsRejected = (
    state: Draft<ElementsState>,
    action: PayloadAction<unknown, string, { arg: { IDs: string[]; conversationID?: string } }>
) => {
    const { IDs, conversationID } = action.meta.arg;
    const copyIDs = [...IDs]; // Copy the array to avoid mutating the original one

    // Look to update the Conversation.ExpirationTime that contains the only message
    if (conversationID) {
        const conversation = state.elements[conversationID] as Conversation;

        if (conversation && conversation.NumMessages === 1) {
            copyIDs.push(conversationID);
        }
    }

    copyIDs.forEach((ID) => {
        const element = state.elements[ID];

        if (element) {
            element.ExpirationTime = previousExpiration[ID];
            delete previousExpiration[ID];
        }
    });
};

export const setParams = (
    state: Draft<ElementsState>,
    action: PayloadAction<Partial<ElementsStateParams> & { total?: number }>
) => {
    const { total, ...params } = action.payload;
    state.params = {
        ...state.params,
        ...params,
    };
    if (total !== undefined) {
        const params = state.params;
        const contextFilter = getElementContextIdentifier({
            labelID: params.labelID,
            conversationMode: params.conversationMode,
            filter: params.filter,
            sort: params.sort,
            from: params.search?.from,
            to: params.search?.to,
            address: params.search?.address,
            begin: params.search?.begin,
            end: params.search?.end,
            keyword: params.search?.keyword,
        });
        state.total[contextFilter] = total;
    }
};

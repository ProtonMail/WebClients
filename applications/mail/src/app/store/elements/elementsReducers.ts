import type { PayloadAction } from '@reduxjs/toolkit';
import type { Draft } from 'immer';
import isDeepEqual from 'lodash/isEqual';

import { isCategoryLabel } from '@proton/mail/helpers/location';
import { safeDecreaseCount, safeIncreaseCount } from '@proton/redux-utilities';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { toMap } from '@proton/shared/lib/helpers/object';
import type { Folder, Label } from '@proton/shared/lib/interfaces';
import type { Message, MessageMetadata } from '@proton/shared/lib/interfaces/mail/Message';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';
import diff from '@proton/utils/diff';
import isTruthy from '@proton/utils/isTruthy';
import range from '@proton/utils/range';
import unique from '@proton/utils/unique';

import {
    filterElementsInState,
    getElementContextIdentifier,
    getSearchParameters,
    isElementConversation,
    isElementMessage,
    parseElementContextIdentifier,
    parseLabelIDsInEvent,
} from '../../helpers/elements';
import type { Conversation } from '../../models/conversation';
import type { Element } from '../../models/element';
import {
    applyLabelToConversation,
    applyLabelToConversationMessage,
    applyLabelToMessage,
    removeLabelFromConversation,
    removeLabelFromMessage,
    removeLabelToConversationMessage,
} from '../mailbox/locationHelpers';
import type { filterSubscriptionList } from '../newsletterSubscriptions/newsletterSubscriptionsActions';
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
        newsletterSubscriptionID: params.newsletterSubscriptionID,
    });

    Object.assign(state, {
        beforeFirstLoad: false,
        invalidated: false,
        pendingRequest: false,
        page: refetch ? state.page : page,
        retry: newRetry(state.retry, state.params, undefined),
        taskRunning,
    });

    if (!state.taskRunning.labelIDs.includes(params.labelID)) {
        state.total[contextFilter] = Total;
    }
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

    if (state.taskRunning.labelIDs.includes(params.labelID)) {
        return;
    }

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
        newsletterSubscriptionID: params.newsletterSubscriptionID,
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
    const pagesArray = range(0, Math.ceil(total / action.payload.pageSize));
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
        newsletterSubscriptionID: params.newsletterSubscriptionID,
    });

    state.bypassFilter = [];
    state.beforeFirstLoad = false;
    state.invalidated = false;
    state.pendingRequest = false;
    state.page = action.payload.page;
    state.elements = { ...state.elements, ...toMap(action.payload.elements, 'ID') };
    state.retry = { payload: undefined, count: 0, error: undefined };
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
        newsletterSubscriptionID: params.newsletterSubscriptionID,
    });

    if (action.payload.isMove) {
        const elementIDs = action.payload.elements.map(({ ID }) => ID || '');
        state.bypassFilter = diff(state.bypassFilter, elementIDs);

        // Can update total only if move and is removing item from the current location (not all sent/all drafts/all mail)
        if (action.payload.elementTotalAdjustment && state.total) {
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

        elementsToBypass.forEach((element) => {
            const isMessage = isElementMessage(element);
            const id = (isMessage && conversationMode ? element.ConversationID : element.ID) || '';
            if (!state.bypassFilter.includes(id)) {
                state.bypassFilter.push(id);
            }
        });

        // When some element bypass the filter in the current context, we need to update total in the "opposite" context
        const oppositeFilter = getElementContextIdentifier({
            labelID: params.labelID,
            conversationMode: params.conversationMode,
            filter: { Unread: unreadFilter ? 0 : 1 },
            sort: params.sort,
            from: params.search.from,
            to: params.search.to,
            address: params.search.address,
            begin: params.search.begin,
            end: params.search.end,
            keyword: params.search.keyword,
        });

        if (state.total[oppositeFilter]) {
            state.total[oppositeFilter] = state.total[oppositeFilter] + elementsToBypass.length;
        }

        // If we are not in a case where we need to bypass filter,
        // we need to remove elements if they are already in the array
        const toRemoveIDs = elementsToRemove.map((element) => {
            const isMessage = isElementMessage(element);
            return (isMessage && conversationMode ? element.ConversationID : element.ID) || '';
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
            newsletterSubscriptionID: params.newsletterSubscriptionID,
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
    { payload: { LabelID, timeoutID } }: PayloadAction<{ LabelID?: string; timeoutID?: NodeJS.Timeout }>
) => {
    if (LabelID && !state.taskRunning.labelIDs.includes(LabelID)) {
        state.taskRunning.labelIDs.push(LabelID);
    }
    if (timeoutID) {
        state.taskRunning.timeoutID = timeoutID;
    }
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

    const prevContextFilter = getElementContextIdentifier({
        labelID: state.params.labelID,
        conversationMode: state.params.conversationMode,
        filter: state.params.filter,
        sort: state.params.sort,
        from: state.params.search.from,
        to: state.params.search.to,
        address: state.params.search.address,
        begin: state.params.search.begin,
        end: state.params.search.end,
        keyword: state.params.search.keyword,
    });

    const nextContextFilter = getElementContextIdentifier({
        labelID: params.labelID ?? state.params.labelID,
        conversationMode: params.conversationMode ?? state.params.conversationMode,
        filter: params.filter,
        sort: params.sort,
        from: params.search?.from,
        to: params.search?.to,
        address: params.search?.address,
        begin: params.search?.begin,
        end: params.search?.end,
        keyword: params.search?.keyword,
    });

    const bypassFilterLength = state.bypassFilter.length;
    if (
        prevContextFilter !== nextContextFilter &&
        state.total[prevContextFilter] !== undefined &&
        bypassFilterLength > 0 &&
        state.total[prevContextFilter] >= bypassFilterLength
    ) {
        state.total[prevContextFilter] = state.total[prevContextFilter] - bypassFilterLength;
    }

    // Some items can bypass filter when a filter is active (e.g. Unread filter, and opening emails, we want them to stay in the list)
    // If sort or filter is being updated, we can reset bypass filter value from the state, otherwise it could create
    // false placeholders when switching filters.
    if (!isDeepEqual(state.params.sort, params.sort) || !isDeepEqual(state.params.filter, params.filter)) {
        state.bypassFilter = [];
    }

    state.params = {
        ...state.params,
        ...params,
    };
    if (total !== undefined) {
        state.total[nextContextFilter] = total;
        state.retry = newRetry(state.retry, state.params, undefined);
    }
};

const handleBypassFilter = (
    state: Draft<ElementsState>,
    elements: Element[],
    markAsStatus: MARK_AS_STATUS,
    unreadFilter: number | undefined
) => {
    if (unreadFilter === undefined) {
        return;
    }

    const shouldBypass =
        (unreadFilter === 1 && markAsStatus === MARK_AS_STATUS.READ) ||
        (unreadFilter === 0 && markAsStatus === MARK_AS_STATUS.UNREAD);

    if (shouldBypass) {
        const { elementsToBypass, elementsToRemove } = getElementsToBypassFilter(elements, markAsStatus, unreadFilter);

        // Add elements to bypass filter if they are not already present
        const elementsToBypassIDs = elementsToBypass.map((element) => element.ID || '');
        const newBypassIDs = elementsToBypassIDs.filter((id) => !state.bypassFilter.includes(id));
        state.bypassFilter.push(...newBypassIDs);

        // If we are not in a case where we need to bypass filter,
        // we need to remove elements if they are already in the array
        const toRemoveIDs = elementsToRemove.map((element) => {
            const isMessage = isElementMessage(element);
            return (isMessage && state.params.conversationMode ? element.ConversationID : element.ID) || '';
        });

        state.bypassFilter = state.bypassFilter.filter((elementID) => {
            return !toRemoveIDs.includes(elementID);
        });

        // When some element bypass the filter in the current context, we need to update total in the "opposite" context
        const oppositeFilter = getElementContextIdentifier({
            labelID: state.params.labelID,
            conversationMode: state.params.conversationMode,
            filter: { Unread: unreadFilter ? 0 : 1 },
            sort: state.params.sort,
            from: state.params.search.from,
            to: state.params.search.to,
            address: state.params.search.address,
            begin: state.params.search.begin,
            end: state.params.search.end,
            keyword: state.params.search.keyword,
        });

        if (state.total[oppositeFilter]) {
            state.total[oppositeFilter] = state.total[oppositeFilter] + elementsToBypass.length;
        }
    }
};

export const markMessagesAsReadPending = (
    state: Draft<ElementsState>,
    action: PayloadAction<
        undefined,
        string,
        {
            arg: {
                elements: MessageMetadata[];
                conversations: Conversation[];
                labelID: string;
                showSuccessNotification?: boolean;
            };
        }
    >
) => {
    const { elements, conversations } = action.meta.arg;

    elements.forEach((element) => {
        // Already marked as read, do nothing
        if (element.Unread === 0) {
            return;
        }

        const elementState = state.elements[element.ID];

        // Update the message selected in element state
        if (elementState && isElementMessage(elementState)) {
            elementState.Unread = 0;
        }

        const conversationElementState = state.elements[element.ConversationID];
        if (!conversationElementState || !isElementConversation(conversationElementState)) {
            return;
        }

        // Update the conversation element state attach to the same message
        conversationElementState.ContextNumUnread = safeDecreaseCount(conversationElementState.ContextNumUnread, 1);
        conversationElementState.NumUnread = safeDecreaseCount(conversationElementState.NumUnread, 1);
        conversationElementState.Labels?.forEach((label) => {
            if (element.LabelIDs.includes(label.ID)) {
                label.ContextNumUnread = safeDecreaseCount(label.ContextNumUnread, 1);
            }
        });
    });

    // When we open a conversation, an action is triggered to mark a message as read
    // We need to bypass filter for the conversation and the messages attached to it
    handleBypassFilter(state, [...elements, ...conversations], MARK_AS_STATUS.READ, state.params.filter.Unread);
};

export const markMessagesAsUnreadPending = (
    state: Draft<ElementsState>,
    action: PayloadAction<
        undefined,
        string,
        {
            arg: {
                elements: MessageMetadata[];
                conversations: Conversation[];
                labelID: string;
                showSuccessNotification?: boolean;
            };
        }
    >
) => {
    const { elements, conversations } = action.meta.arg;

    elements.forEach((element) => {
        // Already unread, do nothing
        if (element.Unread === 1) {
            return;
        }

        // Update elements state
        const elementState = state.elements[element.ID];

        if (elementState) {
            (elementState as Message).Unread = 1;
        }

        const conversationElementState = state.elements[element.ConversationID] as Conversation;
        if (!conversationElementState || !isElementConversation(conversationElementState)) {
            return;
        }

        conversationElementState.ContextNumUnread = safeIncreaseCount(conversationElementState.ContextNumUnread, 1);
        conversationElementState.NumUnread = safeIncreaseCount(conversationElementState.NumUnread, 1);
        conversationElementState.Labels?.forEach((label) => {
            if (element.LabelIDs.includes(label.ID)) {
                label.ContextNumUnread = safeIncreaseCount(label.ContextNumUnread, 1);
            }
        });
    });

    // When we open a conversation, an action is triggered to mark a message as unread
    // We need to bypass filter for the conversation and the messages attached to it
    handleBypassFilter(state, [...elements, ...conversations], MARK_AS_STATUS.UNREAD, state.params.filter.Unread);
};

export const markMessagesAsReadRejected = (
    state: Draft<ElementsState>,
    action: PayloadAction<
        unknown,
        string,
        {
            arg: {
                elements: MessageMetadata[];
                conversations: Conversation[];
                labelID: string;
                showSuccessNotification?: boolean;
            };
        }
    >
) => {
    const pendingAction = {
        ...action,
        payload: undefined,
    };
    return markMessagesAsUnreadPending(state, pendingAction);
};

export const markMessagesAsUnreadRejected = (
    state: Draft<ElementsState>,
    action: PayloadAction<
        unknown,
        string,
        {
            arg: {
                elements: MessageMetadata[];
                conversations: Conversation[];
                labelID: string;
                showSuccessNotification?: boolean;
            };
        }
    >
) => {
    const pendingAction = {
        ...action,
        payload: undefined,
    };
    return markMessagesAsReadPending(state, pendingAction);
};

export const markConversationsAsReadPending = (
    state: Draft<ElementsState>,
    action: PayloadAction<undefined, string, { arg: { elements: Conversation[]; labelID: string } }>
) => {
    const { elements, labelID } = action.meta.arg;

    elements.forEach((element) => {
        const conversationLabel = element?.Labels?.find((label) => label.ID === labelID);
        if (conversationLabel?.ContextNumUnread === 0) {
            return;
        }
        const elementState = state.elements[element.ID];

        // Update the conversation element state
        if (elementState && isElementConversation(elementState)) {
            elementState.ContextNumUnread = 0;
            elementState.NumUnread = 0;
            elementState.Labels?.forEach((label) => {
                label.ContextNumUnread = 0;
            });
        }

        const messagesElementState = Object.values(state.elements)
            .filter(isElementMessage)
            .filter((message) => message.ConversationID === element.ID);

        // Update all messages attach to the same conversation in element state
        messagesElementState.forEach((messageElementState) => {
            messageElementState.Unread = 0;
        });
    });

    handleBypassFilter(state, elements, MARK_AS_STATUS.READ, state.params.filter.Unread);
};

export const markConversationsAsUnreadPending = (
    state: Draft<ElementsState>,
    action: PayloadAction<undefined, string, { arg: { elements: Conversation[]; labelID: string } }>
) => {
    const { elements, labelID } = action.meta.arg;
    const isCurrentLabelIDCategory = isCategoryLabel(labelID);

    elements.forEach((element) => {
        const conversationLabel = element?.Labels?.find((label) => label.ID === labelID);

        if (!!conversationLabel?.ContextNumUnread) {
            // Conversation is already unread, do nothing
            return;
        }

        // Update the conversation element state
        const elementState = state.elements[element.ID];
        if (!elementState || !isElementConversation(elementState)) {
            return;
        }

        elementState.ContextNumUnread = safeIncreaseCount(elementState.ContextNumUnread, 1);
        elementState.NumUnread = safeIncreaseCount(elementState.NumUnread, 1);
        elementState.Labels?.forEach((label) => {
            if (label.ID === labelID) {
                label.ContextNumUnread = safeIncreaseCount(label.ContextNumUnread, 1);
            } else if (isCurrentLabelIDCategory && label.ID === MAILBOX_LABEL_IDS.INBOX) {
                label.ContextNumUnread = safeIncreaseCount(label.ContextNumUnread, 1);
            }
        });
    });

    handleBypassFilter(state, elements, MARK_AS_STATUS.UNREAD, state.params.filter.Unread);
};

export const markConversationsAsReadRejected = (
    state: Draft<ElementsState>,
    action: PayloadAction<unknown, string, { arg: { elements: Conversation[]; labelID: string } }>
) => {
    const pendingAction = {
        ...action,
        payload: undefined,
    };
    return markConversationsAsUnreadPending(state, pendingAction);
};

export const markConversationsAsUnreadRejected = (
    state: Draft<ElementsState>,
    action: PayloadAction<unknown, string, { arg: { elements: Conversation[]; labelID: string } }>
) => {
    const pendingAction = {
        ...action,
        payload: undefined,
    };
    return markConversationsAsReadPending(state, pendingAction);
};

export const resetRetry = (state: Draft<ElementsState>) => {
    state.retry = newRetry(state.retry, state.params, undefined);
};

export const markNewsletterElementsAsReadPending = (
    state: Draft<ElementsState>,
    action: ReturnType<typeof filterSubscriptionList.pending>
) => {
    const payload = action.meta.arg;

    // The only action that have a visual impact is the mark as read
    if (!payload.data.MarkAsRead) {
        return;
    }

    Object.values(state.elements).forEach((element) => {
        if (isElementMessage(element) && element.NewsletterSubscriptionID === payload.subscription.ID) {
            element.Unread = 0;
        }
    });
};

/**
 * Update all the context of the store to reflect the change that was just made
 * To do so, we get the store before and after the action. We use the length difference of the two list to compute the new total count.
 */
const updateTotal = ({
    state,
    elementsBeforeAction,
}: {
    state: Draft<ElementsState>;
    elementsBeforeAction: Element[];
}) => {
    const currentContextIdentifier = getElementContextIdentifier({
        labelID: state.params.labelID,
        conversationMode: state.params.conversationMode,
        filter: state.params.filter,
        sort: state.params.sort,
        from: state.params.search?.from,
        to: state.params.search?.to,
        address: state.params.search?.address,
        begin: state.params.search?.begin,
        end: state.params.search?.end,
        keyword: state.params.search?.keyword,
    });
    const elements = Object.values(state.elements);

    Object.keys(state.total).forEach((contextIdentifier) => {
        const context = parseElementContextIdentifier(contextIdentifier);
        if (!context) {
            return;
        }

        // Local filtering of state before change for the current context
        const beforeChangeFiltered = filterElementsInState({
            elements: elementsBeforeAction,
            bypassFilter: currentContextIdentifier === contextIdentifier ? state.bypassFilter : [],
            labelID: context.labelID,
            filter: context.filter || {},
            conversationMode: context.conversationMode,
            search: getSearchParameters(context),
            newsletterSubscriptionID: context.newsletterSubscriptionID,
            disabledCategoriesIDs: [],
        });

        // Local filtering of state after change for the current context
        const filteredElements = filterElementsInState({
            elements,
            bypassFilter: currentContextIdentifier === contextIdentifier ? state.bypassFilter : [],
            labelID: context.labelID,
            filter: context.filter || {},
            conversationMode: context.conversationMode,
            search: getSearchParameters(context),
            newsletterSubscriptionID: context.newsletterSubscriptionID,
            disabledCategoriesIDs: [],
        });

        const totalBefore = state.total[contextIdentifier] || 0;

        // The new total is the current total minus the difference between the number of elements before and after filtering
        state.total[contextIdentifier] = totalBefore - (beforeChangeFiltered.length - filteredElements.length);
    });
};

export const labelMessagesPending = (
    state: Draft<ElementsState>,
    action: PayloadAction<
        undefined,
        string,
        {
            arg: {
                elements: MessageMetadata[];
                sourceLabelID: string;
                destinationLabelID: string;
                labels: Label[];
                folders: Folder[];
            };
        }
    >
) => {
    const { elements, sourceLabelID, destinationLabelID, labels, folders } = action.meta.arg;
    const elementsBeforeAction = structuredClone(Object.values(state.elements));

    elements.forEach((element) => {
        // Update conversation first because we need to have the initial state of the element
        const conversationElementState = state.elements[element.ConversationID];
        if (conversationElementState && isElementConversation(conversationElementState)) {
            applyLabelToConversationMessage(
                element,
                conversationElementState,
                sourceLabelID,
                destinationLabelID,
                labels
            );
        }

        const elementState = state.elements[element.ID];
        if (!elementState || !isElementMessage(elementState)) {
            return;
        }

        // Then update message since the mutation are done in the conversation
        applyLabelToMessage(elementState, destinationLabelID, folders, labels);
    });

    updateTotal({ state, elementsBeforeAction });
};

export const unlabelMessagesPending = (
    state: Draft<ElementsState>,
    action: PayloadAction<
        undefined,
        string,
        {
            arg: {
                elements: MessageMetadata[];
                sourceLabelID: string;
                destinationLabelID: string;
                labels: Label[];
                folders: Folder[];
            };
        }
    >
) => {
    const { elements, destinationLabelID, labels } = action.meta.arg;
    const elementsBeforeAction = structuredClone(Object.values(state.elements));

    elements.forEach((element) => {
        const conversationElementState = state.elements[element.ConversationID];

        if (conversationElementState && isElementConversation(conversationElementState)) {
            removeLabelToConversationMessage(element, conversationElementState, destinationLabelID, labels);
        }

        const elementState = state.elements[element.ID];
        if (!elementState || !isElementMessage(elementState)) {
            return;
        }

        removeLabelFromMessage(elementState, destinationLabelID, labels);
    });

    updateTotal({ state, elementsBeforeAction });
};

export const labelMessagesRejected = (
    state: Draft<ElementsState>,
    action: PayloadAction<
        unknown,
        string,
        { arg: { elements: MessageMetadata[]; destinationLabelID: string; labels: Label[]; folders: Folder[] } }
    >
) => {
    const { elements } = action.meta.arg;

    elements.forEach((element) => {
        const elementState = state.elements[element.ID];
        if (!elementState || !isElementMessage(elementState)) {
            return;
        }

        elementState.LabelIDs = element.LabelIDs;
        elementState.Unread = element.Unread;
    });
};

export const labelConversationsPending = (
    state: Draft<ElementsState>,
    action: PayloadAction<
        undefined,
        string,
        {
            arg: {
                conversations: Conversation[];
                destinationLabelID: string;
                sourceLabelID: string;
                labels: Label[];
                folders: Folder[];
            };
        }
    >
) => {
    const { conversations, sourceLabelID, destinationLabelID, labels, folders } = action.meta.arg;
    const elementsBeforeAction = structuredClone(Object.values(state.elements));

    conversations.forEach((conversation) => {
        const conversationState = state.elements[conversation.ID];
        if (!conversationState) {
            return;
        }

        if (isElementConversation(conversationState)) {
            applyLabelToConversation(conversationState, sourceLabelID, destinationLabelID, labels, folders);
        }

        const messagesElementState = Object.values(state.elements)
            .filter(isElementMessage)
            .filter((message) => message.ConversationID === conversation.ID);

        messagesElementState.forEach((messageElementState) => {
            applyLabelToMessage(messageElementState, destinationLabelID, folders, labels);
        });
    });

    updateTotal({ state, elementsBeforeAction });
};

export const unlabelConversationsPending = (
    state: Draft<ElementsState>,
    action: PayloadAction<
        undefined,
        string,
        {
            arg: {
                conversations: Conversation[];
                sourceLabelID: string;
                destinationLabelID: string;
                labels: Label[];
                folders: Folder[];
            };
        }
    >
) => {
    const { conversations, destinationLabelID, labels } = action.meta.arg;
    const elementsBeforeAction = structuredClone(Object.values(state.elements));

    conversations.forEach((conversation) => {
        const conversationState = state.elements[conversation.ID];
        if (!conversationState) {
            return;
        }

        if (isElementConversation(conversationState)) {
            removeLabelFromConversation(conversationState, destinationLabelID, labels);
        }

        const messagesElementState = Object.values(state.elements)
            .filter(isElementMessage)
            .filter((message) => message.ConversationID === conversation.ID);

        messagesElementState.forEach((messageElementState) => {
            removeLabelFromMessage(messageElementState, destinationLabelID, labels);
        });
    });

    updateTotal({ state, elementsBeforeAction });
};

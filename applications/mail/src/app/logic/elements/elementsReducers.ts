import { PayloadAction } from '@reduxjs/toolkit';
import { Draft } from 'immer';

import { toMap } from '@proton/shared/lib/helpers/object';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import diff from '@proton/utils/diff';
import isTruthy from '@proton/utils/isTruthy';
import range from '@proton/utils/range';

import { MAX_ELEMENT_LIST_LOAD_RETRIES, PAGE_SIZE } from '../../constants';
import { parseLabelIDsInEvent, isMessage as testIsMessage } from '../../helpers/elements';
import { Element } from '../../models/element';
import { newState } from './elementsSlice';
import {
    ESResults,
    ElementsState,
    EventUpdates,
    NewStateParams,
    OptimisticDelete,
    OptimisticUpdates,
    QueryParams,
    QueryResults,
    TaskRunningInfo,
} from './elementsTypes';
import { newRetry } from './helpers/elementQuery';

export const globalReset = (state: Draft<ElementsState>) => {
    Object.assign(state, newState());
};

export const reset = (state: Draft<ElementsState>, action: PayloadAction<NewStateParams>) => {
    Object.assign(
        state,
        newState({
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
    action: PayloadAction<{ queryParameters: any; error: Error | undefined }>
) => {
    state.beforeFirstLoad = false;
    state.invalidated = false;
    state.pendingRequest = false;
    state.retry = newRetry(state.retry, action.payload.queryParameters, action.payload.error);
};

const hasSameMode = (state: Draft<ElementsState>, arg: QueryParams) => {
    return state.params.conversationMode === arg.params.conversationMode;
};

export const loadPending = (
    state: Draft<ElementsState>,
    action: PayloadAction<undefined, string, { arg: QueryParams }>
) => {
    if (hasSameMode(state, action.meta.arg)) {
        state.pendingRequest = true;
        state.page = action.meta.arg.page;
    }
};

export const loadFulfilled = (
    state: Draft<ElementsState>,
    action: PayloadAction<{ result: QueryResults; taskRunning: TaskRunningInfo }, string, { arg: QueryParams }>
) => {
    const { page, params } = action.meta.arg;
    const {
        result: { Total, Elements },
        taskRunning,
    } = action.payload;
    if (hasSameMode(state, action.meta.arg)) {
        Object.assign(state, {
            beforeFirstLoad: false,
            invalidated: false,
            pendingRequest: false,
            page,
            total: Total,
            retry: newRetry(state.retry, params, undefined),
        });
        state.pages.push(page);
        Object.assign(state.elements, toMap(Elements, 'ID'));
        state.taskRunning = taskRunning;
    }
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
    const pages = range(0, Math.ceil(total / PAGE_SIZE));
    // Retry is disabled for encrypted search results, to avoid re-triggering the search several times
    // when there are no results
    Object.assign(state, {
        bypassFilter: [],
        beforeFirstLoad: false,
        invalidated: false,
        pendingRequest: false,
        page: action.payload.page,
        total,
        pages,
        elements: toMap(action.payload.elements, 'ID'),
        retry: { payload: undefined, count: MAX_ELEMENT_LIST_LOAD_RETRIES, error: undefined },
    });
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
    }
    if (action.payload.bypass) {
        const { conversationMode } = action.payload;
        action.payload.elements.forEach((element) => {
            const isMessage = testIsMessage(element);
            const id = (isMessage && conversationMode ? (element as Message).ConversationID : element.ID) || '';
            if (!state.bypassFilter.includes(id)) {
                state.bypassFilter.push(id);
            }
        });
    }
};

export const optimisticDelete = (state: Draft<ElementsState>, action: PayloadAction<OptimisticDelete>) => {
    action.payload.elementIDs.forEach((elementID) => {
        delete state.elements[elementID];
    });
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

export const moveAllFulfilled = (
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

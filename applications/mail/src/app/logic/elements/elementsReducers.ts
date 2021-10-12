import { toMap } from '@proton/shared/lib/helpers/object';
import { Draft } from 'immer';
import { PayloadAction } from '@reduxjs/toolkit';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { range } from '@proton/shared/lib/helpers/array';
import { newState } from './elementsSlice';
import { ElementsState, ESResults, EventUpdates, NewStateParams, QueryParams, QueryResults } from './elementsTypes';
import { Element } from '../../models/element';
import { parseLabelIDsInEvent } from '../../helpers/elements';
import { newRetry } from './helpers/elementQuery';
import { MAX_ELEMENT_LIST_LOAD_RETRIES, PAGE_SIZE } from '../../constants';

export const reset = (state: Draft<ElementsState>, action: PayloadAction<NewStateParams>) => {
    console.log('reset', state, action);
    Object.assign(state, newState(action.payload));
};

export const updatePage = (state: Draft<ElementsState>, action: PayloadAction<number>) => {
    state.page = action.payload;
};

export const loadPending = (
    state: Draft<ElementsState>,
    action: PayloadAction<undefined, string, { arg: QueryParams }>
) => {
    console.log('loadStarted', state, action);
    state.pendingRequest = true;
    state.page = action.meta.arg.page;
};

export const loadFulfilled = (
    state: Draft<ElementsState>,
    action: PayloadAction<QueryResults, string, { arg: QueryParams }>
) => {
    console.log('loadSuccess', state, action);

    const { page, params } = action.meta.arg;
    const { Total, Elements } = action.payload;

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

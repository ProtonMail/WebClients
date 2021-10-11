import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { toMap } from '@proton/shared/lib/helpers/object';
import { Draft } from 'immer';
import { PayloadAction } from '@reduxjs/toolkit';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { newState } from './elementsSlice';
import { ElementsState, EventUpdates, NewStateParams, QueryParams, QueryResults, RetryData } from './elementsTypes';
import { Element } from '../../models/element';
import { parseLabelIDsInEvent } from '../../helpers/elements';

export const reset = (state: Draft<ElementsState>, action: PayloadAction<NewStateParams>) => {
    console.log('reset', state, action);
    Object.assign(state, newState(action.payload));
};

/**
 * A retry is the same request as before expecting a different result
 * @param payload: request params + expected total
 * @param error: optional error from last request
 */
const newRetry = (retry: RetryData, payload: any, error: Error | undefined) => {
    const count = error && isDeepEqual(payload, retry.payload) ? retry.count + 1 : 1;
    return { payload, count, error };
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

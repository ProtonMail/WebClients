import type { Draft, PayloadAction } from '@reduxjs/toolkit';

import { MAIL_PAGE_SIZE } from '@proton/shared/lib/mail/mailSettings';

import { addESResults, esSearchSettled, esSearchStarted, loadFulfilled } from '../elementsReducers';
import { newElementsState } from '../elementsSlice';
import type {
    ESResults,
    ElementsState,
    ElementsStateParams,
    QueryParams,
    QueryResults,
    TaskRunningInfo,
} from '../elementsTypes';

const buildLoadFulfilledAction = (
    params: ElementsStateParams
): PayloadAction<
    { result: QueryResults; taskRunning: TaskRunningInfo; params: ElementsStateParams },
    string,
    { arg: QueryParams }
> => ({
    type: 'elements/load/fulfilled',
    payload: {
        result: {
            abortController: new AbortController(),
            Total: 0,
            Elements: [],
            More: false,
            Stale: 0,
            TasksRunning: [],
        },
        taskRunning: { labelIDs: [], timeoutID: undefined },
        params,
    },
    meta: {
        arg: { abortController: undefined, page: 0, pageSize: MAIL_PAGE_SIZE.FIFTY, count: 0, refetch: false },
    },
});

const buildAddESResultsAction = (params: ElementsStateParams): PayloadAction<ESResults> => ({
    type: 'elements/addESResults',
    payload: { page: 0, elements: [], params, pageSize: MAIL_PAGE_SIZE.FIFTY },
});

describe('elementsReducers — Encrypted Search progress', () => {
    let state: Draft<ElementsState>;

    beforeEach(() => {
        state = newElementsState();
    });

    it('is not searching before any run starts', () => {
        expect(state.pendingESSearches).toBe(0);
    });

    it('counts a run as in flight until it settles', () => {
        esSearchStarted(state);
        expect(state.pendingESSearches).toBe(1);

        esSearchSettled(state);
        expect(state.pendingESSearches).toBe(0);
    });

    // A load-more run can overlap the search that started it, which a boolean would report settled early.
    it('stays in flight while overlapping runs are outstanding', () => {
        esSearchStarted(state);
        esSearchStarted(state);

        esSearchSettled(state);
        expect(state.pendingESSearches).toBe(1);

        esSearchSettled(state);
        expect(state.pendingESSearches).toBe(0);
    });

    it('never counts below zero, so a stray settle cannot wedge the count', () => {
        esSearchSettled(state);
        expect(state.pendingESSearches).toBe(0);
    });
});

describe('elementsReducers — usedEncryptedSearch', () => {
    let state: Draft<ElementsState>;

    beforeEach(() => {
        state = newElementsState() as Draft<ElementsState>;
    });

    it('is undefined before anything is loaded', () => {
        expect(state.usedEncryptedSearch).toBeUndefined();
    });

    it('is false once a server load resolves for the current context', () => {
        loadFulfilled(state, buildLoadFulfilledAction(state.params));

        expect(state.usedEncryptedSearch).toBe(false);
    });

    it('is true once Encrypted Search delivers results', () => {
        addESResults(state, buildAddESResultsAction(state.params));

        expect(state.usedEncryptedSearch).toBe(true);
    });

    it('is false again when Encrypted Search falls back to the server for the same context', () => {
        addESResults(state, buildAddESResultsAction(state.params));
        loadFulfilled(state, buildLoadFulfilledAction(state.params));

        expect(state.usedEncryptedSearch).toBe(false);
    });

    it('stays true when a load resolves for a context the user has already left', () => {
        const inboxParams = { ...state.params };
        state.params.search = { keyword: 'invoice' };

        addESResults(state, buildAddESResultsAction({ ...state.params }));
        loadFulfilled(state, buildLoadFulfilledAction(inboxParams));

        expect(state.usedEncryptedSearch).toBe(true);
    });
});

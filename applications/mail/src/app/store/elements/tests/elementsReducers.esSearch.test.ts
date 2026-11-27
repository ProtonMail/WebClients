import type { Draft, PayloadAction } from '@reduxjs/toolkit';

import { MAIL_PAGE_SIZE } from '@proton/shared/lib/mail/mailSettings';

import { getElementContextIdentifier } from '../../../helpers/elements';
import type { Element } from '../../../models/element';
import {
    addESResults,
    esSearchSettled,
    esSearchStarted,
    loadFulfilled,
    showSerializedElements,
} from '../elementsReducers';
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

describe('elementsReducers — orderedSearchResultIDs', () => {
    let state: Draft<ElementsState>;

    const keywordParams = (): ElementsStateParams => ({
        ...newElementsState().params,
        conversationMode: false,
        search: { keyword: 'invoice' },
    });

    const contextOf = (params: ElementsStateParams) =>
        getElementContextIdentifier({
            labelID: params.labelID,
            categoryIDs: params.categoryIDs,
            conversationMode: params.conversationMode,
            filter: params.filter,
            sort: params.sort,
            keyword: params.search.keyword,
        });

    const results = (...ids: string[]) => ids.map((ID) => ({ ID }) as Element);

    beforeEach(() => {
        state = newElementsState() as Draft<ElementsState>;
    });

    it('keeps the order of ordered results', () => {
        const params = keywordParams();
        addESResults(state, {
            ...buildAddESResultsAction(params),
            payload: { ...buildAddESResultsAction(params).payload, elements: results('c', 'a', 'b'), ordered: true },
        });

        expect(state.orderedSearchResultIDs[contextOf(params)]).toEqual(['c', 'a', 'b']);
    });

    it('replaces the list with each new snapshot', () => {
        const params = keywordParams();
        const action = (ids: string[]) => ({
            ...buildAddESResultsAction(params),
            payload: { ...buildAddESResultsAction(params).payload, elements: results(...ids), ordered: true },
        });
        addESResults(state, action(['a']));
        addESResults(state, action(['b', 'a']));

        expect(state.orderedSearchResultIDs[contextOf(params)]).toEqual(['b', 'a']);
    });

    it('drops the list when results for the context are not ordered', () => {
        const params = keywordParams();
        addESResults(state, {
            ...buildAddESResultsAction(params),
            payload: { ...buildAddESResultsAction(params).payload, elements: results('a'), ordered: true },
        });
        addESResults(state, {
            ...buildAddESResultsAction(params),
            payload: { ...buildAddESResultsAction(params).payload, elements: results('a') },
        });

        expect(state.orderedSearchResultIDs[contextOf(params)]).toBeUndefined();
    });

    it('drops the list when the server answers for the same context', () => {
        const params = keywordParams();
        addESResults(state, {
            ...buildAddESResultsAction(params),
            payload: { ...buildAddESResultsAction(params).payload, elements: results('a'), ordered: true },
        });
        showSerializedElements(state, {
            type: 'elements/showSerializedElements',
            payload: {
                result: { abortController: new AbortController(), Total: 1, Elements: results('a'), Stale: 0 },
                page: 0,
                params,
            },
        });

        expect(state.orderedSearchResultIDs[contextOf(params)]).toBeUndefined();
    });
});

import type { Draft } from '@reduxjs/toolkit';

import { esSearchSettled, esSearchStarted } from '../elementsReducers';
import { newElementsState } from '../elementsSlice';
import type { ElementsState } from '../elementsTypes';

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

import { createAction, createReducer } from '@reduxjs/toolkit';

import { pullSpacesSuccess } from '../core/spaces';

export const setReduxLoadedFromIdb = createAction('lumo/meta/setReduxLoadedFromIdb');

export interface InitializationState {
    reduxLoadedFromIdb: boolean;
    /** Bumped after each successful pullSpaces so retention enforcement can re-run. */
    lastSpacesPullAt: number;
}

const initialState: InitializationState = {
    reduxLoadedFromIdb: false,
    lastSpacesPullAt: 0,
};

const initializationReducer = createReducer<InitializationState>(initialState, (builder) => {
    builder
        .addCase(setReduxLoadedFromIdb, (state) => {
            console.log('Action triggered: setReduxLoadedFromIdb');
            state.reduxLoadedFromIdb = true;
        })
        .addCase(pullSpacesSuccess, (state) => {
            state.lastSpacesPullAt = Date.now();
        });
});

export default initializationReducer;


import { createAction, createReducer } from '@reduxjs/toolkit';

export const setReduxLoadedFromIdb = createAction('lumo/meta/setReduxLoadedFromIdb');

export interface InitializationState {
    reduxLoadedFromIdb: boolean;
}

const initialState: InitializationState = {
    reduxLoadedFromIdb: false,
};

const initializationReducer = createReducer<InitializationState>(initialState, (builder) => {
    builder
        .addCase(setReduxLoadedFromIdb, (state) => {
            console.log('Action triggered: setReduxLoadedFromIdb');
            state.reduxLoadedFromIdb = true;
        });
});

export default initializationReducer;


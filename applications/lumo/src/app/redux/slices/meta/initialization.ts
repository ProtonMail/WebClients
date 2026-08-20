import { createAction, createReducer } from '@reduxjs/toolkit';

import { pullSpacesSuccess } from '../core/spaces';

export const setReduxLoadedFromIdb = createAction('lumo/meta/setReduxLoadedFromIdb');
/** Set after the addMasterKey settings listener finishes (remote or localStorage fallback). */
export const setLumoUserSettingsBootstrapped = createAction('lumo/meta/setLumoUserSettingsBootstrapped');

export interface InitializationState {
    reduxLoadedFromIdb: boolean;
    /** True once Lumo user settings have been loaded after the master key is available. */
    lumoUserSettingsBootstrapped: boolean;
    /** Bumped after each successful pullSpaces so retention enforcement can re-run. */
    lastSpacesPullAt: number;
}

const initialState: InitializationState = {
    reduxLoadedFromIdb: false,
    lumoUserSettingsBootstrapped: false,
    lastSpacesPullAt: 0,
};

const initializationReducer = createReducer<InitializationState>(initialState, (builder) => {
    builder
        .addCase(setReduxLoadedFromIdb, (state) => {
            console.log('Action triggered: setReduxLoadedFromIdb');
            state.reduxLoadedFromIdb = true;
        })
        .addCase(setLumoUserSettingsBootstrapped, (state) => {
            state.lumoUserSettingsBootstrapped = true;
        })
        .addCase(pullSpacesSuccess, (state) => {
            state.lastSpacesPullAt = Date.now();
        });
});

export default initializationReducer;


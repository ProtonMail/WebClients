import { type PayloadAction, createAction, createReducer } from '@reduxjs/toolkit';

import { pullSpacesFailure, pullSpacesSuccess } from '../core/spaces';

export const setReduxLoadedFromIdb = createAction('lumo/meta/setReduxLoadedFromIdb');
/** Set after the addMasterKey settings listener finishes (remote or localStorage fallback). */
export const setLumoUserSettingsBootstrapped = createAction('lumo/meta/setLumoUserSettingsBootstrapped');
/**
 * True when the remote user-settings blob exists but could not be decrypted with any available
 * master key (e.g. after a password reset that minted a new one — see LUMO-853). The old account
 * keys might still come back through some other recovery path later, and the old envelope is
 * never deleted, so as long as this is true we must not let an auto-save PUT the current
 * (default) settings over that blob — that would destroy it for good.
 *
 * Cleared when settings can be loaded or the acknowledged pre-reset blob has been replaced.
 */
export const setRemoteUserSettingsUndecryptable = createAction<boolean>('lumo/meta/setRemoteUserSettingsUndecryptable');

export const acknowledgeLumoDataLossWarning = createAction('lumo/meta/acknowledgeLumoDataLossWarning');

/** True when the startup settings load from the server failed; `useUserSettingsLoadFailedNotification` shows a toast. */
export const setRemoteUserSettingsLoadFailed = createAction<boolean>('lumo/meta/setRemoteUserSettingsLoadFailed');

interface InitializationState {
    reduxLoadedFromIdb: boolean;
    /** True once Lumo user settings have been loaded after the master key is available. */
    lumoUserSettingsBootstrapped: boolean;
    /** Bumped after each successful pullSpaces so retention enforcement can re-run. */
    lastSpacesPullAt: number;
    /** True once the first pullSpaces has finished, successfully or not. */
    spacesPullSettled: boolean;
    remoteUserSettingsUndecryptable: boolean;
    lumoDataLossWarningShown: boolean;
    remoteUserSettingsLoadFailed: boolean;
}

const initialState: InitializationState = {
    reduxLoadedFromIdb: false,
    lumoUserSettingsBootstrapped: false,
    lastSpacesPullAt: 0,
    spacesPullSettled: false,
    remoteUserSettingsUndecryptable: false,
    lumoDataLossWarningShown: false,
    remoteUserSettingsLoadFailed: false,
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
            state.spacesPullSettled = true;
        })
        .addCase(pullSpacesFailure, (state) => {
            state.spacesPullSettled = true;
        })
        .addCase(setRemoteUserSettingsUndecryptable, (state, action: PayloadAction<boolean>) => {
            state.remoteUserSettingsUndecryptable = action.payload;
        })
        .addCase(acknowledgeLumoDataLossWarning, (state) => {
            state.lumoDataLossWarningShown = true;
        })
        .addCase(setRemoteUserSettingsLoadFailed, (state, action: PayloadAction<boolean>) => {
            state.remoteUserSettingsLoadFailed = action.payload;
        });
});

export default initializationReducer;

import { type PayloadAction, createAction, createReducer } from '@reduxjs/toolkit';

import { pullSpacesSuccess } from '../core/spaces';

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
 * Cleared as soon as a load actually succeeds in decrypting something (real recovery), or once
 * `useDataLossWarningNotification` has told the user their pre-reset data is gone — at that
 * point there's no more reason to keep refusing to sync settings forever, so new settings are
 * free to overwrite the old, now-acknowledged-as-lost blob.
 */
export const setRemoteUserSettingsUndecryptable = createAction<boolean>(
    'lumo/meta/setRemoteUserSettingsUndecryptable'
);

interface InitializationState {
    reduxLoadedFromIdb: boolean;
    /** True once Lumo user settings have been loaded after the master key is available. */
    lumoUserSettingsBootstrapped: boolean;
    /** Bumped after each successful pullSpaces so retention enforcement can re-run. */
    lastSpacesPullAt: number;
    remoteUserSettingsUndecryptable: boolean;
}

const initialState: InitializationState = {
    reduxLoadedFromIdb: false,
    lumoUserSettingsBootstrapped: false,
    lastSpacesPullAt: 0,
    remoteUserSettingsUndecryptable: false,
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
        })
        .addCase(setRemoteUserSettingsUndecryptable, (state, action: PayloadAction<boolean>) => {
            state.remoteUserSettingsUndecryptable = action.payload;
        });
});

export default initializationReducer;


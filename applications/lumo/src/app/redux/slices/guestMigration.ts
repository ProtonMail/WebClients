import { createAction, createReducer } from '@reduxjs/toolkit';

import type { GuestMigrationData } from '../../hooks/useGuestMigration';
import type { ConversationId } from '../../types';

export const importGuestDataRequest = createAction<GuestMigrationData>('guestMigration/importGuestDataRequest');

export const importGuestDataSuccess = createAction<{
    activeConversationId?: ConversationId;
}>('guestMigration/importGuestDataSuccess');

export const importGuestDataFailure = createAction<{
    error: string;
}>('guestMigration/importGuestDataFailure');

export interface GuestMigrationState {
    isImporting: boolean;
    importSuccess: boolean;
    importError: string | null;
    activeConversationId?: ConversationId;
}

const initialState: GuestMigrationState = {
    isImporting: false,
    importSuccess: false,
    importError: null,
};

const guestMigrationReducer = createReducer<GuestMigrationState>(initialState, (builder) => {
    builder
        .addCase(importGuestDataRequest, (state) => {
            console.log('Action triggered: importGuestDataRequest');
            state.isImporting = true;
            state.importSuccess = false;
            state.importError = null;
        })
        .addCase(importGuestDataSuccess, (state, action) => {
            console.log('Action triggered: importGuestDataSuccess', action.payload);
            state.isImporting = false;
            state.importSuccess = true;
            state.importError = null;
            state.activeConversationId = action.payload.activeConversationId;
        })
        .addCase(importGuestDataFailure, (state, action) => {
            console.log('Action triggered: importGuestDataFailure', action.payload);
            state.isImporting = false;
            state.importSuccess = false;
            state.importError = action.payload.error;
        });
});

export default guestMigrationReducer;

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface ComposerActionsState {
    pendingPrefill: string | null;
    // Agent selected for the next/new conversation, before that conversation has an id.
    // Once the conversation is created, the agent is stamped onto it and this is cleared.
    pendingAgentId: string | null;
    // Whether the agent picker modal is open. Triggered from the Tools menu or the active badge.
    agentPickerOpen: boolean;
}

const initialState: ComposerActionsState = {
    pendingPrefill: null,
    pendingAgentId: null,
    agentPickerOpen: false,
};

const composerActionsSlice = createSlice({
    name: 'composerActions',
    initialState,
    reducers: {
        setPendingPrefill: (state, action: PayloadAction<string>) => {
            state.pendingPrefill = action.payload;
        },
        clearPendingPrefill: (state) => {
            state.pendingPrefill = null;
        },
        setPendingAgent: (state, action: PayloadAction<string>) => {
            state.pendingAgentId = action.payload;
        },
        clearPendingAgent: (state) => {
            state.pendingAgentId = null;
        },
        openAgentPicker: (state) => {
            state.agentPickerOpen = true;
        },
        closeAgentPicker: (state) => {
            state.agentPickerOpen = false;
        },
    },
});

export const {
    setPendingPrefill,
    clearPendingPrefill,
    setPendingAgent,
    clearPendingAgent,
    openAgentPicker,
    closeAgentPicker,
} = composerActionsSlice.actions;
export default composerActionsSlice.reducer;

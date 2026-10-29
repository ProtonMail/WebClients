import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface ComposerActionsState {
    pendingPrefill: string | null;
    // Agent selected for the next/new conversation, before that conversation has an id.
    // Once the conversation is created, the agent is stamped onto it and this is cleared.
    pendingAgentId: string | null;
    // Artifact-creation choice made in the composer tool menu for a new conversation, before that
    // conversation has an id. Stamped onto the conversation on first send, then cleared. `null`
    // means the user hasn't touched the toggle, so the global default applies.
    pendingArtifactCreation: boolean | null;
    // Whether the agent picker modal is open. Triggered from the Tools menu or the active badge.
    agentPickerOpen: boolean;
    // Skill handle picked from the Tools menu, waiting for the composer to insert it as `/handle `.
    pendingSkillHandle: string | null;
}

const initialState: ComposerActionsState = {
    pendingPrefill: null,
    pendingAgentId: null,
    pendingArtifactCreation: null,
    agentPickerOpen: false,
    pendingSkillHandle: null,
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
        setPendingArtifactCreation: (state, action: PayloadAction<boolean>) => {
            state.pendingArtifactCreation = action.payload;
        },
        clearPendingArtifactCreation: (state) => {
            state.pendingArtifactCreation = null;
        },
        openAgentPicker: (state) => {
            state.agentPickerOpen = true;
        },
        closeAgentPicker: (state) => {
            state.agentPickerOpen = false;
        },
        insertSkillCommand: (state, action: PayloadAction<string>) => {
            state.pendingSkillHandle = action.payload;
        },
        clearPendingSkillCommand: (state) => {
            state.pendingSkillHandle = null;
        },
    },
});

export const {
    setPendingPrefill,
    clearPendingPrefill,
    setPendingAgent,
    clearPendingAgent,
    setPendingArtifactCreation,
    clearPendingArtifactCreation,
    openAgentPicker,
    closeAgentPicker,
    insertSkillCommand,
    clearPendingSkillCommand,
} = composerActionsSlice.actions;
export default composerActionsSlice.reducer;

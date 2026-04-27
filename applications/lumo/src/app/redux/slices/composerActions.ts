import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface ComposerActionsState {
    pendingPrefill: string | null;
}

const initialState: ComposerActionsState = {
    pendingPrefill: null,
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
    },
});

export const { setPendingPrefill, clearPendingPrefill } = composerActionsSlice.actions;
export default composerActionsSlice.reducer;

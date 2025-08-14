import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface GhostChatState {
    isGhostChatMode: boolean;
}

const initialState: GhostChatState = {
    isGhostChatMode: false,
};

const ghostChatSlice = createSlice({
    name: 'ghostChat',
    initialState,
    reducers: {
        setGhostChatMode: (state, action: PayloadAction<boolean>) => {
            console.log('Action triggered: setGhostChatMode', action.payload);
            state.isGhostChatMode = action.payload;
        },
        toggleGhostChatMode: (state) => {
            console.log('Action triggered: toggleGhostChatMode');
            state.isGhostChatMode = !state.isGhostChatMode;
        },
    },
});

export const { setGhostChatMode, toggleGhostChatMode } = ghostChatSlice.actions;
export default ghostChatSlice.reducer; 
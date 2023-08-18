import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface LayoutState {
    sidebarExpanded: boolean;
}

const initialState: LayoutState = {
    /**
     * Used on narrow devices when burger menu allows to toggle sidebar
     */
    sidebarExpanded: false,
};

const layoutSlice = createSlice({
    name: 'layout',
    initialState,
    reducers: {
        setSidebarExpanded: (state, action: PayloadAction<boolean>) => {
            state.sidebarExpanded = action.payload;
        },
        toggleSidebarExpand: (state) => {
            state.sidebarExpanded = !state.sidebarExpanded;
        },
    },
});

export const layoutActions = layoutSlice.actions;

export default layoutSlice.reducer;

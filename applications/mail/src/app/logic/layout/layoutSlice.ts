import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface LayoutState {
    sidebarExpanded: boolean;
    selectAll: boolean;
}

const initialState: LayoutState = {
    /**
     * Used on narrow devices when burger menu allows to toggle sidebar
     */
    sidebarExpanded: false,
    selectAll: false,
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
        setSelectAll: (state, action: PayloadAction<boolean>) => {
            state.selectAll = action.payload;
        },
    },
});

export const layoutActions = layoutSlice.actions;

export default layoutSlice.reducer;

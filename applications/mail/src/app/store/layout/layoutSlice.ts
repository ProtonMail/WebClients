import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

interface LayoutState {
    sidebarExpanded: boolean;
    selectAll: boolean;
}

export const layoutInitialState: LayoutState = {
    /**
     * Used on narrow devices when burger menu allows to toggle sidebar
     */
    sidebarExpanded: false,
    selectAll: false,
};

const name = 'layout';
const layoutSlice = createSlice({
    name,
    initialState: layoutInitialState,
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
export const layoutReducer = { [name]: layoutSlice.reducer };

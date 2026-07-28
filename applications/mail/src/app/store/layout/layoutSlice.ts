import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

interface LayoutState {
    sidebarExpanded: boolean;
    selectAll: boolean;
    draggingElements: boolean;
}

export const layoutInitialState: LayoutState = {
    /**
     * Used on narrow devices when burger menu allows to toggle sidebar
     */
    sidebarExpanded: false,
    selectAll: false,
    /**
     * True while the user drags elements out of the mailbox list. Drop targets
     * outside of the list (category tabs, ...) use it to show their affordance.
     */
    draggingElements: false,
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
        setDraggingElements: (state, action: PayloadAction<boolean>) => {
            state.draggingElements = action.payload;
        },
    },
});

export const layoutActions = layoutSlice.actions;
export const layoutReducer = { [name]: layoutSlice.reducer };

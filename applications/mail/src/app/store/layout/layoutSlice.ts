import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

interface LayoutState {
    sidebarExpanded: boolean;
    selectAll: boolean;
    draggingElements: boolean;
    /**
     * Number of elements currently being dragged out of the mailbox list.
     * `1` means a single message is eligible for the "create calendar event"
     * drop target; anything greater than `1` disables it (multi-select drags
     * are reserved for moving messages between folders/labels).
     */
    draggingElementsCount: number;
    /**
     * The message ID being dragged, but only when exactly one message is
     * dragged (`draggingElementsCount === 1`). Kept local to Mail and only
     * resolved into event metadata after a valid Calendar drop. `null` for
     * multi-message drags so no IDs are retained unnecessarily.
     */
    draggedMessageID?: string | null;
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
    draggingElementsCount: 0,
    draggedMessageID: null,
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
        setDraggingElementsCount: (state, action: PayloadAction<number>) => {
            state.draggingElementsCount = action.payload;
        },
        setDraggedMessageID: (state, action: PayloadAction<string | null>) => {
            state.draggedMessageID = action.payload;
        },
    },
});

export const layoutActions = layoutSlice.actions;
export const layoutReducer = { [name]: layoutSlice.reducer };

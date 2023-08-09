import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface LayoutState {
    expanded: boolean;
}

const initialState: LayoutState = {
    expanded: false,
};

const layoutSlice = createSlice({
    name: 'layout',
    initialState,
    reducers: {
        setExpanded: (state, action: PayloadAction<boolean>) => {
            state.expanded = action.payload;
        },
        toggleExpanded: (state) => {
            state.expanded = !state.expanded;
        },
    },
});

export const layoutActions = layoutSlice.actions;

export default layoutSlice.reducer;

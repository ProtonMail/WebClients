import { createAction, createSlice } from '@reduxjs/toolkit';

export interface BYOEFlowState {
    connectedAddress: string | null;
    stepModal: 'moreStorage' | 'success' | null;
    skipImport: boolean;
}

const initialState: BYOEFlowState = {
    connectedAddress: null,
    stepModal: null,
    skipImport: false,
};

export const setBYOEFlowResult = createAction<{
    connectedAddress: string;
    isPaid: boolean;
    skipImport: boolean;
}>('byoeFlow/setResult');

export const advanceToBYOESuccess = createAction('byoeFlow/advanceToSuccess');
export const clearBYOEFlow = createAction('byoeFlow/clear');

const byoeFlowSlice = createSlice({
    name: 'byoeFlow',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(setBYOEFlowResult, (state, action) => {
            state.connectedAddress = action.payload.connectedAddress;
            state.skipImport = action.payload.skipImport;
            state.stepModal = action.payload.isPaid || action.payload.skipImport ? 'success' : 'moreStorage';
        });

        builder.addCase(advanceToBYOESuccess, (state) => {
            state.stepModal = 'success';
        });

        builder.addCase(clearBYOEFlow, (state) => {
            state.connectedAddress = null;
            state.stepModal = null;
            state.skipImport = false;
        });
    },
});

export default byoeFlowSlice.reducer;

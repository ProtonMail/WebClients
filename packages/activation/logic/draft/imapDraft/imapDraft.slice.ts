import { createSlice } from '@reduxjs/toolkit';

import * as actions from './imapDraft.actions';
import { ImapDraftState } from './imapDraft.interface';

const initialState: ImapDraftState = { step: 'idle' };

const imapDraftSlice = createSlice({
    name: 'imapDraft',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(actions.resetImapDraft, (state) => {
            state.step = 'idle';
            delete state.product;
            delete state.provider;
            delete state.hasReadInstructions;
        });

        builder.addCase(actions.startImapDraft, (state, action) => {
            state.step = 'started';
            state.provider = action.payload.provider;
            state.hasReadInstructions = false;
        });

        builder.addCase(actions.selectImapProductToImport, (state, action) => {
            state.product = action.payload.product;
        });

        builder.addCase(actions.readImapInstructions, (state) => {
            state.hasReadInstructions = true;
        });
    },
});

export default imapDraftSlice.reducer;

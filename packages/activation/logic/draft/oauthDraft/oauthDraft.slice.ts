import { createSlice } from '@reduxjs/toolkit';

import * as actions from './oauthDraft.actions';
import { OauthDraftState } from './oauthDraft.interface';

const initialState: OauthDraftState = { step: 'idle' };

const oauthDraftSlice = createSlice({
    name: 'oauthDraft',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(actions.resetOauthDraft, (state) => {
            state.step = 'idle';
            delete state.products;
            delete state.provider;
        });

        builder.addCase(actions.startOauthDraft, (state, action) => {
            state.step = 'started';
            state.provider = action.payload.provider;
            state.products = action.payload.products;
        });
    },
});

export default oauthDraftSlice.reducer;

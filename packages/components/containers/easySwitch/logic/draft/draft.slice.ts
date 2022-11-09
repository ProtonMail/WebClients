import { createSlice } from '@reduxjs/toolkit';

import { ImportAuthType } from '../types/shared.types';
import * as actions from './draft.actions';
import { DraftState, DraftStep } from './draft.interface';

const initialState: DraftState = { ui: { step: DraftStep.IDLE } };

const reportsSlice = createSlice({
    name: 'reports',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(actions.resetDraft, (state) => {
            state.ui = { step: DraftStep.IDLE };
        });

        builder.addCase(actions.startDraft, (state, action) => {
            state.ui = {
                step: DraftStep.START,
                provider: action.payload.provider,
                authType: action.payload.authType,
                importType: action.payload.importType,
                hasReadInstructions: false,
            };
        });

        builder.addCase(actions.selectProductToImport, (state, action) => {
            if (state.ui.step === DraftStep.START) {
                state.ui.importType = action.payload.importType;
            }
        });

        builder.addCase(actions.readInstructions, (state, action) => {
            if (state.ui.step === DraftStep.START && state.ui.authType === ImportAuthType.IMAP) {
                state.ui.hasReadInstructions = action.payload;
            }
        });
    },
});

export default reportsSlice.reducer;

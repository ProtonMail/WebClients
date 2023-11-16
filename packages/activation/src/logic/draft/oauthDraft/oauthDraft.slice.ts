import { Action, createSlice } from '@reduxjs/toolkit';

import { RequireSome } from '@proton/shared/lib/interfaces';

import { createImporterThunk } from './createImporter.action';
import * as actions from './oauthDraft.actions';
import { OauthDraftState } from './oauthDraft.interface';

const initialState: OauthDraftState = { step: 'idle' };

const mailImportIsDefined = (
    state: OauthDraftState,
    action: Action
): state is RequireSome<OauthDraftState, 'mailImport'> => {
    if (state.mailImport === undefined) {
        throw new Error(`Reducer for ${action.type} should not be called if 'mailImport' is not defined`);
    }

    return state.mailImport !== undefined;
};

const oauthDraftSlice = createSlice({
    name: 'oauthDraft',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(actions.startOauthDraft, (state, action) => {
            state.step = 'started';
            state.provider = action.payload.provider;
            state.source = action.payload.source;

            state.mailImport = {
                ...state.mailImport,
                products: action.payload.products,
            };
        });

        builder.addCase(actions.displayConfirmLeaveModal, (state, action) => {
            state.displayConfirmLeaveModal = action.payload;
        });

        builder.addCase(actions.resetOauthDraft, (state) => {
            state.step = 'idle';
            delete state.provider;
            delete state.mailImport;
            delete state.displayConfirmLeaveModal;
        });

        builder.addCase(actions.initOauthMailImport, (state) => {
            if (mailImportIsDefined(state, actions.initOauthMailImport)) {
                state.mailImport.step = 'products';
            }
        });

        builder.addCase(actions.submitProducts, (state, action) => {
            if (mailImportIsDefined(state, actions.submitProducts)) {
                state.mailImport.products = action.payload;
            }
        });

        builder.addCase(actions.submitProductProvider, (state, action) => {
            if (mailImportIsDefined(state, actions.submitProductProvider)) {
                state.mailImport.products = action.payload.products;
                state.mailImport.scopes = action.payload.scopes;
            }
        });

        builder.addCase(actions.changeOAuthStep, (state, action) => {
            if (mailImportIsDefined(state, actions.changeOAuthStep)) {
                state.mailImport.step = action.payload;
            }
        });

        builder.addCase(createImporterThunk.fulfilled, (state, action) => {
            if (mailImportIsDefined(state, createImporterThunk.fulfilled)) {
                state.mailImport.isCreatingImporter = false;
                state.mailImport.importerData = action.payload;
                state.mailImport.step = 'prepare-import';
            }
        });

        builder.addCase(createImporterThunk.rejected, (state) => {
            state.step = 'idle';
            delete state.provider;
            delete state.mailImport;
            delete state.displayConfirmLeaveModal;
        });

        builder.addCase(createImporterThunk.pending, (state) => {
            if (mailImportIsDefined(state, createImporterThunk.pending)) {
                state.mailImport.isCreatingImporter = true;
            }
        });

        builder.addCase(actions.updateCalendarData, (state, action) => {
            if (mailImportIsDefined(state, actions.updateCalendarData) && state.mailImport.importerData?.calendars) {
                state.mailImport.importerData.calendars.calendars = action.payload;
            }
        });

        builder.addCase(actions.updateEmailsData, (state, action) => {
            if (mailImportIsDefined(state, actions.updateEmailsData) && state.mailImport.importerData?.emails) {
                state.mailImport.importerData.emails.fields = action.payload;
            }
        });
    },
});

export default oauthDraftSlice.reducer;

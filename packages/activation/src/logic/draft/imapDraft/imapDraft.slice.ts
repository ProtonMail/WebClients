import type { Action, Draft } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { ImportProvider, ImportType } from '@proton/activation/src/interface';
import type { RequireSome } from '@proton/shared/lib/interfaces';

import * as actions from './imapDraft.actions';
import type { ImapDraftState } from './imapDraft.interface';

const initialState: ImapDraftState = { step: 'idle' };

const mailImportIsDefined = (
    state: ImapDraftState,
    action: Action
): state is RequireSome<ImapDraftState, 'mailImport'> => {
    if (state.mailImport === undefined) {
        throw new Error(`Reducer for ${action.type} should not be called if 'mailImport' is not defined`);
    }

    return state.mailImport !== undefined;
};

const resetState = (state: Draft<ImapDraftState>) => {
    state.step = 'idle';
    delete state.provider;
    delete state.product;
    delete state.hasReadInstructions;
    delete state.mailImport;
    delete state.displayConfirmLeaveModal;
};

const imapDraftSlice = createSlice({
    name: 'imapDraft',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(actions.resetImapDraft, resetState);

        builder.addCase(actions.startImapDraft, (state, action) => {
            state.step = 'started';
            state.provider = action.payload.provider;
            state.hasReadInstructions = false;
        });

        builder.addCase(actions.selectImapProduct, (state, action) => {
            state.product = action.payload.product;
        });

        builder.addCase(actions.readImapInstructions, (state) => {
            state.hasReadInstructions = true;
        });

        builder.addCase(actions.initImapMailImport, (state) => {
            state.mailImport = {
                step: 'form',
            };
        });

        /**
         * Reconnect IMAP import thunk
         */
        builder.addCase(actions.reconnectImapImport.fulfilled, (state, action) => {
            state.step = 'started';
            state.provider = ImportProvider.DEFAULT;
            state.product = ImportType.MAIL;
            state.hasReadInstructions = true;

            state.mailImport = {
                step: 'reconnect-form',
                apiImporterID: action.payload.ID,
                apiSasl: action.payload.Sasl,
                domain: action.payload.ImapHost,
                email: action.payload.Account,
                port: action.payload.ImapPort,
                loading: false,
            };
        });

        /**
         * Submit IMAP credentials thunk
         */
        builder.addCase(actions.submitImapMailCredentials.pending, (state) => {
            if (mailImportIsDefined(state, actions.submitImapMailCredentials.pending)) {
                state.mailImport.loading = true;
            }
        });
        builder.addCase(actions.submitImapMailCredentials.fulfilled, (state, action) => {
            if (mailImportIsDefined(state, actions.submitImapMailCredentials.pending)) {
                const { email, port, domain, foldersMapping, importerID, sasl, password } = action.payload;

                state.mailImport.step = 'prepare-import';
                state.mailImport.loading = false;
                state.mailImport.apiImporterID = importerID;
                state.mailImport.apiSasl = sasl;
                state.mailImport.domain = domain;
                state.mailImport.email = email;
                state.mailImport.foldersMapping = foldersMapping;
                state.mailImport.password = password;
                state.mailImport.port = port;
            }
        });
        builder.addCase(actions.submitImapMailCredentials.rejected, (state, action) => {
            if (mailImportIsDefined(state, actions.submitImapMailCredentials.pending)) {
                state.mailImport.step = 'form';
                state.mailImport.apiErrorCode = action.payload?.Code;
                state.mailImport.apiErrorLabel = action.payload?.Error;
                state.mailImport.loading = false;
            }
        });

        builder.addCase(actions.saveImapMailFields, (state, action) => {
            if (mailImportIsDefined(state, actions.saveImapMailFields)) {
                state.mailImport.fields = action.payload;
            }
        });

        /**
         * Prepare IMAP import thunk
         */
        builder.addCase(actions.startImapMailImport.pending, (state) => {
            if (mailImportIsDefined(state, actions.startImapMailImport.pending)) {
                state.mailImport.loading = true;
            }
        });
        builder.addCase(actions.startImapMailImport.fulfilled, (state) => {
            if (mailImportIsDefined(state, actions.startImapMailImport.fulfilled)) {
                state.mailImport.step = 'importing';
                state.mailImport.loading = false;
            }
        });
        builder.addCase(actions.startImapMailImport.rejected, (state) => {
            if (mailImportIsDefined(state, actions.startImapMailImport.rejected)) {
                state.mailImport.loading = false;
            }
        });

        builder.addCase(actions.resumeImapImport.rejected, resetState);
        builder.addCase(actions.resumeImapImport.fulfilled, resetState);
        builder.addCase(actions.displayConfirmLeaveModal, (state, action) => {
            state.displayConfirmLeaveModal = action.payload;
        });
    },
});

export default imapDraftSlice.reducer;

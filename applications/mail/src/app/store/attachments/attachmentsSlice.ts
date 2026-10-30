import { createSlice } from '@reduxjs/toolkit';

import { addAttachmentsCases } from '@proton/mail-message/store/attachments/attachmentsCases';
import { globalReset as globalResetReducer } from '@proton/mail-message/store/attachments/attachmentsReducers';
import type { AttachmentsState } from '@proton/mail-message/store/attachments/attachmentsTypes';

import { globalReset } from '../actions';

const name = 'attachments';

const attachmentsSlice = createSlice({
    name,
    initialState: {} as AttachmentsState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(globalReset, globalResetReducer);
        addAttachmentsCases(builder);
    },
});

export const attachmentsReducer = { [name]: attachmentsSlice.reducer };

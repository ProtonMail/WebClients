import { createSlice } from '@reduxjs/toolkit';

import { globalReset } from '../actions';
import { addAttachment, updateAttachment } from './attachmentsActions';
import { globalReset as globalResetReducer, setAttachment as setAttachmentReducer } from './attachmentsReducers';
import type { AttachmentsState } from './attachmentsTypes';

const name = 'attachments';

const attachmentsSlice = createSlice({
    name,
    initialState: {} as AttachmentsState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(globalReset, globalResetReducer);
        builder.addCase(addAttachment, setAttachmentReducer);
        builder.addCase(updateAttachment, setAttachmentReducer);
    },
});

export const attachmentsReducer = { [name]: attachmentsSlice.reducer };

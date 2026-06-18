import { createSlice } from '@reduxjs/toolkit';

import { globalReset } from '../actions';
import { addAttachment, addImageIdentifierAction, updateAttachment } from './attachmentsActions';
import {
    addImageIdentifierReducer,
    globalReset as globalResetReducer,
    setAttachment as setAttachmentReducer,
} from './attachmentsReducers';
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
        builder.addCase(addImageIdentifierAction, addImageIdentifierReducer);
    },
});

export const attachmentsReducer = { [name]: attachmentsSlice.reducer };

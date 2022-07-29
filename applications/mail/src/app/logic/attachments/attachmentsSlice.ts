import { createSlice } from '@reduxjs/toolkit';

import { globalReset } from '../actions';
import { addAttachment, updateAttachment } from './attachmentsActions';
import { globalReset as globalResetReducer, setAttachment as setAttachmentReducer } from './attachmentsReducers';
import { AttachmentsState } from './attachmentsTypes';

const attachmentsSlice = createSlice({
    name: 'attachments',
    initialState: {} as AttachmentsState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(globalReset, globalResetReducer);
        builder.addCase(addAttachment, setAttachmentReducer);
        builder.addCase(updateAttachment, setAttachmentReducer);
    },
});

export default attachmentsSlice.reducer;

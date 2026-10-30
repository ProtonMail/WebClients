import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';

import { addAttachment, addImageIdentifierAction, updateAttachment } from './attachmentsActions';
import { addImageIdentifierReducer, setAttachment as setAttachmentReducer } from './attachmentsReducers';
import type { AttachmentsState } from './attachmentsTypes';

/**
 * Registers the cases for the attachments slice's own actions.
 * The app owns the slice and adds the reset case.
 */
export const addAttachmentsCases = (builder: ActionReducerMapBuilder<AttachmentsState>) => {
    builder.addCase(addAttachment, setAttachmentReducer);
    builder.addCase(updateAttachment, setAttachmentReducer);
    builder.addCase(addImageIdentifierAction, addImageIdentifierReducer);
};

import type { PayloadAction } from '@reduxjs/toolkit';
import type { Draft } from 'immer';

import type { AttachmentsState, DecryptedAttachment } from './attachmentsTypes';

export const globalReset = (state: Draft<AttachmentsState>) => {
    Object.keys(state).forEach((key) => delete state[key]);
};

export const setAttachment = (
    state: Draft<AttachmentsState>,
    { payload: { ID, attachment } }: PayloadAction<{ ID: string; attachment: DecryptedAttachment }>
) => {
    state[ID] = attachment;
};

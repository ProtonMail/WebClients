import { PayloadAction } from '@reduxjs/toolkit';
import { Draft } from 'immer';

import { WorkerDecryptionResult } from '@proton/crypto';

import { AttachmentsState } from './attachmentsTypes';

export const globalReset = (state: Draft<AttachmentsState>) => {
    Object.keys(state).forEach((key) => delete state[key]);
};

export const setAttachment = (
    state: Draft<AttachmentsState>,
    { payload: { ID, attachment } }: PayloadAction<{ ID: string; attachment: WorkerDecryptionResult<Uint8Array> }>
) => {
    state[ID] = attachment;
};

import { Draft } from 'immer';
import { PayloadAction } from '@reduxjs/toolkit';
import { DecryptResultPmcrypto } from 'pmcrypto';
import { AttachmentsState } from './attachmentsTypes';

export const globalReset = (state: Draft<AttachmentsState>) => {
    Object.keys(state).forEach((key) => delete state[key]);
};

export const setAttachment = (
    state: Draft<AttachmentsState>,
    { payload: { ID, attachment } }: PayloadAction<{ ID: string; attachment: DecryptResultPmcrypto }>
) => {
    state[ID] = attachment;
};

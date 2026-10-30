import { createSelector } from '@reduxjs/toolkit';

import type { AttachmentsStoreState } from './attachmentsTypes';

const attachments = (state: AttachmentsStoreState) => state.attachments;

const currentID = (_: AttachmentsStoreState, { ID }: { ID: string }) => ID;

export const attachmentByID = createSelector(
    [attachments, currentID],
    (attachments, currentID) => attachments[currentID]
);

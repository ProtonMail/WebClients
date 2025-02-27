import { createSelector } from '@reduxjs/toolkit';

import type { MailState } from '../store';

const attachments = (state: MailState) => state.attachments;

const currentID = (_: MailState, { ID }: { ID: string }) => ID;

export const attachmentByID = createSelector(
    [attachments, currentID],
    (attachments, currentID) => attachments[currentID]
);

import { createSelector } from '@reduxjs/toolkit';

import type { MailState } from '../store';

const attachments = (state: MailState) => state.attachments;

const currentID = (_: MailState, { ID }: { ID: string }) => ID;
const identifier = (_: MailState, { identifier }: { identifier: string }) => identifier;

export const attachmentByID = createSelector(
    [attachments, currentID],
    (attachments, currentID) => attachments[currentID]
);

/**
 * Look up a stored attachment by its embedded-image CID or CLOC.
 * Used to recover the bytes of a deleted inline image when it is restored via undo,
 * so it can be re-uploaded while preserving the same CID.
 */
export const attachmentByCidOrCloc = createSelector([attachments, identifier], (attachments, identifier) =>
    Object.values(attachments).find((attachment) => attachment?.cid === identifier || attachment?.cloc === identifier)
);

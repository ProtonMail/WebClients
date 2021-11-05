import { createSelector } from 'reselect';
import { RootState } from '../store';

const attachments = (state: RootState) => state.attachments;

const currentID = (_: RootState, { ID }: { ID: string }) => ID;

export const attachmentByID = createSelector(
    [attachments, currentID],
    (attachments, currentID) => attachments[currentID]
);

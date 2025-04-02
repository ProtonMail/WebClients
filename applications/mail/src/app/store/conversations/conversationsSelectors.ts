import { createSelector } from '@reduxjs/toolkit';

import type { MailState } from '../store';

const conversations = (state: MailState) => state.conversations;

const currentID = (_: MailState, { ID }: { ID: string }) => ID;

export const conversationByID = createSelector(
    [conversations, currentID],
    (conversations, currentID) => conversations[currentID]
);

export const allConversations = createSelector([conversations], (conversations) => {
    return Object.values(conversations);
});

export const conversationsByIDs = createSelector(
    [conversations, (_, IDs: string[]) => IDs],
    (conversations, IDs: string[]) => IDs.map((ID) => conversations[ID])
);

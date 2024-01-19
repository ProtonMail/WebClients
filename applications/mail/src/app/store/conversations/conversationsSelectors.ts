import { createSelector } from 'reselect';

import { MailState } from '../store';

const conversations = (state: MailState) => state.conversations;

const currentID = (_: MailState, { ID }: { ID: string }) => ID;

export const conversationByID = createSelector(
    [conversations, currentID],
    (conversations, currentID) => conversations[currentID]
);

export const allConversations = createSelector([conversations], (conversations) => {
    return Object.values(conversations);
});

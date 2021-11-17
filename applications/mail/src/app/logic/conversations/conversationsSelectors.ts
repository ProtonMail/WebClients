import { createSelector } from 'reselect';
import { RootState } from '../store';

const conversations = (state: RootState) => state.conversations;

const currentID = (_: RootState, { ID }: { ID: string }) => ID;

export const conversationByID = createSelector(
    [conversations, currentID],
    (conversations, currentID) => conversations[currentID]
);

export const allConversations = createSelector([conversations], (conversations) => {
    return Object.values(conversations);
});

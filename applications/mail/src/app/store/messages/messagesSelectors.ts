import { createSelector } from '@reduxjs/toolkit';

import { DRAFT_ID_PREFIX } from '@proton/shared/lib/mail/messages';

import type { MailState } from '../store';

const messages = (state: MailState) => state.messages;

const currentID = (_: MailState, { ID }: { ID: string }) => ID;
const conversationID = (_: MailState, { ConversationID }: { ConversationID: string }) => ConversationID;

export const localID = createSelector([messages, currentID], (messages, currentID) => {
    const localID = [...Object.keys(messages)]
        .filter((key) => key?.startsWith(DRAFT_ID_PREFIX))
        .find((key) => messages[key]?.data?.ID === currentID);

    return localID || currentID;
});

export const messageByID = createSelector([messages, localID], (messages, localID) => messages[localID]);

export const messagesByConversationID = createSelector([messages, conversationID], (messages, conversationID) => {
    return Object.values(messages).filter((message) => message?.data?.ConversationID === conversationID);
});

export const allMessages = createSelector([messages], (messages) => {
    return Object.values(messages);
});

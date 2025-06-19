import { type Draft, type PayloadAction } from '@reduxjs/toolkit';

import { type ModelState } from '@proton/account';
import { safeDecreaseCount, safeIncreaseCount } from '@proton/redux-utilities';
import { type LabelCount } from '@proton/shared/lib/interfaces';
import { type Message } from '@proton/shared/lib/interfaces/mail/Message';

import { type Conversation } from 'proton-mail/models/conversation';
import { type Element } from 'proton-mail/models/element';

export const markConversationsAsUnread = (
    state: Draft<ModelState<LabelCount[]>>,
    action: PayloadAction<{ elements: Element[]; labelID: string }>
) => {
    // When we mark a conversation as unread, the latest message of this conversation is marked as unread.
    // This message must be part of the current label (labelID)
    const { elements, labelID } = action.payload;

    elements.forEach((selectedElement) => {
        const selectedConversation = selectedElement as Conversation;
        // The reason we apply changes only in the current label is because we cannot predict if the conversation is also marked as unread in other labels based on data received from the server.
        // This condition depends on messages order and labels attached to this conversation.
        const conversationLabel = selectedConversation?.Labels?.find((label) => label.ID === labelID);

        if (!!conversationLabel?.ContextNumUnread) {
            // Conversation is already unread, do nothing
            return;
        }

        if (conversationLabel?.ContextNumUnread === 0) {
            const conversationCounter = state.value?.find((counter) => counter.LabelID === labelID);

            if (conversationCounter) {
                conversationCounter.Unread = safeIncreaseCount(conversationCounter.Unread, 1);
            }
        }
    });
};

export const markConversationsAsRead = (
    state: Draft<ModelState<LabelCount[]>>,
    action: PayloadAction<{ elements: Element[]; labelID: string }>
) => {
    const { elements } = action.payload;

    elements.forEach((selectedElement) => {
        const selectedConversation = selectedElement as Conversation;
        selectedConversation?.Labels?.forEach((conversationLabel) => {
            if (conversationLabel?.ContextNumUnread === 0) {
                return;
            }

            const conversationCounter = state.value?.find((counter) => counter.LabelID === conversationLabel.ID);

            if (conversationCounter) {
                conversationCounter.Unread = safeDecreaseCount(conversationCounter.Unread, 1);
            }
        });
    });
};

export const markMessagesAsUnread = (
    state: Draft<ModelState<LabelCount[]>>,
    action: PayloadAction<{ elements: Element[]; labelID: string; conversations: Conversation[] }>
) => {
    const { conversations, elements, labelID } = action.payload;

    conversations.forEach((conversation) => {
        const messages = elements.filter(
            (element) =>
                (element as Message).ConversationID === conversation.ID &&
                (element as Message).LabelIDs.includes(labelID)
        );

        const conversationLabel = conversation.Labels?.find((label) => label.ID === labelID);

        if (conversationLabel?.ContextNumUnread === 0 && messages.length > 0) {
            const conversationCounter = state.value?.find((counter) => counter.LabelID === labelID);

            if (conversationCounter) {
                conversationCounter.Unread = safeIncreaseCount(conversationCounter.Unread, 1);
            }
        }
    });
};

export const markMessagesAsRead = (
    state: Draft<ModelState<LabelCount[]>>,
    action: PayloadAction<{ elements: Element[]; labelID: string; conversations: Conversation[] }>
) => {
    const { elements, labelID, conversations } = action.payload;

    conversations.forEach((conversation) => {
        // Count number of messages associated with the conversation
        const messages = elements.filter(
            (element) =>
                (element as Message).ConversationID === conversation.ID &&
                (element as Message).LabelIDs.includes(labelID)
        );
        const messagesCount = messages.length;

        const conversationLabel = conversation.Labels?.find((label) => label.ID === labelID);

        if (conversationLabel?.ContextNumUnread === messagesCount && messagesCount > 0) {
            const conversationCounter = state.value?.find((counter) => counter.LabelID === labelID);

            if (conversationCounter) {
                conversationCounter.Unread = safeDecreaseCount(conversationCounter.Unread, 1);
            }
        }
    });
};

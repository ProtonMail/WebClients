import type { PayloadAction } from '@reduxjs/toolkit';
import type { Draft } from 'immer';

import type { MessagesState } from '@proton/mail/store/messages/messagesTypes';
import type { Folder, Label } from '@proton/shared/lib/interfaces';
import type { Message, MessageMetadata } from '@proton/shared/lib/interfaces/mail/Message';
import { isDraft } from '@proton/shared/lib/mail/messages';

import type { Conversation } from 'proton-mail/models/conversation';
import { applyLabelToMessage, removeLabelFromMessage } from 'proton-mail/store/mailbox/locationHelpers';

import { isElementMessage } from '../../../helpers/elements';
import type { QueryParams, QueryResults, TaskRunningInfo } from '../../elements/elementsTypes';
import type { MailState } from '../../store';
import { localID as localIDSelector, messageByID, messagesByConversationID } from '../messagesSelectors';

/**
 * Only takes technical stuff from the updated message
 */
export const mergeSavedMessage = (messageSaved: Draft<Message>, messageReturned: Message) => {
    Object.assign(messageSaved, {
        ID: messageReturned.ID,
        Time: messageReturned.Time,
        ConversationID: messageReturned.ConversationID,
        LabelIDs: messageReturned.LabelIDs,
    });
};

export const getLocalID = (state: Draft<MessagesState>, ID: string) =>
    localIDSelector({ messages: state } as MailState, { ID });

export const getMessage = (state: Draft<MessagesState>, ID: string) =>
    messageByID({ messages: state } as MailState, { ID });

export const getMessagesByConversationID = (state: Draft<MessagesState>, ConversationID: string) =>
    messagesByConversationID({ messages: state } as MailState, { ConversationID });

export const updateFromElements = (
    state: Draft<MessagesState>,
    action: PayloadAction<
        {
            result: QueryResults;
            taskRunning: TaskRunningInfo;
        },
        string,
        {
            arg: QueryParams;
            requestId: string;
            requestStatus: 'fulfilled';
        },
        never
    >
) => {
    const { Elements } = action.payload.result;

    if (Elements && Elements.length) {
        Elements.forEach((element) => {
            if (isElementMessage(element)) {
                const messageState = getMessage(state, element.ID);

                if (messageState) {
                    /**
                     * For messages containing MimeAttachments, the NumAttachment value is updated on message load
                     * So if a message is opened in a location, we might update NumAttachments.
                     * Then, when switching location, we will receive again metadata from the API, which does not know about
                     * Mime attachments.
                     * Since the message is already loaded in the session, we will not compute this value again, and NumAttachments
                     * will be 0.
                     * We are relying on this value to display the attachment list, so in that case, the attachment would be hidden.
                     *
                     * To prevent this behaviour, we are reusing the NumAttachment value if it was already set.
                     */
                    const realNumAttachments = messageState.data?.NumAttachments
                        ? messageState.data?.NumAttachments
                        : element.NumAttachments || 0;

                    messageState.data = {
                        ...messageState.data,
                        ...(element as Message),
                        NumAttachments: realNumAttachments,
                    };
                }
            }
        });
    }
};

export const markMessagesAsReadPending = (
    state: Draft<MessagesState>,
    action: PayloadAction<undefined, string, { arg: { messages: MessageMetadata[]; labelID: string } }>
) => {
    const { messages } = action.meta.arg;

    messages.forEach((message) => {
        if (message.Unread === 0) {
            return;
        }

        const messageState = getMessage(state, message.ID);

        if (messageState) {
            if (messageState.data) {
                messageState.data.Unread = 0;
            }
        }
    });
};

export const markMessagesAsUnreadPending = (
    state: Draft<MessagesState>,
    action: PayloadAction<undefined, string, { arg: { messages: MessageMetadata[]; labelID: string } }>
) => {
    const { messages } = action.meta.arg;

    messages.forEach((message) => {
        if (message.Unread === 1) {
            return;
        }

        const messageState = getMessage(state, message.ID);

        if (messageState) {
            if (messageState.data) {
                messageState.data.Unread = 1;
            }
        }
    });
};

export const markConversationsAsReadPending = (
    state: Draft<MessagesState>,
    action: PayloadAction<undefined, string, { arg: { conversations: Conversation[]; labelID: string } }>
) => {
    const { conversations, labelID } = action.meta.arg;

    conversations.forEach((conversation) => {
        const conversationLabel = conversation?.Labels?.find((label) => label.ID === labelID);

        if (conversationLabel?.ContextNumUnread === 0) {
            return;
        }

        const messageStates = messagesByConversationID({ messages: state } as MailState, {
            ConversationID: conversation.ID,
        });

        // Update all messages attach to the same conversation in message state
        messageStates.forEach((messageState) => {
            if (messageState?.data) {
                messageState.data.Unread = 0;
            }
        });
    });
};

export const markConversationsAsUnreadPending = (
    state: Draft<MessagesState>,
    action: PayloadAction<undefined, string, { arg: { conversations: Conversation[]; labelID: string } }>
) => {
    const { conversations, labelID } = action.meta.arg;

    conversations.forEach((conversations) => {
        const conversationLabel = conversations?.Labels?.find((label) => label.ID === labelID);

        if (!!conversationLabel?.ContextNumUnread) {
            // Conversation is already unread, do nothing
            return;
        }

        // Get all messages attached to the conversation
        const messageStates = messagesByConversationID({ messages: state } as MailState, {
            ConversationID: conversations.ID,
        });

        // Mark the last message as unread
        const lastMessageState = messageStates
            .filter((messageState) => messageState?.data?.LabelIDs.includes(labelID) && !isDraft(messageState.data))
            .sort((a, b) => (b?.data?.Order || 0) - (a?.data?.Order || 0))[0];

        if (lastMessageState?.data) {
            lastMessageState.data.Unread = 1;
        }
    });
};

export const labelMessagesPending = (
    state: Draft<MessagesState>,
    action: PayloadAction<
        undefined,
        string,
        { arg: { messages: MessageMetadata[]; destinationLabelID: string; labels: Label[]; folders: Folder[] } }
    >
) => {
    const { messages, destinationLabelID, labels, folders } = action.meta.arg;

    messages.forEach((message) => {
        const messageState = getMessage(state, message.ID);

        if (!messageState || !messageState.data) {
            return;
        }

        applyLabelToMessage(messageState.data as MessageMetadata, destinationLabelID, folders, labels);
    });
};

export const unlabelMessagesPending = (
    state: Draft<MessagesState>,
    action: PayloadAction<
        undefined,
        string,
        { arg: { messages: MessageMetadata[]; destinationLabelID: string; labels: Label[] } }
    >
) => {
    const { messages, destinationLabelID, labels } = action.meta.arg;

    messages.forEach((message) => {
        const messageState = getMessage(state, message.ID);

        if (!messageState || !messageState.data) {
            return;
        }

        removeLabelFromMessage(messageState.data as MessageMetadata, destinationLabelID, labels);
    });
};

export const labelConversationsPending = (
    state: Draft<MessagesState>,
    action: PayloadAction<
        undefined,
        string,
        {
            arg: {
                conversations: Conversation[];
                destinationLabelID: string;
                sourceLabelID: string;
                labels: Label[];
                folders: Folder[];
            };
        }
    >
) => {
    const { conversations, destinationLabelID, labels, folders } = action.meta.arg;

    conversations.forEach((conversation) => {
        const messageStates = getMessagesByConversationID(state, conversation.ID);

        if (!messageStates) {
            return;
        }

        messageStates.forEach((messageState) => {
            if (messageState?.data) {
                applyLabelToMessage(messageState.data as Message, destinationLabelID, folders, labels);
            }
        });
    });
};

export const unlabelConversationsPending = (
    state: Draft<MessagesState>,
    action: PayloadAction<
        undefined,
        string,
        { arg: { conversations: Conversation[]; destinationLabelID: string; labels: Label[] } }
    >
) => {
    const { conversations, destinationLabelID, labels } = action.meta.arg;

    conversations.forEach((conversation) => {
        const messageStates = getMessagesByConversationID(state, conversation.ID);

        if (!messageStates) {
            return;
        }

        messageStates.forEach((messageState) => {
            if (messageState?.data) {
                removeLabelFromMessage(messageState.data as Message, destinationLabelID, labels);
            }
        });
    });
};

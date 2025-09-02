import type { Draft, PayloadAction } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account';
import { safeDecreaseCount, safeIncreaseCount } from '@proton/redux-utilities';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Folder, Label } from '@proton/shared/lib/interfaces';
import type { LabelCount } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import type { Conversation } from 'proton-mail/models/conversation';
import type { Element } from 'proton-mail/models/element';

import { getContextNumMessages, getContextNumUnread } from '../../helpers/conversation';
import {
    isCategoryLabel,
    isCustomFolder,
    isCustomLabel,
    isSystemFolder,
    isSystemLabel,
    isUnmodifiableByUser,
} from '../../helpers/location';

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

export const labelMessagesPending = (
    state: Draft<ModelState<LabelCount[]>>,
    action: PayloadAction<{
        elements: Message[];
        destinationLabelID: string;
        conversations: Conversation[];
        labels: Label[];
        folders: Folder[];
    }>
) => {
    const { elements, conversations, destinationLabelID, labels, folders } = action.payload;
    const conversationCounterTarget = state.value?.find((counter) => counter.LabelID === destinationLabelID);

    if (!conversationCounterTarget) {
        return;
    }

    conversations.forEach((conversation) => {
        const messagesFromConversation = elements.filter(
            (element) => (element as Message).ConversationID === conversation.ID
        );
        const unreadMessagesFromConversation = messagesFromConversation.filter(
            (element) => (element as Message).Unread
        );

        // Decrease
        conversation.Labels?.forEach((label) => {
            const labelID = label.ID;
            const conversationCounter = state.value?.find((counter) => counter.LabelID === label.ID);

            if (!conversationCounter) {
                return;
            }

            const messagesFromConversationInLabel = messagesFromConversation.filter((element) =>
                (element as Message).LabelIDs.includes(label.ID)
            );
            const unreadMessagesFromConversationInLabel = unreadMessagesFromConversation.filter((element) =>
                (element as Message).LabelIDs.includes(label.ID)
            );

            // Do not decrease counters if moving to a custom label, STARRED, or a category
            if (
                isCustomLabel(destinationLabelID, labels) ||
                isSystemLabel(destinationLabelID) ||
                isUnmodifiableByUser(destinationLabelID, labels, folders)
            ) {
                return;
            }

            // If target is a category, only decrease counters in old category
            if (isCategoryLabel(destinationLabelID)) {
                if (isCategoryLabel(destinationLabelID) && isCategoryLabel(labelID) && destinationLabelID !== labelID) {
                    if (messagesFromConversationInLabel.length === getContextNumMessages(conversation, label.ID)) {
                        conversationCounter.Total = safeDecreaseCount(conversationCounter.Total, 1);
                    }

                    if (
                        unreadMessagesFromConversationInLabel.length === getContextNumUnread(conversation, label.ID) &&
                        unreadMessagesFromConversationInLabel.length > 0
                    ) {
                        conversationCounter.Unread = safeDecreaseCount(conversationCounter.Unread, 1);
                    }
                }
                return;
            }

            if (destinationLabelID === MAILBOX_LABEL_IDS.TRASH || destinationLabelID === MAILBOX_LABEL_IDS.SPAM) {
                // Decrease ALMOST_ALL_MAIL and custom labels counts since items are no longer visible there
                if (labelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL) {
                    if (messagesFromConversationInLabel.length === getContextNumMessages(conversation, label.ID)) {
                        conversationCounter.Total = safeDecreaseCount(conversationCounter.Total, 1);
                    }

                    if (
                        unreadMessagesFromConversationInLabel.length === getContextNumUnread(conversation, label.ID) &&
                        unreadMessagesFromConversationInLabel.length > 0
                    ) {
                        conversationCounter.Unread = safeDecreaseCount(conversationCounter.Unread, 1);
                    }
                    return;
                }

                // Do not updated unmodifiable labels. However unread needs to be updated when moving to trash
                if (isUnmodifiableByUser(labelID, labels, folders)) {
                    if (
                        destinationLabelID === MAILBOX_LABEL_IDS.TRASH &&
                        unreadMessagesFromConversationInLabel.length === getContextNumUnread(conversation, label.ID) &&
                        unreadMessagesFromConversationInLabel.length > 0
                    ) {
                        conversationCounter.Unread = safeDecreaseCount(conversationCounter.Unread, 1);
                    }
                    return;
                }
                // Decrease STARRED and custom labels counts since items are removed
                if (isCustomLabel(labelID, labels) || isSystemLabel(labelID)) {
                    if (messagesFromConversationInLabel.length === getContextNumMessages(conversation, label.ID)) {
                        conversationCounter.Total = safeDecreaseCount(conversationCounter.Total, 1);
                    }

                    if (
                        unreadMessagesFromConversationInLabel.length === getContextNumUnread(conversation, label.ID) &&
                        unreadMessagesFromConversationInLabel.length > 0
                    ) {
                        conversationCounter.Unread = safeDecreaseCount(conversationCounter.Unread, 1);
                    }
                    return;
                }
            }

            // Do not update labels, categories and unmodifiable counters
            if (
                isCustomLabel(labelID, labels) ||
                isSystemLabel(labelID) ||
                isCategoryLabel(labelID) ||
                isUnmodifiableByUser(labelID, labels, folders)
            ) {
                return;
            }

            const messageFolderID = messagesFromConversation[0].LabelIDs.find((labelID) => {
                if (isSystemFolder(labelID) || isCustomFolder(labelID, folders)) {
                    return labelID;
                }
            });
            // Do nothing if is not the folder in which the message was located
            if (labelID !== messageFolderID) {
                return;
            }

            // Else decrease count
            if (messagesFromConversationInLabel.length === getContextNumMessages(conversation, labelID)) {
                conversationCounter.Total = safeDecreaseCount(conversationCounter.Total, 1);
            }

            if (
                unreadMessagesFromConversationInLabel.length === getContextNumUnread(conversation, labelID) &&
                unreadMessagesFromConversationInLabel.length > 0
            ) {
                conversationCounter.Unread = safeDecreaseCount(conversationCounter.Unread, 1);
            }

            const almostAllMailMessageCountState = state.value?.find(
                (counter) => counter.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL
            );
            if (
                (messageFolderID === MAILBOX_LABEL_IDS.TRASH || messageFolderID === MAILBOX_LABEL_IDS.SPAM) &&
                destinationLabelID !== MAILBOX_LABEL_IDS.TRASH &&
                destinationLabelID !== MAILBOX_LABEL_IDS.SPAM &&
                almostAllMailMessageCountState
            ) {
                if (getContextNumMessages(conversation, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL) === 0) {
                    almostAllMailMessageCountState.Total = safeIncreaseCount(almostAllMailMessageCountState.Total, 1);
                }

                if (
                    getContextNumUnread(conversation, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL) === 0 &&
                    unreadMessagesFromConversationInLabel.length > 0
                ) {
                    almostAllMailMessageCountState.Unread = safeIncreaseCount(almostAllMailMessageCountState.Unread, 1);
                }
            }
        });

        // Increase
        if (getContextNumMessages(conversation, destinationLabelID) === 0) {
            if (conversationCounterTarget) {
                conversationCounterTarget.Total = safeIncreaseCount(conversationCounterTarget.Total, 1);
            }
        }

        if (
            getContextNumUnread(conversation, destinationLabelID) === 0 &&
            unreadMessagesFromConversation.length > 0 &&
            destinationLabelID !== MAILBOX_LABEL_IDS.TRASH
        ) {
            if (conversationCounterTarget) {
                conversationCounterTarget.Unread = safeIncreaseCount(conversationCounterTarget.Unread, 1);
            }
        }
    });
};

export const labelConversationsPending = (
    state: Draft<ModelState<LabelCount[]>>,
    action: PayloadAction<{
        conversations: Conversation[];
        destinationLabelID: string;
        sourceLabelID: string;
        labels: Label[];
        folders: Folder[];
    }>
) => {
    const { conversations, destinationLabelID, labels, folders } = action.payload;

    conversations.forEach((conversation) => {
        const numUnreadMessagesInConversation = conversation.NumUnread || 0;

        // DECREASE count in old locations
        conversation.Labels?.forEach((label) => {
            const labelID = label.ID;
            const messageCountState = state.value?.find((counter) => counter.LabelID === labelID);

            const hasUnreadInLabel = getContextNumUnread(conversation, labelID) > 0;

            if (!messageCountState) {
                return;
            }

            // If the label cannot be updated, do not update counters
            if (isUnmodifiableByUser(labelID, labels, folders)) {
                return;
            }

            if (isSystemLabel(labelID) || isCustomLabel(labelID, labels)) {
                // If moving to TRASH or SPAM, labels are removed
                if (destinationLabelID === MAILBOX_LABEL_IDS.TRASH || destinationLabelID === MAILBOX_LABEL_IDS.SPAM) {
                    messageCountState.Total = safeDecreaseCount(messageCountState?.Total, 1);

                    if (hasUnreadInLabel) {
                        messageCountState.Unread = safeDecreaseCount(messageCountState?.Unread, 1);
                    }
                }

                // Else do not update counters
                return;
            }

            // When changing the category, remove the messages from the old category
            if (isCategoryLabel(labelID) && isCategoryLabel(destinationLabelID) && destinationLabelID !== labelID) {
                messageCountState.Total = safeDecreaseCount(messageCountState?.Total, 1);
                if (hasUnreadInLabel) {
                    messageCountState.Unread = safeDecreaseCount(
                        messageCountState?.Unread,
                        getContextNumUnread(conversation, labelID)
                    );
                }
                return;
            }

            // Do not update counters when moving to STARRED, custom folders or a category
            if (
                isCustomLabel(destinationLabelID, labels) ||
                isSystemLabel(destinationLabelID) ||
                isCategoryLabel(destinationLabelID)
            ) {
                return;
            }

            // Do not update category
            if (isCategoryLabel(labelID)) {
                return;
            }

            // Remove the conversation messages from all locations (except the destination)
            if (destinationLabelID !== labelID) {
                messageCountState.Total = safeDecreaseCount(messageCountState?.Total, 1);
                if (hasUnreadInLabel) {
                    messageCountState.Unread = safeDecreaseCount(
                        messageCountState?.Unread,
                        getContextNumUnread(conversation, labelID)
                    );
                }

                // If items are moving out from TRASH or SPAM, we need to add them to ALMOST_ALL_MAIL count
                const almostAllMailCountState = state.value?.find(
                    (counter) => counter.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL
                );
                if (
                    (labelID === MAILBOX_LABEL_IDS.TRASH || labelID === MAILBOX_LABEL_IDS.SPAM) &&
                    destinationLabelID !== MAILBOX_LABEL_IDS.TRASH &&
                    destinationLabelID !== MAILBOX_LABEL_IDS.SPAM &&
                    almostAllMailCountState
                ) {
                    if (getContextNumMessages(conversation, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL) === 0) {
                        almostAllMailCountState.Total = safeIncreaseCount(almostAllMailCountState?.Total, 1);
                    }

                    if (
                        hasUnreadInLabel &&
                        getContextNumUnread(conversation, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL) === 0
                    ) {
                        almostAllMailCountState.Unread = safeIncreaseCount(
                            almostAllMailCountState?.Unread,
                            getContextNumUnread(conversation, labelID)
                        );
                    }
                }

                return;
            }
        });

        // Elements are removed from ALMOST_ALL_MAIL
        const almostAllMailMessageCountState = state.value?.find(
            (counter) => counter.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL
        );
        if (
            (destinationLabelID === MAILBOX_LABEL_IDS.TRASH || destinationLabelID === MAILBOX_LABEL_IDS.SPAM) &&
            almostAllMailMessageCountState
        ) {
            almostAllMailMessageCountState.Total = safeDecreaseCount(almostAllMailMessageCountState?.Total, 1);

            if (numUnreadMessagesInConversation > 0) {
                almostAllMailMessageCountState.Unread = safeDecreaseCount(almostAllMailMessageCountState?.Unread, 1);
            }
        }

        // Additionally, ALL_MAIL unread count needs to be reduced if some messages were unread
        const allMailMessageCountState = state.value?.find((counter) => counter.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL);
        if (
            destinationLabelID === MAILBOX_LABEL_IDS.TRASH &&
            numUnreadMessagesInConversation > 0 &&
            allMailMessageCountState
        ) {
            allMailMessageCountState.Unread = safeDecreaseCount(allMailMessageCountState?.Unread, 1);
        }

        // INCREASE count in destination locations
        const targetMessageCountState = state.value?.find((counter) => counter.LabelID === destinationLabelID);

        if (!targetMessageCountState) {
            return;
        }

        const numMessagesInInbox = getContextNumMessages(conversation, MAILBOX_LABEL_IDS.INBOX);
        const numMessagesInAllSent = getContextNumMessages(conversation, MAILBOX_LABEL_IDS.ALL_SENT);
        const numMessagesInSent = getContextNumMessages(conversation, MAILBOX_LABEL_IDS.SENT);
        const numMessagesInAllDrafts = getContextNumMessages(conversation, MAILBOX_LABEL_IDS.ALL_DRAFTS);
        const numMessagesInDrafts = getContextNumMessages(conversation, MAILBOX_LABEL_IDS.DRAFTS);
        const numMessagesInTarget = getContextNumMessages(conversation, destinationLabelID);
        const numUnreadMessagesInInbox = getContextNumUnread(conversation, MAILBOX_LABEL_IDS.INBOX);
        const numUnreadMessagesInAllSent = getContextNumUnread(conversation, MAILBOX_LABEL_IDS.ALL_SENT);
        const numUnreadMessagesInSent = getContextNumUnread(conversation, MAILBOX_LABEL_IDS.SENT);
        const numUnreadMessagesInAllDrafts = getContextNumUnread(conversation, MAILBOX_LABEL_IDS.ALL_DRAFTS);
        const numUnreadMessagesInDrafts = getContextNumUnread(conversation, MAILBOX_LABEL_IDS.DRAFTS);
        const numUnreadMessagesInTarget = getContextNumUnread(conversation, destinationLabelID);

        const hasUnreadReceivedMessage =
            numUnreadMessagesInConversation - numMessagesInAllDrafts - numMessagesInAllSent > 0;

        if (
            destinationLabelID === MAILBOX_LABEL_IDS.INBOX ||
            destinationLabelID === MAILBOX_LABEL_IDS.SENT ||
            destinationLabelID === MAILBOX_LABEL_IDS.DRAFTS
        ) {
            // Move missing received messages in INBOX
            const inboxMessageCountState = state.value?.find((counter) => counter.LabelID === MAILBOX_LABEL_IDS.INBOX);

            if (inboxMessageCountState) {
                if (numMessagesInInbox === 0) {
                    inboxMessageCountState.Total = safeIncreaseCount(inboxMessageCountState.Total, 1);
                }

                if (numUnreadMessagesInInbox === 0 && hasUnreadReceivedMessage) {
                    inboxMessageCountState.Unread = safeIncreaseCount(inboxMessageCountState.Unread, 1);
                }
            }

            // Move all sent messages to SENT
            const sentMessageCountState = state.value?.find((counter) => counter.LabelID === MAILBOX_LABEL_IDS.SENT);

            if (sentMessageCountState && numMessagesInAllSent > numMessagesInSent) {
                if (numMessagesInSent === 0) {
                    sentMessageCountState.Total = safeIncreaseCount(sentMessageCountState.Total, 1);
                }

                if (numUnreadMessagesInSent === 0 && numUnreadMessagesInAllSent > 0) {
                    sentMessageCountState.Unread = safeIncreaseCount(sentMessageCountState.Unread, 1);
                }
            }

            // Move all drafts messages to DRAFTS
            const draftsMessageCountState = state.value?.find(
                (counter) => counter.LabelID === MAILBOX_LABEL_IDS.DRAFTS
            );

            if (draftsMessageCountState && numMessagesInAllDrafts > numMessagesInDrafts) {
                if (numMessagesInDrafts === 0) {
                    draftsMessageCountState.Total = safeIncreaseCount(draftsMessageCountState.Total, 1);
                }

                if (numUnreadMessagesInDrafts === 0 && numUnreadMessagesInAllDrafts > 0) {
                    draftsMessageCountState.Unread = safeIncreaseCount(draftsMessageCountState.Unread, 1);
                }
            }
        } else if (isCategoryLabel(destinationLabelID)) {
            const numMessagesInCategory = getContextNumMessages(conversation, destinationLabelID);
            const numUnreadMessagesInCategory = getContextNumUnread(conversation, destinationLabelID);

            if (numMessagesInCategory === 0) {
                targetMessageCountState.Total = safeIncreaseCount(targetMessageCountState.Total, 1);
            }

            if (numUnreadMessagesInCategory === 0 && hasUnreadReceivedMessage) {
                targetMessageCountState.Unread = safeIncreaseCount(targetMessageCountState.Unread, 1);
            }
        } else {
            if (numMessagesInTarget === 0) {
                targetMessageCountState.Total = safeIncreaseCount(targetMessageCountState.Total, 1);
            }
            if (
                numUnreadMessagesInTarget === 0 &&
                numUnreadMessagesInConversation > 0 &&
                destinationLabelID !== MAILBOX_LABEL_IDS.TRASH
            ) {
                targetMessageCountState.Unread = safeIncreaseCount(targetMessageCountState.Unread, 1);
            }
        }
    });
};

export const unlabelConversationsPending = (
    state: Draft<ModelState<LabelCount[]>>,
    action: PayloadAction<{ conversations: Conversation[]; destinationLabelID: string; labels: Label[] }>
) => {
    const { conversations, destinationLabelID, labels } = action.payload;
    const conversationCounter = state.value?.find((counter) => counter.LabelID === destinationLabelID);
    const isLabel = isCustomLabel(destinationLabelID, labels) || destinationLabelID === MAILBOX_LABEL_IDS.STARRED;

    if (!isLabel) {
        return;
    }

    if (!conversationCounter) {
        return;
    }

    conversations.forEach((conversation) => {
        conversationCounter.Total = safeDecreaseCount(conversationCounter.Total, 1);

        if (getContextNumUnread(conversation, destinationLabelID) > 0) {
            conversationCounter.Unread = safeDecreaseCount(conversationCounter.Unread, 1);
        }
    });
};

export const unlabelMessagesPending = (
    state: Draft<ModelState<LabelCount[]>>,
    action: PayloadAction<{
        elements: Message[];
        conversations: Conversation[];
        destinationLabelID: string;
        labels: Label[];
    }>
) => {
    const { elements, conversations, destinationLabelID, labels } = action.payload;
    const isLabel = isCustomLabel(destinationLabelID, labels) || destinationLabelID === MAILBOX_LABEL_IDS.STARRED;

    if (!isLabel) {
        return;
    }

    const conversationCounter = state.value?.find((counter) => counter.LabelID === destinationLabelID);

    if (!conversationCounter) {
        return;
    }

    conversations.forEach((conversation) => {
        const messagesFromConversation = elements.filter(
            (element) => (element as Message).ConversationID === conversation.ID
        );
        const unreadMessagesFromConversation = messagesFromConversation.filter(
            (element) => (element as Message).Unread
        );
        const messagesFromConversationInLabel = messagesFromConversation.filter((element) =>
            (element as Message).LabelIDs.includes(destinationLabelID)
        );
        const unreadMessagesFromConversationInLabel = unreadMessagesFromConversation.filter((element) =>
            (element as Message).LabelIDs.includes(destinationLabelID)
        );
        const conversationLabel = conversation.Labels?.find((label) => label.ID === destinationLabelID);

        if (!conversationLabel) {
            return;
        }

        if (messagesFromConversationInLabel.length === getContextNumMessages(conversation, destinationLabelID)) {
            conversationCounter.Total = safeDecreaseCount(conversationCounter.Total, 1);
        }

        if (unreadMessagesFromConversationInLabel.length === getContextNumUnread(conversation, destinationLabelID)) {
            conversationCounter.Unread = safeDecreaseCount(conversationCounter.Unread, 1);
        }
    });
};

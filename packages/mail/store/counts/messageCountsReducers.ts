import type { Draft, PayloadAction } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account';
import {
    isCategoryLabel,
    isCustomFolder,
    isCustomLabel,
    isSystemFolder,
    isSystemLabel,
    isUnmodifiableByUser,
} from '@proton/mail/helpers/location';
import { safeDecreaseCount, safeIncreaseCount } from '@proton/redux-utilities';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Folder, Label, LabelCount } from '@proton/shared/lib/interfaces';
import type { Message, MessageMetadata } from '@proton/shared/lib/interfaces/mail/Message';

import type { Conversation } from 'proton-mail/models/conversation';
import type { Element } from 'proton-mail/models/element';

import { getContextNumMessages, getContextNumUnread } from '../../helpers/conversation';

export const markMessagesAsRead = (
    state: Draft<ModelState<LabelCount[]>>,
    action: PayloadAction<{
        elements: Element[];
        labelID: string;
    }>
) => {
    const { elements } = action.payload;

    elements.forEach((selectedElement) => {
        const selectedMessage = selectedElement as Message;

        if (selectedMessage.Unread === 0) {
            return;
        }

        selectedMessage.LabelIDs.forEach((selectedLabelID) => {
            const updatedMessageCounter = state.value?.find((counter) => counter.LabelID === selectedLabelID);

            if (updatedMessageCounter) {
                updatedMessageCounter.Unread = safeDecreaseCount(updatedMessageCounter.Unread, 1);
            }
        });
    });
};

export const markMessagesAsUnread = (
    state: Draft<ModelState<LabelCount[]>>,
    action: PayloadAction<{
        elements: Element[];
        labelID: string;
    }>
) => {
    const { elements } = action.payload;

    elements.forEach((selectedElement) => {
        const selectedMessage = selectedElement as Message;

        if (selectedMessage.Unread === 1) {
            return;
        }

        selectedMessage.LabelIDs.forEach((selectedLabelID) => {
            const updatedMessageCounter = state.value?.find((counter) => counter.LabelID === selectedLabelID);

            if (updatedMessageCounter) {
                updatedMessageCounter.Unread = safeIncreaseCount(updatedMessageCounter.Unread, 1);
            }
        });
    });
};

export const labelMessages = (
    state: Draft<ModelState<LabelCount[]>>,
    action: PayloadAction<{
        elements: MessageMetadata[];
        sourceLabelID: string;
        destinationLabelID: string;
        labels: Label[];
        folders: Folder[];
    }>
) => {
    const { elements, destinationLabelID, folders, labels } = action.payload;
    const isTargetAFolder = isSystemFolder(destinationLabelID) || isCustomFolder(destinationLabelID, folders);
    const isTargetACategory = isCategoryLabel(destinationLabelID);

    elements.forEach((element) => {
        const selectedMessage = element;

        if (isTargetAFolder) {
            selectedMessage.LabelIDs.forEach((selectedLabelID) => {
                if (
                    isSystemFolder(selectedLabelID) ||
                    isCustomFolder(selectedLabelID, folders) ||
                    isCategoryLabel(selectedLabelID)
                ) {
                    const updatedMessageCounter = state.value?.find((counter) => counter.LabelID === selectedLabelID);

                    if (updatedMessageCounter) {
                        updatedMessageCounter.Total = safeDecreaseCount(updatedMessageCounter.Total, 1);

                        if (selectedMessage.Unread === 1) {
                            updatedMessageCounter.Unread = safeDecreaseCount(updatedMessageCounter.Unread, 1);
                        }
                    }
                }

                if (destinationLabelID === MAILBOX_LABEL_IDS.TRASH || destinationLabelID === MAILBOX_LABEL_IDS.SPAM) {
                    if (selectedLabelID === MAILBOX_LABEL_IDS.STARRED || isCustomLabel(selectedLabelID, labels)) {
                        const updatedMessageCounter = state.value?.find(
                            (counter) => counter.LabelID === selectedLabelID
                        );

                        if (updatedMessageCounter) {
                            updatedMessageCounter.Total = safeDecreaseCount(updatedMessageCounter.Total, 1);

                            if (selectedMessage.Unread === 1) {
                                updatedMessageCounter.Unread = safeDecreaseCount(updatedMessageCounter.Unread, 1);
                            }
                        }
                    }
                }
            });
        } else if (isTargetACategory) {
            selectedMessage.LabelIDs.forEach((selectedLabelID) => {
                const updatedMessageCounter = state.value?.find((counter) => counter.LabelID === selectedLabelID);

                if (updatedMessageCounter && isCategoryLabel(selectedLabelID)) {
                    updatedMessageCounter.Total = safeDecreaseCount(updatedMessageCounter.Total, 1);

                    if (selectedMessage.Unread === 1) {
                        updatedMessageCounter.Unread = safeDecreaseCount(updatedMessageCounter.Unread, 1);
                    }
                }
            });
        }

        // Elements are removed from ALMOST_ALL_MAIL
        const almostAllMailMessageCounter = state.value?.find(
            (counter) => counter.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL
        );
        if (
            (destinationLabelID === MAILBOX_LABEL_IDS.TRASH || destinationLabelID === MAILBOX_LABEL_IDS.SPAM) &&
            almostAllMailMessageCounter
        ) {
            almostAllMailMessageCounter.Total = safeDecreaseCount(almostAllMailMessageCounter.Total, 1);
            if (selectedMessage.Unread === 1) {
                almostAllMailMessageCounter.Unread = safeDecreaseCount(almostAllMailMessageCounter.Unread, 1);
            }
        }

        // Additionally, ALL_MAIL unread count needs to be reduced if the message was unread
        const allMailMessageCounter = state.value?.find((counter) => counter.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL);
        if (destinationLabelID === MAILBOX_LABEL_IDS.TRASH && selectedMessage.Unread === 1 && allMailMessageCounter) {
            allMailMessageCounter.Unread = safeDecreaseCount(allMailMessageCounter.Unread, 1);
        }

        const updatedMessageCounter = state.value?.find((counter) => counter.LabelID === destinationLabelID);

        if (updatedMessageCounter) {
            updatedMessageCounter.Total = safeIncreaseCount(updatedMessageCounter.Total, 1);

            if (
                selectedMessage.Unread === 1 &&
                destinationLabelID !== MAILBOX_LABEL_IDS.TRASH &&
                destinationLabelID !== MAILBOX_LABEL_IDS.SPAM
            ) {
                updatedMessageCounter.Unread = safeIncreaseCount(updatedMessageCounter.Unread, 1);
            }
        }
    });
};

export const unlabelMessages = (
    state: Draft<ModelState<LabelCount[]>>,
    action: PayloadAction<{
        elements: Element[];
        sourceLabelID: string;
        destinationLabelID: string;
        labels: Label[];
        folders: Folder[];
    }>
) => {
    const { elements, destinationLabelID, labels } = action.payload;
    const isLabel = isCustomLabel(destinationLabelID, labels) || destinationLabelID === MAILBOX_LABEL_IDS.STARRED;

    if (!isLabel) {
        return;
    }

    elements.forEach((element) => {
        const selectedMessage = element as Message;
        const messageCount = state.value?.find((counter) => counter.LabelID === destinationLabelID);

        if (messageCount) {
            messageCount.Total = safeDecreaseCount(messageCount.Total, 1);

            if (selectedMessage.Unread === 1) {
                messageCount.Unread = safeDecreaseCount(messageCount.Unread, 1);
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
        const numMessagesInConversation = conversation.NumMessages || 0;
        const numUnreadMessagesInConversation = conversation.NumUnread || 0;

        // DECREASE count in old locations
        conversation.Labels?.forEach((label) => {
            const messageCountState = state.value?.find((counter) => counter.LabelID === label.ID);

            if (!messageCountState) {
                return;
            }

            // If the label cannot be updated, do not update counters
            if (isUnmodifiableByUser(label.ID, labels, folders)) {
                return;
            }

            if (isSystemLabel(label.ID) || isCustomLabel(label.ID, labels)) {
                // If moving to TRASH or SPAM, labels are removed
                if (destinationLabelID === MAILBOX_LABEL_IDS.TRASH || destinationLabelID === MAILBOX_LABEL_IDS.SPAM) {
                    messageCountState.Total = safeDecreaseCount(
                        messageCountState?.Total,
                        getContextNumMessages(conversation, label.ID)
                    );
                    messageCountState.Unread = safeDecreaseCount(
                        messageCountState?.Unread,
                        getContextNumUnread(conversation, label.ID)
                    );
                }

                // Else do not update counters
                return;
            }

            // When changing the category, remove the messages from the old category
            if (isCategoryLabel(label.ID) && isCategoryLabel(destinationLabelID) && destinationLabelID !== label.ID) {
                messageCountState.Total = safeDecreaseCount(
                    messageCountState?.Total,
                    getContextNumMessages(conversation, label.ID)
                );
                messageCountState.Unread = safeDecreaseCount(
                    messageCountState?.Unread,
                    getContextNumUnread(conversation, label.ID)
                );
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

            // Remove the conversation messages from all locations (except the destination)
            if (destinationLabelID !== label.ID) {
                messageCountState.Total = safeDecreaseCount(
                    messageCountState?.Total,
                    getContextNumMessages(conversation, label.ID)
                );
                messageCountState.Unread = safeDecreaseCount(
                    messageCountState?.Unread,
                    getContextNumUnread(conversation, label.ID)
                );

                // If items are moving out from TRASH or SPAM, we need to add them to ALMOST_ALL_MAIL count
                const almostAllMailCountState = state.value?.find(
                    (counter) => counter.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL
                );
                if (
                    (label.ID === MAILBOX_LABEL_IDS.TRASH || label.ID === MAILBOX_LABEL_IDS.SPAM) &&
                    destinationLabelID !== MAILBOX_LABEL_IDS.TRASH &&
                    destinationLabelID !== MAILBOX_LABEL_IDS.SPAM &&
                    almostAllMailCountState
                ) {
                    almostAllMailCountState.Total = safeIncreaseCount(
                        almostAllMailCountState?.Total,
                        getContextNumMessages(conversation, label.ID)
                    );
                    almostAllMailCountState.Unread = safeIncreaseCount(
                        almostAllMailCountState?.Unread,
                        getContextNumUnread(conversation, label.ID)
                    );
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
            almostAllMailMessageCountState.Total = safeDecreaseCount(
                almostAllMailMessageCountState?.Total,
                getContextNumMessages(conversation, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL)
            );
            almostAllMailMessageCountState.Unread = safeDecreaseCount(
                almostAllMailMessageCountState?.Unread,
                getContextNumUnread(conversation, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL)
            );
        }

        // Additionally, ALL_MAIL unread count needs to be reduced if some messages were unread
        const allMailMessageCountState = state.value?.find((counter) => counter.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL);
        if (destinationLabelID === MAILBOX_LABEL_IDS.TRASH && allMailMessageCountState) {
            allMailMessageCountState.Unread = safeDecreaseCount(
                allMailMessageCountState?.Unread,
                numUnreadMessagesInConversation
            );
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
        const numUnreadMessagesInInbox = getContextNumUnread(conversation, MAILBOX_LABEL_IDS.INBOX);
        const numUnreadMessagesInAllSent = getContextNumUnread(conversation, MAILBOX_LABEL_IDS.ALL_SENT);
        const numUnreadMessagesInSent = getContextNumUnread(conversation, MAILBOX_LABEL_IDS.SENT);
        const numUnreadMessagesInAllDrafts = getContextNumUnread(conversation, MAILBOX_LABEL_IDS.ALL_DRAFTS);
        const numUnreadMessagesInDrafts = getContextNumUnread(conversation, MAILBOX_LABEL_IDS.DRAFTS);

        if (
            destinationLabelID === MAILBOX_LABEL_IDS.INBOX ||
            destinationLabelID === MAILBOX_LABEL_IDS.SENT ||
            destinationLabelID === MAILBOX_LABEL_IDS.DRAFTS
        ) {
            // Move missing received messages in INBOX
            const inboxMessageCountState = state.value?.find((counter) => counter.LabelID === MAILBOX_LABEL_IDS.INBOX);

            if (inboxMessageCountState) {
                const missingMessagesInInbox =
                    numMessagesInConversation - numMessagesInInbox - numMessagesInAllSent - numMessagesInAllDrafts;

                const missingUnreadMessagesInInbox =
                    numUnreadMessagesInConversation -
                    numUnreadMessagesInInbox -
                    numUnreadMessagesInAllSent -
                    numUnreadMessagesInAllDrafts;

                inboxMessageCountState.Total = safeIncreaseCount(inboxMessageCountState.Total, missingMessagesInInbox);
                inboxMessageCountState.Unread = safeIncreaseCount(
                    inboxMessageCountState.Unread,
                    missingUnreadMessagesInInbox
                );
            }

            // Move all sent messages to SENT
            const sentMessageCountState = state.value?.find((counter) => counter.LabelID === MAILBOX_LABEL_IDS.SENT);

            if (sentMessageCountState) {
                sentMessageCountState.Total = safeIncreaseCount(
                    sentMessageCountState.Total,
                    numMessagesInAllSent - numMessagesInSent
                );
                sentMessageCountState.Unread = safeIncreaseCount(
                    sentMessageCountState.Unread,
                    numUnreadMessagesInAllSent - numUnreadMessagesInSent
                );
            }

            // Move all drafts messages to DRAFTS
            const draftsMessageCountState = state.value?.find(
                (counter) => counter.LabelID === MAILBOX_LABEL_IDS.DRAFTS
            );

            if (draftsMessageCountState) {
                draftsMessageCountState.Total = safeIncreaseCount(
                    draftsMessageCountState.Total,
                    numMessagesInAllDrafts - numMessagesInDrafts
                );
                draftsMessageCountState.Unread = safeIncreaseCount(
                    draftsMessageCountState.Unread,
                    numUnreadMessagesInAllDrafts - numUnreadMessagesInDrafts
                );
            }
        } else if (isCategoryLabel(destinationLabelID)) {
            const numMessagesInCategory = getContextNumMessages(conversation, destinationLabelID);
            const numUnreadMessagesInCategory = getContextNumUnread(conversation, destinationLabelID);

            const missingMessagesInCategory = numMessagesInConversation - numMessagesInCategory;

            const missingUnreadMessagesInCategory = numUnreadMessagesInConversation - numUnreadMessagesInCategory;

            targetMessageCountState.Total = safeIncreaseCount(targetMessageCountState.Total, missingMessagesInCategory);
            targetMessageCountState.Unread = safeIncreaseCount(
                targetMessageCountState.Unread,
                missingUnreadMessagesInCategory
            );
        } else {
            targetMessageCountState.Total = safeIncreaseCount(
                targetMessageCountState.Total,
                numMessagesInConversation - getContextNumMessages(conversation, destinationLabelID)
            );

            if (destinationLabelID !== MAILBOX_LABEL_IDS.TRASH) {
                targetMessageCountState.Unread = safeIncreaseCount(
                    targetMessageCountState.Unread,
                    numUnreadMessagesInConversation - getContextNumUnread(conversation, destinationLabelID)
                );
            }
        }
    });
};

export const unlabelConversationsPending = (
    state: Draft<ModelState<LabelCount[]>>,
    action: PayloadAction<{ conversations: Conversation[]; destinationLabelID: string; labels: Label[] }>
) => {
    const { conversations, destinationLabelID, labels } = action.payload;
    const messageCounter = state.value?.find((counter) => counter.LabelID === destinationLabelID);
    const isLabel = isCustomLabel(destinationLabelID, labels) || destinationLabelID === MAILBOX_LABEL_IDS.STARRED;

    if (!isLabel) {
        return;
    }

    if (!messageCounter) {
        return;
    }

    conversations.forEach((conversation) => {
        const totalMessagesFromConversationInTargetLabel = getContextNumMessages(conversation, destinationLabelID);
        const unreadMessagesFromConversationInTargetLabel = getContextNumUnread(conversation, destinationLabelID);

        messageCounter.Total = safeDecreaseCount(messageCounter.Total, totalMessagesFromConversationInTargetLabel);

        if (unreadMessagesFromConversationInTargetLabel) {
            messageCounter.Unread = safeDecreaseCount(
                messageCounter.Unread,
                unreadMessagesFromConversationInTargetLabel
            );
        }
    });
};

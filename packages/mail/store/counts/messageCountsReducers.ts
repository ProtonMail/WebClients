import { type Draft, type PayloadAction } from '@reduxjs/toolkit';

import { type ModelState } from '@proton/account';
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
import type { Folder, Label } from '@proton/shared/lib/interfaces';
import { type LabelCount } from '@proton/shared/lib/interfaces';
import { type Message } from '@proton/shared/lib/interfaces/mail/Message';

import type { Conversation } from 'proton-mail/models/conversation';
import { type Element } from 'proton-mail/models/element';

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
        elements: Element[];
        sourceLabelID: string;
        targetLabelID: string;
        labels: Label[];
        folders: Folder[];
    }>
) => {
    const { elements, targetLabelID, folders, labels } = action.payload;
    const isTargetAFolder = isSystemFolder(targetLabelID) || isCustomFolder(targetLabelID, folders);
    const isTargetACategory = isCategoryLabel(targetLabelID);

    elements.forEach((element) => {
        const selectedMessage = element as Message;

        if (isTargetAFolder) {
            selectedMessage.LabelIDs.forEach((selectedLabelID) => {
                if (isSystemFolder(selectedLabelID) || isCustomFolder(selectedLabelID, folders)) {
                    const updatedMessageCounter = state.value?.find((counter) => counter.LabelID === selectedLabelID);

                    if (updatedMessageCounter) {
                        updatedMessageCounter.Total = safeDecreaseCount(updatedMessageCounter.Total, 1);

                        if (selectedMessage.Unread === 1) {
                            updatedMessageCounter.Unread = safeDecreaseCount(updatedMessageCounter.Unread, 1);
                        }
                    }
                }

                if (targetLabelID === MAILBOX_LABEL_IDS.TRASH || targetLabelID === MAILBOX_LABEL_IDS.SPAM) {
                    if (
                        selectedLabelID === MAILBOX_LABEL_IDS.STARRED ||
                        selectedLabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL ||
                        isCustomLabel(selectedLabelID, labels)
                    ) {
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

        const updatedMessageCounter = state.value?.find((counter) => counter.LabelID === targetLabelID);

        if (updatedMessageCounter) {
            updatedMessageCounter.Total = safeIncreaseCount(updatedMessageCounter.Total, 1);

            if (
                selectedMessage.Unread === 1 &&
                targetLabelID !== MAILBOX_LABEL_IDS.TRASH &&
                targetLabelID !== MAILBOX_LABEL_IDS.SPAM
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
        targetLabelID: string;
        labels: Label[];
        folders: Folder[];
    }>
) => {
    const { elements, targetLabelID, labels } = action.payload;
    const isLabel = isCustomLabel(targetLabelID, labels) || targetLabelID === MAILBOX_LABEL_IDS.STARRED;

    if (!isLabel) {
        return;
    }

    elements.forEach((element) => {
        const selectedMessage = element as Message;
        const messageCount = state.value?.find((counter) => counter.LabelID === targetLabelID);

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
        targetLabelID: string;
        sourceLabelID: string;
        labels: Label[];
        folders: Folder[];
    }>
) => {
    const { conversations, targetLabelID, labels, folders } = action.payload;

    conversations.forEach((conversation) => {
        const numMessagesInConversation = conversation.NumMessages || 0;
        const numUnreadMessagesInConversation = conversation.NumUnread || 0;

        // DECREASE count in old locations
        conversation.Labels?.forEach((label) => {
            const labelID = label.ID;
            const messageCountState = state.value?.find((counter) => counter.LabelID === labelID);

            if (!messageCountState) {
                return;
            }

            // If moving to TRASH or SPAM, no item should remain in ALMOST_ALL_MAIL
            if (
                (targetLabelID === MAILBOX_LABEL_IDS.TRASH || targetLabelID === MAILBOX_LABEL_IDS.SPAM) &&
                labelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL
            ) {
                messageCountState.Total = safeDecreaseCount(
                    messageCountState?.Total,
                    getContextNumMessages(conversation, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL)
                );
                messageCountState.Unread = safeDecreaseCount(
                    messageCountState?.Unread,
                    getContextNumUnread(conversation, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL)
                );
                return;
            }

            // If the label cannot be updated, do not update counters
            if (isUnmodifiableByUser(labelID, labels, folders)) {
                return;
            }

            if (isSystemLabel(labelID) || isCustomLabel(labelID, labels)) {
                // If moving to TRASH or SPAM, labels are removed
                if (targetLabelID === MAILBOX_LABEL_IDS.TRASH || targetLabelID === MAILBOX_LABEL_IDS.SPAM) {
                    messageCountState.Total = safeDecreaseCount(
                        messageCountState?.Total,
                        getContextNumMessages(conversation, labelID)
                    );
                    messageCountState.Unread = safeDecreaseCount(
                        messageCountState?.Unread,
                        getContextNumUnread(conversation, labelID)
                    );
                }

                // Else do not update counters
                return;
            }

            // When changing the category, remove the messages from the old category
            if (isCategoryLabel(labelID) && isCategoryLabel(targetLabelID) && targetLabelID !== labelID) {
                messageCountState.Total = safeDecreaseCount(
                    messageCountState?.Total,
                    getContextNumMessages(conversation, labelID)
                );
                messageCountState.Unread = safeDecreaseCount(
                    messageCountState?.Unread,
                    getContextNumUnread(conversation, labelID)
                );
                return;
            }

            // Remove the conversation messages from all locations (except the destination)
            if (targetLabelID !== labelID) {
                messageCountState.Total = safeDecreaseCount(
                    messageCountState?.Total,
                    getContextNumMessages(conversation, labelID)
                );
                messageCountState.Unread = safeDecreaseCount(
                    messageCountState?.Unread,
                    getContextNumUnread(conversation, labelID)
                );
                return;
            }
        });

        // INCREASE count in destination locations
        const targetMessageCountState = state.value?.find((counter) => counter.LabelID === targetLabelID);

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
            targetLabelID === MAILBOX_LABEL_IDS.INBOX ||
            targetLabelID === MAILBOX_LABEL_IDS.SENT ||
            targetLabelID === MAILBOX_LABEL_IDS.DRAFTS ||
            isCategoryLabel(targetLabelID)
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
            const draftsMessageCountState = state.value?.find((counter) => counter.LabelID === MAILBOX_LABEL_IDS.SENT);

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

            if (isCategoryLabel(targetLabelID)) {
                const numMessagesInCategory = getContextNumMessages(conversation, targetLabelID);
                const numUnreadMessagesInCategory = getContextNumUnread(conversation, targetLabelID);

                const missingMessagesInCategory =
                    numMessagesInConversation - numMessagesInCategory - numMessagesInAllSent - numMessagesInAllDrafts;

                const missingUnreadMessagesInCategory =
                    numUnreadMessagesInConversation -
                    numUnreadMessagesInCategory -
                    numUnreadMessagesInAllSent -
                    numUnreadMessagesInAllDrafts;

                targetMessageCountState.Total = safeIncreaseCount(
                    targetMessageCountState.Total,
                    missingMessagesInCategory
                );
                targetMessageCountState.Unread = safeIncreaseCount(
                    targetMessageCountState.Unread,
                    missingUnreadMessagesInCategory
                );
            }
        } else {
            targetMessageCountState.Total = safeIncreaseCount(
                targetMessageCountState.Total,
                numMessagesInConversation - getContextNumMessages(conversation, targetLabelID)
            );
            targetMessageCountState.Unread = safeIncreaseCount(
                targetMessageCountState.Unread,
                numUnreadMessagesInConversation - getContextNumUnread(conversation, targetLabelID)
            );
        }
    });
};

export const unlabelConversationsPending = (
    state: Draft<ModelState<LabelCount[]>>,
    action: PayloadAction<{ conversations: Conversation[]; targetLabelID: string; labels: Label[] }>
) => {
    const { conversations, targetLabelID } = action.payload;
    const messageCounter = state.value?.find((counter) => counter.LabelID === targetLabelID);

    if (!messageCounter) {
        return;
    }

    conversations.forEach((conversation) => {
        const totalMessagesFromConversationInTargetLabel = getContextNumMessages(conversation, targetLabelID);
        const unreadMessagesFromConversationInTargetLabel = getContextNumUnread(conversation, targetLabelID);

        messageCounter.Total = safeDecreaseCount(messageCounter.Total, totalMessagesFromConversationInTargetLabel);

        if (unreadMessagesFromConversationInTargetLabel) {
            messageCounter.Unread = safeDecreaseCount(
                messageCounter.Unread,
                unreadMessagesFromConversationInTargetLabel
            );
        }
    });
};

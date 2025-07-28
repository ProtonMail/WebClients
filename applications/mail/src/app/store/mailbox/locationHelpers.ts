import {
    isCategoryLabel,
    isCustomFolder,
    isCustomLabel,
    isSystemFolder,
    isSystemLabel,
    isUnmodifiableByUser,
} from '@proton/mail/helpers/location';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Folder, Label } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import type { Conversation } from 'proton-mail/models/conversation';

export const applyLabelToMessage = (
    message: Message,
    targetLabelID: string,
    folders: Folder[],
    labels: Label[]
): Message => {
    let labelIDsCopy = [...message.LabelIDs];
    const isTargetAFolder = isSystemFolder(targetLabelID) || isCustomFolder(targetLabelID, folders);
    const isTargetACategory = isCategoryLabel(targetLabelID);

    if (isTargetAFolder) {
        if (labelIDsCopy.includes(MAILBOX_LABEL_IDS.TRASH) || labelIDsCopy.includes(MAILBOX_LABEL_IDS.SPAM)) {
            // TODO [P3-120]: Remove auto-delete spam and trash expiration days
        }

        labelIDsCopy = labelIDsCopy.filter((labelID) => !isSystemFolder(labelID) && !isCustomFolder(labelID, folders));

        // Only for trash and spam, we need to remove almost all mail and starred labels
        if (targetLabelID === MAILBOX_LABEL_IDS.TRASH || targetLabelID === MAILBOX_LABEL_IDS.SPAM) {
            if (targetLabelID === MAILBOX_LABEL_IDS.TRASH) {
                message.Unread = 0; // Mark message as read when moving to trash
            }
            labelIDsCopy = labelIDsCopy.filter(
                (labelID) =>
                    labelID !== MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL && // Remove almost all mail
                    labelID !== MAILBOX_LABEL_IDS.STARRED && // Remove starred
                    !isCustomLabel(labelID, labels) // Remove custom labels
            );
        }
    } else if (isTargetACategory) {
        labelIDsCopy = labelIDsCopy.filter((labelID) => isCategoryLabel(labelID));
    }

    message.LabelIDs = [...labelIDsCopy, targetLabelID];

    return message;
};

export const removeLabelFromMessage = (message: Message, targetLabelID: string, labels: Label[]): Message => {
    const isTargetALabel = isSystemLabel(targetLabelID) || isCustomLabel(targetLabelID, labels);

    if (!isTargetALabel) {
        return message;
    }

    message.LabelIDs = message.LabelIDs.filter((labelID) => labelID !== targetLabelID);

    return message;
};

export const applyLabelToConversation = (
    conversation: Conversation,
    messages: Message[],
    sourceLabelID: string,
    targetLabelID: string,
    folders: Folder[],
    labels: Label[]
): Conversation => {
    let labelsCopy = [...(conversation.Labels || [])]; // Not a deep copy
    const isTargetAFolder = isSystemFolder(targetLabelID) || isCustomFolder(targetLabelID, folders);
    const isTargetACategory = isCategoryLabel(targetLabelID);
    const allMessagesLoaded = messages.length === conversation.NumMessages;

    if (isTargetAFolder) {
        const isTrashOrSpam = labelsCopy.some(
            (label) => label.ID === MAILBOX_LABEL_IDS.TRASH || label.ID === MAILBOX_LABEL_IDS.SPAM
        );

        if (isTrashOrSpam) {
            // TODO [P3-120]: Remove auto-delete spam and trash expiration days
        }

        labelsCopy = labelsCopy.filter((label) => !isSystemFolder(label.ID) && !isCustomFolder(label.ID, folders));

        if (!isUnmodifiableByUser(sourceLabelID)) {
            // Check with move engine
            // conversation.ContextNumMessages = conversation.NumMessages - conversation;
        }

        // Only for trash and spam, we need to remove almost all mail and starred labels
        if (targetLabelID === MAILBOX_LABEL_IDS.TRASH || targetLabelID === MAILBOX_LABEL_IDS.SPAM) {
            if (targetLabelID === MAILBOX_LABEL_IDS.TRASH) {
                conversation.NumUnread = 0;
            }

            labelsCopy = labelsCopy.filter(
                (label) =>
                    label.ID !== MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL && // Remove almost all mail
                    label.ID !== MAILBOX_LABEL_IDS.STARRED && // Remove starred
                    !isCustomLabel(label.ID, labels) // Remove custom labels
            );
        }
    } else if (isTargetACategory) {
        conversation.Labels = conversation.Labels?.filter((label) => isCategoryLabel(label.ID));
    }

    labelsCopy = [
        ...labelsCopy,
        {
            ID: targetLabelID,
            ContextNumMessages: conversation.NumMessages,
            ContextNumUnread: allMessagesLoaded ? conversation.NumUnread : undefined,
            ContextTime: allMessagesLoaded ? conversation.Time : undefined,
            ContextExpirationTime: allMessagesLoaded ? conversation.ExpirationTime : undefined,
            ContextSize: allMessagesLoaded ? conversation.Size : undefined,
            ContextNumAttachments: allMessagesLoaded ? conversation.NumAttachments : undefined,
        },
    ];

    conversation.Labels = [...labelsCopy];

    return conversation;
};

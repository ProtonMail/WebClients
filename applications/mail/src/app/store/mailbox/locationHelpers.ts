import {
    getContextNumAttachments,
    getContextNumMessages,
    getContextNumUnread,
    getContextValues,
} from '@proton/mail/helpers/conversation';
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
            if (targetLabelID !== MAILBOX_LABEL_IDS.TRASH && targetLabelID !== MAILBOX_LABEL_IDS.SPAM) {
                labelIDsCopy.push(MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            }
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
        labelIDsCopy = labelIDsCopy.filter((labelID) => !isCategoryLabel(labelID));
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

export const trashedNumUnread = (targetLabelID: string, numUnread: number): number => {
    if (targetLabelID === MAILBOX_LABEL_IDS.TRASH) {
        return 0;
    }
    return numUnread;
};

const updateAlmostAllMail = ({
    conversation,
    sourceLabelID,
    targetLabelID,
    labels,
}: {
    conversation: Conversation;
    targetLabelID: string;
    sourceLabelID: string;
    labels: Label[];
}) => {
    if (
        (sourceLabelID === MAILBOX_LABEL_IDS.TRASH || sourceLabelID === MAILBOX_LABEL_IDS.SPAM) &&
        targetLabelID !== MAILBOX_LABEL_IDS.TRASH &&
        targetLabelID !== MAILBOX_LABEL_IDS.SPAM &&
        !isSystemLabel(targetLabelID) &&
        !isCategoryLabel(targetLabelID) &&
        !isCustomLabel(targetLabelID, labels)
    ) {
        const almostAllMail = conversation.Labels?.find((label) => label.ID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);

        if (almostAllMail) {
            almostAllMail.ContextNumMessages =
                (almostAllMail.ContextNumMessages || 0) + getContextNumMessages(conversation, sourceLabelID);
            almostAllMail.ContextNumUnread =
                (almostAllMail.ContextNumUnread || 0) + getContextNumUnread(conversation, sourceLabelID);
            almostAllMail.ContextNumAttachments =
                (almostAllMail.ContextNumAttachments || 0) + getContextNumAttachments(conversation, sourceLabelID);
        } else {
            conversation.Labels?.push({
                ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                ...getContextValues(conversation, sourceLabelID),
            });
        }
    }
};

export const moveContextValues = (
    sourceLabelID: string,
    targetLabelID: string,
    conversation: Conversation,
    labels: Label[],
    folders: Folder[]
): { ContextNumMessages: number; ContextNumUnread: number; ContextNumAttachments: number } => {
    // All messages are moved, so the conversation should disappear from ALMOST_ALL_MAIL
    if (targetLabelID === MAILBOX_LABEL_IDS.TRASH && sourceLabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL) {
        return {
            ContextNumMessages: 0,
            ContextNumUnread: 0,
            ContextNumAttachments: 0,
        };
    }

    // All messages are moved, so the conversation should disappear from ALMOST_ALL_MAIL
    if (targetLabelID === MAILBOX_LABEL_IDS.SPAM && sourceLabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL) {
        return {
            ContextNumMessages: 0,
            ContextNumUnread: 0,
            ContextNumAttachments: 0,
        };
    }

    /**
     * Move to unmodifiable label (e.g. ALL_MAIL)
     * Messages should stay in the label, so the value should remain the same
     */
    if (isUnmodifiableByUser(sourceLabelID, labels, folders)) {
        return {
            ContextNumMessages: getContextNumMessages(conversation, sourceLabelID),
            ContextNumUnread: trashedNumUnread(targetLabelID, getContextNumUnread(conversation, sourceLabelID)),
            ContextNumAttachments: getContextNumAttachments(conversation, sourceLabelID),
        };
    }
    /**
     * Move to SCHEDULED
     * Messages should stay in the label, so the value should remain the same
     */
    if (sourceLabelID === MAILBOX_LABEL_IDS.SCHEDULED) {
        return {
            ContextNumMessages: getContextNumMessages(conversation, sourceLabelID),
            ContextNumUnread: trashedNumUnread(targetLabelID, getContextNumUnread(conversation, sourceLabelID)),
            ContextNumAttachments: getContextNumAttachments(conversation, sourceLabelID),
        };
    }

    /**
     * Move to INBOX
     */
    if (targetLabelID === MAILBOX_LABEL_IDS.INBOX) {
        // Update destination - all received messages are moved to INBOX
        if (sourceLabelID === MAILBOX_LABEL_IDS.INBOX) {
            return {
                ContextNumMessages:
                    (conversation.NumMessages || 0) -
                    getContextNumMessages(conversation, MAILBOX_LABEL_IDS.ALL_SENT) -
                    getContextNumMessages(conversation, MAILBOX_LABEL_IDS.ALL_DRAFTS),
                ContextNumUnread:
                    (conversation.NumUnread || 0) -
                    getContextNumUnread(conversation, MAILBOX_LABEL_IDS.ALL_SENT) -
                    getContextNumUnread(conversation, MAILBOX_LABEL_IDS.ALL_DRAFTS),
                ContextNumAttachments:
                    (conversation.NumAttachments || 0) -
                    getContextNumAttachments(conversation, MAILBOX_LABEL_IDS.ALL_SENT) -
                    getContextNumAttachments(conversation, MAILBOX_LABEL_IDS.ALL_DRAFTS),
            };
        }

        // Update other labels
        // System labels, custom labels and category should not change
        if (isSystemLabel(sourceLabelID) || isCustomLabel(sourceLabelID, labels) || isCategoryLabel(sourceLabelID)) {
            return getContextValues(conversation, sourceLabelID);
        }

        // All sent messages should end up in SENT
        if (sourceLabelID === MAILBOX_LABEL_IDS.SENT) {
            return getContextValues(conversation, MAILBOX_LABEL_IDS.ALL_SENT);
        }

        // All drafts messages should end up in DRAFTS
        if (sourceLabelID === MAILBOX_LABEL_IDS.DRAFTS) {
            return getContextValues(conversation, MAILBOX_LABEL_IDS.ALL_DRAFTS);
        }

        // When moving out from TRASH or SPAM, ALMOST_ALL_MAIL needs to be updated
        updateAlmostAllMail({ conversation, sourceLabelID, targetLabelID, labels });

        // Messages should be removed from other labels, so the value should be 0
        return {
            ContextNumMessages: 0,
            ContextNumUnread: 0,
            ContextNumAttachments: 0,
        };
    }

    /**
     * Move to CATEGORY
     */
    if (isCategoryLabel(targetLabelID)) {
        // Update destination - all received messages are moved to the category and to INBOX.
        if (isCategoryLabel(sourceLabelID) && targetLabelID === sourceLabelID) {
            return {
                ContextNumMessages:
                    (conversation.NumMessages || 0) -
                    getContextNumMessages(conversation, MAILBOX_LABEL_IDS.ALL_SENT) -
                    getContextNumMessages(conversation, MAILBOX_LABEL_IDS.ALL_DRAFTS),
                ContextNumUnread:
                    (conversation.NumUnread || 0) -
                    getContextNumUnread(conversation, MAILBOX_LABEL_IDS.ALL_SENT) -
                    getContextNumUnread(conversation, MAILBOX_LABEL_IDS.ALL_DRAFTS),
                ContextNumAttachments:
                    (conversation.NumAttachments || 0) -
                    getContextNumAttachments(conversation, MAILBOX_LABEL_IDS.ALL_SENT) -
                    getContextNumAttachments(conversation, MAILBOX_LABEL_IDS.ALL_DRAFTS),
            };
        }

        // Remove previous category
        if (isCategoryLabel(sourceLabelID)) {
            return {
                ContextNumMessages: 0,
                ContextNumUnread: 0,
                ContextNumAttachments: 0,
            };
        }

        // Else keep all items in their current locations
        return getContextValues(conversation, sourceLabelID);
    }

    /**
     * Move to SENT
     */
    if (targetLabelID === MAILBOX_LABEL_IDS.SENT) {
        // All sent messages should end up in SENT
        if (sourceLabelID === MAILBOX_LABEL_IDS.SENT) {
            return getContextValues(conversation, MAILBOX_LABEL_IDS.ALL_SENT);
        }

        // All drafts messages should end up in DRAFTS
        if (sourceLabelID === MAILBOX_LABEL_IDS.DRAFTS) {
            return getContextValues(conversation, MAILBOX_LABEL_IDS.ALL_DRAFTS);
        }

        // All received messages are moved to INBOX
        if (sourceLabelID === MAILBOX_LABEL_IDS.INBOX) {
            return {
                ContextNumMessages:
                    (conversation.NumMessages || 0) -
                    getContextNumMessages(conversation, MAILBOX_LABEL_IDS.ALL_SENT) -
                    getContextNumMessages(conversation, MAILBOX_LABEL_IDS.ALL_DRAFTS),
                ContextNumUnread:
                    (conversation.NumUnread || 0) -
                    getContextNumUnread(conversation, MAILBOX_LABEL_IDS.ALL_SENT) -
                    getContextNumUnread(conversation, MAILBOX_LABEL_IDS.ALL_DRAFTS),
                ContextNumAttachments:
                    (conversation.NumAttachments || 0) -
                    getContextNumAttachments(conversation, MAILBOX_LABEL_IDS.ALL_SENT) -
                    getContextNumAttachments(conversation, MAILBOX_LABEL_IDS.ALL_DRAFTS),
            };
        }

        // Custom labels, system labels and category should be kept
        if (isSystemLabel(sourceLabelID) || isCustomLabel(sourceLabelID, labels) || isCategoryLabel(sourceLabelID)) {
            return getContextValues(conversation, sourceLabelID);
        }

        // When moving out from TRASH or SPAM, ALMOST_ALL_MAIL needs to be updated
        updateAlmostAllMail({ conversation, sourceLabelID, targetLabelID, labels });

        // Messages should be removed from other labels, so the value should be 0
        return {
            ContextNumMessages: 0,
            ContextNumUnread: 0,
            ContextNumAttachments: 0,
        };
    }

    /**
     * Move to DRAFTS
     */
    if (targetLabelID === MAILBOX_LABEL_IDS.DRAFTS) {
        // All drafts messages should end up in DRAFTS
        if (sourceLabelID === MAILBOX_LABEL_IDS.DRAFTS) {
            return getContextValues(conversation, MAILBOX_LABEL_IDS.ALL_DRAFTS);
        }

        // All sent messages should end up in SENT
        if (sourceLabelID === MAILBOX_LABEL_IDS.SENT) {
            return getContextValues(conversation, MAILBOX_LABEL_IDS.ALL_SENT);
        }

        // All received messages are moved to INBOX
        if (sourceLabelID === MAILBOX_LABEL_IDS.INBOX) {
            return {
                ContextNumMessages:
                    (conversation.NumMessages || 0) -
                    getContextNumMessages(conversation, MAILBOX_LABEL_IDS.ALL_SENT) -
                    getContextNumMessages(conversation, MAILBOX_LABEL_IDS.ALL_DRAFTS),
                ContextNumUnread:
                    (conversation.NumUnread || 0) -
                    getContextNumUnread(conversation, MAILBOX_LABEL_IDS.ALL_SENT) -
                    getContextNumUnread(conversation, MAILBOX_LABEL_IDS.ALL_DRAFTS),
                ContextNumAttachments:
                    (conversation.NumAttachments || 0) -
                    getContextNumAttachments(conversation, MAILBOX_LABEL_IDS.ALL_SENT) -
                    getContextNumAttachments(conversation, MAILBOX_LABEL_IDS.ALL_DRAFTS),
            };
        }

        // Custom labels, system labels and category should be kept
        if (isSystemLabel(sourceLabelID) || isCustomLabel(sourceLabelID, labels) || isCategoryLabel(sourceLabelID)) {
            return getContextValues(conversation, sourceLabelID);
        }

        // When moving out from TRASH or SPAM, ALMOST_ALL_MAIL needs to be updated
        updateAlmostAllMail({ conversation, sourceLabelID, targetLabelID, labels });

        // Messages should be removed from other labels, so the value should be 0
        return {
            ContextNumMessages: 0,
            ContextNumUnread: 0,
            ContextNumAttachments: 0,
        };
    }

    /**
     * Move to a System Label or Custom Label
     * All messages should be moved to the label, while staying in their current location
     */
    if (isSystemLabel(targetLabelID) || isCustomLabel(targetLabelID, labels)) {
        if (targetLabelID === sourceLabelID) {
            return {
                ContextNumMessages: conversation.NumMessages || 0,
                ContextNumUnread: conversation.NumUnread || 0,
                ContextNumAttachments: conversation.NumAttachments || 0,
            };
        }

        return getContextValues(conversation, sourceLabelID);
    }

    /**
     * Default scenario
     * All messages should be moved to destination and removed from their current label
     */
    if (targetLabelID === sourceLabelID) {
        return {
            ContextNumMessages: conversation.NumMessages || 0,
            ContextNumUnread: trashedNumUnread(targetLabelID, conversation.NumUnread || 0),
            ContextNumAttachments: conversation.NumAttachments || 0,
        };
    }

    // When moving out from TRASH or SPAM, ALMOST_ALL_MAIL needs to be updated
    updateAlmostAllMail({ conversation, sourceLabelID, targetLabelID, labels });

    // Custom and system labels should be kept unless moving to TRASH or SPAM
    if (
        (isSystemLabel(sourceLabelID) || isCustomLabel(sourceLabelID, labels)) &&
        targetLabelID !== MAILBOX_LABEL_IDS.TRASH &&
        targetLabelID !== MAILBOX_LABEL_IDS.SPAM
    ) {
        return getContextValues(conversation, sourceLabelID);
    }

    // Category should be kept
    if (isCategoryLabel(sourceLabelID)) {
        return {
            ContextNumMessages: getContextNumMessages(conversation, sourceLabelID),
            ContextNumUnread: trashedNumUnread(targetLabelID, getContextNumUnread(conversation, sourceLabelID)),
            ContextNumAttachments: getContextNumAttachments(conversation, sourceLabelID),
        };
    }

    return {
        ContextNumMessages: 0,
        ContextNumUnread: 0,
        ContextNumAttachments: 0,
    };
};

export const moveNumUnread = (targetLabelID: string, conversation: Conversation): number => {
    // When moving to TRASH, all items should be marked as read. Otherwise, NumUnread should not change.
    if (targetLabelID === MAILBOX_LABEL_IDS.TRASH) {
        return 0;
    }

    return conversation.NumUnread || 0;
};

export const applyLabelToConversation = (
    conversation: Conversation,
    sourceLabelID: string,
    targetLabelID: string,
    labels: Label[],
    folders: Folder[]
): Conversation => {
    // When applying a label to a conversation, several attributes need to be updated:
    // - Conversation.NumUnread (if moving to TRASH)
    // - For each Conversation.Labels, we need to update their ContextNumMessages, ContextNumUnread and ContextNumAttachments
    // Other fields like ContextTime cannot be updated since we need to have all messages with their order.

    conversation.NumUnread = moveNumUnread(targetLabelID, conversation);

    conversation.Labels =
        conversation.Labels?.map((label) => {
            return {
                ...label,
                ...moveContextValues(label.ID, targetLabelID, conversation, labels, folders),
            };
        }) || [];

    // If the target label was not already present on the conversation labels, it needs to be added
    const targetLabel = conversation.Labels.find((label) => label.ID === targetLabelID);

    if (!targetLabel) {
        conversation.Labels.push({
            ID: targetLabelID,
            ...moveContextValues(targetLabelID, targetLabelID, conversation, labels, folders),
        });
    }

    // Additionally, if some messages are ending up on labels not present in the conversation, they need to be added
    const hasSentMessages = getContextNumMessages(conversation, MAILBOX_LABEL_IDS.SENT) > 0;
    const hasAllSentMessages = getContextNumMessages(conversation, MAILBOX_LABEL_IDS.ALL_SENT) > 0;
    const hasInboxMessages = getContextNumMessages(conversation, MAILBOX_LABEL_IDS.INBOX) > 0;
    const hasDraftsMessages = getContextNumMessages(conversation, MAILBOX_LABEL_IDS.DRAFTS) > 0;
    const hasAllDraftsMessages = getContextNumMessages(conversation, MAILBOX_LABEL_IDS.ALL_DRAFTS) > 0;
    const numReceivedMessages =
        (conversation.NumMessages || 0) -
        getContextNumMessages(conversation, MAILBOX_LABEL_IDS.ALL_SENT) -
        getContextNumMessages(conversation, MAILBOX_LABEL_IDS.ALL_DRAFTS);
    const hasReceivedMessages = numReceivedMessages > 0;
    const numUnreadReceivedMessages =
        (conversation.NumUnread || 0) -
        getContextNumUnread(conversation, MAILBOX_LABEL_IDS.ALL_SENT) -
        getContextNumUnread(conversation, MAILBOX_LABEL_IDS.ALL_DRAFTS);
    const numAttachmentsReceivedMessages =
        (conversation.NumAttachments || 0) -
        getContextNumAttachments(conversation, MAILBOX_LABEL_IDS.ALL_SENT) -
        getContextNumAttachments(conversation, MAILBOX_LABEL_IDS.ALL_DRAFTS);

    if (targetLabelID === MAILBOX_LABEL_IDS.INBOX) {
        // When moving to INBOX, all sent messages should end up in SENT
        if (!hasSentMessages && hasAllSentMessages) {
            conversation.Labels.push({
                ID: MAILBOX_LABEL_IDS.SENT,
                ...getContextValues(conversation, MAILBOX_LABEL_IDS.ALL_SENT),
            });
        }

        // When moving to INBOX, all drafts messages should end up in DRAFTS
        if (!hasDraftsMessages && hasAllDraftsMessages) {
            conversation.Labels.push({
                ID: MAILBOX_LABEL_IDS.DRAFTS,
                ...getContextValues(conversation, MAILBOX_LABEL_IDS.ALL_DRAFTS),
            });
        }
    }

    if (targetLabelID === MAILBOX_LABEL_IDS.SENT) {
        // When moving to SENT, all received messages should end up in INBOX
        if (!hasInboxMessages && hasReceivedMessages) {
            conversation.Labels.push({
                ID: MAILBOX_LABEL_IDS.INBOX,
                ContextNumMessages: numReceivedMessages,
                ContextNumUnread: numUnreadReceivedMessages,
                ContextNumAttachments: numAttachmentsReceivedMessages,
            });
        }

        // When moving to SENT, all drafts messages should end up in DRAFTS
        if (!hasDraftsMessages && hasAllDraftsMessages) {
            conversation.Labels.push({
                ID: MAILBOX_LABEL_IDS.DRAFTS,
                ...getContextValues(conversation, MAILBOX_LABEL_IDS.ALL_DRAFTS),
            });
        }
    }

    if (targetLabelID === MAILBOX_LABEL_IDS.DRAFTS) {
        // When moving to DRAFTS, all received messages should end up in INBOX
        if (!hasInboxMessages && hasReceivedMessages) {
            conversation.Labels.push({
                ID: MAILBOX_LABEL_IDS.INBOX,
                ContextNumMessages: numReceivedMessages,
                ContextNumUnread: numUnreadReceivedMessages,
                ContextNumAttachments: numAttachmentsReceivedMessages,
            });
        }

        // When moving to DRAFTS, all sent messages should end up in SENT
        if (!hasSentMessages && hasAllSentMessages) {
            conversation.Labels.push({
                ID: MAILBOX_LABEL_IDS.SENT,
                ...getContextValues(conversation, MAILBOX_LABEL_IDS.ALL_SENT),
            });
        }
    }

    // Empty labels can be removed
    conversation.Labels = conversation.Labels.filter((label) => {
        return (label.ContextNumMessages || 0) > 0;
    });

    return conversation;
};

export const removeLabelFromConversation = (
    conversation: Conversation,
    targetLabelID: string,
    labels: Label[]
): Conversation => {
    if (isSystemLabel(targetLabelID) || isCustomLabel(targetLabelID, labels)) {
        conversation.Labels =
            conversation.Labels?.filter((label) => {
                return label.ID !== targetLabelID;
            }) || [];
    }

    return conversation;
};

export const hasSentOrDraftMessages = (conversations: Conversation[]): boolean => {
    return conversations.some((conversation) =>
        conversation.Labels?.some(
            (label) => label.ID === MAILBOX_LABEL_IDS.SENT || label.ID === MAILBOX_LABEL_IDS.DRAFTS
        )
    );
};

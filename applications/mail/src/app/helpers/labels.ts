import type { FolderInfo } from '@proton/mail/store/labels/helpers';
import { getStandardFolders, labelIncludes } from '@proton/mail/store/labels/helpers';
import type { MessageWithOptionalBody } from '@proton/mail/store/messages/messagesTypes';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { toMap } from '@proton/shared/lib/helpers/object';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import type { Folder } from '@proton/shared/lib/interfaces/Folder';
import { SHOW_MOVED } from '@proton/shared/lib/mail/mailSettings';

import type { Conversation } from '../models/conversation';
import type { Element } from '../models/element';
import { getLabelIDs } from './elements';

const {
    INBOX,
    TRASH,
    SPAM,
    ARCHIVE,
    SENT,
    DRAFTS,
    ALL_SENT,
    ALL_DRAFTS,
    SCHEDULED,
    OUTBOX,
    STARRED,
    ALL_MAIL,
    SNOOZED,
    ALMOST_ALL_MAIL,
} = MAILBOX_LABEL_IDS;
const DEFAULT_FOLDERS = [INBOX, TRASH, SPAM, ARCHIVE, SENT, DRAFTS, SCHEDULED, OUTBOX];

export type LabelChanges = { [labelID: string]: boolean };

export const getCurrentFolders = (
    element: Element | undefined,
    labelID: string,
    customFoldersList: Folder[],
    mailSettings: MailSettings
): FolderInfo[] => {
    const { ShowMoved } = mailSettings;
    const labelIDs = Object.keys(getLabelIDs(element, labelID));
    const standardFolders = getStandardFolders();
    const customFolders = toMap(customFoldersList, 'ID');

    return labelIDs
        .filter((labelID) => {
            if ([SENT, ALL_SENT].includes(labelID as MAILBOX_LABEL_IDS)) {
                return (hasBit(ShowMoved, SHOW_MOVED.SENT) ? ALL_SENT : SENT) === labelID;
            }
            if ([DRAFTS, ALL_DRAFTS].includes(labelID as MAILBOX_LABEL_IDS)) {
                return (hasBit(ShowMoved, SHOW_MOVED.DRAFTS) ? ALL_DRAFTS : DRAFTS) === labelID;
            }
            // We don't want to show "All mail" folder in the details
            if ([ALL_MAIL, ALMOST_ALL_MAIL].includes(labelID as MAILBOX_LABEL_IDS)) {
                return false;
            }

            // We don't wait to show both the starred and empty start folder
            if (labelID === STARRED) {
                return false;
            }
            return true;
        })
        .filter((labelID) => standardFolders[labelID] || customFolders[labelID])
        .map((labelID) => {
            if (standardFolders[labelID]) {
                return standardFolders[labelID];
            }
            const folder = customFolders[labelID];
            return {
                icon: 'folder',
                name: folder?.Name,
                to: `/${folder?.ID}`,
                color: folder?.Color,
                parentID: folder?.ParentID,
            };
        });
};

export const getCurrentFolderID = (labelIDs: string[] = [], customFoldersList: Folder[] = []): string => {
    const allFolderIDs = [...DEFAULT_FOLDERS, ...customFoldersList.map(({ ID }) => ID)];
    return labelIDs.find((labelID) => allFolderIDs.includes(labelID)) || '';
};

export interface UnreadStatus {
    id: string;
    unread: number;
}

export const applyLabelChangesOnMessage = <T>(
    message: MessageWithOptionalBody & T,
    changes: LabelChanges,
    unreadStatuses?: UnreadStatus[]
): MessageWithOptionalBody & T => {
    const { LabelIDs: inputLabelIDs } = message;
    const LabelIDs = [...inputLabelIDs];

    Object.keys(changes).forEach((labelID) => {
        const index = LabelIDs.findIndex((existingLabelID) => existingLabelID === labelID);
        if (changes[labelID]) {
            if (index === -1) {
                LabelIDs.push(labelID);
            }
        } else if (index >= 0) {
            LabelIDs.splice(index, 1);
        }
    });

    if (unreadStatuses) {
        const elementUnreadStatus = unreadStatuses.find((element) => element.id === message.ID)?.unread;
        if (elementUnreadStatus) {
            return { ...message, LabelIDs, Unread: elementUnreadStatus };
        }
    }

    return { ...message, LabelIDs };
};

export const applyLabelChangesOnConversation = (
    conversation: Conversation,
    changes: LabelChanges,
    unreadStatuses?: UnreadStatus[]
): Conversation => {
    let Time = conversation.Time;

    const Labels = [...(conversation.Labels || [])];
    Object.keys(changes).forEach((labelID) => {
        const index = Labels.findIndex((existingLabel) => existingLabel.ID === labelID);
        if (changes[labelID]) {
            if (index === -1) {
                Labels.push({
                    ID: labelID,
                    ContextNumMessages: conversation.NumMessages || 1,
                });
            } else {
                Labels[index] = {
                    ...Labels[index],
                    ContextNumMessages: conversation.NumMessages || 1,
                };
            }
        } else if (index >= 0) {
            // When the conversation has been received through the event manager it will not have a Time field
            // By removing the label, we are losing the context time associated
            // If we roll back that change, both label time and fallback on conversation will be missing
            // By filling the conversation time at label removal, we ensure there will be a time on rollback
            if (Time === undefined) {
                Time = Labels[index].ContextTime;
            }

            Labels.splice(index, 1);
        }
    });

    if (unreadStatuses) {
        const elementUnreadStatus = unreadStatuses.find((element) => element.id === conversation.ID)?.unread;
        if (elementUnreadStatus) {
            return { ...conversation, Time, Labels, NumUnread: elementUnreadStatus };
        }
    }

    return { ...conversation, Time, Labels };
};

export const applyLabelChangesOnOneMessageOfAConversation = (
    conversation: Conversation,
    changes: LabelChanges
): { updatedConversation: Conversation; conversationChanges: LabelChanges } => {
    let Time = conversation.Time;

    const Labels = [...(conversation.Labels || [])];
    const conversationChanges: LabelChanges = {};
    Object.keys(changes).forEach((labelID) => {
        const index = Labels.findIndex((existingLabel) => existingLabel.ID === labelID);
        const hasLabel = index >= 0;
        const numMessages = Labels?.[index]?.ContextNumMessages || 0;

        if (changes[labelID]) {
            if (hasLabel) {
                Labels[index] = { ...Labels[index], ContextNumMessages: numMessages + 1 };
            } else {
                Labels.push({ ID: labelID, ContextNumMessages: 1 });
                conversationChanges[labelID] = true;
            }
        } else if (hasLabel) {
            if (numMessages <= 1) {
                // When the conversation has been received through the event manager it will not have a Time field
                // By removing the label, we are losing the context time associated
                // If we roll back that change, both label time and fallback on conversation will be missing
                // By filling the conversation time at label removal, we ensure there will be a time on rollback
                if (Time === undefined) {
                    Time = Labels[index].ContextTime;
                }

                Labels.splice(index, 1);
                conversationChanges[labelID] = false;
            } else {
                Labels[index] = { ...Labels[index], ContextNumMessages: numMessages - 1 };
            }
        }
    });

    return { updatedConversation: { ...conversation, Time, Labels }, conversationChanges };
};

// For some locations, we want to display the total number of messages instead of the number of unread (e.g. Scheduled folder)
export const shouldDisplayTotal = (labelID: string) => {
    const needsDisplayTotalLabels = [SCHEDULED, SNOOZED];

    return needsDisplayTotalLabels.includes(labelID as MAILBOX_LABEL_IDS);
};

export const canMoveAll = (
    currentLabelID: string,
    targetLabelID: string,
    elementIDs: string[],
    selectedIDs: string[],
    isSearch: boolean
) => {
    // We also need to hide move all actions in ALL_DRAFTS and ALL_SENT location because the goal of this setting
    // is to keep the message in DRAFTS and SENT locations all the time.
    return (
        !labelIncludes(currentLabelID, targetLabelID, ALL_MAIL, SCHEDULED, ALL_DRAFTS, ALL_SENT) &&
        elementIDs.length > 0 &&
        selectedIDs.length === 0 &&
        !isSearch
    );
};

export const getSortedChanges = (changes: {
    [labelID: string]: boolean;
}): { toLabel: string[]; toUnlabel: string[] } => {
    return Object.keys(changes).reduce<{ toLabel: string[]; toUnlabel: string[] }>(
        (acc, labelID) => {
            if (changes[labelID]) {
                acc.toLabel.push(labelID);
            } else {
                acc.toUnlabel.push(labelID);
            }

            return acc;
        },
        { toLabel: [], toUnlabel: [] }
    );
};

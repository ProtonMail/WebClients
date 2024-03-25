import { c } from 'ttag';

import { IconName } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { toMap } from '@proton/shared/lib/helpers/object';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { Folder } from '@proton/shared/lib/interfaces/Folder';
import { Label } from '@proton/shared/lib/interfaces/Label';
import { SHOW_MOVED } from '@proton/shared/lib/mail/mailSettings';

import { LABELS_AUTO_READ, LABELS_UNMODIFIABLE_BY_USER, LABEL_IDS_TO_HUMAN } from '../constants';
import { Conversation } from '../models/conversation';
import { Element } from '../models/element';
import { MessageWithOptionalBody } from '../store/messages/messagesTypes';
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

export interface FolderInfo {
    icon: IconName;
    name: string;
    to: string;
    color?: string;
    parentID?: string | number;
}

interface FolderMap {
    [id: string]: FolderInfo;
}

const alwaysMessageLabels = [DRAFTS, ALL_DRAFTS, SENT, ALL_SENT];
const SYSTEM_LABELS = [STARRED, SNOOZED, ALL_MAIL, ALMOST_ALL_MAIL, SCHEDULED, ALL_SENT, ALL_DRAFTS, OUTBOX];

export const isSystemLabel = (labelID: string) => SYSTEM_LABELS.includes(labelID as MAILBOX_LABEL_IDS);

export const getHumanLabelID = (labelID: string) => LABEL_IDS_TO_HUMAN[labelID as MAILBOX_LABEL_IDS] || labelID;

export const isCustomLabelOrFolder = (labelID: string) =>
    !Object.values(MAILBOX_LABEL_IDS).includes(labelID as MAILBOX_LABEL_IDS);

export const isAlwaysMessageLabels = (labelID: string) => alwaysMessageLabels.includes(labelID as MAILBOX_LABEL_IDS);

export const labelIncludes = (labelID: string, ...labels: (MAILBOX_LABEL_IDS | string)[]) =>
    labels.includes(labelID as MAILBOX_LABEL_IDS);

export const isCustomLabel = (labelID: string, labels: Label[] = []) => labels.some((label) => label.ID === labelID);

export const isLabel = (labelID: string, labels: Label[] = []) =>
    labelIncludes(labelID, STARRED) || isCustomLabel(labelID, labels);

export const isCustomFolder = (labelID: string, folders: Folder[] = []) =>
    folders.some((folder) => folder.ID === labelID);

export const getStandardFolders = (): FolderMap => ({
    [INBOX]: {
        icon: 'inbox',
        name: c('Link').t`Inbox`,
        to: '/inbox',
    },
    [TRASH]: {
        icon: 'trash',
        name: c('Link').t`Trash`,
        to: '/trash',
    },
    [SPAM]: {
        icon: 'fire',
        name: c('Link').t`Spam`,
        to: '/spam',
    },
    [ARCHIVE]: {
        icon: 'archive-box',
        name: c('Link').t`Archive`,
        to: '/archive',
    },
    [SENT]: {
        icon: 'paper-plane',
        name: c('Link').t`Sent`,
        to: `/${LABEL_IDS_TO_HUMAN[SENT]}`,
    },
    [ALL_SENT]: {
        icon: 'paper-plane',
        name: c('Link').t`Sent`,
        to: `/${LABEL_IDS_TO_HUMAN[ALL_SENT]}`,
    },
    [DRAFTS]: {
        icon: 'file-lines',
        name: c('Link').t`Drafts`,
        to: `/${LABEL_IDS_TO_HUMAN[DRAFTS]}`,
    },
    [ALL_DRAFTS]: {
        icon: 'file-lines',
        name: c('Link').t`Drafts`,
        to: `/${LABEL_IDS_TO_HUMAN[ALL_DRAFTS]}`,
    },
    [SCHEDULED]: {
        icon: 'paper-plane-clock',
        name: c('Link').t`Scheduled`,
        to: `/${LABEL_IDS_TO_HUMAN[SCHEDULED]}`,
    },
    [STARRED]: {
        icon: 'star',
        name: c('Link').t`Starred`,
        to: `/${LABEL_IDS_TO_HUMAN[STARRED]}`,
    },
    [SNOOZED]: {
        icon: 'clock',
        name: c('Link').t`Snooze`,
        to: `/${LABEL_IDS_TO_HUMAN[SNOOZED]}`,
    },
    [ALL_MAIL]: {
        icon: 'envelopes',
        name: c('Link').t`All mail`,
        to: `/${LABEL_IDS_TO_HUMAN[ALL_MAIL]}`,
    },
    [ALMOST_ALL_MAIL]: {
        icon: 'envelopes',
        name: c('Link').t`All mail`,
        to: `/${LABEL_IDS_TO_HUMAN[ALMOST_ALL_MAIL]}`,
    },
    // [OUTBOX]: {
    //     icon: 'inbox-out',
    //     name: c('Mailbox').t`Outbox`,
    //     to: `/${LABEL_IDS_TO_HUMAN[OUTBOX]}`,
    // },
});

export const getLabelName = (labelID: string, labels: Label[] = [], folders: Folder[] = []): string => {
    if (labelID in LABEL_IDS_TO_HUMAN) {
        const folders = getStandardFolders();
        return folders[labelID].name;
    }

    const labelsMap = toMap(labels, 'ID');
    if (labelID in labelsMap) {
        return labelsMap[labelID]?.Name || labelID;
    }

    const foldersMap = toMap(folders, 'ID');
    if (labelID in foldersMap) {
        return foldersMap[labelID]?.Name || labelID;
    }

    return labelID;
};

export const getLabelNames = (changes: string[], labels: Label[], folders: Folder[]) => {
    if (!changes || changes.length === 0) {
        return;
    }

    return changes.map((ID) => getLabelName(ID, labels, folders));
};

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
            // We don't want to show the All mail folder in the details
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
    return labelIDs.find((labeID) => allFolderIDs.includes(labeID)) || '';
};

export const getFolderName = (labelID: string, customFoldersList: Folder[] = []): string => {
    const standardFolders = getStandardFolders();
    if (standardFolders[labelID]) {
        return standardFolders[labelID].name;
    }
    const { Name = '' } = customFoldersList.find(({ ID }) => ID === labelID) || {};
    return Name;
};

export const isAutoRead = (labelID: MAILBOX_LABEL_IDS | string) =>
    LABELS_AUTO_READ.includes(labelID as MAILBOX_LABEL_IDS);

export const isUnmodifiableByUser = (labelID: MAILBOX_LABEL_IDS | string) =>
    LABELS_UNMODIFIABLE_BY_USER.includes(labelID as MAILBOX_LABEL_IDS);

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
            // If we rollback that change, both label time and fallback on conversation will be missing
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
                // If we rollback that change, both label time and fallback on conversation will be missing
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

// For some locations, we want to display the total number of messages instead of the number of unreads (e.g. Scheduled folder)
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

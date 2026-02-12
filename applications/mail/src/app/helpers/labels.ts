import { c } from 'ttag';

import type { IconName } from '@proton/icons/types';
import { getLabelFromCategoryId } from '@proton/mail/features/categoriesView/categoriesStringHelpers';
import { isCategoryLabel, labelIncludes } from '@proton/mail/helpers/location';
import type { MessageWithOptionalBody } from '@proton/mail/store/messages/messagesTypes';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { toMap } from '@proton/shared/lib/helpers/object';
import type { Label, MailSettings } from '@proton/shared/lib/interfaces';
import type { Folder } from '@proton/shared/lib/interfaces/Folder';
import { CUSTOM_VIEWS, CUSTOM_VIEWS_LABELS, LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';
import { SHOW_MOVED } from '@proton/shared/lib/mail/mailSettings';

import type { Conversation } from '../models/conversation';
import type { Element } from '../models/element';
import { getLabelIDs } from './elements';

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

export const getStandardFolders = (): FolderMap => ({
    [MAILBOX_LABEL_IDS.INBOX]: {
        icon: 'inbox',
        name: c('Link').t`Inbox`,
        to: '/inbox',
    },
    [MAILBOX_LABEL_IDS.TRASH]: {
        icon: 'trash',
        name: c('Link').t`Trash`,
        to: '/trash',
    },
    [MAILBOX_LABEL_IDS.SPAM]: {
        icon: 'fire',
        name: c('Link').t`Spam`,
        to: '/spam',
    },
    [MAILBOX_LABEL_IDS.ARCHIVE]: {
        icon: 'archive-box',
        name: c('Link').t`Archive`,
        to: '/archive',
    },
    [MAILBOX_LABEL_IDS.SENT]: {
        icon: 'paper-plane',
        name: c('Link').t`Sent`,
        to: `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.SENT]}`,
    },
    [MAILBOX_LABEL_IDS.ALL_SENT]: {
        icon: 'paper-plane',
        name: c('Link').t`Sent`,
        to: `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.ALL_SENT]}`,
    },
    [MAILBOX_LABEL_IDS.DRAFTS]: {
        icon: 'file-lines',
        name: c('Link').t`Drafts`,
        to: `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.DRAFTS]}`,
    },
    [MAILBOX_LABEL_IDS.ALL_DRAFTS]: {
        icon: 'file-lines',
        name: c('Link').t`Drafts`,
        to: `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.ALL_DRAFTS]}`,
    },
    [MAILBOX_LABEL_IDS.SCHEDULED]: {
        icon: 'paper-plane-clock',
        name: c('Link').t`Scheduled`,
        to: `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.SCHEDULED]}`,
    },
    [MAILBOX_LABEL_IDS.STARRED]: {
        icon: 'star',
        name: c('Link').t`Starred`,
        to: `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.STARRED]}`,
    },
    [MAILBOX_LABEL_IDS.SNOOZED]: {
        icon: 'clock',
        name: c('Link').t`Snooze`,
        to: `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.SNOOZED]}`,
    },
    [MAILBOX_LABEL_IDS.ALL_MAIL]: {
        icon: 'envelopes',
        name: c('Link').t`All mail`,
        to: `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.ALL_MAIL]}`,
    },
    [MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL]: {
        icon: 'envelopes',
        name: c('Link').t`All mail`,
        to: `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL]}`,
    },
    [MAILBOX_LABEL_IDS.SOFT_DELETED]: {
        icon: 'trash-clock',
        name: c('Link').t`Deleted`,
        to: `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.SOFT_DELETED]}`,
    },
});

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
            if ([MAILBOX_LABEL_IDS.SENT, MAILBOX_LABEL_IDS.ALL_SENT].includes(labelID as MAILBOX_LABEL_IDS)) {
                return (
                    (hasBit(ShowMoved, SHOW_MOVED.SENT) ? MAILBOX_LABEL_IDS.ALL_SENT : MAILBOX_LABEL_IDS.SENT) ===
                    labelID
                );
            }
            if ([MAILBOX_LABEL_IDS.DRAFTS, MAILBOX_LABEL_IDS.ALL_DRAFTS].includes(labelID as MAILBOX_LABEL_IDS)) {
                return (
                    (hasBit(ShowMoved, SHOW_MOVED.DRAFTS) ? MAILBOX_LABEL_IDS.ALL_DRAFTS : MAILBOX_LABEL_IDS.DRAFTS) ===
                    labelID
                );
            }
            // We don't want to show "All mail" folder in the details
            if (
                [MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL].includes(labelID as MAILBOX_LABEL_IDS)
            ) {
                return false;
            }
            // We don't want to show "Trash" folder if it is soft-deleted
            if ([MAILBOX_LABEL_IDS.SOFT_DELETED, MAILBOX_LABEL_IDS.TRASH].includes(labelID as MAILBOX_LABEL_IDS)) {
                return MAILBOX_LABEL_IDS.SOFT_DELETED === labelID;
            }

            // We don't wait to show both the starred and empty start folder
            if (labelID === MAILBOX_LABEL_IDS.STARRED) {
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
    const needsDisplayTotalLabels = [MAILBOX_LABEL_IDS.SCHEDULED, MAILBOX_LABEL_IDS.SNOOZED];

    return needsDisplayTotalLabels.includes(labelID as MAILBOX_LABEL_IDS);
};

export const canMoveAll = (
    currentLabelID: string,
    destinationLabelID: string,
    elementIDs: string[],
    selectedIDs: string[],
    isSearch: boolean
) => {
    // We also need to hide move all actions in MAILBOX_LABEL_IDS.ALL_DRAFTS and MAILBOX_LABEL_IDS.ALL_SENT location because the goal of this setting
    // is to keep the message in MAILBOX_LABEL_IDS.DRAFTS and MAILBOX_LABEL_IDS.SENT locations all the time.
    return (
        !labelIncludes(
            currentLabelID,
            destinationLabelID,
            MAILBOX_LABEL_IDS.ALL_MAIL,
            MAILBOX_LABEL_IDS.SCHEDULED,
            MAILBOX_LABEL_IDS.ALL_DRAFTS,
            MAILBOX_LABEL_IDS.ALL_SENT
        ) &&
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

export const getViewTitleFromLabel = (label: string) => {
    switch (label) {
        case CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS:
            return c('Title').t`Newsletters view`;
        default:
            return label;
    }
};

export const isValidCustomViewLabel = (label: string): boolean => {
    return Object.keys(CUSTOM_VIEWS).includes(label);
};

export const isLabelIDNewsletterSubscription = (labelID: string): boolean => {
    return labelID === CUSTOM_VIEWS[CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS].label;
};

export const convertCustomViewLabelsToAlmostAllMail = (labelID: string) => {
    if (isLabelIDNewsletterSubscription(labelID)) {
        return MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL;
    }

    return labelID;
};

export const convertCategoryLabelToCategoryAndInbox = (labelID: string, disabledCategoriesIDs: string[]) => {
    if (isCategoryLabel(labelID)) {
        if (labelID === MAILBOX_LABEL_IDS.CATEGORY_DEFAULT) {
            return [MAILBOX_LABEL_IDS.INBOX, labelID, ...disabledCategoriesIDs];
        }

        return [MAILBOX_LABEL_IDS.INBOX, labelID];
    }

    return labelID;
};

export const getCustomViewFromRoute = (route: string) => {
    return Object.values(CUSTOM_VIEWS).find(({ route: customRoute }) => customRoute === route);
};

export const getCustomViewFromLabel = (label: string) => {
    return Object.values(CUSTOM_VIEWS).find(({ label: customLabel }) => customLabel === label);
};

export const getLabelName = (labelID: string, labels: Label[] = [], folders: Folder[] = []): string => {
    if (labelID in LABEL_IDS_TO_HUMAN) {
        if (isCategoryLabel(labelID)) {
            return getLabelFromCategoryId(labelID);
        }

        const folders = getStandardFolders();
        return folders[labelID]?.name || folders[MAILBOX_LABEL_IDS.INBOX].name;
    }

    const labelsMap = toMap(labels, 'ID');
    if (labelID in labelsMap) {
        return labelsMap[labelID]?.Name || labelID;
    }

    const foldersMap = toMap(folders, 'ID');
    if (labelID in foldersMap) {
        return foldersMap[labelID]?.Name || labelID;
    }

    if (isValidCustomViewLabel(labelID)) {
        return getViewTitleFromLabel(labelID);
    }

    return labelID;
};

/**
 * Only use this method when the label name in the toolbar.
 * It's used to ensure that categories get the "Inbox" name.
 */
export const getLabelNameForToolbar = (labelID: string, labels: Label[] = [], folders: Folder[] = []) => {
    if (isCategoryLabel(labelID)) {
        return getStandardFolders()[MAILBOX_LABEL_IDS.INBOX].name;
    }

    return getLabelName(labelID, labels, folders);
};

export const getLabelNames = (changes: string[], labels: Label[], folders: Folder[]) => {
    if (!changes || changes.length === 0) {
        return;
    }

    return changes.map((ID) => getLabelName(ID, labels, folders));
};

export const getFolderName = (labelID: string, customFoldersList: Folder[] = []): string => {
    const standardFolders = getStandardFolders();
    if (standardFolders[labelID]) {
        return standardFolders[labelID].name;
    }
    const { Name = '' } = customFoldersList.find(({ ID }) => ID === labelID) || {};
    return Name;
};

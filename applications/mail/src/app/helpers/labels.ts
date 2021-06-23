import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { c } from 'ttag';
import { MAILBOX_LABEL_IDS, SHOW_MOVED } from 'proton-shared/lib/constants';
import { toMap } from 'proton-shared/lib/helpers/object';
import { Label } from 'proton-shared/lib/interfaces/Label';
import { Folder } from 'proton-shared/lib/interfaces/Folder';
import { hasBit } from 'proton-shared/lib/helpers/bitset';
import { MailSettings } from 'proton-shared/lib/interfaces';
import { LABELS_AUTO_READ, LABELS_UNMODIFIABLE_BY_USER, LABEL_IDS_TO_HUMAN, getLabelIDsToI18N } from '../constants';
import { Conversation } from '../models/conversation';
import { getLabelIDs } from './elements';
import { Element } from '../models/element';

const { INBOX, TRASH, SPAM, ARCHIVE, SENT, DRAFTS, ALL_SENT, ALL_DRAFTS } = MAILBOX_LABEL_IDS;

export type LabelChanges = { [labelID: string]: boolean };

export interface FolderInfo {
    icon: string;
    name: string;
    to: string;
    color?: string;
    parentID?: string | number;
}

interface FolderMap {
    [id: string]: FolderInfo;
}

const alwaysMessageLabels = [DRAFTS, ALL_DRAFTS, SENT, ALL_SENT];

export const getHumanLabelID = (labelID: string) => LABEL_IDS_TO_HUMAN[labelID as MAILBOX_LABEL_IDS] || labelID;

export const getI18nLabelID = (labelID: string) =>
    getLabelIDsToI18N()[labelID as MAILBOX_LABEL_IDS] || getHumanLabelID(labelID);

export const getLabelName = (labelID: string, labels: Label[] = [], folders: Folder[] = []): string => {
    if (labelID in LABEL_IDS_TO_HUMAN) {
        return getI18nLabelID(labelID);
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

export const isCustomLabelOrFolder = (labelID: string) =>
    !Object.values(MAILBOX_LABEL_IDS).includes(labelID as MAILBOX_LABEL_IDS);

export const isAlwaysMessageLabels = (labelID: string) => alwaysMessageLabels.includes(labelID as MAILBOX_LABEL_IDS);

export const isCustomLabel = (labelID: string, labels: Label[] = []) => labels.some((label) => label.ID === labelID);

export const isCustomFolder = (labelID: string, folders: Folder[] = []) =>
    folders.some((folder) => folder.ID === labelID);

export const getStandardFolders = (): FolderMap => ({
    [INBOX]: {
        icon: 'inbox',
        name: c('Mailbox').t`Inbox`,
        to: '/inbox',
    },
    [TRASH]: {
        icon: 'trash',
        name: c('Mailbox').t`Trash`,
        to: '/trash',
    },
    [SPAM]: {
        icon: 'spam',
        name: c('Mailbox').t`Spam`,
        to: '/spam',
    },
    [ARCHIVE]: {
        icon: 'archive',
        name: c('Mailbox').t`Archive`,
        to: '/archive',
    },
    [SENT]: {
        icon: 'sent',
        name: c('Mailbox').t`Sent`,
        to: `/${LABEL_IDS_TO_HUMAN[SENT]}`,
    },
    [ALL_SENT]: {
        icon: 'sent',
        name: c('Mailbox').t`Sent`,
        to: `/${LABEL_IDS_TO_HUMAN[ALL_SENT]}`,
    },
    [DRAFTS]: {
        icon: 'drafts',
        name: c('Mailbox').t`Drafts`,
        to: `/${LABEL_IDS_TO_HUMAN[DRAFTS]}`,
    },
    [ALL_DRAFTS]: {
        icon: 'drafts',
        name: c('Mailbox').t`Drafts`,
        to: `/${LABEL_IDS_TO_HUMAN[ALL_DRAFTS]}`,
    },
    // [OUTBOX]: {
    //     icon: 'outbox',
    //     name: c('Mailbox').t`Outbox`,
    //     to: `/${LABEL_IDS_TO_HUMAN[OUTBOX]}`,
    // },
});

export const getCurrentFolders = (
    element: Element | undefined,
    labelID: string,
    customFoldersList: Folder[],
    mailSettings: MailSettings | undefined
): FolderInfo[] => {
    const { ShowMoved = SHOW_MOVED.NONE } = mailSettings || {};
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
    const allFolderIDs = [INBOX, ARCHIVE, SPAM, TRASH, SENT, DRAFTS, ...customFoldersList.map(({ ID }) => ID)];
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

export const labelIncludes = (labelID: string, ...labels: (MAILBOX_LABEL_IDS | string)[]) =>
    labels.includes(labelID as MAILBOX_LABEL_IDS);

export const isAutoRead = (labelID: MAILBOX_LABEL_IDS | string) =>
    LABELS_AUTO_READ.includes(labelID as MAILBOX_LABEL_IDS);

export const isUnmodifiableByUser = (labelID: MAILBOX_LABEL_IDS | string) =>
    LABELS_UNMODIFIABLE_BY_USER.includes(labelID as MAILBOX_LABEL_IDS);

export const applyLabelChangesOnMessage = (message: Message, changes: LabelChanges): Message => {
    const { LabelIDs } = message;
    let { Unread } = message;

    Object.keys(changes).forEach((labelID) => {
        const index = LabelIDs.findIndex((existingLabelID) => existingLabelID === labelID);
        if (changes[labelID]) {
            if (index === -1) {
                LabelIDs.push(labelID);
                if (isAutoRead(labelID)) {
                    Unread = 0;
                }
            }
        } else if (index >= 0) {
            LabelIDs.splice(index, 1);
        }
    });

    return { ...message, LabelIDs, Unread };
};

export const applyLabelChangesOnConversation = (conversation: Conversation, changes: LabelChanges): Conversation => {
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
                Labels[index].ContextNumMessages = conversation.NumMessages || 1;
            }
        } else if (index >= 0) {
            Labels.splice(index, 1);
        }
    });
    const NumUnread = Object.keys(changes).some((labelID) => isAutoRead(labelID)) ? 0 : conversation.NumUnread;

    return { ...conversation, Labels, NumUnread };
};

export const applyLabelChangesOnOneMessageOfAConversation = (
    conversation: Conversation,
    changes: LabelChanges
): { updatedConversation: Conversation; conversationChanges: LabelChanges } => {
    const Labels = [...(conversation.Labels || [])];
    const conversationChanges: LabelChanges = {};
    Object.keys(changes).forEach((labelID) => {
        const index = Labels.findIndex((existingLabel) => existingLabel.ID === labelID);
        const hasLabel = index >= 0;
        const numMessages = Labels?.[index]?.ContextNumMessages || 0;

        if (changes[labelID]) {
            if (hasLabel) {
                Labels[index].ContextNumMessages = numMessages + 1;
            } else {
                Labels.push({ ID: labelID, ContextNumMessages: 1 });
                conversationChanges[labelID] = true;
            }
        } else if (hasLabel) {
            if (numMessages <= 1) {
                Labels.splice(index, 1);
                conversationChanges[labelID] = false;
            } else {
                Labels[index].ContextNumMessages = numMessages - 1;
            }
        }
    });

    return { updatedConversation: { ...conversation, Labels }, conversationChanges };
};

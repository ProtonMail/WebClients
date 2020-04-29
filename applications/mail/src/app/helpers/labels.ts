import { c } from 'ttag';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { toMap } from 'proton-shared/lib/helpers/object';
import { Label } from 'proton-shared/lib/interfaces/Label';
import { Folder } from 'proton-shared/lib/interfaces/Folder';

import { LABEL_IDS_TO_HUMAN, LABEL_IDS_TO_I18N } from '../constants';

const { INBOX, TRASH, SPAM, ARCHIVE, SENT, DRAFTS, ALL_SENT, ALL_DRAFTS } = MAILBOX_LABEL_IDS;

interface FolderMap {
    [id: string]: {
        icon: string;
        name: string;
        to: string;
        color?: string;
    };
}

const alwaysMessageLabels = [
    MAILBOX_LABEL_IDS.DRAFTS,
    MAILBOX_LABEL_IDS.ALL_DRAFTS,
    MAILBOX_LABEL_IDS.SENT,
    MAILBOX_LABEL_IDS.ALL_SENT
];

export const getHumanLabelID = (labelID: string) => LABEL_IDS_TO_HUMAN[labelID as MAILBOX_LABEL_IDS] || labelID;

export const getI18nLabelID = (labelID: string) => LABEL_IDS_TO_I18N[labelID as MAILBOX_LABEL_IDS] || labelID;

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
        to: '/inbox'
    },
    [TRASH]: {
        icon: 'trash',
        name: c('Mailbox').t`Trash`,
        to: '/trash'
    },
    [SPAM]: {
        icon: 'spam',
        name: c('Mailbox').t`Spam`,
        to: '/spam'
    },
    [ARCHIVE]: {
        icon: 'archive',
        name: c('Mailbox').t`Archive`,
        to: '/archive'
    },
    [SENT]: {
        icon: 'sent',
        name: c('Mailbox').t`Sent`,
        to: `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.SENT]}`
    },
    [ALL_SENT]: {
        icon: 'sent',
        name: c('Mailbox').t`Sent`,
        to: `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.ALL_SENT]}`
    },
    [DRAFTS]: {
        icon: 'drafts',
        name: c('Mailbox').t`Drafts`,
        to: `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.DRAFTS]}`
    },
    [ALL_DRAFTS]: {
        icon: 'drafts',
        name: c('Mailbox').t`Drafts`,
        to: `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.ALL_DRAFTS]}`
    }
});

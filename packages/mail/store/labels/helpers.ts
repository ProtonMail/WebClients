import { c } from 'ttag';

import type { IconName } from '@proton/icons';
import { CATEGORY_LABEL_IDS_SET, type CategoryLabelID, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { toMap } from '@proton/shared/lib/helpers/object';
import type { Folder, Label } from '@proton/shared/lib/interfaces';
import {
    CUSTOM_VIEWS,
    CUSTOM_VIEWS_LABELS,
    CUSTOM_VIEWS_TO_HUMAN,
    LABELS_AUTO_READ,
    LABELS_UNMODIFIABLE_BY_USER,
    LABEL_IDS_TO_HUMAN,
} from '@proton/shared/lib/mail/constants';

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

export const SYSTEM_LABELS = [
    STARRED,
    SNOOZED,
    ALL_MAIL,
    ALMOST_ALL_MAIL,
    SCHEDULED,
    ALL_SENT,
    ALL_DRAFTS,
    OUTBOX,
    INBOX,
];
const ALWAYS_MESSAGE_LABELS = [DRAFTS, ALL_DRAFTS, SENT, ALL_SENT];

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

export const isCategoryLabel = (labelID: string): labelID is CategoryLabelID => {
    return CATEGORY_LABEL_IDS_SET.has(labelID as CategoryLabelID);
};

export const isSystemLabel = (labelID: string) => SYSTEM_LABELS.includes(labelID as MAILBOX_LABEL_IDS);

export const isAlwaysMessageLabels = (labelID: string) => ALWAYS_MESSAGE_LABELS.includes(labelID as MAILBOX_LABEL_IDS);

export const labelIncludes = (labelID: string, ...labels: (MAILBOX_LABEL_IDS | string)[]) =>
    labels.includes(labelID as MAILBOX_LABEL_IDS);

export const isCustomLabel = (labelID: string, labels: Label[] = []) => labels.some((label) => label.ID === labelID);

export const isCustomFolder = (labelID: string, folders: Folder[] = []) =>
    folders.some((folder) => folder.ID === labelID);

export const isCustomLabelOrFolder = (labelID: string) =>
    !Object.values(MAILBOX_LABEL_IDS).includes(labelID as MAILBOX_LABEL_IDS);

export const getHumanLabelID = (labelID: string) => LABEL_IDS_TO_HUMAN[labelID as MAILBOX_LABEL_IDS] || labelID;

export const isStringHumanLabelID = (labelID: string) => {
    const humanLabels = Object.values(LABEL_IDS_TO_HUMAN);
    return humanLabels.includes(labelID);
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

export const getCustomViewFromRoute = (route: string) => {
    return Object.values(CUSTOM_VIEWS).find(({ route: customRoute }) => customRoute === route);
};

export const getCustomViewFromLabel = (label: string) => {
    return Object.values(CUSTOM_VIEWS).find(({ label: customLabel }) => customLabel === label);
};

export const getViewTitleFromLabel = (label: string) => {
    switch (label) {
        case CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS:
            return c('Title').t`Newsletters view`;
        default:
            return label;
    }
};

export const getLabelName = (labelID: string, labels: Label[] = [], folders: Folder[] = []): string => {
    if (labelID in LABEL_IDS_TO_HUMAN) {
        const folders = getStandardFolders();
        const labelIDToUse = isCategoryLabel(labelID) ? MAILBOX_LABEL_IDS.INBOX : labelID;
        return folders[labelIDToUse]?.name || folders[MAILBOX_LABEL_IDS.INBOX].name;
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

export const getLabelNames = (changes: string[], labels: Label[], folders: Folder[]) => {
    if (!changes || changes.length === 0) {
        return;
    }

    return changes.map((ID) => getLabelName(ID, labels, folders));
};

export const getLabelNameAnonymised = (labelID: string) => {
    const humanLabel = getHumanLabelID(labelID);
    if (humanLabel !== labelID) {
        return humanLabel;
    }
    return 'custom';
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

export const isHumalLabelIDKey = (labelID: string): labelID is keyof typeof LABEL_IDS_TO_HUMAN => {
    return labelID in LABEL_IDS_TO_HUMAN;
};

export const isHumanCustomViewKey = (labelID: string): labelID is keyof typeof CUSTOM_VIEWS_TO_HUMAN => {
    return labelID in CUSTOM_VIEWS_TO_HUMAN;
};

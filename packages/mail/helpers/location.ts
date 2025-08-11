import type { CategoryLabelID } from '@proton/shared/lib/constants';
import { CATEGORY_LABEL_IDS_SET, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Folder, Label } from '@proton/shared/lib/interfaces';
import {
    CUSTOM_VIEWS_TO_HUMAN,
    LABELS_AUTO_READ,
    LABELS_UNMODIFIABLE_BY_USER,
    LABEL_IDS_TO_HUMAN,
    SYSTEM_FOLDERS,
    SYSTEM_LABELS,
} from '@proton/shared/lib/mail/constants';

const ALWAYS_MESSAGE_LABELS = [
    MAILBOX_LABEL_IDS.DRAFTS,
    MAILBOX_LABEL_IDS.ALL_DRAFTS,
    MAILBOX_LABEL_IDS.SENT,
    MAILBOX_LABEL_IDS.ALL_SENT,
];

export const isSystemLabel = (labelID: string) => SYSTEM_LABELS.includes(labelID as MAILBOX_LABEL_IDS);
export const isSystemFolder = (labelID: string) => SYSTEM_FOLDERS.includes(labelID as MAILBOX_LABEL_IDS);
export const isSystemLocation = (labelID: string) => isSystemFolder(labelID) || isSystemLabel(labelID);
export const isCategoryLabel = (labelID: string): labelID is CategoryLabelID => {
    return CATEGORY_LABEL_IDS_SET.has(labelID as CategoryLabelID);
};

export const getCurrentFolderID = (labelIDs: string[] = [], customFoldersList: Folder[] = []): string => {
    const allFolderIDs = [...SYSTEM_FOLDERS, ...customFoldersList.map(({ ID }) => ID)];
    return labelIDs.find((labelID) => allFolderIDs.includes(labelID)) || '';
};

export const isAlwaysMessageLabels = (labelID: string) => ALWAYS_MESSAGE_LABELS.includes(labelID as MAILBOX_LABEL_IDS);

export const labelIncludes = (labelID: string, ...labels: (MAILBOX_LABEL_IDS | string)[]) =>
    labels.includes(labelID as MAILBOX_LABEL_IDS);

export const isCustomLabel = (labelID: string, labels: Label[] = []) => labels.some((label) => label.ID === labelID);

export const isCustomFolder = (labelID: string, folders: Folder[] = []) =>
    folders.some((folder) => folder.ID === labelID);

export const isCustomLabelOrFolder = (labelID: string) =>
    !Object.values(MAILBOX_LABEL_IDS).includes(labelID as MAILBOX_LABEL_IDS);

export const getHumanLabelID = (labelID: string) => LABEL_IDS_TO_HUMAN[labelID as MAILBOX_LABEL_IDS] || labelID;

export const getLabelNameAnonymised = (labelID: string) => {
    const humanLabel = getHumanLabelID(labelID);
    if (humanLabel !== labelID) {
        return humanLabel;
    }
    return 'custom';
};

export const isStringHumanLabelID = (labelID: string) => {
    const humanLabels = Object.values(LABEL_IDS_TO_HUMAN);
    return humanLabels.includes(labelID);
};

export const isAutoRead = (labelID: MAILBOX_LABEL_IDS | string) =>
    LABELS_AUTO_READ.includes(labelID as MAILBOX_LABEL_IDS);

export const isUnmodifiableByUser = (
    labelID: MAILBOX_LABEL_IDS | string,
    labels: Label[] = [],
    folders: Folder[] = []
): boolean => {
    if (LABELS_UNMODIFIABLE_BY_USER.includes(labelID as MAILBOX_LABEL_IDS)) {
        return true;
    }

    if (isSystemLabel(labelID)) {
        return false;
    }

    if (isSystemFolder(labelID)) {
        return false;
    }

    if (isCategoryLabel(labelID)) {
        return false;
    }

    if (isCustomLabel(labelID, labels)) {
        return false;
    }

    if (isCustomFolder(labelID, folders)) {
        return false;
    }

    // If the label ID is unknown (e.g. new label ID introduced by the API), we consider it as unmodifiable by user to avoid unexpected behavior
    return true;
};

export const isHumalLabelIDKey = (labelID: string): labelID is keyof typeof LABEL_IDS_TO_HUMAN => {
    return labelID in LABEL_IDS_TO_HUMAN;
};

export const isHumanCustomViewKey = (labelID: string): labelID is keyof typeof CUSTOM_VIEWS_TO_HUMAN => {
    return labelID in CUSTOM_VIEWS_TO_HUMAN;
};

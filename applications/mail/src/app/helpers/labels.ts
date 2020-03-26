import { LABEL_IDS_TO_HUMAN, LABEL_IDS_TO_I18N } from '../constants';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { toMap } from 'proton-shared/lib/helpers/object';
import { Label } from 'proton-shared/lib/interfaces/Label';
import { Folder } from 'proton-shared/lib/interfaces/Folder';

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

export const isCustomLabel = (labelID: string) =>
    !Object.values(MAILBOX_LABEL_IDS).includes(labelID as MAILBOX_LABEL_IDS);

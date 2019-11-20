import { LABEL_IDS_TO_HUMAN, LABEL_IDS_TO_I18N } from '../constants';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { Label } from '../models/label';
import { toMap } from 'proton-shared/lib/helpers/object';

export const getHumanLabelID = (labelID: string) => LABEL_IDS_TO_HUMAN[labelID as MAILBOX_LABEL_IDS] || labelID;
export const getI18nLabelID = (labelID: string) => LABEL_IDS_TO_I18N[labelID as MAILBOX_LABEL_IDS] || labelID;

export const getLabelName = (labelID: string, labels: Label[]): string => {
    if (labelID in LABEL_IDS_TO_HUMAN) {
        return getI18nLabelID(labelID);
    }

    const labelsMap: { [key: string]: Label } = toMap(labels);
    if (labelID in labelsMap) {
        return labelsMap[labelID].Name || labelID;
    }

    return labelID;
};

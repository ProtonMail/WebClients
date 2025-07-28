import { isCustomFolder, isCustomLabel, isHumalLabelIDKey, isHumanCustomViewKey } from '@proton/mail/helpers/location';
import { traceInitiativeError } from '@proton/shared/lib/helpers/sentry';
import type { Folder, Label } from '@proton/shared/lib/interfaces';
import { CUSTOM_VIEWS_TO_HUMAN, LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';

export const folderLocation = (labelID: string, labels?: Label[], folders?: Folder[]) => {
    if (isCustomFolder(labelID, folders)) {
        return 'CUSTOM_FOLDER';
    }

    if (isCustomLabel(labelID, labels)) {
        return 'CUSTOM_LABEL';
    }

    if (isHumanCustomViewKey(labelID)) {
        return CUSTOM_VIEWS_TO_HUMAN[labelID].toUpperCase();
    }

    if (isHumalLabelIDKey(labelID)) {
        return LABEL_IDS_TO_HUMAN[labelID].toUpperCase();
    }

    traceInitiativeError('list-actions-telemetry', 'Folder location not defined.');
};

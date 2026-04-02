import { type CategoryLabelID, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { LabelCount } from '@proton/shared/lib/interfaces/Label';

export const getUnreadCountForLabel = (
    labelID: string,
    categoryIDs: CategoryLabelID[],
    countersByLabelId: { [labelID: string]: LabelCount }
) => {
    if (labelID === MAILBOX_LABEL_IDS.INBOX && categoryIDs.length) {
        const hasPrimary = categoryIDs.includes(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT);
        const categoryID = hasPrimary ? MAILBOX_LABEL_IDS.CATEGORY_DEFAULT : categoryIDs[0];
        return countersByLabelId[categoryID]?.Unread ?? 0;
    }

    return countersByLabelId[labelID]?.Unread ?? 0;
};

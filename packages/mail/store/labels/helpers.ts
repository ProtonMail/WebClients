import { type CategoryLabelID, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Label } from '@proton/shared/lib/interfaces';

const categoryRank: Record<CategoryLabelID, number> = {
    [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]: 1,
    [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL]: 2,
    [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS]: 3,
    [MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS]: 4,
    [MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS]: 5,
    [MAILBOX_LABEL_IDS.CATEGORY_UPDATES]: 6,
};

export const sortSystemCategories = (unsorted: Label[] = []): Label[] => {
    const sorted: Label[] = [];
    for (const label of unsorted) {
        const rank = categoryRank[label.ID as CategoryLabelID];
        if (rank !== undefined) {
            sorted[rank] = label;
        }
    }

    return sorted.filter(Boolean);
};

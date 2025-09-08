import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Label } from '@proton/shared/lib/interfaces';

const sortedIds = [
    MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
    MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
    MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
    MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
    MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS,
    MAILBOX_LABEL_IDS.CATEGORY_UPDATES,
    MAILBOX_LABEL_IDS.CATEGORY_FORUMS,
] as const;

export const sortSystemCategories = (unsorted: Label[] = []): Label[] => {
    const byId = new Map<string, Label>();
    for (const label of unsorted) {
        byId.set(label.ID, label);
    }

    const sorted: Label[] = [];
    for (const id of sortedIds) {
        const found = byId.get(id);
        if (found) {
            sorted.push(found);
        }
    }

    return sorted;
};

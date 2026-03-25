import { isCategoryLabel } from '@proton/mail/helpers/location';
import { type CategoryLabelID, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { LabelCount } from '@proton/shared/lib/interfaces';
import type { Filter } from '@proton/shared/lib/mail/search';

interface GetTotalArgs {
    counts: LabelCount[];
    labelID: string;
    categoryIDs: CategoryLabelID[];
    filter: Filter;
    bypassFilterCount: number;
}

export const getTotal = ({ counts, labelID, categoryIDs, filter, bypassFilterCount }: GetTotalArgs) => {
    const count = counts.find((count) => {
        if (labelID === MAILBOX_LABEL_IDS.INBOX && categoryIDs.length > 0) {
            if (!count.LabelID || !isCategoryLabel(count.LabelID)) {
                return false;
            }
            if (categoryIDs.includes(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT)) {
                return count.LabelID === MAILBOX_LABEL_IDS.CATEGORY_DEFAULT;
            }

            return categoryIDs.includes(count.LabelID);
        } else {
            return count.LabelID === labelID;
        }
    });

    if (!count) {
        return 0;
    }

    const unreadFilter = filter.Unread as number | undefined;

    if (unreadFilter === undefined) {
        return count.Total || 0;
    }
    if (unreadFilter > 0) {
        return (count.Unread || 0) + bypassFilterCount;
    }
    return (count.Total || 0) - (count.Unread || 0) + bypassFilterCount;
};

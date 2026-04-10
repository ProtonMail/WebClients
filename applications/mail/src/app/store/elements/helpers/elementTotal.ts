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

const aggregateCategoryCounts = (counts: LabelCount[], categoryIDs: CategoryLabelID[]) => {
    return counts.reduce(
        (acc, entry) => {
            // Skip entries that are not category labels or not in the categoryIDs list
            if (!entry.LabelID || !isCategoryLabel(entry.LabelID) || !categoryIDs.includes(entry.LabelID)) {
                return acc;
            }

            const total = acc.total + (entry.Total ?? 0);
            const unread = acc.unread + (entry.Unread ?? 0);

            return { total, unread };
        },
        { total: 0, unread: 0 }
    );
};

const findLabelCount = (counts: LabelCount[], labelID: string, categoryIDs: CategoryLabelID[]) => {
    const isInboxWithCategories = labelID === MAILBOX_LABEL_IDS.INBOX && categoryIDs.length > 0;

    const entry = counts.find((entry) => {
        if (!isInboxWithCategories) {
            return entry.LabelID === labelID;
        }

        if (!entry.LabelID || !isCategoryLabel(entry.LabelID)) {
            return false;
        }

        return categoryIDs.includes(entry.LabelID);
    });

    return entry ? { total: entry.Total ?? 0, unread: entry.Unread ?? 0 } : undefined;
};

/**
 * Returns the total element count for a given label, accounting for active categories and read/unread filters.
 *
 * When user is in the inbox and on the CATEGORY_DEFAULT (primary), counts are aggregated across all categoryIDs.
 * This is because CATEGORY_DEFAULT shows elements from all disabled categories on top of primary one.
 * For all other labels (including other categories labels), the count is resolved from a single matching entry.
 *
 * `bypassFilterCount` compensates elements that remains visible in the list when a filter is applied.
 */
export const getTotal = ({ counts, labelID, categoryIDs, filter, bypassFilterCount }: GetTotalArgs) => {
    const isInboxWithCategories = labelID === MAILBOX_LABEL_IDS.INBOX && categoryIDs.length > 0;
    const isDefaultCategory = isInboxWithCategories && categoryIDs.includes(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT);

    const count = isDefaultCategory
        ? aggregateCategoryCounts(counts, categoryIDs)
        : findLabelCount(counts, labelID, categoryIDs);

    if (!count) {
        return 0;
    }

    const unreadFilter = filter.Unread as number | undefined;
    if (unreadFilter === undefined) {
        return count.total;
    }
    if (unreadFilter > 0) {
        return count.unread + bypassFilterCount;
    }
    return count.total - count.unread + bypassFilterCount;
};

import type { LabelCount } from '@proton/shared/lib/interfaces';
import type { Filter } from '@proton/shared/lib/mail/search';

export const getTotal = (counts: LabelCount[], labelID: string, filter: Filter, bypassFilterCount: number) => {
    const count = counts.find((count) => count.LabelID === labelID);

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

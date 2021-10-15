import { LabelCount } from '@proton/shared/lib/interfaces';
import { Filter } from '../../../models/tools';

export const getTotal = (counts: LabelCount[], labelID: string, filter: Filter) => {
    const count = counts.find((count) => count.LabelID === labelID);

    if (!count) {
        return 0;
    }

    const unreadFilter = filter.Unread as number | undefined;

    if (unreadFilter === undefined) {
        return count.Total || 0;
    }
    if (unreadFilter > 0) {
        return count.Unread || 0;
    }
    return (count.Total || 0) - (count.Unread || 0);
};

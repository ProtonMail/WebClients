import type { Filter, Sort } from '@proton/shared/lib/mail/search';

import { hasAttachmentsFilter } from 'proton-mail/helpers/elements';
import { sortToString } from 'proton-mail/helpers/mailboxUrl';

export const getActiveState = (filter: Filter, sort: Sort) => {
    const isNonDefaultSort = sortToString(sort) !== undefined;
    const isAttachmentActive = hasAttachmentsFilter(filter);

    const hasActiveFilter = Object.keys(filter).length > 0;

    const isReadActive = filter.Unread === 0;
    const isDropdownFilterActive = isReadActive || isAttachmentActive;
    return {
        showReset: isNonDefaultSort || hasActiveFilter,
        isUnreadActive: filter.Unread === 1,
        isReadActive,
        isAttachmentActive,
        isNewestFirstActive: sort.sort === 'Time' && sort.desc === true,
        isOldestFirstActive: sort.sort === 'Time' && sort.desc === false,
        isLargestFirstActive: sort.sort === 'Size' && sort.desc === true,
        isSmallestFirstActive: sort.sort === 'Size' && sort.desc === false,
        dropdownActiveCount: (isDropdownFilterActive ? 1 : 0) + (isNonDefaultSort ? 1 : 0),
    };
};

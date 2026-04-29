import type { Filter, Sort } from '@proton/shared/lib/mail/search';

import { hasAttachmentsFilter } from 'proton-mail/helpers/elements';
import { sortToString } from 'proton-mail/helpers/mailboxUrl';

export const getActiveState = (filter: Filter, sort: Sort) => {
    const isNonDefaultSort = sortToString(sort) !== undefined;
    const isAttachmentActive = hasAttachmentsFilter(filter);

    const hasActiveFilter = Object.keys(filter).length > 0;

    return {
        showReset: isNonDefaultSort || hasActiveFilter,
        isUnreadActive: filter.Unread === 1,
        isReadActive: filter.Unread === 0,
        isAttachmentActive,
        isNewestFirstActive: sort.sort === 'Time' && sort.desc === true,
        isOldestFirstActive: sort.sort === 'Time' && sort.desc === false,
        isLargestFirstActive: sort.sort === 'Size' && sort.desc === false,
        isSmallestFirstActive: sort.sort === 'Size' && sort.desc === true,
        dropdownActiveCount: (filter.Unread === 0 ? 1 : 0) + (isAttachmentActive ? 1 : 0) + (isNonDefaultSort ? 1 : 0),
    };
};

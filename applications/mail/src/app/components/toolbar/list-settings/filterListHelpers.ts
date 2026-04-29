import type { Filter, Sort } from '@proton/shared/lib/mail/search';

import { hasAttachmentsFilter } from 'proton-mail/helpers/elements';

export const getActiveState = (filter: Filter, sort: Sort, isScheduled: boolean) => {
    const isUnreadActive = filter.Unread === 1;
    const isReadActive = filter.Unread === 0;
    const isAttachmentActive = hasAttachmentsFilter(filter);
    const hasActiveFilter = Object.keys(filter).length > 0;
    const isDropdownFilterActive = isReadActive || isAttachmentActive;
    const isLargestFirstActive = sort.sort === 'Size' && sort.desc === true;
    const isSmallestFirstActive = sort.sort === 'Size' && sort.desc === false;

    let isNewestFirstActive = sort.sort === 'Time' && sort.desc === true;
    let isOldestFirstActive = sort.sort === 'Time' && sort.desc === false;
    let isNonDefaultSort = !isNewestFirstActive;
    let dropdownActiveCount = (isDropdownFilterActive ? 1 : 0) + (isNonDefaultSort ? 1 : 0);

    // In scheduled, desc=false means "soonest to send" (newest first)
    if (isScheduled) {
        isNewestFirstActive = sort.sort === 'Time' && sort.desc === false;
        isOldestFirstActive = sort.sort === 'Time' && sort.desc === true;
        isNonDefaultSort = !isNewestFirstActive;
        dropdownActiveCount = (isDropdownFilterActive ? 1 : 0) + (isNonDefaultSort ? 1 : 0);
    }

    return {
        showReset: isNonDefaultSort || hasActiveFilter,
        isUnreadActive,
        isReadActive,
        isAttachmentActive,
        isNewestFirstActive,
        isOldestFirstActive,
        isLargestFirstActive,
        isSmallestFirstActive,
        dropdownActiveCount,
    };
};

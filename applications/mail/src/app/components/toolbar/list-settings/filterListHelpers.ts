import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Filter, Sort } from '@proton/shared/lib/mail/search';

import { hasAttachmentsFilter } from 'proton-mail/helpers/elements';

export const getActiveState = (filter: Filter, sort: Sort, labelID: string) => {
    const isUnreadActive = filter.Unread === 1;
    const isReadActive = filter.Unread === 0;
    const isAttachmentActive = hasAttachmentsFilter(filter);
    const isDropdownFilterActive = isReadActive || isAttachmentActive;
    const isLargestFirstActive = sort.sort === 'Size' && sort.desc === true;
    const isSmallestFirstActive = sort.sort === 'Size' && sort.desc === false;

    const isScheduledLabel = labelID === MAILBOX_LABEL_IDS.SCHEDULED;
    const isInboxOrSnooze = labelID === MAILBOX_LABEL_IDS.INBOX || labelID === MAILBOX_LABEL_IDS.SNOOZED;

    let isNewestFirstActive =
        (sort.sort === 'Time' || (isInboxOrSnooze && sort.sort === 'SnoozeTime')) && sort.desc === true;
    let isOldestFirstActive = sort.sort === 'Time' && sort.desc === false;
    let isNonDefaultSort = !isNewestFirstActive;
    let dropdownActiveCount = (isDropdownFilterActive ? 1 : 0) + (isNonDefaultSort ? 1 : 0);

    // In scheduled, desc=false means "soonest to send" (newest first)
    if (isScheduledLabel) {
        isNewestFirstActive = sort.sort === 'Time' && sort.desc === false;
        isOldestFirstActive = sort.sort === 'Time' && sort.desc === true;
        isNonDefaultSort = !isNewestFirstActive;
        dropdownActiveCount = (isDropdownFilterActive ? 1 : 0) + (isNonDefaultSort ? 1 : 0);
    }

    return {
        showReset: isNonDefaultSort || isDropdownFilterActive,
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

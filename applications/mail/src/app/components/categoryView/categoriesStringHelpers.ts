import { c } from 'ttag';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { CategoryLabelID } from '@proton/shared/lib/constants';

export const getLabelFromCategoryId = (id: CategoryLabelID) => {
    const CATEGORIES_LABEL_MAPPING: Record<CategoryLabelID, string> = {
        [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]: c('Label').t`Primary`,
        [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL]: c('Label').t`Social`,
        [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS]: c('Label').t`Promotions`,
        [MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS]: c('Label').t`Newsletters`,
        [MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS]: c('Label').t`Transactions`,
        [MAILBOX_LABEL_IDS.CATEGORY_UPDATES]: c('Label').t`Updates`,
        [MAILBOX_LABEL_IDS.CATEGORY_FORUMS]: c('Label').t`Forums`,
    };

    return CATEGORIES_LABEL_MAPPING[id];
};

export const getDescriptionFromCategoryId = (id: CategoryLabelID) => {
    const CATEGORIES_DESCRIPTION_MAPPING: Record<CategoryLabelID, string> = {
        [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]: c('Label').t`Primary`,
        [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL]: c('Label').t`Social media updates and activity`,
        [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS]: c('Label').t`Deals, offers, marketing emails`,
        [MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS]: c('Label').t`Non-promotional content and news`,
        [MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS]: c('Label').t`Bookings, billings, and orders`,
        [MAILBOX_LABEL_IDS.CATEGORY_UPDATES]: c('Label').t`Automated confirmations and alerts`,
        [MAILBOX_LABEL_IDS.CATEGORY_FORUMS]: c('Label').t`Discussion board posts and threads`,
    };

    return CATEGORIES_DESCRIPTION_MAPPING[id];
};

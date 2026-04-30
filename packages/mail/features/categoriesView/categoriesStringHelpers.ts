import { c } from 'ttag';

import type { CategoryLabelID } from '@proton/shared/lib/constants';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

export const getLabelFromCategoryId = (id: CategoryLabelID) => {
    const CATEGORIES_LABEL_MAPPING: Record<CategoryLabelID, string> = {
        [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]: c('Label').t`Primary`,
        [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL]: c('Label').t`Social`,
        [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS]: c('Label').t`Promotions`,
        [MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS]: c('Label').t`Newsletters`,
        [MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS]: c('Label').t`Transactions`,
        [MAILBOX_LABEL_IDS.CATEGORY_UPDATES]: c('Label').t`Updates`,
    };

    return CATEGORIES_LABEL_MAPPING[id];
};

export const getDescriptionFromCategoryId = (id: CategoryLabelID) => {
    const CATEGORIES_DESCRIPTION_MAPPING: Record<CategoryLabelID, string> = {
        [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]: c('Label')
            .t`Personal and work emails, plus important updates and notifications`,
        [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL]: c('Label').t`Social media updates and activity`,
        [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS]: c('Label').t`Deals, offers, marketing emails`,
        [MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS]: c('Label').t`Non-promotional content and news`,
        [MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS]: c('Label').t`Bookings, billings, and orders`,
        [MAILBOX_LABEL_IDS.CATEGORY_UPDATES]: c('Label').t`Automated confirmations and alerts`,
    };

    return CATEGORIES_DESCRIPTION_MAPPING[id];
};

export const getLabelFromCategoryIdInCommander = (id: CategoryLabelID) => {
    const CATEGORIES_LABEL_MAPPING: Record<CategoryLabelID, string> = {
        [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]: c('Label').t`Go to Primary`,
        [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL]: c('Label').t`Go to Social`,
        [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS]: c('Label').t`Go to Promotions`,
        [MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS]: c('Label').t`Go to Newsletters`,
        [MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS]: c('Label').t`Go to Transactions`,
        [MAILBOX_LABEL_IDS.CATEGORY_UPDATES]: c('Label').t`Go to Updates`,
    };

    return CATEGORIES_LABEL_MAPPING[id];
};

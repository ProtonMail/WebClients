import { c } from 'ttag';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

export const getLabelFromCategoryId = (id: MAILBOX_LABEL_IDS) => {
    switch (id) {
        case MAILBOX_LABEL_IDS.CATEGORY_DEFAULT:
            return c('Label').t`Primary`;
        case MAILBOX_LABEL_IDS.CATEGORY_SOCIAL:
            return c('Label').t`Social`;
        case MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS:
            return c('Label').t`Promotions`;
        case MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS:
            return c('Label').t`Newsletters`;
        case MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS:
            return c('Label').t`Transactions`;
        case MAILBOX_LABEL_IDS.CATEGORY_UPDATES:
            return c('Label').t`Updates`;
        case MAILBOX_LABEL_IDS.CATEGORY_FORUMS:
            return c('Label').t`Forums`;
        default:
            return c('Label').t`Unknown`;
    }
};

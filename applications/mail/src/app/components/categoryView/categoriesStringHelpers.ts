import { c } from 'ttag';

import { CATEGORY_LABEL_IDS } from './categoriesConstants';

export const getLabelFromCategoryId = (id: CATEGORY_LABEL_IDS) => {
    switch (id) {
        case CATEGORY_LABEL_IDS.CATEGORY_DEFAULT:
            return c('Label').t`Primary`;
        case CATEGORY_LABEL_IDS.CATEGORY_SOCIAL:
            return c('Label').t`Social`;
        case CATEGORY_LABEL_IDS.CATEGORY_PROMOTIONS:
            return c('Label').t`Promotions`;
        case CATEGORY_LABEL_IDS.CATEGORY_NEWSLETTER:
            return c('Label').t`Newsletters`;
        case CATEGORY_LABEL_IDS.CATEGORY_TRANSACTIONS:
            return c('Label').t`Transactions`;
        case CATEGORY_LABEL_IDS.CATEGORY_UPDATES:
            return c('Label').t`Updates`;
        case CATEGORY_LABEL_IDS.CATEGORY_FORUMS:
            return c('Label').t`Forums`;
        default:
            return c('Label').t`Unknown`;
    }
};

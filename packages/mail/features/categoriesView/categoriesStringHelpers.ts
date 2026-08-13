import { c } from 'ttag';

import type { CategoryLabelID } from '@proton/shared/lib/constants';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

const CATEGORIES_LABEL_MAPPING: Record<CategoryLabelID, () => string> = {
    [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]: () => c('Label').t`Primary`,
    [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL]: () => c('Label').t`Social`,
    [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS]: () => c('Label').t`Promotions`,
    [MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS]: () => c('Label').t`Newsletters`,
    [MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS]: () => c('Label').t`Transactions`,
    [MAILBOX_LABEL_IDS.CATEGORY_UPDATES]: () => c('Label').t`Updates`,
};

const CATEGORIES_TITLE_MAPPING: Record<CategoryLabelID, () => string> = {
    [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]: () =>
        c('Label').t`Primary - Anything that needs your attention, plus emails from disabled categories`,
    [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL]: () => c('Label').t`Social - Social media updates, activity, and messages`,
    [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS]: () => c('Label').t`Promotions - Deals, offers, and marketing emails`,
    [MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS]: () =>
        c('Label').t`Newsletters - News, editorial emails, and non-promotional content`,
    [MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS]: () => c('Label').t`Transactions - Receipts, bookings, bills, and orders`,
    [MAILBOX_LABEL_IDS.CATEGORY_UPDATES]: () =>
        c('Label').t`Updates - Automated confirmations, alerts, and account updates`,
};

const CATEGORIES_DESCRIPTION_MAPPING: Record<CategoryLabelID, () => string> = {
    [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]: () =>
        c('Label').t`Anything that needs your attention, plus emails from disabled categories`,
    [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL]: () => c('Label').t`Social media updates and activity`,
    [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS]: () => c('Label').t`Deals, offers, and marketing emails`,
    [MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS]: () => c('Label').t`Non-promotional content and news`,
    [MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS]: () => c('Label').t`Bookings, billings, and orders`,
    [MAILBOX_LABEL_IDS.CATEGORY_UPDATES]: () => c('Label').t`Automated confirmations and alerts`,
};

const CATEGORIES_COMMANDER_MAPPING: Record<CategoryLabelID, () => string> = {
    [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]: () => c('Label').t`Go to Primary`,
    [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL]: () => c('Label').t`Go to Social`,
    [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS]: () => c('Label').t`Go to Promotions`,
    [MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS]: () => c('Label').t`Go to Newsletters`,
    [MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS]: () => c('Label').t`Go to Transactions`,
    [MAILBOX_LABEL_IDS.CATEGORY_UPDATES]: () => c('Label').t`Go to Updates`,
};

export const getLabelFromCategoryId = (id: CategoryLabelID) => CATEGORIES_LABEL_MAPPING[id]?.();
export const getTitleFromCategoryId = (id: CategoryLabelID) => CATEGORIES_TITLE_MAPPING[id]?.();
export const getDescriptionFromCategoryId = (id: CategoryLabelID) => CATEGORIES_DESCRIPTION_MAPPING[id]?.();
export const getLabelFromCategoryIdInCommander = (id: CategoryLabelID) => CATEGORIES_COMMANDER_MAPPING[id]?.();

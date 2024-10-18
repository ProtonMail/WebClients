import { c } from 'ttag';

import type { NEWSLETTER_SUBSCRIPTIONS_BITS } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import { getEmailSubscriptionsMap } from './constants/email-subscriptions';

export const getEmailSubscriptionCategories = (news: NEWSLETTER_SUBSCRIPTIONS_BITS[]) => {
    const emailSubscriptionMap = getEmailSubscriptionsMap();
    const categoryTitles = news
        .map((newsKind) => emailSubscriptionMap[newsKind]?.title)
        .filter((title) => isTruthy(title));

    if (!categoryTitles.length) {
        return null;
    }

    const allCategoryTitlesExceptTheLastOne = categoryTitles.slice(0, -1).join(', ');
    const lastCategoryTitle = categoryTitles[categoryTitles.length - 1];

    return categoryTitles.length > 1
        ? c('Email Unsubscribe Categories').t`${allCategoryTitlesExceptTheLastOne} and ${lastCategoryTitle}`
        : lastCategoryTitle;
};

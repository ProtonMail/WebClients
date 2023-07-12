import { c } from 'ttag';

import { NEWSLETTER_SUBSCRIPTIONS_BITS } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import { getEmailSubscriptionsMap } from './constants/email-subscriptions';

const EmailSubscriptionCategories = ({ news }: { news: NEWSLETTER_SUBSCRIPTIONS_BITS[] }) => {
    const emailSubscriptionMap = getEmailSubscriptionsMap();
    const categoryTitles = news
        .map((newsKind) => emailSubscriptionMap[newsKind]?.title)
        .filter((title) => isTruthy(title));

    if (!categoryTitles.length) {
        return null;
    }

    const allCategoryTitlesExceptTheLastOne = categoryTitles.slice(0, -1).join(', ');
    const lastCategoryTitle = categoryTitles[categoryTitles.length - 1];

    const categoriesString =
        categoryTitles.length > 1
            ? c('Email Unsubscribe Categories').t`${allCategoryTitlesExceptTheLastOne} and ${lastCategoryTitle}`
            : lastCategoryTitle;

    return (
        <span className="text-bold" key="category-title">
            {categoriesString}
        </span>
    );
};

export default EmailSubscriptionCategories;

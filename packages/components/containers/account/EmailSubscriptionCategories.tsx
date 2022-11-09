import { c } from 'ttag';

import { NEWS } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import { getTitle } from './EmailSubscriptionCheckboxes';

const EmailSubscriptionCategories = ({ news }: { news: NEWS[] }) => {
    const categories = news.map(getTitle).filter(isTruthy);

    if (!categories) {
        return null;
    }

    const allCategoriesExceptTheLastOne = categories.slice(0, -1).join(', ');

    const lastCategory = categories[categories.length - 1];

    const categoriesString =
        categories.length > 1
            ? c('Email Unsubscribe Categories').t`${allCategoriesExceptTheLastOne} and ${lastCategory}`
            : lastCategory;

    return (
        <span key="bold" className="text-bold">
            {categoriesString}
        </span>
    );
};

export default EmailSubscriptionCategories;

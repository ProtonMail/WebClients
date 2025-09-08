import { selectCategoriesLabel } from '@proton/mail';
import { isCategoryLabel } from '@proton/mail/helpers/location';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash';

import { params } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import type { CategoryTab } from './categoriesConstants';
import { getCategoryData } from './categoriesHelpers';

export const useCategoriesView = () => {
    const categoryViewAccess = useFlag('CategoryView');
    const mailParams = useMailSelector(params);

    const categoriesStore = useMailSelector(selectCategoriesLabel);

    const categoriesTabs =
        categoriesStore?.map((category): CategoryTab => {
            const data = getCategoryData(category.ID);
            return {
                ...data,
                checked: !!category.Display,
            };
        }) || [];

    const activeCategoriesTabs = categoriesTabs.filter((category) => category.checked);
    const isInboxOrCategory = mailParams.labelID === MAILBOX_LABEL_IDS.INBOX || isCategoryLabel(mailParams.labelID);

    return {
        categoriesStore,
        categoriesTabs,
        activeCategoriesTabs,
        categoryViewAccess,
        shouldShowTabs: categoryViewAccess && isInboxOrCategory,
    };
};

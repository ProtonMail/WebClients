import { isCategoryLabel } from '@proton/mail/helpers/location';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash';

import { params } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { categoriesArray } from './categoriesConstants';

export const useCategoryView = () => {
    const categoryViewAccess = useFlag('CategoryView');
    const mailParams = useMailSelector(params);

    // This is hardcoded for now but will be replace by dynamic value once the edit modal is added
    const activeCategories = categoriesArray;

    return {
        activeCategories,
        categoryViewAccess,
        shouldShowTabs:
            categoryViewAccess &&
            (mailParams.labelID === MAILBOX_LABEL_IDS.INBOX || isCategoryLabel(mailParams.labelID)),
    };
};

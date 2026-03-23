import { useCategoriesData } from '@proton/mail/features/categoriesView/useCategoriesData';
import { isCategoryLabel } from '@proton/mail/helpers/location';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { params } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

export const useCategoriesView = () => {
    const mailParams = useMailSelector(params);
    const categoriesData = useCategoriesData();

    const isInboxOrCategory = mailParams.labelID === MAILBOX_LABEL_IDS.INBOX || isCategoryLabel(mailParams.labelID);

    return {
        ...categoriesData,
        shouldShowTabs: isInboxOrCategory && categoriesData.categoryViewAccess,
    };
};

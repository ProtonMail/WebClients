import { useCategoriesData } from '@proton/mail/features/categoriesView/useCategoriesData';
import { isCategoryLabel } from '@proton/mail/helpers/location';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { selectLabelID } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

export const useCategoriesView = () => {
    const labelID = useMailSelector(selectLabelID);
    const categoriesData = useCategoriesData();

    const isInboxOrCategory = labelID === MAILBOX_LABEL_IDS.INBOX || isCategoryLabel(labelID);

    return {
        ...categoriesData,
        shouldShowTabs: isInboxOrCategory && categoriesData.categoryViewAccess,
    };
};

import { useCategoriesData } from '@proton/mail/features/categoriesView/useCategoriesData';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { selectIsSearching, selectLabelID } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

export const useCategoriesView = () => {
    const isSearching = useMailSelector(selectIsSearching);
    const labelID = useMailSelector(selectLabelID);
    const categoriesData = useCategoriesData();

    return {
        ...categoriesData,
        shouldShowTabs: labelID === MAILBOX_LABEL_IDS.INBOX && !isSearching && categoriesData.isCategoryViewEnabled,
    };
};

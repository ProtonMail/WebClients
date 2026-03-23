import { useCategoriesData } from '@proton/mail/features/categoriesView/useCategoriesData';
import { isCategoryLabel } from '@proton/mail/helpers/location';
import type { CategoryLabelID } from '@proton/shared/lib/constants';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { params } from 'proton-mail/store/elements/elementsSelectors';
import { elementsSliceActions } from 'proton-mail/store/elements/elementsSlice';
import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';

export const useCategoriesView = () => {
    const mailParams = useMailSelector(params);
    const categoriesData = useCategoriesData();

    const dispatch = useMailDispatch();

    const isInboxOrCategory = mailParams.labelID === MAILBOX_LABEL_IDS.INBOX || isCategoryLabel(mailParams.labelID);

    /**
     * Update the category IDs in the store based on the selected category ID.
     * When the default category is selected, it includes all disabled categories as well.
     * @param categoryIDs the new category ID to set in the store.
     */
    const updateCategoryIDs = (categoryIDs: CategoryLabelID) => {
        const ids =
            categoryIDs === MAILBOX_LABEL_IDS.CATEGORY_DEFAULT
                ? [categoryIDs, ...categoriesData.disabledCategoriesIDs]
                : [categoryIDs];

        dispatch(elementsSliceActions.updateCategoryIDs({ categoryIDs: ids }));
    };

    return {
        ...categoriesData,
        updateCategoryIDs,
        shouldShowTabs: isInboxOrCategory && categoriesData.categoryViewAccess,
    };
};

import { useCategoriesData } from '@proton/mail/features/categoriesView/useCategoriesData';

import { selectShouldShowCategoryViewTabs } from 'proton-mail/store/categories/categoriesSelector';
import { useMailSelector } from 'proton-mail/store/hooks';

export const useCategoriesView = () => {
    const categoriesData = useCategoriesData();

    const shouldShowTabsBase = useMailSelector(selectShouldShowCategoryViewTabs);
    const shouldShowTabs = shouldShowTabsBase && categoriesData.isCategoryViewEnabled;

    return {
        ...categoriesData,
        shouldShowTabs,
    };
};

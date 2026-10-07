import { useCategoriesData } from '@proton/mail/features/categoriesView/useCategoriesData';

import { selectCanMoveToCategories, selectShouldShowCategoryViewTabs } from '../../store/categories/categoriesSelector';
import { useMailSelector } from '../../store/hooks';

export const useCategoriesView = () => {
    const categoriesData = useCategoriesData();

    const shouldShowTabsBase = useMailSelector(selectShouldShowCategoryViewTabs);
    const canMoveToCategoriesBase = useMailSelector(selectCanMoveToCategories);

    const shouldShowTabs = shouldShowTabsBase && categoriesData.isCategoryViewEnabled;
    const canMoveToCategories = canMoveToCategoriesBase && categoriesData.isCategoryViewEnabled;

    return {
        ...categoriesData,
        shouldShowTabs,
        canMoveToCategories,
    };
};

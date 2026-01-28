import { createSelector } from '@reduxjs/toolkit';

import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import { getCategoryTabFromLabel } from '@proton/mail/features/categoriesView/categoriesHelpers';
import { isCategoryLabel } from '@proton/mail/helpers/location';
import type { Label } from '@proton/shared/lib/interfaces';

import { sortSystemCategories } from './helpers';
import { selectCategories } from './index';

// We know categories are labels
export const selectCategoriesLabel = createSelector([selectCategories], (categories): Label[] => {
    const raw = categories.value ?? [];
    const onlyCategories = raw.filter((label) => isCategoryLabel(label.ID));
    return sortSystemCategories(onlyCategories);
});

export const selectDisabledCategoriesIDs = createSelector([selectCategoriesLabel], (categories): string[] => {
    return categories.filter((category) => !category.Display).map((category) => category.ID);
});

export const selectCategoriesTabs = createSelector([selectCategoriesLabel], (categoriesStore) => {
    return (
        categoriesStore?.map((category): CategoryTab => {
            return getCategoryTabFromLabel(category);
        }) || []
    );
});

export const selectActiveCategoriesTabs = createSelector([selectCategoriesTabs], (categoriesTabs) => {
    return categoriesTabs.filter((tab) => tab.display);
});

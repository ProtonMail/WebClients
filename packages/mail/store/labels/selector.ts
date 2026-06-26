import { createSelector } from '@reduxjs/toolkit';

import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import { getCategoryTabFromLabel } from '@proton/mail/features/categoriesView/categoriesHelpers';
import { isCategoryLabel } from '@proton/mail/helpers/location';
import { type CategoryLabelID, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { type Category, type Label, hasUnseenTracking } from '@proton/shared/lib/interfaces';

import { sortSystemCategories } from './helpers';
import type { CategoriesState } from './index';
import { selectCategories } from './index';

// We know categories are labels
export const selectCategoriesLabel = createSelector([selectCategories], (categories): Label[] => {
    const raw = categories.value ?? [];
    const onlyCategories = raw.filter((label): label is Label => isCategoryLabel(label.ID));
    return sortSystemCategories(onlyCategories);
});

export const selectDisabledCategoriesIDs = createSelector([selectCategoriesLabel], (categories): CategoryLabelID[] => {
    return categories
        .filter((category) => !category.Display && isCategoryLabel(category.ID))
        .map((category) => category.ID as CategoryLabelID);
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

const hasUnseenToReset = (category: Category | undefined): category is Category => {
    return !!category && hasUnseenTracking(category) && category.LastUnseenMessageEventID !== null;
};

export const selectCategoriesToMarkSeen = createSelector(
    [selectCategoriesLabel, (_state: CategoriesState, labelID: string) => labelID],
    (categories, labelID): Label[] => {
        const currentCategory = categories.find((category) => category.ID === labelID);

        if (labelID === MAILBOX_LABEL_IDS.CATEGORY_DEFAULT) {
            const disabled = categories.filter((category) => !category.Display && hasUnseenToReset(category));
            return hasUnseenToReset(currentCategory) ? [currentCategory, ...disabled] : [...disabled];
        }

        return hasUnseenToReset(currentCategory) ? [currentCategory] : [];
    }
);

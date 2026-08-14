import { createSelector } from '@reduxjs/toolkit';

import { CATEGORY_LABEL_IDS, type CategoryLabelID, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { type Category, type Label, hasUnseenTracking } from '@proton/shared/lib/interfaces';

import type { CategoryTab } from '../../features/categoriesView/categoriesConstants';
import { getCategoryTabFromLabel } from '../../features/categoriesView/categoriesHelpers';
import { isCategoryLabel } from '../../helpers/location';
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

const DEFAULT_B2C_CATEGORY_CONFIGURATION: Record<CategoryLabelID, { display: boolean; notify: boolean }> = {
    [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]: { display: true, notify: true },
    [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL]: { display: true, notify: false },
    [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS]: { display: true, notify: false },
    [MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS]: { display: true, notify: false },
    [MAILBOX_LABEL_IDS.CATEGORY_UPDATES]: { display: false, notify: false },
    [MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS]: { display: false, notify: false },
};

export const selectHasDefaultB2CCategoryConfiguration = createSelector(
    [selectCategoriesLabel],
    (categories): boolean => {
        if (categories.length !== CATEGORY_LABEL_IDS.length) {
            return false;
        }

        return categories.every((category) => {
            const expected = DEFAULT_B2C_CATEGORY_CONFIGURATION[category.ID as CategoryLabelID];
            if (!expected) {
                return false;
            }

            return !!category.Display === expected.display && !!category.Notify === expected.notify;
        });
    }
);

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
            const filteredCategories = categories.filter((category) => !category.Display && hasUnseenToReset(category));
            if (hasUnseenToReset(currentCategory)) {
                return [currentCategory, ...filteredCategories];
            }

            return filteredCategories;
        }

        return hasUnseenToReset(currentCategory) ? [currentCategory] : [];
    }
);

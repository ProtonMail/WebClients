import { createSelector } from '@reduxjs/toolkit';

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

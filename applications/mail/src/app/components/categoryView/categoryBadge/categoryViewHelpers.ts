import { type CategoryBadgeMapping, getCategoriesBadgeMapping } from './categoryViewConstants';

export const isLabelIDCategoryKey = (labelID: string): labelID is keyof CategoryBadgeMapping => {
    return Object.keys(getCategoriesBadgeMapping()).includes(labelID);
};

export const hasCategoryLabel = (labelIDs?: string[]) => {
    if (!labelIDs) {
        return false;
    }

    return labelIDs.some((labelID) => isLabelIDCategoryKey(labelID));
};

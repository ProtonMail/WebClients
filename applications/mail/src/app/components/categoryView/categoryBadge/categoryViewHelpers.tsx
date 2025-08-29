import { type CategoryBadgeMapping, getCategoriesBadgeMapping } from './categoryViewConstants';

export const isLabelIDCaregoryKey = (labelID: string): labelID is keyof CategoryBadgeMapping => {
    return Object.keys(getCategoriesBadgeMapping()).includes(labelID);
};

export const hasCategoryLabel = (labelIDs?: string[]) => {
    if (!labelIDs) {
        return false;
    }
    return labelIDs.some((labelID) => isLabelIDCaregoryKey(labelID));
};

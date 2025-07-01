import { categoryBadgeMapping } from './categoryViewConstants';

export const isLabelIDCaregoryKey = (labelID: string): labelID is keyof typeof categoryBadgeMapping => {
    return Object.keys(categoryBadgeMapping).includes(labelID);
};

export const hasCategoryLabel = (labelIDs?: string[]) => {
    if (!labelIDs) {
        return false;
    }
    return labelIDs.some((labelID) => isLabelIDCaregoryKey(labelID));
};

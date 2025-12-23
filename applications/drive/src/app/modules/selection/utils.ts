import { SelectionState } from './types';

/**
 * Calculate the selection state based on selected and total items
 */
export const calculateSelectionState = (selectedCount: number, totalCount: number): SelectionState => {
    if (selectedCount === 0) {
        return SelectionState.NONE;
    }
    if (selectedCount === totalCount && totalCount > 0) {
        return SelectionState.ALL;
    }
    return SelectionState.SOME;
};

/**
 * Get range of item IDs between start and end (inclusive)
 */
export const getRangeOfItems = (allItems: string[], startId: string, endId: string): string[] => {
    const startIndex = allItems.indexOf(startId);
    const endIndex = allItems.indexOf(endId);

    if (startIndex === -1 || endIndex === -1) {
        return [endId];
    }

    const [fromIndex, toIndex] = startIndex <= endIndex ? [startIndex, endIndex] : [endIndex, startIndex];

    return allItems.slice(fromIndex, toIndex + 1);
};

/**
 * Filter selected items to only include those that exist in current items
 */
export const filterValidSelections = (selectedIds: Set<string>, currentItemIds: string[]): Set<string> => {
    const validIds = new Set<string>();
    const currentIdsSet = new Set(currentItemIds);

    for (const id of selectedIds) {
        if (currentIdsSet.has(id)) {
            validIds.add(id);
        }
    }

    return validIds;
};

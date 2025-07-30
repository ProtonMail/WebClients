import isTruthy from '@proton/utils/isTruthy';

export const getSelectedItems = <T extends { isLocked?: boolean; uid: string }>(
    items: T[],
    selectedItemIds: string[]
): T[] => {
    if (items) {
        return selectedItemIds
            .map((selectedItemId) => items.find(({ isLocked, ...item }) => !isLocked && selectedItemId === item.uid))
            .filter(isTruthy);
    }

    return [];
};

import isTruthy from '@proton/utils/isTruthy';

// Uses the legacy Device-Id because that's how the global file selection works right now
export const getSelectedDevice = <T extends { id: string }>(items: T[], selectedItemIds: string[]): T[] => {
    if (items) {
        return selectedItemIds.map((selectedItemId) => items.find(({ id }) => selectedItemId === id)).filter(isTruthy);
    }

    return [];
};

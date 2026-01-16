const GUEST_DISPLAY_NAME_STORAGE_KEY = 'guest.displayName';

const getUserDisplayNameStorageKey = (userId: string) => `user.${userId}`;

// store to different keys based on whether the user is a guest or not
// for authenticated users, all unique users should have different keys
export const getDisplayNameStorageKey = (guestMode: boolean, userId?: string): string => {
    if (guestMode || !userId) {
        return GUEST_DISPLAY_NAME_STORAGE_KEY;
    }
    return getUserDisplayNameStorageKey(userId);
};

export const clearDisplayNameStorage = (guestMode: boolean, userId?: string) => {
    if (guestMode || !userId) {
        localStorage.removeItem(GUEST_DISPLAY_NAME_STORAGE_KEY);
    } else {
        localStorage.removeItem(getUserDisplayNameStorageKey(userId));
    }
};

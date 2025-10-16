import { getLocalIDFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';

const WHATS_NEW_KEY = 'lumo-whats-new';

const getStorageKey = (): string => {
    const localID = getLocalIDFromPathname(window.location.pathname);
    return localID !== undefined ? `${WHATS_NEW_KEY}:${localID}` : WHATS_NEW_KEY;
};

export const getSeenFeatureFlags = (): string[] => {
    try {
        const stored = localStorage.getItem(getStorageKey());
        if (stored) {
            const parsed = JSON.parse(stored);
            return Array.isArray(parsed) ? parsed : [];
        }
    } catch {
        // If parsing fails, return empty array
    }
    return [];
};

export const hasSeenFeatureFlag = (flagName: string): boolean => {
    const seenFlags = getSeenFeatureFlags();
    return seenFlags.includes(flagName);
};

export const markFeatureFlagAsSeen = (flagName: string): void => {
    try {
        const seenFlags = getSeenFeatureFlags();
        if (!seenFlags.includes(flagName)) {
            seenFlags.push(flagName);
            localStorage.setItem(getStorageKey(), JSON.stringify(seenFlags));
        }
    } catch {
        // Fail silently if localStorage is unavailable
    }
};

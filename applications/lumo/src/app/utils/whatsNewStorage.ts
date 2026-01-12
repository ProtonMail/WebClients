import { getLocalIDFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';

import type { FeatureFlag } from '../redux/slices/featureFlags';

const WHATS_NEW_KEY = 'lumo-whats-new';

const getStorageKey = (): string => {
    const localID = getLocalIDFromPathname(window.location.pathname);
    return localID !== undefined ? `${WHATS_NEW_KEY}:${localID}` : WHATS_NEW_KEY;
};

export const getSeenFeatureFlags = (): FeatureFlag[] => {
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

export const hasSeenFeatureFlag = (id: string, versionId: string): boolean => {
    const seenFlags = getSeenFeatureFlags();
    return seenFlags.some((flag) => flag.id === id && flag.versionId === versionId);
};

export const hasDeclinedFeatureFlag = (id: string, versionId: string): boolean => {
    const seenFlags = getSeenFeatureFlags();
    return seenFlags.some((flag) => flag.id === id && flag.versionId === versionId && flag.wasDeclined);
};

export const markFeatureFlagAsSeen = (id: string, versionId: string, wasDeclined: boolean): void => {
    try {
        const seenFlags = getSeenFeatureFlags();
        const existingFlag = seenFlags.find((flag) => flag.id === id && flag.versionId === versionId);

        if (!existingFlag) {
            seenFlags.push({
                id,
                versionId,
                dismissedAt: Date.now(),
                wasDeclined,
            });
            localStorage.setItem(getStorageKey(), JSON.stringify(seenFlags));
        }
    } catch {
        // Fail silently if localStorage is unavailable
    }
};

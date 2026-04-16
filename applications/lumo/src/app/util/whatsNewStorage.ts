import type { FeatureFlag } from '../redux/slices/featureFlags';
import { readScopedLocalStorageJson, writeScopedLocalStorageJson } from './lumoScopedLocalStorage';

const WHATS_NEW_KEY = 'lumo-whats-new';

export const getSeenFeatureFlags = (): FeatureFlag[] => {
    const parsed = readScopedLocalStorageJson<unknown>(WHATS_NEW_KEY, []);
    return Array.isArray(parsed) ? parsed : [];
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
            writeScopedLocalStorageJson(WHATS_NEW_KEY, seenFlags);
        }
    } catch {
        // Fail silently if localStorage is unavailable
    }
};

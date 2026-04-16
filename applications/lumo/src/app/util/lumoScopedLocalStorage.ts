import { getLocalIDFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';

/**
 * Lumo localStorage keys are optionally scoped by account local ID (same pattern as `lumo-whats-new`).
 */
export const getLumoScopedStorageKey = (baseKey: string): string => {
    if (typeof window === 'undefined') {
        return baseKey;
    }
    const localID = getLocalIDFromPathname(window.location.pathname);
    return localID !== undefined ? `${baseKey}:${localID}` : baseKey;
};

export const readScopedLocalStorageJson = <T>(baseKey: string, fallback: T): T => {
    try {
        if (typeof window === 'undefined') {
            return fallback;
        }
        const stored = localStorage.getItem(getLumoScopedStorageKey(baseKey));
        if (!stored) {
            return fallback;
        }
        return JSON.parse(stored) as T;
    } catch {
        return fallback;
    }
};

export const writeScopedLocalStorageJson = (baseKey: string, value: unknown): void => {
    try {
        if (typeof window === 'undefined') {
            return;
        }
        localStorage.setItem(getLumoScopedStorageKey(baseKey), JSON.stringify(value));
    } catch {
        // Fail silently if localStorage is unavailable
    }
};

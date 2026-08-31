import type { IStorageProvider } from '@unleash/proxy-client-react';

import { deleteCookie } from '@proton/shared/lib/helpers/cookies';
import { getItem, getKeys, removeItem, setItem } from '@proton/shared/lib/helpers/storage';

import { FLAGS_WITH_VARIANT } from '../UnleashFeatureFlagsVariants';
import saveAllowlistedFlagInCookies, { UNLEASH_FLAG_COOKIE_NAME } from './UnleashCookiesProvider';

export const featureFlagStorageKey = 'repo';

/**
 * The subset of storage operations this provider needs. Kept narrower than the DOM `Storage`
 * interface so it can be backed by the safe `@proton/shared` localStorage wrappers, which
 * swallow the errors thrown when storage is unavailable or restricted.
 */
export interface UnleashStorage {
    getItem: (key: string) => string | null | undefined;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
    getKeys: () => string[];
}

const safeLocalStorage: UnleashStorage = { getItem, setItem, removeItem, getKeys };

export default class ProtonUnleashStorageProvider implements IStorageProvider {
    private prefix = 'unleash:repository';

    constructor(private storage: UnleashStorage = safeLocalStorage) {}

    public async save(name: string, data: any) {
        const serializedValue = JSON.stringify(data);
        const key = `${this.prefix}:${name}`;
        try {
            this.storage.setItem(key, serializedValue);
            if (name === featureFlagStorageKey) {
                saveAllowlistedFlagInCookies(data, FLAGS_WITH_VARIANT);
            }
        } catch (e) {}
    }

    // Since we use (sync) localStorage, this is a bit of a workaround to respect the `IStorageProvider` signature
    // of returning promises for `get` and `set` while still having the possibility to synchronously read persisted
    // data to bootstrap the unleash client with persisted feature flags.
    public getSync(name: string) {
        try {
            const key = `${this.prefix}:${name}`;
            const data = this.storage.getItem(key);
            return data ? JSON.parse(data) : undefined;
        } catch (e) {}
    }

    public async get(name: string) {
        return this.getSync(name);
    }

    /**
     * Clears all Unleash feature flag data from localStorage and cookies.
     * Use this before force reload to ensure fresh feature flag state.
     */
    public clear(): void {
        try {
            // Clear all localStorage entries with unleash prefix
            this.storage
                .getKeys()
                .filter((key) => key.startsWith(this.prefix))
                .forEach((key) => this.storage.removeItem(key));

            // Clear feature flags cookie
            deleteCookie(UNLEASH_FLAG_COOKIE_NAME);
        } catch (e) {
            // Silent fail - storage might be unavailable or restricted
        }
    }
}

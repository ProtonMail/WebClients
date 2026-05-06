import type { IStorageProvider } from '@unleash/proxy-client-react';

import { deleteCookie } from '@proton/shared/lib/helpers/cookies';

import { FLAGS_WITH_VARIANT } from '../UnleashFeatureFlagsVariants';
import saveWhitelistedFlagInCookies, { UNLEASH_FLAG_COOKIE_NAME } from './UnleashCookiesProvider';

export const featureFlagStorageKey = 'repo';

export default class ProtonUnleashStorageProvider implements IStorageProvider {
    private prefix = 'unleash:repository';

    constructor(private storage: Storage = global.localStorage) {}

    public async save(name: string, data: any) {
        const serializedValue = JSON.stringify(data);
        const key = `${this.prefix}:${name}`;
        try {
            this.storage.setItem(key, serializedValue);
            if (name === featureFlagStorageKey) {
                saveWhitelistedFlagInCookies(data, FLAGS_WITH_VARIANT);
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
            const keysToRemove: string[] = [];
            for (let i = 0; i < this.storage.length; i++) {
                const key = this.storage.key?.(i);
                if (key?.startsWith(this.prefix)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach((key) => this.storage.removeItem(key));

            // Clear feature flags cookie
            deleteCookie(UNLEASH_FLAG_COOKIE_NAME);
        } catch (e) {
            // Silent fail - storage might be unavailable or restricted
        }
    }
}

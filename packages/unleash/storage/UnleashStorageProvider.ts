import type { IStorageProvider } from '@unleash/proxy-client-react';

import { FLAGS_WITH_VARIANT } from '../UnleashFeatureFlagsVariants';
import saveWhitelistedFlagInCookies from './UnleashCookiesProvider';

export const featureFlagStorageKey = 'repo';

export default class ProtonUnleashStorageProvider implements IStorageProvider {
    private prefix = 'unleash:repository';

    constructor(private storage: Pick<typeof global.localStorage, 'setItem' | 'getItem'> = global.localStorage) {}

    public async save(name: string, data: any) {
        const serializedValue = JSON.stringify(data);
        const key = `${this.prefix}:${name}`;
        try {
            this.storage.setItem(key, serializedValue);
            if (key === featureFlagStorageKey) {
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
}

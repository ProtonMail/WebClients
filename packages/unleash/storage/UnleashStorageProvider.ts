import type { IStorageProvider } from '@unleash/proxy-client-react';

import { FLAGS_WITH_VARIANT } from '../UnleashFeatureFlagsVariants';
import { type FeatureFlagToggle } from '../interface';
import saveWhitelistedFlagInCookies from './UnleashCookiesProvider';

export default class ProtonUnleashStorageProvider implements IStorageProvider {
    private prefix = 'unleash:repository';

    public async save(name: string, data: FeatureFlagToggle[]) {
        const repo = JSON.stringify(data);

        const key = `${this.prefix}:${name}`;
        try {
            saveWhitelistedFlagInCookies(data, FLAGS_WITH_VARIANT);
            window.localStorage.setItem(key, repo);
        } catch (e) {}
    }

    public get(name: string) {
        try {
            const key = `${this.prefix}:${name}`;
            const data = window.localStorage.getItem(key);
            return data ? JSON.parse(data) : undefined;
        } catch (e) {}
    }
}

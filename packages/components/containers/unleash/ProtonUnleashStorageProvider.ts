import { IStorageProvider } from 'unleash-proxy-client';

// Ignore storage of feature flags to avoid flickering of flags due to differing constraints.
const ignoredKey = 'repo';

export default class ProtonUnleashStorageProvider implements IStorageProvider {
    private prefix = 'unleash:repository';

    public async save(name: string, data: any) {
        if (name === ignoredKey) {
            return;
        }
        const repo = JSON.stringify(data);
        const key = `${this.prefix}:${name}`;
        try {
            window.localStorage.setItem(key, repo);
        } catch (e) {}
    }

    public get(name: string) {
        if (name === ignoredKey) {
            return;
        }
        try {
            const key = `${this.prefix}:${name}`;
            const data = window.localStorage.getItem(key);
            return data ? JSON.parse(data) : undefined;
        } catch (e) {}
    }
}

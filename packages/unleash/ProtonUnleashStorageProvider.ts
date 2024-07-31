import type { IStorageProvider } from '@unleash/proxy-client-react';

export default class ProtonUnleashStorageProvider implements IStorageProvider {
    private prefix = 'unleash:repository';

    public async save(name: string, data: any) {
        const repo = JSON.stringify(data);
        const key = `${this.prefix}:${name}`;
        try {
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

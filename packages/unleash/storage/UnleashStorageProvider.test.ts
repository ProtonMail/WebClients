import { UnleashClient } from 'unleash-proxy-client';

import ProtonUnleashStorageProvider, { featureFlagStorageKey } from './UnleashStorageProvider';

const mockFeatureFlags = {
    toggles: [
        {
            name: 'TestFeature',
            enabled: true,
            variant: {
                name: 'default',
                enabled: false,
            },
            impressionData: false,
        },
    ],
};

const getFetchMock = () => {
    return jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockFeatureFlags,
        headers: {
            get: () => '',
        },
    }) as any;
};

const getStorageMock = () => {
    const localStorageMock: { [key: string]: any } = {};
    const mock = {
        setItem: jest.fn().mockImplementation((key: string, value: any) => {
            localStorageMock[key] = value;
        }),
        getItem: jest.fn().mockImplementation((key: string) => {
            return localStorageMock[key] || null;
        }),
    };
    return { mock, storageProvider: new ProtonUnleashStorageProvider(mock) };
};

describe('UnleashStorageProvider', () => {
    let client: UnleashClient | undefined;

    afterEach(() => {
        client?.stop();
    });

    it('should use "repo" as the storage key for feature flags', async () => {
        const { mock, storageProvider } = getStorageMock();

        // Create unleash client with our storage provider
        client = new UnleashClient({
            url: 'http://localhost:4242/api/frontend',
            clientKey: 'test-key',
            appName: 'test-app',
            storageProvider,
            fetch: getFetchMock(),
            disableMetrics: true,
        });

        // Start the client
        await client.start();

        // Verify that localStorage.setItem was called with the correct key
        const expectedKey = `unleash:repository:${featureFlagStorageKey}`;
        expect(mock.setItem).toHaveBeenCalledWith(expectedKey, JSON.stringify(mockFeatureFlags.toggles));

        // Verify the actual key used is 'unleash:repository:repo'
        expect(expectedKey).toBe('unleash:repository:repo');

        // Verify we can retrieve the data using the same key
        const storedData = await storageProvider.get(featureFlagStorageKey);
        expect(storedData).toBeDefined();
        expect(Array.isArray(storedData)).toBe(true);
    });

    it('should allow bootstrapping default feature flags', async () => {
        const { storageProvider } = getStorageMock();
        await storageProvider.save(featureFlagStorageKey, mockFeatureFlags.toggles);

        client = new UnleashClient({
            url: 'http://localhost:4242/api/frontend',
            clientKey: 'test-key',
            appName: 'test-app',
            storageProvider,
            fetch: getFetchMock(),
            disableMetrics: true,
            bootstrap: storageProvider.getSync(featureFlagStorageKey),
        });

        expect(client.isEnabled('TestFeature')).toBe(true);
        expect(client.getAllToggles().length).toBe(1);
    });
});

import { base64ToMasterKey } from '../crypto';
import type { MasterKeysBundle } from '../types';
import { buildMasterKeyContext, getLegacyMasterKeyBase64, mergeRefreshedMasterKeysBundle } from './masterKeys';

jest.mock('../crypto', () => ({
    base64ToMasterKey: jest.fn((keyBase64: string) => Promise.resolve({ type: 'AesKwCryptoKey', id: keyBase64 })),
}));

const mockedBase64ToMasterKey = base64ToMasterKey as jest.MockedFunction<typeof base64ToMasterKey>;

const makeBundle = (): MasterKeysBundle => ({
    primaryMasterKeyId: 'primary',
    primaryMasterKey: 'PRIMARY_KEY',
    masterKeys: { primary: 'PRIMARY_KEY', legacy1: 'LEGACY_1', legacy2: 'LEGACY_2' },
});

describe('buildMasterKeyContext', () => {
    beforeEach(() => {
        mockedBase64ToMasterKey.mockClear();
    });

    it('imports each key once per bundle, however many callers ask', async () => {
        const bundle = makeBundle();

        const contexts = await Promise.all(Array.from({ length: 50 }, () => buildMasterKeyContext(bundle)));

        expect(mockedBase64ToMasterKey).toHaveBeenCalledTimes(3);
        expect(new Set(contexts).size).toBe(1);
        expect(contexts[0].legacy).toHaveLength(2);
    });

    it('re-imports for a different bundle object', async () => {
        await buildMasterKeyContext(makeBundle());
        await buildMasterKeyContext(makeBundle());

        expect(mockedBase64ToMasterKey).toHaveBeenCalledTimes(6);
    });

    it('does not cache a failed import', async () => {
        const bundle = makeBundle();
        mockedBase64ToMasterKey.mockRejectedValueOnce(new Error('import failed'));

        await expect(buildMasterKeyContext(bundle)).rejects.toThrow('import failed');
        await expect(buildMasterKeyContext(bundle)).resolves.toMatchObject({ legacy: expect.any(Array) });
    });
});

describe('mergeRefreshedMasterKeysBundle', () => {
    it('keeps the refreshed primary while preserving address-key-recovered legacy keys', () => {
        const recoveredBundle: MasterKeysBundle = {
            primaryMasterKeyId: 'address-primary-envelope',
            primaryMasterKey: 'PRIMARY_KEY',
            masterKeys: {
                'address-legacy-envelope': 'LEGACY_KEY',
                'address-primary-envelope': 'PRIMARY_KEY',
            },
        };
        const refreshedBundle: MasterKeysBundle = {
            primaryMasterKeyId: 'user-primary-envelope',
            primaryMasterKey: 'PRIMARY_KEY',
            masterKeys: {
                'user-primary-envelope': 'PRIMARY_KEY',
            },
        };

        const mergedBundle = mergeRefreshedMasterKeysBundle(recoveredBundle, refreshedBundle);

        expect(mergedBundle).toEqual({
            primaryMasterKeyId: 'user-primary-envelope',
            primaryMasterKey: 'PRIMARY_KEY',
            masterKeys: {
                'address-legacy-envelope': 'LEGACY_KEY',
                'address-primary-envelope': 'PRIMARY_KEY',
                'user-primary-envelope': 'PRIMARY_KEY',
            },
        });
        expect(getLegacyMasterKeyBase64(mergedBundle)).toContain('LEGACY_KEY');
    });

    it('prefers refreshed key material if an envelope ID is present in both bundles', () => {
        const recoveredBundle: MasterKeysBundle = {
            primaryMasterKeyId: 'shared-envelope',
            primaryMasterKey: 'OLD_KEY',
            masterKeys: { 'shared-envelope': 'OLD_KEY' },
        };
        const refreshedBundle: MasterKeysBundle = {
            primaryMasterKeyId: 'shared-envelope',
            primaryMasterKey: 'REFRESHED_KEY',
            masterKeys: { 'shared-envelope': 'REFRESHED_KEY' },
        };

        expect(mergeRefreshedMasterKeysBundle(recoveredBundle, refreshedBundle)).toEqual(refreshedBundle);
    });
});

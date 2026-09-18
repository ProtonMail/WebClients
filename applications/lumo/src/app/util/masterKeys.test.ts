import type { MasterKeysBundle } from '../types';
import { getLegacyMasterKeyBase64, mergeRefreshedMasterKeysBundle } from './masterKeys';

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

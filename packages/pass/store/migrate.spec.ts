import { createTestItem } from '@proton/pass/lib/items/item.test.utils';
import type { EncryptedPassCache } from '@proton/pass/types/worker/cache';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import { cacheGuard, migrate } from './migrate';
import { INITIAL_HIGHSECURITY_SETTINGS, rootReducer } from './reducers';
import { INITIAL_ORGANIZATION_SETTINGS } from './reducers/organization';

const snapshot = { shareManagers: [] };

describe('`migrate`', () => {
    test('should sanitize invalid items', () => {
        const state = rootReducer(undefined, { type: '__TEST__' });
        const shareId = uniqueId();

        const login = createTestItem('login');
        const note = createTestItem('note', { shareId });

        state.items.byShareId[login.shareId] = { [login.itemId]: login };

        state.items.byShareId[shareId] = {
            [uniqueId()]: {},
            [uniqueId()]: null,
            [uniqueId()]: undefined,
            [uniqueId()]: false,
            [note.itemId]: note,
        } as any;

        const migration = migrate(state, snapshot, { from: '1.0.0', to: '2.0.0 ' });

        expect(migration.items.byShareId[shareId]).toStrictEqual({ [note.itemId]: note });
        expect(migration.items.byShareId[login.shareId]).toStrictEqual({ [login.itemId]: login });
    });

    test('should move organization data out of user state', () => {
        const state = rootReducer(undefined, { type: '__TEST__' });
        const organization = { ID: uniqueId(), Name: 'ProtonB2B' };
        state.user = { organization } as any;
        const migration = migrate(state, snapshot, { from: '1.0.0', to: '2.0.0 ' });

        expect('organization' in migration.user).toBe(false);

        expect(migration.organization).toStrictEqual({
            organization,
            canUpdate: false,
            settings: INITIAL_ORGANIZATION_SETTINGS,
            groups: [],
        });
    });

    test('should hydrate initial `HighSecurity` settings if empty', () => {
        const state = rootReducer(undefined, { type: '__TEST__' });
        state.user.userSettings = {} as any;
        const migration = migrate(state, snapshot, { from: '1.0.0', to: '2.0.0 ' });

        expect(migration.user.userSettings!.HighSecurity).toStrictEqual(INITIAL_HIGHSECURITY_SETTINGS);
    });

    test('should auto-hydrate `addressID` from crypto snapshot when missing', () => {
        const state = rootReducer(undefined, { type: '__TEST__' });
        const shareId = uniqueId();
        const addressId = uniqueId();

        state.shares[shareId] = { id: shareId } as any;
        const snapshotWithShare = { shareManagers: [[shareId, { share: { addressId } }]] } as any;
        const migration = migrate(state, snapshotWithShare, { from: '1.0.0', to: '2.0.0' });

        expect(migration.shares[shareId].addressId).toBe(addressId);
    });
});

describe('`cacheGuard`', () => {
    const createMockCache = (version: string): EncryptedPassCache => ({
        version,
        encryptedCacheKey: 'cache-key',
        snapshot: 'encrypted-snapshot',
        state: 'encrypted-state',
        salt: 'encryption-salt',
    });

    test.each(['1.0.0', '0.0.0.9', '1.0.0-rc0'])('should return original cache when `%s` is older than app version', (version) => {
        const cache = createMockCache(version);

        expect(cacheGuard(cache, '2.0.0')).toEqual(cache);
        expect(cacheGuard(cache, '1.0.1')).toEqual(cache);
        expect(cacheGuard(cache, '1.2.0-rc1')).toEqual(cache);
    });

    test('should return original cache when versions are equal', () => {
        const cache = createMockCache('2.0.0');
        expect(cacheGuard(cache, '2.0.0')).toEqual(cache);
    });

    test.each(['2.0.2', '2.1.0.1', '2.2.0-rc1'])('should return empty object when `%s` is newer than app version', (version) => {
        const cache = createMockCache(version);

        expect(cacheGuard(cache, '1.9.0')).toEqual({});
        expect(cacheGuard(cache, '2.0.0')).toEqual({});
        expect(cacheGuard(cache, '2.0.0-rc2')).toEqual({});
    });

    test('should handle missing version in cache', () => {
        const cache = createMockCache('');
        delete cache.version;

        expect(cacheGuard(cache, '1.0.0')).toEqual({});
        expect(cacheGuard(createMockCache(''), '2.0.0')).toEqual({});
    });
});

import { createTestItem } from '@proton/pass/lib/items/item.test.utils';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import { migrate } from './migrate';
import { INITIAL_HIGHSECURITY_SETTINGS, rootReducer } from './reducers';
import { INITIAL_ORGANIZATION_SETTINGS } from './reducers/organization';

describe('migrate', () => {
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

        const migration = migrate(state);

        expect(migration.items.byShareId[shareId]).toStrictEqual({ [note.itemId]: note });
        expect(migration.items.byShareId[login.shareId]).toStrictEqual({ [login.itemId]: login });
    });

    test('should move organization data out of user state', () => {
        const state = rootReducer(undefined, { type: '__TEST__' });
        const organization = { ID: uniqueId(), Name: 'ProtonB2B' };
        state.user = { organization } as any;
        const migration = migrate(state);

        expect('organization' in migration.user).toBe(false);

        expect(migration.organization).toStrictEqual({
            organization,
            canUpdate: false,
            settings: INITIAL_ORGANIZATION_SETTINGS,
        });
    });

    test('should hydrate initial `HighSecurity` settings if empty', () => {
        const state = rootReducer(undefined, { type: '__TEST__' });
        state.user.userSettings = {} as any;
        const migration = migrate(state);

        expect(migration.user.userSettings!.HighSecurity).toStrictEqual(INITIAL_HIGHSECURITY_SETTINGS);
    });
});

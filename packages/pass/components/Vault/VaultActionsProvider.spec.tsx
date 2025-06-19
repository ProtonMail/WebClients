import { createAuthStore, exposeAuthStore } from '@proton/pass/lib/auth/store';
import createStore from '@proton/shared/lib/helpers/store';

import { handleSelect } from './VaultActionsProvider';

describe('VaultActionsProvider', () => {
    exposeAuthStore(createAuthStore(createStore()));

    test('navigate to all should go to /', () => {
        const navigate = jest.fn();

        handleSelect(navigate, 'all');
        expect(navigate.mock.lastCall[0]).toBe('/');
    });

    test('navigate to trash should go to /trash', () => {
        const navigate = jest.fn();

        handleSelect(navigate, 'trash');
        expect(navigate.mock.lastCall[0]).toBe('/trash');
    });

    test('navigate to a vault should go to /share/vaultId', () => {
        const navigate = jest.fn();

        handleSelect(navigate, 'vaultId');
        expect(navigate.mock.lastCall[0]).toBe('/share/vaultId');
    });

    test('change vault should not override the filters', () => {
        const navigate = jest.fn();

        handleSelect(navigate, 'all');
        expect(navigate.mock.lastCall[1].filters.search).toBeUndefined();
        handleSelect(navigate, 'trash');
        expect(navigate.mock.lastCall[1].filters.search).toBeUndefined();
        handleSelect(navigate, 'test');
        expect(navigate.mock.lastCall[1].filters.search).toBeUndefined();
    });
});

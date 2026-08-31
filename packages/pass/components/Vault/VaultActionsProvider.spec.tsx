import { createAuthStore, exposeAuthStore } from '../../lib/auth/store';
import { createMemoryStore } from '../../utils/store';
import { handleSelect } from './VaultActionsProvider';

describe('VaultActionsProvider', () => {
    exposeAuthStore(createAuthStore(createMemoryStore()));

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

        for (const selected of ['all', 'trash', 'test'] as const) {
            handleSelect(navigate, selected);
            expect(navigate.mock.lastCall[1].filters.search).toBeUndefined();
            expect(navigate.mock.lastCall[1].filters.type).toBeUndefined();
            expect(navigate.mock.lastCall[1].filters.sort).toBeUndefined();
        }
    });

    test('navigate to trash should only clear selectedShareId', () => {
        const navigate = jest.fn();

        handleSelect(navigate, 'trash');

        expect(navigate.mock.lastCall[1].filters).toEqual({ selectedShareId: null });
    });
});

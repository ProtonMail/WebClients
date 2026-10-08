import { jest } from '@jest/globals';

import type { LumoState } from '../store';

// This project runs Jest in ESM mode, where static imports resolve before a hoisted `jest.mock`
// would take effect. Mocks are therefore registered with `jest.doMock` + a fresh dynamic
// `import()` inside each test — see `lumoBootstrapRecovery.test.ts` for the same pattern.

const READY_MASTER_KEY_STATE = {
    status: 'ready' as const,
    primaryMasterKeyId: 'fresh-envelope',
    primaryMasterKey: 'FRESH_MASTER_KEY',
    masterKeys: { 'fresh-envelope': 'FRESH_MASTER_KEY' },
};

function makeState(remoteUserSettingsUndecryptable: boolean): LumoState {
    return {
        credentials: { masterKeyState: READY_MASTER_KEY_STATE },
        initialization: {
            reduxLoadedFromIdb: true,
            lumoUserSettingsBootstrapped: true,
            lastSpacesPullAt: 0,
            remoteUserSettingsUndecryptable,
        },
    } as unknown as LumoState;
}

describe('saveLumoUserSettingsToRemote — must not clobber an undecryptable remote blob (LUMO-853)', () => {
    afterEach(() => jest.resetModules());

    it('skips the remote PUT/POST entirely when the remote blob is flagged as undecryptable', async () => {
        const getUserSettings = jest.fn(() => Promise.resolve({ UserSettingsTag: 'x', Encrypted: 'y' }));
        const putUserSettings = jest.fn(() => Promise.resolve(undefined));
        const postUserSettings = jest.fn(() => Promise.resolve(undefined));

        jest.doMock('../../crypto', () => ({
            base64ToMasterKey: () => Promise.resolve({ wrappingKey: {} }),
        }));
        jest.doMock('../../serialization', () => ({
            serializeUserSettings: () => Promise.resolve({ UserSettingsTag: 'tag', Encrypted: 'enc' }),
        }));

        const { saveLumoUserSettingsToRemote } = await import('./lumoUserSettingsThunks');

        const thunk = saveLumoUserSettingsToRemote({ theme: 'dark' } as never);
        await thunk(
            jest.fn() as never,
            () => makeState(true),
            { lumoApi: { getUserSettings, putUserSettings, postUserSettings } } as never
        );

        expect(getUserSettings).not.toHaveBeenCalled();
        expect(putUserSettings).not.toHaveBeenCalled();
        expect(postUserSettings).not.toHaveBeenCalled();
    });

    it('saves normally when nothing is flagged as undecryptable', async () => {
        const getUserSettings = jest.fn(() => Promise.resolve({ UserSettingsTag: 'x', Encrypted: 'y' }));
        const putUserSettings = jest.fn(() => Promise.resolve(undefined));
        const postUserSettings = jest.fn(() => Promise.resolve(undefined));

        jest.doMock('../../crypto', () => ({
            base64ToMasterKey: () => Promise.resolve({ wrappingKey: {} }),
        }));
        jest.doMock('../../serialization', () => ({
            serializeUserSettings: () => Promise.resolve({ UserSettingsTag: 'tag', Encrypted: 'enc' }),
        }));

        const { saveLumoUserSettingsToRemote } = await import('./lumoUserSettingsThunks');

        const thunk = saveLumoUserSettingsToRemote({ theme: 'dark' } as never);
        await thunk(
            jest.fn() as never,
            () => makeState(false),
            { lumoApi: { getUserSettings, putUserSettings, postUserSettings } } as never
        );

        expect(putUserSettings).toHaveBeenCalledTimes(1);
        expect(postUserSettings).not.toHaveBeenCalled();
    });
});

describe('loadLumoUserSettingsFromRemote — flags an existing-but-undecryptable remote blob (LUMO-853)', () => {
    afterEach(() => jest.resetModules());

    it('dispatches setRemoteUserSettingsUndecryptable(true) when a blob exists but decrypts to nothing', async () => {
        jest.doMock('../../serialization', () => ({
            deserializeUserSettingsWithMasterKeys: () =>
                Promise.resolve({ userSettings: null, needsMasterKeyMigration: false }),
        }));
        jest.doMock('../../util/masterKeys', () => ({
            buildMasterKeyContext: () => Promise.resolve({ primary: { id: 'primary' }, legacy: [] }),
        }));

        const { loadLumoUserSettingsFromRemote } = await import('./lumoUserSettingsThunks');
        const { setRemoteUserSettingsUndecryptable } = await import('./meta/initialization');

        const getUserSettings = jest.fn(() => Promise.resolve({ UserSettingsTag: 'x', Encrypted: 'stale-blob' }));
        const dispatched: unknown[] = [];
        const dispatch = jest.fn((action: unknown) => {
            dispatched.push(action);
            return action;
        });

        const thunk = loadLumoUserSettingsFromRemote();
        const result = await thunk(dispatch as never, () => makeState(false), { lumoApi: { getUserSettings } } as never);

        expect((result as { payload: unknown }).payload).toBeNull();
        expect(dispatched).toEqual(
            expect.arrayContaining([expect.objectContaining(setRemoteUserSettingsUndecryptable(true))])
        );
    });

    it('clears the flag once a load actually decrypts settings', async () => {
        const decryptedSettings = { theme: 'dark', personalization: {} };
        jest.doMock('../../serialization', () => ({
            deserializeUserSettingsWithMasterKeys: () =>
                Promise.resolve({ userSettings: decryptedSettings, needsMasterKeyMigration: false }),
        }));
        jest.doMock('../../util/masterKeys', () => ({
            buildMasterKeyContext: () => Promise.resolve({ primary: { id: 'primary' }, legacy: [] }),
        }));

        const { loadLumoUserSettingsFromRemote } = await import('./lumoUserSettingsThunks');
        const { setRemoteUserSettingsUndecryptable } = await import('./meta/initialization');

        const getUserSettings = jest.fn(() => Promise.resolve({ UserSettingsTag: 'x', Encrypted: 'good-blob' }));
        const dispatched: unknown[] = [];
        const dispatch = jest.fn((action: unknown) => {
            dispatched.push(action);
            return action;
        });

        const thunk = loadLumoUserSettingsFromRemote();
        await thunk(dispatch as never, () => makeState(true), { lumoApi: { getUserSettings } } as never);

        expect(dispatched).toEqual(
            expect.arrayContaining([expect.objectContaining(setRemoteUserSettingsUndecryptable(false))])
        );
    });
});

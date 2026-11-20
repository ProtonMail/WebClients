import type { LumoState } from '../store';

// Mocks are registered with `vi.doMock` + `vi.resetModules()` + a fresh dynamic
// `import()` inside each test so every test gets its own module graph — see `lumoBootstrapRecovery.test.ts` for the same pattern.

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
            spacesPullSettled: false,
            remoteUserSettingsUndecryptable,
        },
    } as unknown as LumoState;
}

describe('saveLumoUserSettingsToRemote — must not clobber an undecryptable remote blob (LUMO-853)', () => {
    afterEach(() => vi.resetModules());

    it('skips writes while the same undecryptable blob remains protected', async () => {
        const getUserSettings = vi.fn(() => Promise.resolve({ userSettingsTag: 'x', encrypted: 'y' }));
        const putUserSettings = vi.fn(() => Promise.resolve(undefined));
        const postUserSettings = vi.fn(() => Promise.resolve(undefined));

        vi.doMock('../../serialization', () => ({
            deserializeUserSettingsWithMasterKeys: () =>
                Promise.resolve({ userSettings: null, needsMasterKeyMigration: false }),
        }));
        vi.doMock('../../util/masterKeys', () => ({
            buildMasterKeyContext: () => Promise.resolve({ primary: { id: 'primary' }, legacy: [] }),
        }));

        const { loadLumoUserSettingsFromRemote, saveLumoUserSettingsToRemote } =
            await import('./lumoUserSettingsThunks');
        const extra = { lumoApi: { getUserSettings, putUserSettings, postUserSettings } } as never;
        await loadLumoUserSettingsFromRemote()(vi.fn() as never, () => makeState(false), extra);

        const thunk = saveLumoUserSettingsToRemote({ theme: 'dark' });
        await thunk(vi.fn() as never, () => makeState(true), extra);

        expect(putUserSettings).not.toHaveBeenCalled();
        expect(postUserSettings).not.toHaveBeenCalled();
    });

    it('saves normally when nothing is flagged as undecryptable', async () => {
        const getUserSettings = vi.fn(() => Promise.resolve({ UserSettingsTag: 'x', Encrypted: 'y' }));
        const putUserSettings = vi.fn(() => Promise.resolve(undefined));
        const postUserSettings = vi.fn(() => Promise.resolve(undefined));

        vi.doMock('../../serialization', () => ({
            serializeUserSettings: () => Promise.resolve({ UserSettingsTag: 'tag', Encrypted: 'enc' }),
            deserializeUserSettingsWithMasterKeys: () =>
                Promise.resolve({
                    userSettings: { theme: 'light', personalization: {} },
                    needsMasterKeyMigration: false,
                }),
        }));
        vi.doMock('../../util/masterKeys', () => ({
            buildMasterKeyContext: () => Promise.resolve({ primary: { id: 'primary' }, legacy: [] }),
        }));

        const { saveLumoUserSettingsToRemote } = await import('./lumoUserSettingsThunks');

        const thunk = saveLumoUserSettingsToRemote({ theme: 'dark' });
        await thunk(vi.fn() as never, () => makeState(false), {
            lumoApi: { getUserSettings, putUserSettings, postUserSettings },
        } as never);

        expect(putUserSettings).toHaveBeenCalledTimes(1);
        expect(postUserSettings).not.toHaveBeenCalled();
    });
});

describe('loadLumoUserSettingsFromRemote — flags an existing-but-undecryptable remote blob (LUMO-853)', () => {
    afterEach(() => vi.resetModules());

    it('dispatches setRemoteUserSettingsUndecryptable(true) when a blob exists but decrypts to nothing', async () => {
        vi.doMock('../../serialization', () => ({
            deserializeUserSettingsWithMasterKeys: () =>
                Promise.resolve({ userSettings: null, needsMasterKeyMigration: false }),
        }));
        vi.doMock('../../util/masterKeys', () => ({
            buildMasterKeyContext: () => Promise.resolve({ primary: { id: 'primary' }, legacy: [] }),
        }));

        const { loadLumoUserSettingsFromRemote } = await import('./lumoUserSettingsThunks');
        const { setRemoteUserSettingsUndecryptable } = await import('./meta/initialization');

        const getUserSettings = vi.fn(() => Promise.resolve({ userSettingsTag: 'x', encrypted: 'stale-blob' }));
        const dispatched: unknown[] = [];
        const dispatch = vi.fn((action: unknown) => {
            dispatched.push(action);
            return action;
        });

        const thunk = loadLumoUserSettingsFromRemote();
        const result = await thunk(dispatch as never, () => makeState(false), {
            lumoApi: { getUserSettings },
        } as never);

        expect((result as { payload: unknown }).payload).toBeNull();
        expect(dispatched).toEqual(
            expect.arrayContaining([expect.objectContaining(setRemoteUserSettingsUndecryptable(true))])
        );
    });

    it('clears the flag once a load actually decrypts settings', async () => {
        const decryptedSettings = { theme: 'dark', personalization: {} };
        vi.doMock('../../serialization', () => ({
            deserializeUserSettingsWithMasterKeys: () =>
                Promise.resolve({ userSettings: decryptedSettings, needsMasterKeyMigration: false }),
        }));
        vi.doMock('../../util/masterKeys', () => ({
            buildMasterKeyContext: () => Promise.resolve({ primary: { id: 'primary' }, legacy: [] }),
        }));

        const { loadLumoUserSettingsFromRemote } = await import('./lumoUserSettingsThunks');
        const { setRemoteUserSettingsUndecryptable } = await import('./meta/initialization');

        const getUserSettings = vi.fn(() => Promise.resolve({ UserSettingsTag: 'x', Encrypted: 'good-blob' }));
        const dispatched: unknown[] = [];
        const dispatch = vi.fn((action: unknown) => {
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

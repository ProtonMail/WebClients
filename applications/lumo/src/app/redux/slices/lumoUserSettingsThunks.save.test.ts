import { jest } from '@jest/globals';

import type { LumoState } from '../store';
import type { LumoUserSettings, Memory } from './lumoUserSettingsTypes';

// This project runs Jest in ESM mode, where static imports resolve before a hoisted `jest.mock`
// would take effect. Mocks are therefore registered with `jest.doMock` + a fresh dynamic
// `import()` inside each test — see `lumoUserSettingsThunks.remoteUndecryptable.test.ts`.

const memory = (id: string): Memory => ({ id, content: `memory ${id}`, createdAt: 1, source: 'user' });

const settings = (overrides: Partial<LumoUserSettings> = {}): LumoUserSettings =>
    ({
        theme: 'auto',
        personalization: {
            nickname: '',
            jobRole: '',
            personality: 'default',
            traits: [],
            lumoTraits: '',
            additionalContext: '',
            enableForNewChats: true,
        },
        featureFlags: [],
        showGallerySuggestions: true,
        ...overrides,
    }) as LumoUserSettings;

const makeState = (lumoUserSettings: LumoUserSettings = settings(), lumoDataLossWarningShown = false): LumoState =>
    ({
        credentials: {
            masterKeyState: {
                status: 'ready',
                primaryMasterKeyId: 'envelope',
                primaryMasterKey: 'MASTER_KEY',
                masterKeys: { envelope: 'MASTER_KEY' },
            },
        },
        initialization: { remoteUserSettingsUndecryptable: false, lumoDataLossWarningShown },
        lumoUserSettings,
    }) as unknown as LumoState;

const REMOTE_BLOB = { userSettingsTag: 'tag', encrypted: 'blob', createTime: '', updateTime: '' };

/** Mocks crypto with a decrypted server copy, and returns the settings passed to the serializer. */
const setUp = async (remoteUserSettings: LumoUserSettings | null) => {
    const serialized: LumoUserSettings[] = [];
    jest.doMock('../../serialization', () => ({
        serializeUserSettings: (userSettings: LumoUserSettings) => {
            serialized.push(userSettings);
            return Promise.resolve({ UserSettingsTag: 'new-tag', Encrypted: 'enc' });
        },
        deserializeUserSettingsWithMasterKeys: () =>
            Promise.resolve({ userSettings: remoteUserSettings, needsMasterKeyMigration: false }),
    }));
    jest.doMock('../../util/masterKeys', () => ({
        buildMasterKeyContext: () => Promise.resolve({ primary: { id: 'primary' }, legacy: [] }),
    }));

    const thunks = await import('./lumoUserSettingsThunks');
    const { setRemoteUserSettingsUndecryptable } = await import('./meta/initialization');
    return { ...thunks, setRemoteUserSettingsUndecryptable, serialized };
};

const makeApi = (getUserSettings: () => Promise<unknown>) => ({
    getUserSettings: jest.fn(getUserSettings),
    putUserSettings: jest.fn(() => Promise.resolve('ok')),
    postUserSettings: jest.fn(() => Promise.resolve('ok')),
});

const run = (thunk: any, state: LumoState, lumoApi: unknown, dispatch = jest.fn((action: unknown) => action)) =>
    thunk(dispatch as never, () => state, { lumoApi } as never);

describe('saveLumoUserSettingsToRemote', () => {
    afterEach(() => jest.resetModules());

    it('applies the changes to the server copy instead of sending local state', async () => {
        const remote = settings({ theme: 'dark', isMemoryEnabled: true, memories: [memory('1')] });
        const { saveLumoUserSettingsToRemote, serialized } = await setUp(remote);
        const lumoApi = makeApi(() => Promise.resolve(REMOTE_BLOB));

        // Local state is defaults, as after a failed load.
        await run(saveLumoUserSettingsToRemote({ isMemoryAutoSaveEnabled: false }), makeState(), lumoApi);

        expect(lumoApi.putUserSettings).toHaveBeenCalledTimes(1);
        expect(lumoApi.postUserSettings).not.toHaveBeenCalled();
        expect(serialized[0]).toEqual({ ...remote, isMemoryAutoSaveEnabled: false });
    });

    it('POSTs local state with the changes when the server has no settings', async () => {
        const { saveLumoUserSettingsToRemote, serialized } = await setUp(null);
        const lumoApi = makeApi(() => Promise.resolve(null));
        const local = settings({ theme: 'light', memories: [memory('1')] });

        await run(saveLumoUserSettingsToRemote({ automaticWebSearch: false }), makeState(local), lumoApi);

        expect(lumoApi.postUserSettings).toHaveBeenCalledTimes(1);
        expect(lumoApi.putUserSettings).not.toHaveBeenCalled();
        expect(serialized[0]).toEqual({ ...local, automaticWebSearch: false });
    });

    it('saves nothing and rejects when the server copy fails to load', async () => {
        const { saveLumoUserSettingsToRemote } = await setUp(settings());
        const lumoApi = makeApi(() => Promise.reject(new Error('HTTP error: got 503')));

        const result = await run(saveLumoUserSettingsToRemote({ theme: 'dark' }), makeState(), lumoApi);

        expect((result as { type: string }).type).toBe(saveLumoUserSettingsToRemote.rejected.type);
        expect(lumoApi.putUserSettings).not.toHaveBeenCalled();
        expect(lumoApi.postUserSettings).not.toHaveBeenCalled();
    });

    it('protects a changed ciphertext even if the earlier blob was already warned about', async () => {
        const { saveLumoUserSettingsToRemote, serialized } = await setUp(null);
        const lumoApi = makeApi(() => Promise.resolve(REMOTE_BLOB));
        const save = (warningShown: boolean) =>
            run(
                saveLumoUserSettingsToRemote({ automaticWebSearch: false }),
                makeState(settings(), warningShown),
                lumoApi
            );

        expect(saveLumoUserSettingsToRemote.rejected.match(await save(false))).toBe(true);
        lumoApi.getUserSettings.mockResolvedValueOnce({ ...REMOTE_BLOB, encrypted: 'different-blob' });
        expect(saveLumoUserSettingsToRemote.rejected.match(await save(true))).toBe(true);

        expect(lumoApi.putUserSettings).not.toHaveBeenCalled();
        expect(serialized).toHaveLength(0);
    });

    it('uses local state as the base when the server copy is not Lumo settings', async () => {
        const coreSettings = { Email: 'x', Phone: 'y' } as unknown as LumoUserSettings;
        const { saveLumoUserSettingsToRemote, serialized } = await setUp(coreSettings);
        const lumoApi = makeApi(() => Promise.resolve(REMOTE_BLOB));
        const local = settings({ theme: 'light' });

        await run(saveLumoUserSettingsToRemote({ automaticWebSearch: false }), makeState(local), lumoApi);

        expect(serialized[0]).toEqual({ ...local, automaticWebSearch: false });
    });

    it('adds without deleting when the device has no merge base', async () => {
        const remote = settings({ memories: [memory('1'), memory('2')] });
        const { saveLumoUserSettingsToRemote, serialized } = await setUp(remote);
        const lumoApi = makeApi(() => Promise.resolve(REMOTE_BLOB));

        await run(saveLumoUserSettingsToRemote({ memories: [memory('3')] }), makeState(), lumoApi);

        expect(serialized[0].memories?.map((m) => m.id)).toEqual(['1', '2', '3']);
    });

    it('uses the saved result as the merge base for the next save', async () => {
        const remote = settings({ memories: [memory('1')] });
        const { saveLumoUserSettingsToRemote, serialized } = await setUp(remote);
        const lumoApi = makeApi(() => Promise.resolve(REMOTE_BLOB));

        await run(saveLumoUserSettingsToRemote({ theme: 'dark' }), makeState(), lumoApi);
        // Deleting memory 1, which the first save put in the base.
        await run(saveLumoUserSettingsToRemote({ memories: [] }), makeState(), lumoApi);

        expect(serialized[1].memories).toEqual([]);
    });

    it('uses the local copy set with setUserSettingsMergeBase as the merge base', async () => {
        const remote = settings({ memories: [memory('2'), memory('3')] });
        const { saveLumoUserSettingsToRemote, setUserSettingsMergeBase, serialized } = await setUp(remote);
        const lumoApi = makeApi(() => Promise.resolve(REMOTE_BLOB));

        // Local copy still has memory 1, deleted elsewhere since; the user then deletes memory 2.
        setUserSettingsMergeBase(settings({ memories: [memory('1'), memory('2')] }));
        await run(saveLumoUserSettingsToRemote({ memories: [memory('1')] }), makeState(), lumoApi);

        expect(serialized[0].memories?.map((m) => m.id)).toEqual(['3']);
    });
    it('returns what it saved and the merge base it compared against', async () => {
        const remote = settings({ memories: [memory('1')] });
        const { saveLumoUserSettingsToRemote, setUserSettingsMergeBase } = await setUp(remote);
        const lumoApi = makeApi(() => Promise.resolve(REMOTE_BLOB));
        const base = settings({ memories: [] });
        setUserSettingsMergeBase(base);

        const result = await run(saveLumoUserSettingsToRemote({ memories: [memory('2')] }), makeState(), lumoApi);

        expect((result as { payload: unknown }).payload).toEqual({
            merged: settings({ memories: [memory('1'), memory('2')] }),
            base,
        });
    });
});

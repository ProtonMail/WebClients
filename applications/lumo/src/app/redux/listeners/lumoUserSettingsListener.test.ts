import { jest } from '@jest/globals';
import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import type { LumoUserSettings, Memory } from '../slices/lumoUserSettingsTypes';
import type { AppStartListening } from '../store';

// This project runs Jest in ESM mode, where static imports resolve before a hoisted `jest.mock`
// would take effect. Mocks are therefore registered with `jest.doMock` + a fresh dynamic
// `import()` in `setUp` — see `lumoUserSettingsThunks.remoteUndecryptable.test.ts`.

const SAVE_DEBOUNCE_MS = 1000;
const SAVE_RETRY_MS = 30_000;

const MASTER_KEYS_BUNDLE = {
    primaryMasterKeyId: 'envelope',
    primaryMasterKey: 'MASTER_KEY',
    masterKeys: { envelope: 'MASTER_KEY' },
};

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

/** An in-memory settings endpoint. Blobs are plain JSON: crypto is mocked to pass them through. */
const makeServer = (initial: LumoUserSettings | null) => {
    let blob = initial ? JSON.stringify(initial) : null;
    const save = (request: { Encrypted: string }) => {
        blob = request.Encrypted;
        return Promise.resolve('ok');
    };
    const api = {
        getUserSettings: jest.fn(() =>
            Promise.resolve(blob ? { userSettingsTag: 'tag', encrypted: blob, createTime: '', updateTime: '' } : null)
        ),
        putUserSettings: jest.fn(save),
        postUserSettings: jest.fn(save),
    };
    return {
        api,
        read: (): LumoUserSettings | null => (blob ? JSON.parse(blob) : null),
        write: (userSettings: LumoUserSettings) => {
            blob = JSON.stringify(userSettings);
        },
    };
};

const setUp = async ({
    server,
    localCopy = null,
}: {
    server: ReturnType<typeof makeServer>;
    localCopy?: LumoUserSettings | null;
}) => {
    jest.doMock('../../serialization', () => ({
        serializeUserSettings: (userSettings: LumoUserSettings) =>
            Promise.resolve({ UserSettingsTag: 'new-tag', Encrypted: JSON.stringify(userSettings) }),
        deserializeUserSettingsWithMasterKeys: ({ encrypted }: { encrypted: string }) =>
            Promise.resolve({
                userSettings: JSON.parse(encrypted.replace(/^legacy:/, '')),
                needsMasterKeyMigration: encrypted.startsWith('legacy:'),
            }),
    }));
    jest.doMock('../../util/masterKeys', () => ({
        buildMasterKeyContext: () => Promise.resolve({ primary: { id: 'primary' }, legacy: [] }),
    }));
    jest.doMock('../../util/userSettingsStorage', () => ({
        loadUserSettingsFromStorage: () => Promise.resolve({ userSettings: localCopy, needsMasterKeyMigration: false }),
        saveUserSettingsToStorage: () => Promise.resolve(),
    }));
    jest.doMock('../../providers', () => ({
        matchDarkTheme: () => ({ matches: false }),
        setLumoSettings: () => {},
        userSettingsToLocalSettings: () => ({}),
    }));

    const { startLumoUserSettingsListeners } = await import('./lumoUserSettingsListener');
    const lumoUserSettingsModule = await import('../slices/lumoUserSettings');
    const { refreshLumoUserSettings } = await import('../slices/lumoUserSettingsActions');
    const initializationModule = await import('../slices/meta/initialization');
    const personalizationReducer = (await import('../slices/personalization')).default;
    const featureFlagsReducer = (await import('../slices/featureFlags')).default;
    const { addMasterKey } = await import('../slices/core/credentials');

    const extra = { lumoApi: server.api };
    const listener = createListenerMiddleware({ extra });
    startLumoUserSettingsListeners(listener.startListening as unknown as AppStartListening);
    const store = configureStore({
        reducer: {
            credentials: () => ({ masterKeyState: { status: 'ready' as const, ...MASTER_KEYS_BUNDLE } }),
            lumoUserSettings: lumoUserSettingsModule.default,
            initialization: initializationModule.default,
            personalization: personalizationReducer,
            featureFlags: featureFlagsReducer,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                thunk: { extraArgument: extra },
                serializableCheck: false,
                immutableCheck: false,
            }).prepend(listener.middleware),
    });

    const autoSave = (changes: Partial<LumoUserSettings>) =>
        store.dispatch(lumoUserSettingsModule.updateLumoUserSettingsWithAutoSave(changes));
    /** Runs the startup load, as when the master key becomes available. */
    const bootstrap = async () => {
        store.dispatch(addMasterKey(MASTER_KEYS_BUNDLE as never));
        await jest.advanceTimersByTimeAsync(0);
    };

    return { store, autoSave, bootstrap, refreshLumoUserSettings, ...lumoUserSettingsModule, ...initializationModule };
};

const ids = (items: { id: string }[] | undefined) => items?.map((item) => item.id);

beforeEach(() => {
    jest.useFakeTimers();
});

afterEach(() => {
    jest.useRealTimers();
    jest.resetModules();
});

describe('lumoUserSettingsListener — auto-save', () => {
    it('re-wraps a legacy server copy in the load flow before applying queued changes', async () => {
        const initial = settings();
        const server = makeServer(initial);
        const { store, autoSave, bootstrap } = await setUp({ server });
        await bootstrap();

        const remote = settings({ personalization: { ...initial.personalization, jobRole: 'Engineer' } });
        const legacyBlob = {
            userSettingsTag: 'tag',
            encrypted: `legacy:${JSON.stringify(remote)}`,
            createTime: '',
            updateTime: '',
        };
        server.api.getUserSettings.mockResolvedValueOnce(legacyBlob).mockResolvedValueOnce(legacyBlob);
        autoSave({ personalization: { ...initial.personalization, nickname: 'Sam' } });
        await jest.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

        expect(server.api.putUserSettings).toHaveBeenCalledTimes(1);
        expect(server.read()).toEqual(remote);
        expect(store.getState().lumoUserSettings.personalization.nickname).toBe('Sam');

        await jest.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

        expect(server.api.putUserSettings).toHaveBeenCalledTimes(2);
        expect(server.read()?.personalization).toMatchObject({ nickname: 'Sam', jobRole: 'Engineer' });
    });

    it.each(['before', 'after'])('preserves both edits when a refresh is requested %s a local edit', async (order) => {
        const initial = settings();
        const server = makeServer(initial);
        const { store, autoSave, bootstrap, refreshLumoUserSettings } = await setUp({ server });
        await bootstrap();

        server.write(settings({ personalization: { ...initial.personalization, jobRole: 'Engineer' } }));
        const refresh = () => store.dispatch(refreshLumoUserSettings());
        if (order === 'before') {
            refresh();
        }
        autoSave({ personalization: { ...initial.personalization, nickname: 'Sam' } });
        if (order === 'after') {
            refresh();
        }
        await jest.advanceTimersByTimeAsync(0);

        expect(store.getState().lumoUserSettings.personalization.nickname).toBe('Sam');
        await jest.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

        expect(server.read()?.personalization).toMatchObject({ nickname: 'Sam', jobRole: 'Engineer' });
        expect(store.getState().lumoUserSettings.personalization).toEqual(server.read()?.personalization);
    });

    it('collects changes made within the debounce into one save', async () => {
        const server = makeServer(settings());
        const { autoSave, bootstrap } = await setUp({ server });
        await bootstrap();

        autoSave({ theme: 'dark' });
        autoSave({ automaticWebSearch: false });
        await jest.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS - 1);
        autoSave({ isMemoryAutoSaveEnabled: false });
        await jest.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

        expect(server.api.putUserSettings).toHaveBeenCalledTimes(1);
        expect(server.read()).toEqual(
            expect.objectContaining({ theme: 'dark', automaticWebSearch: false, isMemoryAutoSaveEnabled: false })
        );
    });

    it('sends only the changed keys, so a device on defaults keeps the server settings', async () => {
        const server = makeServer(
            settings({ isMemoryEnabled: true, memories: [memory('1')], automaticWebSearch: false })
        );
        // The startup load fails and there is no local copy: the device stays on defaults.
        server.api.getUserSettings.mockRejectedValueOnce(new Error('HTTP error: got 503'));
        const { autoSave, bootstrap } = await setUp({ server });
        await bootstrap();

        autoSave({ theme: 'dark' });
        await jest.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

        expect(server.read()).toEqual(
            expect.objectContaining({
                theme: 'dark',
                isMemoryEnabled: true,
                memories: [memory('1')],
                automaticWebSearch: false,
            })
        );
    });

    it('runs one save at a time and saves changes made meanwhile afterwards', async () => {
        const server = makeServer(settings());
        const { autoSave, bootstrap } = await setUp({ server });
        await bootstrap();

        let finishFirstSave: () => void = () => {};
        server.api.putUserSettings.mockImplementationOnce(
            (request: { Encrypted: string }) =>
                new Promise((resolve) => {
                    finishFirstSave = () => {
                        server.write(JSON.parse(request.Encrypted));
                        resolve('ok');
                    };
                })
        );

        autoSave({ theme: 'dark' });
        await jest.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);
        autoSave({ automaticWebSearch: false });
        await jest.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS * 3);

        expect(server.api.putUserSettings).toHaveBeenCalledTimes(1);

        finishFirstSave();
        await jest.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

        expect(server.api.putUserSettings).toHaveBeenCalledTimes(2);
        expect(server.read()).toEqual(expect.objectContaining({ theme: 'dark', automaticWebSearch: false }));
    });

    it('keeps the changes of a failed save and retries them later', async () => {
        const server = makeServer(settings());
        const { autoSave, bootstrap } = await setUp({ server });
        await bootstrap();
        server.api.getUserSettings.mockRejectedValueOnce(new Error('HTTP error: got 503'));

        autoSave({ theme: 'dark' });
        await jest.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

        expect(server.api.putUserSettings).not.toHaveBeenCalled();

        await jest.advanceTimersByTimeAsync(SAVE_RETRY_MS);

        expect(server.api.putUserSettings).toHaveBeenCalledTimes(1);
        expect(server.read()?.theme).toBe('dark');
    });

    it('lets newer changes win over the ones kept from a failed save', async () => {
        const server = makeServer(settings());
        const { autoSave, bootstrap } = await setUp({ server });
        await bootstrap();
        server.api.getUserSettings.mockRejectedValueOnce(new Error('HTTP error: got 503'));

        autoSave({ theme: 'dark' });
        await jest.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);
        autoSave({ theme: 'light' });
        await jest.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

        expect(server.read()?.theme).toBe('light');
    });

    it('rebases local state onto the saved result, including changes from other devices', async () => {
        const server = makeServer(settings({ isMemoryEnabled: true, memories: [memory('1')] }));
        const { store, autoSave, bootstrap } = await setUp({ server });
        await bootstrap();

        // Another device adds memory 2 and a nickname.
        server.write(
            settings({
                isMemoryEnabled: true,
                memories: [memory('1'), memory('2')],
                personalization: { ...settings().personalization, nickname: 'Ann' },
            })
        );
        autoSave({ theme: 'dark' });
        await jest.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

        const state = store.getState();
        expect(ids(state.lumoUserSettings.memories)).toEqual(['1', '2']);
        expect(state.lumoUserSettings.theme).toBe('dark');
        expect(state.personalization.nickname).toBe('Ann');
    });

    it('does not delete memories added elsewhere when the next save sends the local list', async () => {
        const server = makeServer(settings({ isMemoryEnabled: true, memories: [memory('1')] }));
        const { store, autoSave, bootstrap } = await setUp({ server });
        await bootstrap();

        server.write(settings({ isMemoryEnabled: true, memories: [memory('1'), memory('2')] }));
        autoSave({ theme: 'dark' });
        await jest.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

        // The user adds memory 3 to the list as it now is locally.
        autoSave({ memories: [...(store.getState().lumoUserSettings.memories ?? []), memory('3')] });
        await jest.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

        expect(ids(server.read()?.memories)).toEqual(['1', '2', '3']);
    });

    it('rebases changes made while a save was running', async () => {
        const server = makeServer(settings({ isMemoryEnabled: true, memories: [memory('1')] }));
        const { store, autoSave, bootstrap } = await setUp({ server });
        await bootstrap();

        // Another device adds memory 2 before this device's save reads the server copy.
        server.write(settings({ isMemoryEnabled: true, memories: [memory('1'), memory('2')] }));
        let finishFirstSave: () => void = () => {};
        server.api.putUserSettings.mockImplementationOnce(
            (request: { Encrypted: string }) =>
                new Promise((resolve) => {
                    finishFirstSave = () => {
                        server.write(JSON.parse(request.Encrypted));
                        resolve('ok');
                    };
                })
        );

        autoSave({ theme: 'dark' });
        await jest.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);
        // While that save runs, the user adds memory 3 to the local list, which lacks memory 2.
        autoSave({ memories: [memory('1'), memory('3')] });
        finishFirstSave();
        await jest.advanceTimersByTimeAsync(0);

        expect(ids(store.getState().lumoUserSettings.memories)).toEqual(['1', '2', '3']);

        await jest.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

        expect(ids(server.read()?.memories)).toEqual(['1', '2', '3']);
    });
});

describe('lumoUserSettingsListener — startup load', () => {
    it('warns and retains queued changes when a save first finds an undecryptable blob after a failed startup load', async () => {
        const server = makeServer(null);
        server.api.getUserSettings.mockRejectedValueOnce(new Error('HTTP error: got 503'));
        const { store, autoSave, bootstrap, acknowledgeLumoDataLossWarning } = await setUp({ server });
        await bootstrap();

        const unreadable = { userSettingsTag: 'tag', encrypted: 'null', createTime: '', updateTime: '' };
        server.api.getUserSettings.mockResolvedValue(unreadable);
        autoSave({ theme: 'dark' });
        await jest.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

        expect(store.getState().initialization.remoteUserSettingsUndecryptable).toBe(true);
        expect(store.getState().initialization.remoteUserSettingsLoadFailed).toBe(true);
        expect(server.api.putUserSettings).not.toHaveBeenCalled();
        expect(server.api.postUserSettings).not.toHaveBeenCalled();

        await jest.advanceTimersByTimeAsync(SAVE_RETRY_MS);
        expect(server.api.putUserSettings).not.toHaveBeenCalled();

        store.dispatch(acknowledgeLumoDataLossWarning());
        await jest.advanceTimersByTimeAsync(SAVE_RETRY_MS);

        expect(server.api.putUserSettings).toHaveBeenCalledTimes(1);
        expect(server.read()?.theme).toBe('dark');
    });

    it('applies the local copy when the server load fails, whatever the theme', async () => {
        const server = makeServer(settings());
        server.api.getUserSettings.mockRejectedValueOnce(new Error('HTTP error: got 503'));
        const localCopy = settings({ theme: 'dark', isMemoryEnabled: true, memories: [memory('1')] });
        const { store, bootstrap } = await setUp({ server, localCopy });

        await bootstrap();

        expect(store.getState().lumoUserSettings).toEqual(expect.objectContaining(localCopy));
    });

    it('uses the local copy as the merge base, so memories deleted elsewhere are not written back', async () => {
        const server = makeServer(settings({ isMemoryEnabled: true, memories: [memory('2')] }));
        server.api.getUserSettings.mockRejectedValueOnce(new Error('HTTP error: got 503'));
        // The local copy still has memory 1, deleted elsewhere since.
        const localCopy = settings({ isMemoryEnabled: true, memories: [memory('1'), memory('2')] });
        const { autoSave, bootstrap } = await setUp({ server, localCopy });
        await bootstrap();

        autoSave({ memories: [memory('1'), memory('2'), memory('3')] });
        await jest.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

        expect(ids(server.read()?.memories)).toEqual(['2', '3']);
    });

    it('flags a failed load for the toast', async () => {
        const server = makeServer(settings());
        server.api.getUserSettings.mockRejectedValueOnce(new Error('HTTP error: got 503'));
        const { store, bootstrap } = await setUp({ server });

        await bootstrap();

        expect(store.getState().initialization.remoteUserSettingsLoadFailed).toBe(true);
    });

    it('clears the failed-load flag once a load succeeds', async () => {
        const server = makeServer(settings());
        const { store, bootstrap, setRemoteUserSettingsLoadFailed } = await setUp({ server });
        store.dispatch(setRemoteUserSettingsLoadFailed(true));

        await bootstrap();

        expect(store.getState().initialization.remoteUserSettingsLoadFailed).toBe(false);
    });

    describe('lumoUserSettingsListener — review fixes', () => {
        it('removes only the memories this device had when memory is cleared', async () => {
            const server = makeServer(settings({ isMemoryEnabled: true, memories: [memory('1')] }));
            const { autoSave, bootstrap } = await setUp({ server });
            await bootstrap();

            // Another device adds memory 2 after this device loaded; this device then disables memory.
            server.write(settings({ isMemoryEnabled: true, memories: [memory('1'), memory('2')] }));
            autoSave({ isMemoryEnabled: false, memories: [] });
            await jest.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

            expect(server.read()).toEqual(expect.objectContaining({ isMemoryEnabled: false }));
            expect(ids(server.read()?.memories)).toEqual(['2']);
        });

        it('keeps the feature-flag slice when the server copy has no featureFlags', async () => {
            const { featureFlags: _, ...withoutFlags } = settings();
            const server = makeServer(withoutFlags as LumoUserSettings);
            const { store, autoSave, bootstrap } = await setUp({ server });
            await bootstrap();

            autoSave({ theme: 'dark' });
            await jest.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

            expect(Array.isArray(store.getState().featureFlags)).toBe(true);
        });

        it('sends the memory prompt counter with every save and keeps it through the rebase', async () => {
            const server = makeServer(settings({ memoryPromptsSinceAutoSave: 0 }));
            const { store, autoSave, bootstrap, updateLumoUserSettings } = await setUp({ server });
            await bootstrap();

            // The counter moves without auto-save, as it does on every prompt.
            store.dispatch(updateLumoUserSettings({ memoryPromptsSinceAutoSave: 4 }));
            autoSave({ theme: 'dark' });
            await jest.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

            expect(server.read()?.memoryPromptsSinceAutoSave).toBe(4);
            expect(store.getState().lumoUserSettings.memoryPromptsSinceAutoSave).toBe(4);
        });
    });
});

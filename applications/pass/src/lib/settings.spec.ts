import { SETTINGS_STORAGE_KEY, getSettingsStorageKey } from 'proton-pass-web/lib/storage';

import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';

import { resolveSettings, settings } from './settings';

const setDesktopBuild = (value: boolean) => ((global as any).DESKTOP_BUILD = value);

describe('settings', () => {
    let getItem: jest.SpyInstance;
    let setItem: jest.SpyInstance;
    let removeItem: jest.SpyInstance;

    beforeEach(() => {
        setDesktopBuild(false);
        getItem = jest.spyOn(Storage.prototype, 'getItem');
        setItem = jest.spyOn(Storage.prototype, 'setItem');
        removeItem = jest.spyOn(Storage.prototype, 'removeItem');
    });

    afterAll(() => setDesktopBuild(false));

    describe('Storage key', () => {
        test('[web] should be indexed by `LocalID`', () => {
            expect(getSettingsStorageKey(42)).toEqual('settings::42');
            expect(getSettingsStorageKey()).toEqual('settings');
        });

        test('[desktop] should be indexed by `LocalID`', () => {
            setDesktopBuild(true);
            expect(getSettingsStorageKey(42)).toEqual('settings::42');
            expect(getSettingsStorageKey()).toEqual('settings');
        });
    });

    describe('Settings service', () => {
        test('settings::clear should clear storage for current LocalID', async () => {
            await settings.clear(42);
            expect(removeItem).toHaveBeenCalledWith('settings::42');
        });

        test('settings::sync should write settings to storage for current LocalID', async () => {
            const update = { test: true } as unknown as ProxiedSettings;
            await settings.sync(update, 42);
            expect(setItem).toHaveBeenCalledWith('settings::42', JSON.stringify(update));
        });

        test('settings::resolve should throw if no valid LocalID', () => {
            expect(resolveSettings).toThrow();
        });

        test('settings::resolve should throw if no settings found', () => {
            expect(() => resolveSettings(0)).toThrow();
        });

        test('settings::resolve should migrate legacy settings', () => {
            const legacySettings = JSON.stringify({ legacy: true });

            getItem.mockImplementation((key) => {
                if (key === getSettingsStorageKey(0)) return null;
                if (key === SETTINGS_STORAGE_KEY) return legacySettings;
            });

            const result = resolveSettings(0);
            expect(result).toEqual(legacySettings);
            expect(removeItem).toHaveBeenCalledWith(SETTINGS_STORAGE_KEY);
        });

        test('settings::resolve should return settings', () => {
            const storedSettings = JSON.stringify({ legacy: false });

            getItem.mockImplementation((key) => {
                if (key === getSettingsStorageKey(0)) return storedSettings;
                if (key === SETTINGS_STORAGE_KEY) return null;
            });

            const result = resolveSettings(0);
            expect(result).toEqual(storedSettings);
            expect(removeItem).toHaveBeenCalledWith(SETTINGS_STORAGE_KEY);
        });
    });
});

import { getInitialSettings } from '@proton/pass/store/reducers/settings';

import { createSettingsService } from './service';

describe('createSettingsService', () => {
    const clear = jest.fn();
    const read = jest.fn();
    const sync = jest.fn();

    beforeEach(() => {
        clear.mockClear();
        read.mockClear();
        sync.mockClear();
    });

    test('clear method should proxy `options.clear`', async () => {
        const service = createSettingsService({ clear, read, sync });
        await service.clear();

        expect(clear).toHaveBeenCalledTimes(1);
    });

    test('sync method should proxy `options.sync`', async () => {
        const update = getInitialSettings();
        const service = createSettingsService({ clear, read, sync });
        await service.sync(update, 0);

        expect(sync).toHaveBeenCalledTimes(1);
        expect(sync).toHaveBeenCalledWith(update, 0);
    });

    test('resolve method should merge initial settings with resolved settings', async () => {
        const settings = { test_setting: true };
        read.mockResolvedValue(settings);

        const service = createSettingsService({ clear, read, sync });
        const result = await service.resolve();

        expect(read).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ ...getInitialSettings(), ...settings });
    });

    test('resolve should return initial settings when `options.resolve` fails', async () => {
        read.mockRejectedValue(new Error());
        const service = createSettingsService({ clear, read, sync });
        const result = await service.resolve();

        expect(read).toHaveBeenCalledTimes(1);
        expect(result).toEqual(getInitialSettings());
    });

    test('resolve should cache settings and avoid multiple read calls', async () => {
        const settings = { test_setting: true };
        read.mockResolvedValue(settings);

        const service = createSettingsService({ clear, read, sync });

        const result = await service.resolve();
        expect(read).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ ...getInitialSettings(), ...settings });

        const cachedResult = await service.resolve();
        expect(read).toHaveBeenCalledTimes(1);
        expect(cachedResult).toEqual(result);
        expect(cachedResult).toBe(result);
    });

    test('clear should reset cache and force next resolve to read from storage', async () => {
        const settings = { test_setting: true };
        read.mockResolvedValue(settings);

        const service = createSettingsService({ clear, read, sync });

        await service.resolve();
        await service.clear();
        await service.resolve();

        expect(read).toHaveBeenCalledTimes(2);
    });

    test('sync should update cache with new settings', async () => {
        const initialSettings = { test_setting: true };
        const updatedSettings = { test_setting: false, new_setting: 'value' } as any;

        read.mockResolvedValue(initialSettings);

        const service = createSettingsService({ clear, read, sync });

        const result = await service.resolve();
        await service.sync(updatedSettings);
        const syncedResult = await service.resolve();

        expect(result).toEqual({ ...getInitialSettings(), ...initialSettings });
        expect(read).toHaveBeenCalledTimes(1);
        expect(syncedResult).toBe(updatedSettings);
    });

    test('resolve should work correctly with localID parameter', async () => {
        const settings = { test_setting: true };
        read.mockResolvedValue(settings);

        const service = createSettingsService({ clear, read, sync });
        const localID = 123;
        await service.resolve(localID);

        expect(read).toHaveBeenCalledWith(localID);
    });

    test('clear should work correctly with localID parameter', async () => {
        const service = createSettingsService({ clear, read, sync });
        const localID = 123;
        await service.clear(localID);

        expect(clear).toHaveBeenCalledWith(localID);
    });
});

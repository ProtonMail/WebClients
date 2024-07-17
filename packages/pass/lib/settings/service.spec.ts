import { INITIAL_SETTINGS } from '@proton/pass/store/reducers/settings';

import { createSettingsService } from './service';

describe('createSettingsService', () => {
    const clear = jest.fn();
    const resolve = jest.fn();
    const sync = jest.fn();

    beforeEach(() => {
        clear.mockClear();
        resolve.mockClear();
        sync.mockClear();
    });

    test('clear method should proxy `options.clear`', async () => {
        const service = createSettingsService({ clear, resolve, sync });
        await service.clear();

        expect(clear).toHaveBeenCalledTimes(1);
    });

    test('sync method should proxy `options.sync`', async () => {
        const update = INITIAL_SETTINGS;
        const service = createSettingsService({ clear, resolve, sync });
        await service.sync(update);

        expect(sync).toHaveBeenCalledTimes(1);
        expect(sync).toHaveBeenCalledWith(update);
    });

    test('resolve method should merge INITIAL_SETTINGS with resolved settings', async () => {
        const settings = { test_setting: true };
        resolve.mockResolvedValue(settings);

        const service = createSettingsService({ clear, resolve, sync });
        const result = await service.resolve();

        expect(resolve).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ ...INITIAL_SETTINGS, ...settings });
    });

    test('resolve should return INITIAL_SETTINGS when `options.resolve` fails', async () => {
        resolve.mockRejectedValue(new Error());
        const service = createSettingsService({ clear, resolve, sync });
        const result = await service.resolve();

        expect(resolve).toHaveBeenCalledTimes(1);
        expect(result).toEqual(INITIAL_SETTINGS);
    });
});

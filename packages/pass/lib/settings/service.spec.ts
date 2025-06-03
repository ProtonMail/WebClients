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
        await service.sync(update);

        expect(sync).toHaveBeenCalledTimes(1);
        expect(sync).toHaveBeenCalledWith(update);
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
});

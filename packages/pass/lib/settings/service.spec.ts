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
        const settings = { locale: 'fr_FR' };
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
        const settings = { locale: 'fr_FR' };
        read.mockResolvedValue(settings);

        const service = createSettingsService({ clear, read, sync });

        const result = await service.resolve();
        expect(read).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ ...getInitialSettings(), ...settings });

        const cachedResult = await service.resolve();
        expect(read).toHaveBeenCalledTimes(1);
        expect(cachedResult).toStrictEqual(result);
    });

    test('clear should reset cache and force next resolve to read from storage', async () => {
        const settings = { locale: 'fr_FR' };
        read.mockResolvedValue(settings);

        const service = createSettingsService({ clear, read, sync });

        await service.resolve();
        await service.clear();
        await service.resolve();

        expect(read).toHaveBeenCalledTimes(2);
    });

    test('sync should update cache with new settings', async () => {
        const initialSettings = { locale: 'fr_FR' };
        const updatedSettings = { ...getInitialSettings(), locale: 'de_DE' };
        read.mockResolvedValue(initialSettings);

        const service = createSettingsService({ clear, read, sync });

        const result = await service.resolve();
        await service.sync(updatedSettings);
        const syncedResult = await service.resolve();

        expect(result).toEqual({ ...getInitialSettings(), ...initialSettings });
        expect(read).toHaveBeenCalledTimes(1);
        expect(syncedResult).toStrictEqual(updatedSettings);
    });

    test('resolve should work correctly with localID parameter', async () => {
        const settings = { locale: 'fr_FR' };
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

    test('should maintain separate caches per localID', async () => {
        const settings1 = { locale: 'en_US' };
        const settings2 = { locale: 'fr_FR' };

        read.mockImplementation((localID?: number) => {
            if (localID === 1) return Promise.resolve(settings1);
            if (localID === 2) return Promise.resolve(settings2);
            return Promise.resolve({});
        });

        const service = createSettingsService({ clear, read, sync });

        expect(await service.resolve(1)).toEqual({ ...getInitialSettings(), ...settings1 });
        expect(await service.resolve(2)).toEqual({ ...getInitialSettings(), ...settings2 });

        expect(service.state.size).toBe(2);
        expect(service.state.get(1)).toEqual({ ...getInitialSettings(), ...settings1 });
        expect(service.state.get(2)).toEqual({ ...getInitialSettings(), ...settings2 });
    });

    test('should handle default localID independently', async () => {
        const settings0 = { locale: 'de_DE' };
        const settings1 = { locale: 'en_US' };

        read.mockImplementation((localID?: number) => {
            if (localID === undefined) return Promise.resolve(settings0);
            if (localID === 1) return Promise.resolve(settings1);
            return Promise.resolve({});
        });

        const service = createSettingsService({ clear, read, sync });
        expect(await service.resolve()).toEqual({ ...getInitialSettings(), ...settings0 });
        expect(await service.resolve(1)).toEqual({ ...getInitialSettings(), ...settings1 });

        expect(service.state.has(-1)).toBe(true);
        expect(service.state.has(1)).toBe(true);

        await service.clear();
        expect(service.state.has(-1)).toBe(false);
        expect(service.state.has(1)).toBe(true);
        expect(service.state.get(1)).toEqual({ ...getInitialSettings(), ...settings1 });
    });

    test('clearing one session should not affect others', async () => {
        const settings1 = { locale: 'en_US' };
        const settings2 = { locale: 'fr_FR' };

        read.mockImplementation((localID?: number) => {
            if (localID === 1) return Promise.resolve(settings1);
            if (localID === 2) return Promise.resolve(settings2);
            return Promise.resolve({});
        });

        const service = createSettingsService({ clear, read, sync });

        await service.resolve(1);
        await service.resolve(2);
        expect(service.state.size).toBe(2);

        await service.clear(1);
        expect(service.state.has(1)).toBe(false);
        expect(service.state.has(2)).toBe(true);
        expect(service.state.get(2)).toEqual({ ...getInitialSettings(), ...settings2 });
    });

    test('syncing one session should not affect others', async () => {
        const settings1 = { locale: 'en_US' };
        const settings2 = { locale: 'fr_FR' };
        const updated = { ...getInitialSettings(), locale: 'de_DE' };

        read.mockImplementation((localID?: number) => {
            if (localID === 1) return Promise.resolve(settings1);
            if (localID === 2) return Promise.resolve(settings2);
            return Promise.resolve({});
        });

        const service = createSettingsService({ clear, read, sync });
        await service.resolve(1);
        await service.resolve(2);
        await service.sync(updated, 1);

        expect(service.state.get(1)).toStrictEqual(updated);
        expect(service.state.get(2)).toEqual({ ...getInitialSettings(), ...settings2 });
    });

    test('should return deep clones to prevent external mutations', async () => {
        const settings = getInitialSettings();
        read.mockResolvedValue(settings);

        const service = createSettingsService({ clear, read, sync });
        const result1 = await service.resolve(1);
        const result2 = await service.resolve(1);

        result1.locale = 'en_US';
        expect(result2.locale).not.toBe('en_US');
    });
});

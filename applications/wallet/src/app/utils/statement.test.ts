import { getDeviceStartOfDay } from './statement';

describe('getDeviceStartOfDay', () => {
    beforeEach(() => {
        vi.stubEnv('TZ', 'America/Los_Angeles');
        const deviceOptions = Intl.DateTimeFormat().resolvedOptions();
        vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
            ...deviceOptions,
            timeZone: 'America/Vancouver',
        });
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    it('starts a picked Vancouver day after the move to permanent time at midnight UTC-7', () => {
        expect(getDeviceStartOfDay(new Date(2026, 10, 10)).toISOString()).toBe('2026-11-10T07:00:00.000Z');
    });

    it('starts a picked Vancouver day before the change at midnight UTC-8', () => {
        expect(getDeviceStartOfDay(new Date(2026, 0, 15)).toISOString()).toBe('2026-01-15T08:00:00.000Z');
    });
});

describe('getDeviceStartOfDay on a day whose midnight happens twice', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('starts the Havana day when daylight time ends at its first midnight', () => {
        vi.stubEnv('TZ', 'America/Havana');

        expect(getDeviceStartOfDay(new Date(2025, 10, 2)).toISOString()).toBe('2025-11-02T04:00:00.000Z');
    });
});

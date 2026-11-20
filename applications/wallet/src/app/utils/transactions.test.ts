import { getFormattedPeriodSinceConfirmation } from './transactions';

describe('getFormattedPeriodSinceConfirmation', () => {
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
        vi.useRealTimers();
    });

    it('shows a Vancouver confirmation time after the move to permanent time', () => {
        vi.setSystemTime(new Date('2026-11-20T20:00:00Z'));

        expect(getFormattedPeriodSinceConfirmation(new Date('2026-11-12T17:00:00Z'))).toBe('Nov 12, 2026, 10:00 AM');
    });

    it('labels a confirmation from the first hour of the Vancouver day as today', () => {
        vi.setSystemTime(new Date('2026-11-13T19:00:00Z'));

        expect(getFormattedPeriodSinceConfirmation(new Date('2026-11-13T07:30:00Z'))).toBe('12:30 AM');
    });

    it('labels a confirmation from the first hour of the Vancouver week with its weekday', () => {
        vi.setSystemTime(new Date('2026-11-18T19:00:00Z'));

        expect(getFormattedPeriodSinceConfirmation(new Date('2026-11-15T07:30:00Z'))).toBe('Sunday, 12:30 AM');
    });

    it('labels a confirmation from the previous Vancouver day with its weekday', () => {
        vi.setSystemTime(new Date('2026-11-17T16:00:00Z'));

        expect(getFormattedPeriodSinceConfirmation(new Date('2026-11-16T21:00:00Z'))).toBe('Monday, 2:00 PM');
    });
});

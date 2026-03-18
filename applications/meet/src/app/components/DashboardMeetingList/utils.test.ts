import { enUS } from 'date-fns/locale';

import { SETTINGS_DATE_FORMAT } from '@proton/shared/lib/interfaces';

import { formatMeetingDate } from './utils';

vi.mock('@proton/shared/lib/i18n', () => ({
    dateLocale: enUS,
}));

describe('formatMeetingDate', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-17T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('relative date', () => {
        it('should show "Today" for todays date', () => {
            const result = formatMeetingDate('2026-03-17', SETTINGS_DATE_FORMAT.MMDDYYYY, true);
            expect(result).toBe('Today — March 17');
        });

        it('should show "Tomorrow" for tomorrows date', () => {
            const result = formatMeetingDate('2026-03-18', SETTINGS_DATE_FORMAT.MMDDYYYY, true);
            expect(result).toBe('Tomorrow — March 18');
        });

        it('should show "Yesterday" for yesterdays date', () => {
            const result = formatMeetingDate('2026-03-16', SETTINGS_DATE_FORMAT.MMDDYYYY, true);
            expect(result).toBe('Yesterday — March 16');
        });

        it('should not show relative for two days ago', () => {
            const result = formatMeetingDate('2026-03-15', SETTINGS_DATE_FORMAT.MMDDYYYY, true);
            expect(result).toBe('March 15');
        });

        it('should not show relative for two days from now', () => {
            const result = formatMeetingDate('2026-03-19', SETTINGS_DATE_FORMAT.MMDDYYYY, true);
            expect(result).toBe('March 19');
        });

        describe('showRelativeDate: false', () => {
            it('should return absolute date for today', () => {
                const result = formatMeetingDate('2026-03-17', SETTINGS_DATE_FORMAT.MMDDYYYY, false);
                expect(result).toBe('March 17');
            });

            it('should return absolute date for tomorrow', () => {
                const result = formatMeetingDate('2026-03-18', SETTINGS_DATE_FORMAT.MMDDYYYY, false);
                expect(result).toBe('March 18');
            });

            it('should return absolute date for yesterday', () => {
                const result = formatMeetingDate('2026-03-16', SETTINGS_DATE_FORMAT.MMDDYYYY, false);
                expect(result).toBe('March 16');
            });

            it('should default to false when omitted', () => {
                const result = formatMeetingDate('2026-03-17', SETTINGS_DATE_FORMAT.MMDDYYYY);
                expect(result).toBe('March 17');
            });
        });
    });

    describe('absolute dates within the current year', () => {
        it('should show "Month Day" in MMDDYYYY format', () => {
            const result = formatMeetingDate('2026-06-15', SETTINGS_DATE_FORMAT.MMDDYYYY);
            expect(result).toBe('June 15');
        });

        it('should show "Day Month" in DDMMYYYY format', () => {
            const result = formatMeetingDate('2026-06-15', SETTINGS_DATE_FORMAT.DDMMYYYY);
            expect(result).toBe('15 June');
        });

        it('should show "Month Day" in YYYYMMDD format', () => {
            const result = formatMeetingDate('2026-06-15', SETTINGS_DATE_FORMAT.YYYYMMDD);
            expect(result).toBe('June 15');
        });
    });

    describe('absolute dates outside the current year', () => {
        it('should show "Month Day, Year" for a past year (MMDDYYYY)', () => {
            const result = formatMeetingDate('2025-12-25', SETTINGS_DATE_FORMAT.MMDDYYYY);
            expect(result).toBe('December 25, 2025');
        });

        it('should show "Day Month, Year" for a past year (DDMMYYYY)', () => {
            const result = formatMeetingDate('2025-12-25', SETTINGS_DATE_FORMAT.DDMMYYYY);
            expect(result).toBe('25 December, 2025');
        });

        it('should show "Month Day, Year" for a future year (MMDDYYYY)', () => {
            const result = formatMeetingDate('2027-01-01', SETTINGS_DATE_FORMAT.MMDDYYYY);
            expect(result).toBe('January 1, 2027');
        });

        it('should show "Day Month, Year" for a future year (DDMMYYYY)', () => {
            const result = formatMeetingDate('2027-01-01', SETTINGS_DATE_FORMAT.DDMMYYYY);
            expect(result).toBe('1 January, 2027');
        });

        it('should show "Year, Month Day" for a past year (YYYYMMDD)', () => {
            const result = formatMeetingDate('2025-12-25', SETTINGS_DATE_FORMAT.YYYYMMDD);
            expect(result).toBe('2025, December 25');
        });
    });

    describe('year boundaries', () => {
        it('should show year for December 31 of previous year', () => {
            const result = formatMeetingDate('2025-12-31', SETTINGS_DATE_FORMAT.MMDDYYYY);
            expect(result).toBe('December 31, 2025');
        });

        it('should not show year for January 1 of current year', () => {
            const result = formatMeetingDate('2026-01-01', SETTINGS_DATE_FORMAT.MMDDYYYY);
            expect(result).toBe('January 1');
        });

        it('should show year for today when in a different year', () => {
            vi.setSystemTime(new Date('2025-12-31T12:00:00Z'));

            const result = formatMeetingDate('2025-12-31', SETTINGS_DATE_FORMAT.MMDDYYYY, true);
            expect(result).toBe('Today — December 31');
        });
    });

    describe('LOCALE_DEFAULT format', () => {
        it('should use Intl.DateTimeFormat for locale default - same year', () => {
            const result = formatMeetingDate('2026-06-15', SETTINGS_DATE_FORMAT.LOCALE_DEFAULT);
            expect(result).toContain('June');
            expect(result).toContain('15');
            expect(result).not.toContain('2026');
        });

        it('should include year in Intl.DateTimeFormat for different year', () => {
            const result = formatMeetingDate('2025-06-15', SETTINGS_DATE_FORMAT.LOCALE_DEFAULT);
            expect(result).toContain('June');
            expect(result).toContain('15');
            expect(result).toContain('2025');
        });
    });

    describe('timezone handling', () => {
        const importWithTimezone = async (tz: string) => {
            vi.resetModules();
            const originalIntl = globalThis.Intl.DateTimeFormat;
            vi.spyOn(globalThis.Intl, 'DateTimeFormat').mockImplementation((...args) => {
                const instance = new originalIntl(...args);
                return {
                    ...instance,
                    resolvedOptions: () => ({ ...instance.resolvedOptions(), timeZone: tz }),
                } as Intl.DateTimeFormat;
            });
            const { formatMeetingDate: fn } = await import('./utils');
            vi.restoreAllMocks();
            return fn;
        };

        it('should determine "today" based on the user timezone', async () => {
            // March 17, 2026 23:30 UTC → in Europe/Helsinki (UTC+2) it's already March 18
            vi.setSystemTime(new Date('2026-03-17T23:30:00Z'));

            const formatWithHelsinki = await importWithTimezone('Europe/Helsinki');

            // In Helsinki, today is March 18, so March 17 is yesterday
            const result = formatWithHelsinki('2026-03-17', SETTINGS_DATE_FORMAT.MMDDYYYY, true);
            expect(result).toBe('Yesterday — March 17');
        });

        it('should handle midnight boundary for tomorrow', async () => {
            // March 17, 2026 23:30 UTC → in Asia/Tokyo (UTC+9) it's March 18 08:30
            vi.setSystemTime(new Date('2026-03-17T23:30:00Z'));

            const formatWithTokyo = await importWithTimezone('Asia/Tokyo');

            // In Tokyo, today is March 18, so March 19 is tomorrow
            const result = formatWithTokyo('2026-03-19', SETTINGS_DATE_FORMAT.MMDDYYYY, true);
            expect(result).toBe('Tomorrow — March 19');
        });

        it('should handle midnight boundary for yesterday', async () => {
            // March 18, 2026 00:30 UTC → in America/New_York (UTC-4) it's still March 17
            vi.setSystemTime(new Date('2026-03-18T00:30:00Z'));

            const formatWithNewYork = await importWithTimezone('America/New_York');

            // In New York, today is March 17, so March 16 is yesterday
            const result = formatWithNewYork('2026-03-16', SETTINGS_DATE_FORMAT.MMDDYYYY, true);
            expect(result).toBe('Yesterday — March 16');
        });

        it('should handle year transition at midnight with timezone', async () => {
            // Dec 31, 2025 23:30 UTC → in UTC+2 it's already Jan 1, 2026
            vi.setSystemTime(new Date('2025-12-31T23:30:00Z'));

            const formatWithHelsinki = await importWithTimezone('Europe/Helsinki');

            // In Helsinki, current year is 2026, so 2025 dates get a year suffix
            const result = formatWithHelsinki('2025-12-31', SETTINGS_DATE_FORMAT.MMDDYYYY, true);
            expect(result).toBe('Yesterday — December 31, 2025');
        });
    });
});

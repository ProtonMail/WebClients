import { da, enUS, es, fi, zhCN } from 'date-fns/locale';

import { setDateLocales } from '@proton/shared/lib/i18n';
import { SETTINGS_TIME_FORMAT } from '@proton/shared/lib/interfaces/UserSettings';

import { formatTimeHHMM, parseTimeHHMM } from './timeFormat';

describe('formatTimeHHMM', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('formats an afternoon time on a 12-hour clock', () => {
        expect(formatTimeHHMM(13, 45, SETTINGS_TIME_FORMAT.H12)).toBe('1:45 PM');
    });

    it('formats midnight as 12 AM on a 12-hour clock', () => {
        expect(formatTimeHHMM(0, 0, SETTINGS_TIME_FORMAT.H12)).toBe('12:00 AM');
    });

    it('formats an afternoon time on a 24-hour clock', () => {
        expect(formatTimeHHMM(13, 45, SETTINGS_TIME_FORMAT.H24)).toBe('13:45');
    });

    it('formats the same time when the device is in a zone far from UTC', () => {
        vi.stubEnv('TZ', 'Pacific/Kiritimati');

        expect(formatTimeHHMM(13, 45, SETTINGS_TIME_FORMAT.H12)).toBe('1:45 PM');
    });
});

describe('parseTimeHHMM', () => {
    afterEach(() => {
        setDateLocales({ dateLocale: enUS });
    });

    it.each([
        { locale: da, timeFormat: SETTINGS_TIME_FORMAT.LOCALE_DEFAULT },
        { locale: fi, timeFormat: SETTINGS_TIME_FORMAT.LOCALE_DEFAULT },
        { locale: es, timeFormat: SETTINGS_TIME_FORMAT.H12 },
        { locale: zhCN, timeFormat: SETTINGS_TIME_FORMAT.H12 },
        { locale: enUS, timeFormat: SETTINGS_TIME_FORMAT.LOCALE_DEFAULT },
    ])('reads back the time it shows in $locale.code', ({ locale, timeFormat }) => {
        setDateLocales({ dateLocale: locale });

        expect(parseTimeHHMM(formatTimeHHMM(14, 30, timeFormat), timeFormat)).toBe('14:30');
    });

    it('returns null for text that is not a time', () => {
        expect(parseTimeHHMM('25:99', SETTINGS_TIME_FORMAT.H24)).toBeNull();
    });
});

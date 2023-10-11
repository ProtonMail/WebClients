import { default as enGBLocale } from 'date-fns/locale/en-GB';
import { default as enUSLocale } from 'date-fns/locale/en-US';
import { default as frFRLocale } from 'date-fns/locale/fr';
import { default as frCALocale } from 'date-fns/locale/fr-CA';

import formatUTC from '@proton/shared/lib/date-fns-utc/format';

import { getDateFnLocaleWithLongFormat } from '../../lib/i18n/dateFnLocale';

describe('datefns locales', () => {
    const date = new Date(Date.UTC(1999, 11, 1, 1, 0, 0));
    it('should merge time format from a US locale into FR', () => {
        expect(formatUTC(date, 'P p', { locale: getDateFnLocaleWithLongFormat(enUSLocale, frFRLocale) })).toBe(
            '12/01/1999 01:00'
        );
    });

    it('should merge date & time format from a US locale into US', () => {
        expect(formatUTC(date, 'P p', { locale: getDateFnLocaleWithLongFormat(enUSLocale, enUSLocale) })).toBe(
            '12/01/1999 1:00 AM'
        );
    });

    it('should merge date & time format from a US locale into GB (when languages are the same)', () => {
        expect(formatUTC(date, 'P p', { locale: getDateFnLocaleWithLongFormat(enUSLocale, enGBLocale) })).toBe(
            '01/12/1999 01:00'
        );
    });

    it('should merge date & time format from a FR locale into CA (when languages are the same)', () => {
        expect(formatUTC(date, 'P p', { locale: getDateFnLocaleWithLongFormat(frFRLocale, frCALocale) })).toBe(
            '99-12-01 01:00'
        );
    });
});

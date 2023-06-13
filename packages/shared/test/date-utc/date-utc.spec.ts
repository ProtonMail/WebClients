import { formatIntlUTCDate } from '../../lib/date-utc/formatIntlUTCDate';
import { setLocales } from '../../lib/i18n';
import { getLanguageCode } from '../../lib/i18n/helper';

const setLocalesForTest = (localeCode: string) => {
    setLocales({
        localeCode,
        languageCode: getLanguageCode(localeCode),
    });
};

describe('formatIntlUTCDate()', () => {
    afterEach(() => {
        setLocales({
            localeCode: 'en_US',
            languageCode: 'en',
        });
    });

    it('adapts order of year and month and day for different languages', () => {
        const date = new Date(Date.UTC(2023, 5, 17, 11, 44, 2));

        setLocalesForTest('en-US');
        expect(formatIntlUTCDate(date, { month: 'short', year: 'numeric' })).toEqual('Jun 2023');

        setLocalesForTest('zh-ZH');
        expect(formatIntlUTCDate(date, { month: 'short', year: 'numeric' })).toEqual('2023年6月');
    });

    it('offers four date formatting options (not including time)', () => {
        const date = new Date(Date.UTC(2023, 5, 17, 11, 44, 2));

        setLocalesForTest('en-US');
        expect(formatIntlUTCDate(date, { dateStyle: 'full' })).toEqual('Saturday, June 17, 2023');
        expect(formatIntlUTCDate(date, { dateStyle: 'long' })).toEqual('June 17, 2023');
        expect(formatIntlUTCDate(date, { dateStyle: 'short' })).toEqual('6/17/23');
        expect(formatIntlUTCDate(date, { dateStyle: 'medium' })).toEqual('Jun 17, 2023');

        setLocalesForTest('it');
        expect(formatIntlUTCDate(date, { dateStyle: 'full' })).toEqual('sabato 17 giugno 2023');
        expect(formatIntlUTCDate(date, { dateStyle: 'long' })).toEqual('17 giugno 2023');
        expect(formatIntlUTCDate(date, { dateStyle: 'short' })).toEqual('17/06/23');
        expect(formatIntlUTCDate(date, { dateStyle: 'medium' })).toEqual('17 giu 2023');

        setLocalesForTest('ko');
        expect(formatIntlUTCDate(date, { dateStyle: 'full' })).toEqual('2023년 6월 17일 토요일');
        expect(formatIntlUTCDate(date, { dateStyle: 'long' })).toEqual('2023년 6월 17일');
        expect(formatIntlUTCDate(date, { dateStyle: 'short' })).toEqual('23. 6. 17.');
        expect(formatIntlUTCDate(date, { dateStyle: 'medium' })).toEqual('2023. 6. 17.');
    });

    it('should default to US English when locale is unknown to Javascript', () => {
        const date = new Date(Date.UTC(2023, 5, 17, 11, 44, 2));

        setLocalesForTest('not_a_locale');
        expect(formatIntlUTCDate(date, { dateStyle: 'full' })).toEqual('Saturday, June 17, 2023');
        expect(formatIntlUTCDate(date, { dateStyle: 'long' })).toEqual('June 17, 2023');
        expect(formatIntlUTCDate(date, { dateStyle: 'short' })).toEqual('6/17/23');
        expect(formatIntlUTCDate(date, { dateStyle: 'medium' })).toEqual('Jun 17, 2023');
    });

    it('formats time', () => {
        // Because formatIntlUTCDate uses UTC dates, these tests will pass with any local time zone.
        // Unfortunately there's no easy way of mocking local time zones with karma
        const date = new Date(Date.UTC(2023, 5, 13, 17, 44, 2));

        setLocalesForTest('en-US');
        expect(formatIntlUTCDate(date, { timeStyle: 'medium' })).toEqual('5:44:02 PM');
        expect(formatIntlUTCDate(date, { timeStyle: 'short' })).toEqual('5:44 PM');
        expect(formatIntlUTCDate(date, { timeStyle: 'short', hour12: false })).toEqual('17:44');

        setLocalesForTest('es-ES');
        expect(formatIntlUTCDate(date, { timeStyle: 'medium' })).toEqual('17:44:02');
        expect(formatIntlUTCDate(date, { timeStyle: 'short' })).toEqual('17:44');
        expect(formatIntlUTCDate(date, { timeStyle: 'short', hour12: true })).toEqual('5:44 p. m.');
    });
});

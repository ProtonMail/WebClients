import { formatIntlDate } from '../../lib/date/formatIntlDate';

describe('formatIntlDate()', () => {
    it('adapts order of year and month and day for different languages', () => {
        const date = new Date(2023, 5, 17, 11, 44, 2);

        expect(formatIntlDate(date, { month: 'short', year: 'numeric' }, 'en-US')).toEqual('Jun 2023');
        expect(formatIntlDate(date, { month: 'short', year: 'numeric' }, 'zh-ZH')).toEqual('2023年6月');
    });

    it('offers four built-in date formatting options (not including time)', () => {
        const date = new Date(2023, 5, 17, 11, 44, 2);

        // en-US;
        expect(formatIntlDate(date, { dateStyle: 'full' }, 'en-US')).toEqual('Saturday, June 17, 2023');
        expect(formatIntlDate(date, { dateStyle: 'long' }, 'en-US')).toEqual('June 17, 2023');
        expect(formatIntlDate(date, { dateStyle: 'short' }, 'en-US')).toEqual('6/17/23');
        expect(formatIntlDate(date, { dateStyle: 'medium' }, 'en-US')).toEqual('Jun 17, 2023');

        // it;
        expect(formatIntlDate(date, { dateStyle: 'full' }, 'it')).toEqual('sabato 17 giugno 2023');
        expect(formatIntlDate(date, { dateStyle: 'long' }, 'it')).toEqual('17 giugno 2023');
        expect(formatIntlDate(date, { dateStyle: 'short' }, 'it')).toEqual('17/06/23');
        expect(formatIntlDate(date, { dateStyle: 'medium' }, 'it')).toEqual('17 giu 2023');

        // ko;
        expect(formatIntlDate(date, { dateStyle: 'full' }, 'ko')).toEqual('2023년 6월 17일 토요일');
        expect(formatIntlDate(date, { dateStyle: 'long' }, 'ko')).toEqual('2023년 6월 17일');
        expect(formatIntlDate(date, { dateStyle: 'short' }, 'ko')).toEqual('23. 6. 17.');
        expect(formatIntlDate(date, { dateStyle: 'medium' }, 'ko')).toEqual('2023. 6. 17.');
    });

    it('offers four built-in time formatting options', () => {
        const date = new Date(2023, 5, 13, 17, 44, 2);

        // en-UK
        // timeStyle 'full' includes a full time zone name, e.g. 15:44:02 Central European Summer Time
        expect(formatIntlDate(date, { timeStyle: 'full' }, 'en-UK')).toContain('17:44:02');
        // timeStyle 'long' includes a short time zone name, e.g. 15:44:02 CEST, or 15:44:02 GMT+2
        expect(formatIntlDate(date, { timeStyle: 'long' }, 'en-UK')).toContain('17:44:02');
        expect(formatIntlDate(date, { timeStyle: 'short' }, 'en-UK')).toEqual('17:44');
        expect(formatIntlDate(date, { timeStyle: 'medium' }, 'en-UK')).toEqual('17:44:02');

        // es-ES
        expect(formatIntlDate(date, { timeStyle: 'full' }, 'es-ES')).toContain('17:44:02');
        expect(formatIntlDate(date, { timeStyle: 'long' }, 'es-ES')).toContain('17:44:02');
        expect(formatIntlDate(date, { timeStyle: 'short' }, 'es-ES')).toEqual('17:44');
        expect(formatIntlDate(date, { timeStyle: 'medium' }, 'es-ES')).toEqual('17:44:02');

        // ja-JP;
        expect(formatIntlDate(date, { timeStyle: 'full' }, 'ja-JP')).toContain('17時44分02秒');
        expect(formatIntlDate(date, { timeStyle: 'long' }, 'ja-JP')).toContain('17:44:02');
        expect(formatIntlDate(date, { timeStyle: 'short' }, 'ja-JP')).toEqual('17:44');
        expect(formatIntlDate(date, { timeStyle: 'medium' }, 'ja-JP')).toEqual('17:44:02');
    });

    it('should default to US English when locale is unknown to Javascript', () => {
        const date = new Date(2023, 5, 17, 11, 44, 2);

        expect(formatIntlDate(date, { dateStyle: 'full' }, 'not_a_locale')).toEqual('Saturday, June 17, 2023');
        expect(formatIntlDate(date, { dateStyle: 'long' }, 'not_a_locale')).toEqual('June 17, 2023');
        expect(formatIntlDate(date, { dateStyle: 'short' }, 'not_a_locale')).toEqual('6/17/23');
        expect(formatIntlDate(date, { dateStyle: 'medium' }, 'not_a_locale')).toEqual('Jun 17, 2023');
    });
});

import { formatIntlUTCDate } from '../../lib/date-utc/formatIntlUTCDate';

describe('formatIntlUTCDate()', () => {
    it('formats UTC dates, not local dates', () => {
        // The following test will pass in any machine with any local time zone (try it yourself!).
        const date = new Date(Date.UTC(2023, 5, 13, 17, 44, 2));

        expect(formatIntlUTCDate(date, { timeStyle: 'short', hour12: false }, 'en-US')).toEqual('17:44');
        expect(formatIntlUTCDate(date, { timeStyle: 'short', hour12: true }, 'fr-FR')).toEqual('05:44 PM');
    });
});

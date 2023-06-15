import { formatIntlUTCDate } from '../../lib/date-utc/formatIntlUTCDate';

describe('formatIntlUTCDate()', () => {
    it('formats UTC dates, not local dates', () => {
        // The following test will pass in any machine with any local time zone (try it yourself!).
        // Unfortunately there's no easy way of mocking local time zones with karma, so we can't make that explicit
        const date = new Date(Date.UTC(2023, 5, 13, 17, 44, 2));

        expect(formatIntlUTCDate(date, { timeStyle: 'short', hour12: false }, 'en-US')).toEqual('17:44');
        expect(formatIntlUTCDate(date, { timeStyle: 'short', hour12: true }, 'fr-FR')).toEqual('05:44 PM');
    });
});

import { format } from '../../lib/date-fns-utc';

describe('date-fn utc', () => {
    it('it should format in UTC time', () => {
        const utcDate = new Date(Date.UTC(2000, 0, 1, 1, 0));
        expect(format(utcDate, 'Pp')).toBe('01/01/2000, 1:00 AM');
    });
});

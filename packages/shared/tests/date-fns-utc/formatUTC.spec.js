import { format } from '../../lib/date-fns-utc';

describe('date-fn utc', () => {
    // this test is designed for Central European Time
    it('it should format in UTC time', () => {
        const utcDate = new Date(Date.UTC(2000, 0, 1, 1, 0));
        expect(format(utcDate, 'Pp')).toBe('01/01/2000, 1:00 AM');
    });

    it('it should format properly right at DST change time, summer to winter', () => {
        const utcDate = new Date(Date.UTC(2019, 9, 27, 1, 0));
        expect(format(utcDate, 'Pp')).toBe('10/27/2019, 1:00 AM');
    });

    it('it should format properly before DST change time, summer to winter', () => {
        const utcDate = new Date(Date.UTC(2019, 9, 27, 0, 0));
        expect(format(utcDate, 'Pp')).toBe('10/27/2019, 12:00 AM');
    });

    it('it should format properly after DST change time, summer to winter', () => {
        const utcDate = new Date(Date.UTC(2019, 9, 27, 2, 0));
        expect(format(utcDate, 'Pp')).toBe('10/27/2019, 2:00 AM');
    });

    it('it should format properly right at DST change time, winter to summer', () => {
        const utcDate = new Date(Date.UTC(2019, 2, 31, 1, 0));
        expect(format(utcDate, 'Pp')).toBe('03/31/2019, 1:00 AM');
    });

    it('it should format properly before DST change time, winter to summer', () => {
        const utcDate = new Date(Date.UTC(2019, 2, 31, 0, 0));
        expect(format(utcDate, 'Pp')).toBe('03/31/2019, 12:00 AM');
    });

    it('it should format properly after DST change time, winter to summer', () => {
        const utcDate = new Date(Date.UTC(2019, 2, 31, 2, 0));
        expect(format(utcDate, 'Pp')).toBe('03/31/2019, 2:00 AM');
    });
});

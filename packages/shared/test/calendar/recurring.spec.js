import { parse } from '../../lib/calendar/vcal';
import { getOccurrencesBetween } from '../../lib/calendar/recurring';

describe('recurring', () => {
    const component = {
        dtstart: {
            value: { year: 2019, month: 1, day: 30, hours: 2, minutes: 30, seconds: 0, isUTC: false },
            parameters: {
                type: 'date-time',
                tzid: 'Europe/Zurich'
            }
        },
        dtend: {
            value: { year: 2019, month: 1, day: 30, hours: 3, minutes: 30, seconds: 0, isUTC: false },
            parameters: {
                type: 'date-time',
                tzid: 'Europe/Zurich'
            }
        },
        rrule: {
            value: {
                freq: 'DAILY'
            }
        }
    };

    it('should not get occurrences between if it is out of range', () => {
        const result = getOccurrencesBetween(component, Date.UTC(2018, 3, 1), Date.UTC(2018, 3, 2));
        expect(result).toEqual([]);
    });

    it('should get occurrences between a range', () => {
        const result = getOccurrencesBetween(component, Date.UTC(2019, 2, 1), Date.UTC(2019, 2, 3));

        expect(
            result.map(([start, end]) => `${new Date(start).toISOString()} - ${new Date(end).toISOString()}`)
        ).toEqual([
            '2019-03-01T01:30:00.000Z - 2019-03-01T02:30:00.000Z',
            '2019-03-02T01:30:00.000Z - 2019-03-02T02:30:00.000Z'
        ]);
    });

    it('should get occurrences between a dst range', () => {
        const result = getOccurrencesBetween(component, Date.UTC(2019, 9, 26), Date.UTC(2019, 9, 29));

        expect(
            result.map(([start, end]) => `${new Date(start).toISOString()} - ${new Date(end).toISOString()}`)
        ).toEqual([
            '2019-10-26T00:30:00.000Z - 2019-10-26T01:30:00.000Z',
            '2019-10-27T01:30:00.000Z - 2019-10-27T02:30:00.000Z',
            '2019-10-28T01:30:00.000Z - 2019-10-28T02:30:00.000Z'
        ]);
    });

    it('should get cached occurrences between a range', () => {
        const cache = {};
        const result1 = getOccurrencesBetween(component, Date.UTC(2019, 2, 1), Date.UTC(2019, 2, 3), cache);
        const result2 = getOccurrencesBetween(component, Date.UTC(2019, 2, 1), Date.UTC(2019, 2, 3), cache);
        expect(result1).toEqual(result2);
    });

    it('should fill cache if out of range', () => {
        const cache = {};
        const result1 = getOccurrencesBetween(component, Date.UTC(2019, 2, 1), Date.UTC(2019, 2, 3), cache);
        const result2 = getOccurrencesBetween(component, Date.UTC(2031, 2, 1), Date.UTC(2031, 2, 3), cache);
        expect(
            result2.map(([start, end]) => `${new Date(start).toISOString()} - ${new Date(end).toISOString()}`)
        ).toEqual([
            '2031-03-01T01:30:00.000Z - 2031-03-01T02:30:00.000Z',
            '2031-03-02T01:30:00.000Z - 2031-03-02T02:30:00.000Z'
        ]);
    });

    it('should fill occurrences with a count', () => {
        const component = parse(`
BEGIN:VEVENT
DTSTART;VALUE=DATE:20200129
DTEND;VALUE=DATE:20200130
RRULE:FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH,FR,SA;COUNT=3
END:VEVENT`);
        const cache = {};
        const result = getOccurrencesBetween(component, Date.UTC(2020, 0, 1), Date.UTC(2020, 2, 1), cache);
        expect(
            result.map(([start, end]) => `${new Date(start).toISOString()} - ${new Date(end).toISOString()}`)
        ).toEqual([
            '2020-01-29T00:00:00.000Z - 2020-01-29T00:00:00.000Z',
            '2020-01-30T00:00:00.000Z - 2020-01-30T00:00:00.000Z',
            '2020-01-31T00:00:00.000Z - 2020-01-31T00:00:00.000Z'
        ]);
    });

    it('should fill occurrences until 31st of Jan in for all day events', () => {
        const component = parse(`
BEGIN:VEVENT
DTSTART;VALUE=DATE:20200129
DTEND;VALUE=DATE:20200130
RRULE:FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH,FR,SA;UNTIL=20200131
END:VEVENT`);
        const cache = {};
        const result = getOccurrencesBetween(component, Date.UTC(2020, 0, 1), Date.UTC(2020, 2, 1), cache);
        expect(
            result.map(([start, end]) => `${new Date(start).toISOString()} - ${new Date(end).toISOString()}`)
        ).toEqual([
            '2020-01-29T00:00:00.000Z - 2020-01-29T00:00:00.000Z',
            '2020-01-30T00:00:00.000Z - 2020-01-30T00:00:00.000Z',
            '2020-01-31T00:00:00.000Z - 2020-01-31T00:00:00.000Z'
        ]);
    });

    it('should fill occurrences until 31st of Jan in UTC time', () => {
        const component = parse(`
BEGIN:VEVENT
DTSTART:20200129T130000Z
DTEND:20200129T133000Z
RRULE:FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH,FR,SA;UNTIL=20200131T235959Z
END:VEVENT`);
        const cache = {};
        const result = getOccurrencesBetween(component, Date.UTC(2020, 0, 1), Date.UTC(2020, 2, 1), cache);
        expect(
            result.map(([start, end]) => `${new Date(start).toISOString()} - ${new Date(end).toISOString()}`)
        ).toEqual([
            '2020-01-29T13:00:00.000Z - 2020-01-29T13:30:00.000Z',
            '2020-01-30T13:00:00.000Z - 2020-01-30T13:30:00.000Z',
            '2020-01-31T13:00:00.000Z - 2020-01-31T13:30:00.000Z'
        ]);
    });

    it('should fill occurrences until 31st of Jan in Pago Pago time', () => {
        const component = parse(`
BEGIN:VEVENT
DTSTART;TZID=Pacific/Pago_Pago:20200129T000000
DTEND;TZID=Europe/Zurich:20200129T133000
RRULE:FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH,FR,SA;UNTIL=20200201T105959Z
END:VEVENT`);
        const cache = {};
        const result = getOccurrencesBetween(component, Date.UTC(2020, 0, 1), Date.UTC(2020, 2, 1), cache);
        expect(
            result.map(([start, end]) => `${new Date(start).toISOString()} - ${new Date(end).toISOString()}`)
        ).toEqual([
            '2020-01-29T11:00:00.000Z - 2020-01-29T12:30:00.000Z',
            '2020-01-30T11:00:00.000Z - 2020-01-30T12:30:00.000Z',
            '2020-01-31T11:00:00.000Z - 2020-01-31T12:30:00.000Z'
        ]);
    });

    it('should fill occurrences for an event starting on a sunday', () => {
        const component = parse(`
BEGIN:VEVENT
RRULE:FREQ=WEEKLY;COUNT=4;BYDAY=SA,SU
DTSTART;VALUE=DATE:20200126
DTEND;VALUE=DATE:20200127
END:VEVENT
`);
        const cache = {};
        const result = getOccurrencesBetween(component, Date.UTC(2020, 0, 1), Date.UTC(2021, 2, 1), cache);
        expect(
            result.map(([start, end]) => `${new Date(start).toISOString()} - ${new Date(end).toISOString()}`)
        ).toEqual([
            '2020-01-26T00:00:00.000Z - 2020-01-26T00:00:00.000Z',
            '2020-02-01T00:00:00.000Z - 2020-02-01T00:00:00.000Z',
            '2020-02-02T00:00:00.000Z - 2020-02-02T00:00:00.000Z',
            '2020-02-08T00:00:00.000Z - 2020-02-08T00:00:00.000Z'
        ]);
    });
});

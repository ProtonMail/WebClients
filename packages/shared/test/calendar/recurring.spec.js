import { getOccurencesBetween } from '../../lib/calendar/recurring';

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
        const result = getOccurencesBetween(component, Date.UTC(2018, 3, 1), Date.UTC(2018, 3, 2));
        expect(result).toEqual([]);
    });

    it('should get occurrences between a range', () => {
        const result = getOccurencesBetween(component, Date.UTC(2019, 2, 1), Date.UTC(2019, 2, 3));

        expect(
            result.map(([start, end]) => `${new Date(start).toISOString()} - ${new Date(end).toISOString()}`)
        ).toEqual([
            '2019-03-01T01:30:00.000Z - 2019-03-01T02:30:00.000Z',
            '2019-03-02T01:30:00.000Z - 2019-03-02T02:30:00.000Z'
        ]);
    });

    it('should get occurrences between a dst range', () => {
        const result = getOccurencesBetween(component, Date.UTC(2019, 9, 26), Date.UTC(2019, 9, 29));

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
        const result1 = getOccurencesBetween(component, Date.UTC(2019, 2, 1), Date.UTC(2019, 2, 3), cache);
        const result2 = getOccurencesBetween(component, Date.UTC(2019, 2, 1), Date.UTC(2019, 2, 3), cache);
        expect(result1).toEqual(result2);
    });

    it('should fill cache if out of range', () => {
        const cache = {};
        const result1 = getOccurencesBetween(component, Date.UTC(2019, 2, 1), Date.UTC(2019, 2, 3), cache);
        const result2 = getOccurencesBetween(component, Date.UTC(2031, 2, 1), Date.UTC(2031, 2, 3), cache);
        expect(
            result2.map(([start, end]) => `${new Date(start).toISOString()} - ${new Date(end).toISOString()}`)
        ).toEqual([
            '2031-03-01T01:30:00.000Z - 2031-03-01T02:30:00.000Z',
            '2031-03-02T01:30:00.000Z - 2031-03-02T02:30:00.000Z'
        ]);
    });
});

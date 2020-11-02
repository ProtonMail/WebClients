import { parse } from '../../lib/calendar/vcal';
import { getOccurrences, getOccurrencesBetween } from '../../lib/calendar/recurring';

const stringifyResult = (result) => {
    return result.map(({ utcStart, utcEnd, occurrenceNumber }) => {
        return `${utcStart.toISOString()} - ${utcEnd.toISOString()} | ${occurrenceNumber}`;
    });
};

const stringifyResultFull = (result) => {
    return result.map(({ localStart, localEnd, utcStart, utcEnd, occurrenceNumber }) => {
        return `${localStart.toISOString()} - ${localEnd.toISOString()} | ${utcStart.toISOString()} - ${utcEnd.toISOString()} | ${occurrenceNumber}`;
    });
};

const stringifyResultSimple = (result) => {
    return result.map(({ utcStart, utcEnd }) => {
        return `${utcStart.toISOString()} - ${utcEnd.toISOString()}`;
    });
};

const stringifyLocalResultSimple = (result) => {
    return result.map(({ localStart, occurrenceNumber }) => {
        return `${localStart.toISOString()} - ${occurrenceNumber}`;
    });
};

describe('recurring', () => {
    const component = {
        dtstart: {
            value: { year: 2019, month: 1, day: 30, hours: 2, minutes: 30, seconds: 0, isUTC: false },
            parameters: {
                type: 'date-time',
                tzid: 'Europe/Zurich',
            },
        },
        dtend: {
            value: { year: 2019, month: 1, day: 30, hours: 3, minutes: 30, seconds: 0, isUTC: false },
            parameters: {
                type: 'date-time',
                tzid: 'Europe/Zurich',
            },
        },
        rrule: {
            value: {
                freq: 'DAILY',
            },
        },
    };

    it('should not get occurrences between if it is out of range', () => {
        const result = getOccurrencesBetween(component, Date.UTC(2018, 3, 1), Date.UTC(2018, 3, 2));
        expect(result).toEqual([]);
    });

    it('should get initial occurrences between a range', () => {
        const result = getOccurrencesBetween(component, Date.UTC(2018, 1, 1), Date.UTC(2019, 1, 3));

        expect(stringifyResult(result)).toEqual([
            '2019-01-30T01:30:00.000Z - 2019-01-30T02:30:00.000Z | 1',
            '2019-01-31T01:30:00.000Z - 2019-01-31T02:30:00.000Z | 2',
            '2019-02-01T01:30:00.000Z - 2019-02-01T02:30:00.000Z | 3',
            '2019-02-02T01:30:00.000Z - 2019-02-02T02:30:00.000Z | 4',
        ]);
    });

    it('should get occurrences between a range', () => {
        const result = getOccurrencesBetween(component, Date.UTC(2019, 2, 1), Date.UTC(2019, 2, 3));

        expect(stringifyResult(result)).toEqual([
            '2019-03-01T01:30:00.000Z - 2019-03-01T02:30:00.000Z | 31',
            '2019-03-02T01:30:00.000Z - 2019-03-02T02:30:00.000Z | 32',
        ]);
    });

    it('should get occurrences between a dst range', () => {
        const result = getOccurrencesBetween(component, Date.UTC(2019, 9, 26), Date.UTC(2019, 9, 29));

        expect(stringifyResultFull(result)).toEqual([
            '2019-10-26T02:30:00.000Z - 2019-10-26T03:30:00.000Z | 2019-10-26T00:30:00.000Z - 2019-10-26T01:30:00.000Z | 270',
            '2019-10-27T02:30:00.000Z - 2019-10-27T03:30:00.000Z | 2019-10-27T01:30:00.000Z - 2019-10-27T02:30:00.000Z | 271',
            '2019-10-28T02:30:00.000Z - 2019-10-28T03:30:00.000Z | 2019-10-28T01:30:00.000Z - 2019-10-28T02:30:00.000Z | 272',
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
        getOccurrencesBetween(component, Date.UTC(2019, 2, 1), Date.UTC(2019, 2, 3), cache);
        const result2 = getOccurrencesBetween(component, Date.UTC(2031, 2, 1), Date.UTC(2031, 2, 3), cache);
        expect(stringifyResult(result2)).toEqual([
            '2031-03-01T01:30:00.000Z - 2031-03-01T02:30:00.000Z | 4414',
            '2031-03-02T01:30:00.000Z - 2031-03-02T02:30:00.000Z | 4415',
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
        expect(stringifyResultSimple(result)).toEqual([
            '2020-01-29T00:00:00.000Z - 2020-01-29T00:00:00.000Z',
            '2020-01-30T00:00:00.000Z - 2020-01-30T00:00:00.000Z',
            '2020-01-31T00:00:00.000Z - 2020-01-31T00:00:00.000Z',
        ]);
    });

    it('should pick a targeted given occurrence ', () => {
        const component = parse(`
BEGIN:VEVENT
DTSTART:20200129T113000Z
DTEND:20200129T123000Z
RRULE:FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH,FR,SA;COUNT=3
END:VEVENT`);
        const cache = {};
        const result = getOccurrencesBetween(
            component,
            Date.UTC(2020, 0, 29, 11, 30),
            Date.UTC(2020, 0, 29, 11, 30),
            cache
        );
        expect(stringifyResultSimple(result)).toEqual(['2020-01-29T11:30:00.000Z - 2020-01-29T12:30:00.000Z']);
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
        expect(stringifyResultSimple(result)).toEqual([
            '2020-01-29T00:00:00.000Z - 2020-01-29T00:00:00.000Z',
            '2020-01-30T00:00:00.000Z - 2020-01-30T00:00:00.000Z',
            '2020-01-31T00:00:00.000Z - 2020-01-31T00:00:00.000Z',
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
        expect(stringifyResultSimple(result)).toEqual([
            '2020-01-29T13:00:00.000Z - 2020-01-29T13:30:00.000Z',
            '2020-01-30T13:00:00.000Z - 2020-01-30T13:30:00.000Z',
            '2020-01-31T13:00:00.000Z - 2020-01-31T13:30:00.000Z',
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
        expect(stringifyResultSimple(result)).toEqual([
            '2020-01-29T11:00:00.000Z - 2020-01-29T12:30:00.000Z',
            '2020-01-30T11:00:00.000Z - 2020-01-30T12:30:00.000Z',
            '2020-01-31T11:00:00.000Z - 2020-01-31T12:30:00.000Z',
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
        expect(stringifyResultSimple(result)).toEqual([
            '2020-01-26T00:00:00.000Z - 2020-01-26T00:00:00.000Z',
            '2020-02-01T00:00:00.000Z - 2020-02-01T00:00:00.000Z',
            '2020-02-02T00:00:00.000Z - 2020-02-02T00:00:00.000Z',
            '2020-02-08T00:00:00.000Z - 2020-02-08T00:00:00.000Z',
        ]);
    });

    it('should fill occurrences for an event with an exdate', () => {
        const component = parse(`
BEGIN:VEVENT
RRULE:FREQ=DAILY;COUNT=6
DTSTART;TZID=Europe/Zurich:20200309T043000
DTEND;TZID=Europe/Zurich:20200309T063000
EXDATE;TZID=Europe/Zurich:20200311T043000
EXDATE;TZID=Europe/Zurich:20200313T043000
END:VEVENT
`);
        const cache = {};
        const result = getOccurrencesBetween(component, Date.UTC(2020, 0, 1), Date.UTC(2021, 4, 1), cache);
        expect(stringifyResult(result)).toEqual([
            '2020-03-09T03:30:00.000Z - 2020-03-09T05:30:00.000Z | 1',
            '2020-03-10T03:30:00.000Z - 2020-03-10T05:30:00.000Z | 2',
            '2020-03-12T03:30:00.000Z - 2020-03-12T05:30:00.000Z | 4',
            '2020-03-14T03:30:00.000Z - 2020-03-14T05:30:00.000Z | 6',
        ]);
    });

    it('should fill occurrences for an all day event with an exdate', () => {
        const component = parse(`
BEGIN:VEVENT
RRULE:FREQ=DAILY;COUNT=6
DTSTART;VALUE=DATE:20200201
DTEND;VALUE=DATE:20200202
EXDATE;VALUE=DATE:20200201
EXDATE;VALUE=DATE:20200202
EXDATE;VALUE=DATE:20200203
END:VEVENT
`);
        const cache = {};
        const result = getOccurrencesBetween(component, Date.UTC(2020, 0, 1), Date.UTC(2021, 4, 1), cache);
        expect(stringifyResultSimple(result)).toEqual([
            '2020-02-04T00:00:00.000Z - 2020-02-04T00:00:00.000Z',
            '2020-02-05T00:00:00.000Z - 2020-02-05T00:00:00.000Z',
            '2020-02-06T00:00:00.000Z - 2020-02-06T00:00:00.000Z',
        ]);
    });

    it('should not fill occurrences for an event without rrule', () => {
        const component = parse(`
BEGIN:VEVENT
DTSTART:20200201T030000Z
DTEND:20200201T040000Z
END:VEVENT
`);
        const cache = {};
        const result = getOccurrencesBetween(component, Date.UTC(2020, 0, 1), Date.UTC(2021, 4, 1), cache);
        expect(stringifyResultSimple(result)).toEqual(['2020-02-01T03:00:00.000Z - 2020-02-01T04:00:00.000Z']);
    });

    it('should fill one occurrence without rrule', () => {
        const component = parse(`
BEGIN:VEVENT
DTSTART:20200201T030000Z
DTEND:20200201T040000Z
END:VEVENT
`);
        expect(getOccurrences({ component, maxCount: 0 }).length).toBe(0);
        expect(getOccurrences({ component, maxCount: 1 }).length).toBe(1);
        expect(getOccurrences({ component, maxCount: 2 }).length).toBe(1);
    });

    it('should fill occurrences with max start', () => {
        const component = parse(`
BEGIN:VEVENT
DTSTART:20200201T030000Z
DTEND:20200201T040000Z
RRULE:FREQ=DAILY;COUNT=6
END:VEVENT
`);
        expect(
            stringifyLocalResultSimple(
                getOccurrences({
                    component,
                    maxCount: 999,
                    maxStart: new Date(Date.UTC(2020, 1, 4)),
                })
            )
        ).toEqual(['2020-02-01T03:00:00.000Z - 1', '2020-02-02T03:00:00.000Z - 2', '2020-02-03T03:00:00.000Z - 3']);
    });

    it('should fill occurrences for a UTC date with an exdate', () => {
        const component = parse(`
BEGIN:VEVENT
RRULE:FREQ=DAILY;COUNT=6
DTSTART:20200201T030000Z
DTEND:20200201T040000Z
EXDATE:20200202T030000Z
EXDATE:20200203T030000Z
EXDATE:20200204T030000Z
END:VEVENT
`);
        const cache = {};
        const result = getOccurrencesBetween(component, Date.UTC(2020, 0, 1), Date.UTC(2021, 4, 1), cache);
        expect(stringifyResultSimple(result)).toEqual([
            '2020-02-01T03:00:00.000Z - 2020-02-01T04:00:00.000Z',
            '2020-02-05T03:00:00.000Z - 2020-02-05T04:00:00.000Z',
            '2020-02-06T03:00:00.000Z - 2020-02-06T04:00:00.000Z',
        ]);
    });

    it('should fill occurrences with an end date in another timezone', () => {
        const component = parse(`
BEGIN:VEVENT
RRULE:FREQ=DAILY;COUNT=2;INTERVAL=60
DTSTART;TZID=Europe/Zurich:20200901T080000
DTEND:20200901T060000Z
END:VEVENT
`);
        const cache = {};
        const result = getOccurrencesBetween(component, Date.UTC(2020, 0, 1), Date.UTC(2021, 4, 1), cache);
        expect(stringifyResultFull(result)).toEqual([
            '2020-09-01T08:00:00.000Z - 2020-09-01T06:00:00.000Z | 2020-09-01T06:00:00.000Z - 2020-09-01T06:00:00.000Z | 1',
            '2020-10-31T08:00:00.000Z - 2020-10-31T07:00:00.000Z | 2020-10-31T07:00:00.000Z - 2020-10-31T07:00:00.000Z | 2',
        ]);
    });
});

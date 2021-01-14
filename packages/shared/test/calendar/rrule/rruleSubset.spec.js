import { FREQUENCY } from '../../../lib/calendar/constants';
import { getIsRruleSubset } from '../../../lib/calendar/rruleSubset';

const getTest = (a, b, result) => ({
    a,
    b,
    result,
});

describe('rrule subset', () => {
    const dummyVevent = {
        dtstart: {
            value: { year: 2021, month: 1, day: 6, hours: 12, minutes: 0, seconds: 0, isUTC: false },
            parameters: { tzid: 'America/New_York' },
        },
    };
    const dummyUntil = {
        value: { year: 2021, month: 1, day: 10, hours: 23, minutes: 59, seconds: 59, isUTC: false },
        parameters: { tzid: 'America/New_York' },
    };
    [
        getTest(
            { ...dummyVevent, rrule: { value: { freq: FREQUENCY.DAILY, count: 10 } } },
            { ...dummyVevent, rrule: { value: { freq: FREQUENCY.DAILY } } },
            true
        ),
        getTest(
            { ...dummyVevent, rrule: { value: { freq: FREQUENCY.DAILY, interval: 2 } } },
            { ...dummyVevent, rrule: { value: { freq: FREQUENCY.DAILY } } },
            true
        ),
        getTest(
            { ...dummyVevent, rrule: { value: { freq: FREQUENCY.DAILY, interval: 2, until: dummyUntil } } },
            { ...dummyVevent, rrule: { value: { freq: FREQUENCY.DAILY, until: dummyUntil } } },
            true
        ),
        getTest(
            {
                ...dummyVevent,
                rrule: { value: { freq: FREQUENCY.WEEKLY, byday: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] } },
            },
            { ...dummyVevent, rrule: { value: { freq: FREQUENCY.DAILY } } },
            true
        ),
        getTest(
            { ...dummyVevent, rrule: { value: { freq: FREQUENCY.WEEKLY, byday: ['WE', 'FR', 'SU'], count: 3 } } },
            { ...dummyVevent, rrule: { value: { freq: FREQUENCY.DAILY, interval: 2, count: 3 } } },
            true
        ),
        getTest(
            { ...dummyVevent, rrule: { value: { freq: FREQUENCY.DAILY } } },
            { ...dummyVevent, rrule: { value: { freq: FREQUENCY.DAILY, count: 10 } } },
            false
        ),
        getTest(
            { ...dummyVevent, rrule: { value: { freq: FREQUENCY.DAILY, interval: 2 } } },
            { ...dummyVevent, rrule: { value: { freq: FREQUENCY.DAILY, interval: 3 } } },
            false
        ),
        getTest(
            { ...dummyVevent, rrule: { value: { freq: FREQUENCY.MONTHLY, byday: 'WE', bysetpos: 1 } } },
            { ...dummyVevent, rrule: { value: { freq: FREQUENCY.MONTHLY } } },
            false
        ),
        getTest(
            {
                dtstart: {
                    value: { year: 2020, month: 1, day: 6, hours: 12, minutes: 0, seconds: 0, isUTC: false },
                    parameters: { tzid: 'America/New_York' },
                },
                rrule: {
                    value: {
                        freq: FREQUENCY.WEEKLY,
                        interval: 2,
                        byday: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'],
                        wkst: 'SU',
                    },
                },
            },
            {
                dtstart: {
                    value: { year: 2020, month: 1, day: 6, hours: 12, minutes: 0, seconds: 0, isUTC: false },
                    parameters: { tzid: 'America/New_York' },
                },
                rrule: {
                    value: {
                        freq: FREQUENCY.WEEKLY,
                        interval: 2,
                        byday: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'],
                    },
                },
            },
            false
        ),
    ].forEach(({ a, b, result }, i) => {
        it(`is rrule subset for ${i}`, () => {
            expect(getIsRruleSubset(a, b)).toEqual(result);
        });
    });
});

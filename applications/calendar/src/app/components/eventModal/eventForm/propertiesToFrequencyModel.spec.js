import { END_TYPE, FREQUENCY, MONTHLY_TYPE, WEEKLY_TYPE } from 'proton-shared/lib/calendar/constants';
import { getInitialFrequencyModel } from './state';
import { propertiesToFrequencyModel } from './propertiesToFrequencyModel';

const startModel = {
    date: new Date(2020, 0, 20),
};
const dummyFrequencyModel = getInitialFrequencyModel(startModel.date);

describe('frequency properties to model, daily recurring rule', () => {
    test('non-custom: single day, recurring never ends', () => {
        const rrule = {
            value: {
                freq: 'DAILY',
            },
        };
        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.DAILY,
            frequency: FREQUENCY.DAILY,
        });
    });

    test('every three days, recurring never ends', () => {
        const rrule = {
            value: {
                freq: 'DAILY',
                interval: 3,
            },
        };
        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.DAILY,
            interval: 3,
        });
    });

    test('every two days, recurring ends after 5 occurrences', () => {
        const rrule = {
            value: {
                freq: 'DAILY',
                interval: 2,
                count: 5,
            },
        };
        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.DAILY,
            interval: 2,
            ends: {
                type: END_TYPE.AFTER_N_TIMES,
                count: 5,
            },
        });
    });

    test('recursion ends on 30th January on Europe/Athens timezone', () => {
        const dateTime = { year: 2020, month: 1, day: 30, hours: 21, minutes: 59, seconds: 59, isUTC: true };
        const date = new Date(2020, 0, 30);

        const rrule = {
            value: {
                freq: 'DAILY',
                until: dateTime,
            },
        };
        const startAthens = {
            ...startModel,
            tzid: 'Europe/Athens',
        };
        expect(propertiesToFrequencyModel(rrule, startAthens)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.DAILY,
            ends: {
                type: END_TYPE.UNTIL,
                count: 2,
                until: date,
            },
        });
    });
    test('all-day event every two days, recursion ends on 30th January', () => {
        const dateTime = { year: 2020, month: 1, day: 30, hours: 21, minutes: 59, seconds: 59, isUTC: false };
        const date = new Date(2020, 0, 30);

        const rrule = {
            value: {
                freq: 'DAILY',
                interval: 2,
                until: dateTime,
            },
        };

        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.DAILY,
            interval: 2,
            ends: {
                type: END_TYPE.UNTIL,
                count: 2,
                until: date,
            },
        });
    });
});

describe('frequency properties to model, weekly recurring rule', () => {
    test('non-custom: single day, recurring never ends', () => {
        const rrule = {
            value: {
                freq: 'WEEKLY',
            },
        };
        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.WEEKLY,
        });
    });

    test('single day, every three weeks, recurring never ends', () => {
        const rrule = {
            value: {
                freq: 'WEEKLY',
                interval: 3,
                byday: ['MO'],
            },
        };
        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            interval: 3,
        });
    });

    test('two days, recurring never ends', () => {
        const rrule = {
            value: {
                freq: 'WEEKLY',
                interval: 3,
                byday: ['MO', 'WE'],
            },
        };
        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            interval: 3,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [1, 3],
            },
        });
    });

    test('three days, recurring ends after 5 occurrences', () => {
        const rrule = {
            value: {
                freq: 'WEEKLY',
                byday: ['MO', 'WE', 'FR'],
                count: 5,
            },
        };
        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [1, 3, 5],
            },
            ends: {
                type: END_TYPE.AFTER_N_TIMES,
                count: 5,
            },
        });
    });

    test('three days, recursion ends on 30th January on Europe/Athens timezone', () => {
        const dateTime = { year: 2020, month: 1, day: 30, hours: 21, minutes: 59, seconds: 59, isUTC: true };
        const date = new Date(2020, 0, 30);

        const rrule = {
            value: {
                freq: 'WEEKLY',
                byday: ['MO', 'WE', 'FR'],
                until: dateTime,
            },
        };
        const startAthens = {
            ...startModel,
            tzid: 'Europe/Athens',
        };
        expect(propertiesToFrequencyModel(rrule, startAthens)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [1, 3, 5],
            },
            ends: {
                type: END_TYPE.UNTIL,
                count: 2,
                until: date,
            },
        });
    });

    test('one all-day event, recursion ends on 30th January', () => {
        const dateTime = { year: 2020, month: 1, day: 30, hours: 21, minutes: 59, seconds: 59, isUTC: false };
        const date = new Date(2020, 0, 30);

        const rrule = {
            value: {
                freq: 'WEEKLY',
                byday: ['MO', 'WE', 'FR'],
                until: dateTime,
            },
        };

        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [1, 3, 5],
            },
            ends: {
                type: END_TYPE.UNTIL,
                count: 2,
                until: date,
            },
        });
    });
});

describe('frequency properties to model, monthly recurring rule', () => {
    test('non-custom: single day, recurring never ends', () => {
        const rrule = {
            value: {
                freq: 'MONTHLY',
            },
        };
        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.MONTHLY,
            frequency: FREQUENCY.MONTHLY,
        });
    });

    test('single day, every three months, recurring never ends', () => {
        const rrule = {
            value: {
                freq: 'MONTHLY',
                interval: 3,
            },
        };
        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.MONTHLY,
            interval: 3,
        });
    });

    test('every month on the last Monday, lasting 5 times', () => {
        const lastMondayStart = {
            date: new Date(2020, 0, 27),
        };
        const rrule = {
            value: {
                freq: 'MONTHLY',
                count: 5,
                byday: 'MO',
                bysetpos: -1,
            },
        };
        expect(propertiesToFrequencyModel(rrule, lastMondayStart)).toEqual({
            ...getInitialFrequencyModel(lastMondayStart.date),
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.MONTHLY,
            monthly: {
                type: MONTHLY_TYPE.ON_MINUS_NTH_DAY,
            },
            ends: {
                type: END_TYPE.AFTER_N_TIMES,
                count: 5,
            },
        });
    });

    test('every other month on the 12th, recurring ends after 2 occurrences', () => {
        const twelvethStart = {
            date: new Date(2020, 0, 12),
        };
        const rrule = {
            value: {
                freq: 'MONTHLY',
                interval: 2,
                bymonthday: 12,
                count: 2,
            },
        };
        expect(propertiesToFrequencyModel(rrule, twelvethStart)).toEqual({
            ...getInitialFrequencyModel(twelvethStart.date),
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.MONTHLY,
            interval: 2,
            ends: {
                type: END_TYPE.AFTER_N_TIMES,
                count: 2,
            },
        });
    });

    test('every second Wednesday, recursion ends on 30th January on Europe/Athens timezone', () => {
        const secondWednesdayStart = {
            date: new Date(2020, 0, 8),
            tzid: 'Europe/Athens',
        };
        const dateTime = { year: 2020, month: 1, day: 30, hours: 21, minutes: 59, seconds: 59, isUTC: true };
        const date = new Date(2020, 0, 30);

        const rrule = {
            value: {
                freq: 'MONTHLY',
                byday: 'WE',
                bysetpos: 2,
                until: dateTime,
            },
        };

        expect(propertiesToFrequencyModel(rrule, secondWednesdayStart)).toEqual({
            ...getInitialFrequencyModel(secondWednesdayStart.date),
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.MONTHLY,
            monthly: {
                type: MONTHLY_TYPE.ON_NTH_DAY,
            },
            ends: {
                type: END_TYPE.UNTIL,
                count: 2,
                until: date,
            },
        });
    });
    test('one all-day event every 12th of every 6 months, recursion ends on 30th January', () => {
        const twelvethStart = {
            date: new Date(2020, 0, 12),
        };
        const dateTime = { year: 2020, month: 1, day: 30, hours: 21, minutes: 59, seconds: 59, isUTC: false };
        const date = new Date(2020, 0, 30);

        const rrule = {
            value: {
                freq: 'MONTHLY',
                interval: 6,
                bymonthday: 12,
                until: dateTime,
            },
        };

        expect(propertiesToFrequencyModel(rrule, twelvethStart)).toEqual({
            ...getInitialFrequencyModel(twelvethStart.date),
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.MONTHLY,
            interval: 6,
            ends: {
                type: END_TYPE.UNTIL,
                count: 2,
                until: date,
            },
        });
    });
});

describe('frequency properties to model, yearly recurring rule', () => {
    test('non-custom: single day, recurring never ends', () => {
        const rrule = {
            value: {
                freq: 'YEARLY',
            },
        };
        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.YEARLY,
            frequency: FREQUENCY.YEARLY,
        });
    });

    test('every other year, recurring never ends', () => {
        const rrule = {
            value: {
                freq: 'YEARLY',
                interval: 2,
                bymonth: 7,
                bymonthday: 25,
            },
        };
        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.YEARLY,
            interval: 2,
        });
    });

    test('every other year, recurring ends after 5 occurrences', () => {
        const rrule = {
            value: {
                freq: 'YEARLY',
                interval: 2,
                count: 5,
                bymonth: 7,
                bymonthday: 25,
            },
        };
        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.YEARLY,
            interval: 2,
            ends: {
                type: END_TYPE.AFTER_N_TIMES,
                count: 5,
            },
        });
    });

    test('recursion ends on 30th January 2020 on Europe/Athens timezone', () => {
        const dateTime = { year: 2020, month: 1, day: 30, hours: 21, minutes: 59, seconds: 59, isUTC: true };
        const date = new Date(2020, 0, 30);

        const rrule = {
            value: {
                freq: 'YEARLY',
                until: dateTime,
                bymonth: 7,
                bymonthday: 25,
            },
        };
        const start = {
            ...startModel,
            tzid: 'Europe/Athens',
        };
        expect(propertiesToFrequencyModel(rrule, start)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.YEARLY,
            ends: {
                type: END_TYPE.UNTIL,
                count: 2,
                until: date,
            },
        });
    });

    test('all-day event every other year, recursion ends on 30th January 2020', () => {
        const dateTime = { year: 2020, month: 1, day: 30, hours: 21, minutes: 59, seconds: 59, isUTC: false };
        const date = new Date(2020, 0, 30);

        const rrule = {
            value: {
                freq: 'YEARLY',
                interval: 2,
                until: dateTime,
            },
        };
        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.YEARLY,
            interval: 2,
            ends: {
                type: END_TYPE.UNTIL,
                count: 2,
                until: date,
            },
        });
    });
});

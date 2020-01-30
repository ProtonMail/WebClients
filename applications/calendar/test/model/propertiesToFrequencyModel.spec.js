import { propertiesToFrequencyModel } from '../../src/app/components/eventModal/eventForm/propertiesToFrequencyModel';
import { END_TYPE, FREQUENCY, WEEKLY_TYPE } from '../../src/app/constants';
import { getInitialFrequencyModel } from '../../src/app/components/eventModal/eventForm/state';

const startModel = {
    date: new Date(2020, 0, 20)
};
const dummyFrequencyModel = getInitialFrequencyModel(startModel.date);

describe('frequency properties to model, daily recurring rule', () => {
    test('non-custom: single day, recurring never ends', () => {
        const rrule = {
            value: {
                freq: 'DAILY'
            }
        };
        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.DAILY,
            frequency: FREQUENCY.DAILY
        });
    });

    test('every three days, recurring never ends', () => {
        const rrule = {
            value: {
                freq: 'DAILY',
                interval: 3
            }
        };
        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.DAILY,
            interval: 3
        });
    });

    test('every two days, recurring ends after 5 occurrences', () => {
        const rrule = {
            value: {
                freq: 'DAILY',
                interval: 2,
                count: 5
            }
        };
        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.DAILY,
            interval: 2,
            ends: {
                type: END_TYPE.AFTER_N_TIMES,
                count: 5
            }
        });
    });

    test('recursion ends on 30th January on Europe/Athens timezone', () => {
        const dateTime = { year: 2020, month: 1, day: 30, hours: 21, minutes: 59, seconds: 59, isUTC: true };
        const date = new Date(2020, 0, 30);

        const rrule = {
            value: {
                freq: 'DAILY',
                until: dateTime
            }
        };
        const startAthens = {
            ...startModel,
            tzid: 'Europe/Athens'
        };
        expect(propertiesToFrequencyModel(rrule, startAthens)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.DAILY,
            ends: {
                type: END_TYPE.UNTIL,
                count: 2,
                until: date
            }
        });
    });
    test('all-day event every two days, recursion ends on 30th January', () => {
        const dateTime = { year: 2020, month: 1, day: 30, hours: 21, minutes: 59, seconds: 59, isUTC: false };
        const date = new Date(2020, 0, 30);

        const rrule = {
            value: {
                freq: 'DAILY',
                interval: 2,
                until: dateTime
            }
        };

        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.DAILY,
            interval: 2,
            ends: {
                type: END_TYPE.UNTIL,
                count: 2,
                until: date
            }
        });
    });
});

describe('frequency properties to model, weekly recurring rule', () => {
    test('non-custom: single day, recurring never ends', () => {
        const rrule = {
            value: {
                freq: 'WEEKLY'
            }
        };
        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.WEEKLY,
            frequency: FREQUENCY.WEEKLY
        });
    });

    test('single day, every three weeks, recurring never ends', () => {
        const rrule = {
            value: {
                freq: 'WEEKLY',
                interval: 3,
                byday: ['MO']
            }
        };
        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            interval: 3,
            until: undefined
        });
    });

    test('two days, recurring never ends', () => {
        const rrule = {
            value: {
                freq: 'WEEKLY',
                interval: 3,
                byday: ['WE', 'TH']
            }
        };
        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            interval: 3,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [3, 4]
            }
        });
    });

    test('three days, recurring ends after 5 occurrences', () => {
        const rrule = {
            value: {
                freq: 'WEEKLY',
                byday: ['MO', 'WE', 'FR'],
                count: 5
            }
        };
        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [1, 3, 5]
            },
            ends: {
                type: END_TYPE.AFTER_N_TIMES,
                count: 5,
                until: undefined
            }
        });
    });

    test('three days, recursion ends on 30th January on Europe/Athens timezone', () => {
        const dateTime = { year: 2020, month: 1, day: 30, hours: 21, minutes: 59, seconds: 59, isUTC: true };
        const date = new Date(2020, 0, 30);

        const rrule = {
            value: {
                freq: 'WEEKLY',
                byday: ['MO', 'WE', 'FR'],
                until: dateTime
            }
        };
        const startAthens = {
            ...startModel,
            tzid: 'Europe/Athens'
        };
        expect(propertiesToFrequencyModel(rrule, startAthens)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [1, 3, 5]
            },
            ends: {
                type: END_TYPE.UNTIL,
                count: 2,
                until: date
            }
        });
    });
    test('one all-day event, recursion ends on 30th January', () => {
        const dateTime = { year: 2020, month: 1, day: 30, hours: 21, minutes: 59, seconds: 59, isUTC: false };
        const date = new Date(2020, 0, 30);

        const rrule = {
            value: {
                freq: 'WEEKLY',
                byday: ['MO', 'WE', 'FR'],
                until: dateTime
            }
        };

        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [1, 3, 5]
            },
            ends: {
                type: END_TYPE.UNTIL,
                count: 2,
                until: date
            }
        });
    });
});

describe('frequency properties to model, yearly recurring rule', () => {
    test('non-custom: single day, recurring never ends', () => {
        const rrule = {
            value: {
                freq: 'YEARLY'
            }
        };
        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.YEARLY,
            frequency: FREQUENCY.YEARLY
        });
    });

    test('every other year, recurring never ends', () => {
        const rrule = {
            value: {
                freq: 'YEARLY',
                interval: 2,
                bymonth: 7,
                bymonthday: 25
            }
        };
        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.YEARLY,
            interval: 2
        });
    });

    test('every other year, recurring ends after 5 occurrences', () => {
        const rrule = {
            value: {
                freq: 'YEARLY',
                interval: 2,
                count: 5,
                bymonth: 7,
                bymonthday: 25
            }
        };
        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.YEARLY,
            interval: 2,
            ends: {
                type: END_TYPE.AFTER_N_TIMES,
                count: 5,
                until: undefined
            }
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
                bymonthday: 25
            }
        };
        const start = {
            ...startModel,
            tzid: 'Europe/Athens'
        };
        expect(propertiesToFrequencyModel(rrule, start)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.YEARLY,
            ends: {
                type: END_TYPE.UNTIL,
                count: 2,
                until: date
            }
        });
    });
    test('all-day event every other year, recursion ends on 30th January 2020', () => {
        const dateTime = { year: 2020, month: 1, day: 30, hours: 21, minutes: 59, seconds: 59, isUTC: false };
        const date = new Date(2020, 0, 30);

        const rrule = {
            value: {
                freq: 'YEARLY',
                interval: 2,
                until: dateTime
            }
        };

        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.YEARLY,
            interval: 2,
            ends: {
                type: END_TYPE.UNTIL,
                count: 2,
                until: date
            }
        });
    });
});

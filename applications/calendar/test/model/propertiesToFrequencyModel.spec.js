import { propertiesToFrequencyModel } from '../../src/app/components/eventModal/eventForm/propertiesToFrequencyModel';
import { DAILY_TYPE, END_TYPE, FREQUENCY, MONTHLY_TYPE, WEEKLY_TYPE, YEARLY_TYPE } from '../../src/app/constants';

describe('frequency properties to model, daily recurring rule', () => {
    const startModel = {
        date: new Date(2020, 0, 20)
    };
    test('non-custom: single day, recurring never ends', () => {
        const rrule = {
            value: {
                freq: 'DAILY'
            }
        };
        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            type: FREQUENCY.DAILY,
            frequency: FREQUENCY.DAILY,
            interval: 1,
            daily: {
                type: DAILY_TYPE.ALL_DAYS
            },
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [1]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.ON_YEAR_DAY
            },
            ends: {
                type: END_TYPE.NEVER,
                count: 2,
                until: undefined
            }
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
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.DAILY,
            interval: 3,
            daily: {
                type: DAILY_TYPE.ALL_DAYS
            },
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [1]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.ON_YEAR_DAY
            },
            ends: {
                type: END_TYPE.NEVER,
                count: 2,
                until: undefined
            }
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
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.DAILY,
            interval: 2,
            daily: {
                type: DAILY_TYPE.ALL_DAYS
            },
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [1]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.ON_YEAR_DAY
            },
            ends: {
                type: END_TYPE.AFTER_N_TIMES,
                count: 5,
                until: undefined
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
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.DAILY,
            interval: 1,
            daily: {
                type: DAILY_TYPE.ALL_DAYS
            },
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [1]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.ON_YEAR_DAY
            },
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
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.DAILY,
            interval: 2,
            daily: {
                type: DAILY_TYPE.ALL_DAYS
            },
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [1]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.ON_YEAR_DAY
            },
            ends: {
                type: END_TYPE.UNTIL,
                count: 2,
                until: date
            }
        });
    });
});

describe('frequency properties to model, weekly recurring rule', () => {
    const startModel = {
        date: new Date(2020, 0, 20)
    };
    test('non-custom: single day, recurring never ends', () => {
        const rrule = {
            value: {
                freq: 'WEEKLY'
            }
        };
        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            type: FREQUENCY.WEEKLY,
            frequency: FREQUENCY.WEEKLY,
            interval: 1,
            daily: {
                type: DAILY_TYPE.ALL_DAYS
            },
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [1]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.ON_YEAR_DAY
            },
            ends: {
                type: END_TYPE.NEVER,
                count: 2,
                until: undefined
            }
        });
    });

    test('single day, every three weeks, recurring never ends', () => {
        const rrule = {
            value: {
                freq: 'WEEKLY',
                interval: 3,
                byday: ['SU']
            }
        };
        expect(propertiesToFrequencyModel(rrule, startModel)).toEqual({
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            interval: 3,
            daily: {
                type: DAILY_TYPE.ALL_DAYS
            },
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [0]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.ON_YEAR_DAY
            },
            ends: {
                type: END_TYPE.NEVER,
                count: 2,
                until: undefined
            }
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
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            interval: 3,
            daily: {
                type: DAILY_TYPE.ALL_DAYS
            },
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [3, 4]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.ON_YEAR_DAY
            },
            ends: {
                type: END_TYPE.NEVER,
                count: 2,
                until: undefined
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
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            interval: 1,
            daily: {
                type: DAILY_TYPE.ALL_DAYS
            },
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [1, 3, 5]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.ON_YEAR_DAY
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
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            interval: 1,
            daily: {
                type: DAILY_TYPE.ALL_DAYS
            },
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [1, 3, 5]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.ON_YEAR_DAY
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
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            interval: 1,
            daily: {
                type: DAILY_TYPE.ALL_DAYS
            },
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [1, 3, 5]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.ON_YEAR_DAY
            },
            ends: {
                type: END_TYPE.UNTIL,
                count: 2,
                until: date
            }
        });
    });
});

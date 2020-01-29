import { modelToFrequencyProperties } from '../../src/app/components/eventModal/eventForm/modelToProperties';
import { END_TYPE, FREQUENCY, MONTHLY_TYPE } from '../../src/app/constants';

describe('frequency model to frequency properties, weekly recurring rule', () => {
    test('non-custom: single day, recurring never ends', () => {
        const frequencyModel = {
            type: FREQUENCY.WEEKLY,
            frequency: FREQUENCY.WEEKLY,
            interval: 1,
            weekly: {
                days: [3, 4]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY,
                monthday: undefined,
                day: 10,
                nth: undefined
            },
            yearly: {
                month: undefined,
                monthday: undefined
            },
            ends: {
                type: END_TYPE.NEVER,
                count: 5,
                until: undefined
            }
        };
        expect(modelToFrequencyProperties({ frequencyModel })).toEqual({
            rrule: {
                value: {
                    freq: 'WEEKLY'
                }
            }
        });
    });

    test('single day, every two weeks, ends after two occurrences', () => {
        const frequencyModel = {
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            interval: 2,
            weekly: {
                days: [5]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY,
                monthday: undefined,
                day: 10,
                nth: undefined
            },
            yearly: {
                month: undefined,
                monthday: undefined
            },
            ends: {
                type: END_TYPE.AFTER_N_TIMES,
                count: 2,
                until: undefined
            }
        };
        expect(modelToFrequencyProperties({ frequencyModel })).toEqual({
            rrule: {
                value: {
                    freq: 'WEEKLY',
                    interval: 2,
                    byday: 'FR',
                    count: 2
                }
            }
        });
    });

    test('two days per week, ends on 30th January 2020 in Europe/Athens timezone', () => {
        const until = new Date(2020, 0, 30);
        const untilDateTime = { year: 2020, month: 1, day: 30, hours: 21, minutes: 59, seconds: 59, isUTC: true };

        const start = { tzid: 'Europe/Athens' };
        const frequencyModel = {
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            weekly: {
                days: [0, 6]
            },
            ends: {
                type: END_TYPE.UNTIL,
                until
            }
        };
        expect(modelToFrequencyProperties({ start, frequencyModel })).toEqual({
            rrule: {
                value: {
                    freq: 'WEEKLY',
                    interval: undefined,
                    byday: 'SU,SA',
                    until: untilDateTime
                }
            }
        });
    });
    test('two days per week, ends on 30th January 2020 in Pacific/Pago_Pago timezone', () => {
        const until = new Date(2020, 0, 30);
        const untilDateTime = { year: 2020, month: 1, day: 31, hours: 10, minutes: 59, seconds: 59, isUTC: true };

        const start = { tzid: 'Pacific/Pago_Pago' };
        const frequencyModel = {
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            weekly: {
                days: [0, 6]
            },
            ends: {
                type: END_TYPE.UNTIL,
                until
            }
        };
        expect(modelToFrequencyProperties({ start, frequencyModel })).toEqual({
            rrule: {
                value: {
                    freq: 'WEEKLY',
                    interval: undefined,
                    byday: 'SU,SA',
                    until: untilDateTime
                }
            }
        });
    });
    test('two all-day events per week, ends on 30th January 2020', () => {
        const until = new Date(2020, 0, 30);
        const untilDateTime = { year: 2020, month: 1, day: 30 };

        const frequencyModel = {
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            weekly: {
                days: [0, 6]
            },
            ends: {
                type: END_TYPE.UNTIL,
                until
            }
        };
        expect(modelToFrequencyProperties({ frequencyModel, isAllDay: true })).toEqual({
            rrule: {
                value: {
                    freq: 'WEEKLY',
                    interval: undefined,
                    byday: 'SU,SA',
                    until: untilDateTime
                }
            }
        });
    });
});

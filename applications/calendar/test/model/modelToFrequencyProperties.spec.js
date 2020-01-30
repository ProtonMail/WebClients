import { modelToFrequencyProperties } from '../../src/app/components/eventModal/eventForm/modelToProperties';
import { getInitialFrequencyModel } from '../../src/app/components/eventModal/eventForm/state';
import { END_TYPE, FREQUENCY, WEEKLY_TYPE } from '../../src/app/constants';

describe('frequency model to frequency properties, daily recurring rule', () => {
    const dummyStart = { date: new Date(2020, 0, 20), tzid: 'Europe/Athens' };
    const dummyFrequencyModel = getInitialFrequencyModel(dummyStart.date);

    test('non-custom: recurring never ends', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.DAILY,
            frequency: FREQUENCY.DAILY,
            interval: 1
        };
        expect(modelToFrequencyProperties({ frequencyModel, start: dummyStart })).toEqual({
            rrule: {
                value: {
                    freq: 'DAILY'
                }
            }
        });
    });

    test('every two days, ends after two occurrences', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.DAILY,
            interval: 2,
            ends: {
                type: END_TYPE.AFTER_N_TIMES,
                count: 2
            }
        };
        expect(modelToFrequencyProperties({ frequencyModel, start: dummyStart })).toEqual({
            rrule: {
                value: {
                    freq: 'DAILY',
                    interval: 2,
                    count: 2
                }
            }
        });
    });

    test('ends on 30th January 2020 in Europe/Athens timezone', () => {
        const until = new Date(2020, 0, 30);
        const untilDateTime = { year: 2020, month: 1, day: 30, hours: 21, minutes: 59, seconds: 59, isUTC: true };

        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.DAILY,
            ends: {
                type: END_TYPE.UNTIL,
                until
            }
        };
        expect(modelToFrequencyProperties({ frequencyModel, start: dummyStart })).toEqual({
            rrule: {
                value: {
                    freq: 'DAILY',
                    interval: undefined,
                    until: untilDateTime
                }
            }
        });
    });
    test('every two days, ends on 30th January 2020 in Pacific/Pago_Pago timezone', () => {
        const until = new Date(2020, 0, 30);
        const untilDateTime = { year: 2020, month: 1, day: 31, hours: 10, minutes: 59, seconds: 59, isUTC: true };

        const start = { ...dummyStart, tzid: 'Pacific/Pago_Pago' };
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.DAILY,
            interval: 2,
            ends: {
                type: END_TYPE.UNTIL,
                until
            }
        };
        expect(modelToFrequencyProperties({ start, frequencyModel })).toEqual({
            rrule: {
                value: {
                    freq: 'DAILY',
                    interval: 2,
                    until: untilDateTime
                }
            }
        });
    });
    test('every two days, all-day event, ends on 30th January 2020', () => {
        const until = new Date(2020, 0, 30);
        const untilDateTime = { year: 2020, month: 1, day: 30 };

        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.DAILY,
            interval: 2,
            ends: {
                type: END_TYPE.UNTIL,
                until
            }
        };
        expect(modelToFrequencyProperties({ frequencyModel, start: dummyStart, isAllDay: true })).toEqual({
            rrule: {
                value: {
                    freq: 'DAILY',
                    interval: 2,
                    until: untilDateTime
                }
            }
        });
    });
});

describe('frequency model to frequency properties, weekly recurring rule', () => {
    const dummyStart = { date: new Date(2020, 0, 20), tzid: 'Europe/Athens' };
    const dummyFrequencyModel = getInitialFrequencyModel(dummyStart.date);

    test('non-custom: single day, recurring never ends', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.WEEKLY,
            frequency: FREQUENCY.WEEKLY
        };
        expect(modelToFrequencyProperties({ frequencyModel, start: dummyStart })).toEqual({
            rrule: {
                value: {
                    freq: 'WEEKLY'
                }
            }
        });
    });

    test('single day, every two weeks, ends after two occurrences', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            interval: 2,
            ends: {
                type: END_TYPE.AFTER_N_TIMES,
                count: 2
            }
        };
        expect(modelToFrequencyProperties({ frequencyModel, start: dummyStart })).toEqual({
            rrule: {
                value: {
                    freq: 'WEEKLY',
                    interval: 2,
                    count: 2
                }
            }
        });
    });

    test('two days per week, ends on 30th January 2020 in Europe/Athens timezone', () => {
        const until = new Date(2020, 0, 30);
        const untilDateTime = { year: 2020, month: 1, day: 30, hours: 21, minutes: 59, seconds: 59, isUTC: true };

        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [1, 6]
            },
            ends: {
                type: END_TYPE.UNTIL,
                until
            }
        };
        expect(modelToFrequencyProperties({ frequencyModel, start: dummyStart })).toEqual({
            rrule: {
                value: {
                    freq: 'WEEKLY',
                    byday: 'MO,SA',
                    until: untilDateTime
                }
            }
        });
    });
    test('two days per week, ends on 30th January 2020 in Pacific/Pago_Pago timezone', () => {
        const until = new Date(2020, 0, 30);
        const untilDateTime = { year: 2020, month: 1, day: 31, hours: 10, minutes: 59, seconds: 59, isUTC: true };

        const start = { ...dummyStart, tzid: 'Pacific/Pago_Pago' };
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [1, 6]
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
                    byday: 'MO,SA',
                    until: untilDateTime
                }
            }
        });
    });
    test('two all-day events per week, ends on 30th January 2020', () => {
        const until = new Date(2020, 0, 30);
        const untilDateTime = { year: 2020, month: 1, day: 30 };

        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [1, 6]
            },
            ends: {
                type: END_TYPE.UNTIL,
                until
            }
        };
        expect(modelToFrequencyProperties({ frequencyModel, start: dummyStart, isAllDay: true })).toEqual({
            rrule: {
                value: {
                    freq: 'WEEKLY',
                    byday: 'MO,SA',
                    until: untilDateTime
                }
            }
        });
    });
});

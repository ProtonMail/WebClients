import { END_TYPE, FREQUENCY, MONTHLY_TYPE, WEEKLY_TYPE } from 'proton-shared/lib/calendar/constants';
import modelToFrequencyProperties from './modelToFrequencyProperties';
import { getInitialFrequencyModel } from './state';

const dummyStart = { date: new Date(2020, 0, 20), tzid: 'Europe/Athens' };
const dummyFrequencyModel = getInitialFrequencyModel(dummyStart.date);

describe('frequency model to frequency properties, daily recurring rule', () => {
    test('non-custom: recursion ends', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.DAILY,
            frequency: FREQUENCY.DAILY,
        };
        expect(modelToFrequencyProperties({ frequencyModel, start: dummyStart })).toEqual({
            rrule: {
                value: {
                    freq: 'DAILY',
                },
            },
        });
    });

    test('count 1 with other end type', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.DAILY,
            interval: 2,
            ends: {
                type: END_TYPE.UNTIL,
                count: 1,
                until: new Date(2020, 0, 30),
            },
        };
        expect(modelToFrequencyProperties({ frequencyModel, start: dummyStart })).toEqual({
            rrule: {
                value: {
                    freq: 'DAILY',
                    interval: 2,
                    until: {
                        year: 2020,
                        month: 1,
                        day: 30,
                        hours: 21,
                        minutes: 59,
                        seconds: 59,
                        isUTC: true,
                    },
                },
            },
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
                count: 2,
            },
        };
        expect(modelToFrequencyProperties({ frequencyModel, start: dummyStart })).toEqual({
            rrule: {
                value: {
                    freq: 'DAILY',
                    interval: 2,
                    count: 2,
                },
            },
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
                until,
                count: 2,
            },
        };
        expect(modelToFrequencyProperties({ frequencyModel, start: dummyStart })).toEqual({
            rrule: {
                value: {
                    freq: 'DAILY',
                    interval: undefined,
                    until: untilDateTime,
                },
            },
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
                until,
                count: 2,
            },
        };
        expect(modelToFrequencyProperties({ start, frequencyModel })).toEqual({
            rrule: {
                value: {
                    freq: 'DAILY',
                    interval: 2,
                    until: untilDateTime,
                },
            },
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
                until,
                count: 2,
            },
        };
        expect(modelToFrequencyProperties({ frequencyModel, start: dummyStart, isAllDay: true })).toEqual({
            rrule: {
                value: {
                    freq: 'DAILY',
                    interval: 2,
                    until: untilDateTime,
                },
            },
        });
    });
});

describe('frequency model to frequency properties, weekly recurring rule', () => {
    test('non-custom: single day, recursion ends', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.WEEKLY,
            frequency: FREQUENCY.WEEKLY,
        };
        expect(modelToFrequencyProperties({ frequencyModel, start: dummyStart })).toEqual({
            rrule: {
                value: {
                    freq: 'WEEKLY',
                },
            },
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
                count: 2,
            },
        };
        expect(modelToFrequencyProperties({ frequencyModel, start: dummyStart })).toEqual({
            rrule: {
                value: {
                    freq: 'WEEKLY',
                    interval: 2,
                    count: 2,
                },
            },
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
                days: [1, 6],
            },
            ends: {
                type: END_TYPE.UNTIL,
                until,
                count: 2,
            },
        };
        expect(modelToFrequencyProperties({ frequencyModel, start: dummyStart })).toEqual({
            rrule: {
                value: {
                    freq: 'WEEKLY',
                    byday: ['MO', 'SA'],
                    until: untilDateTime,
                },
            },
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
                days: [1, 6],
            },
            ends: {
                type: END_TYPE.UNTIL,
                until,
                count: 2,
            },
        };
        expect(modelToFrequencyProperties({ start, frequencyModel })).toEqual({
            rrule: {
                value: {
                    freq: 'WEEKLY',
                    byday: ['MO', 'SA'],
                    until: untilDateTime,
                },
            },
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
                days: [6, 1],
            },
            ends: {
                type: END_TYPE.UNTIL,
                until,
                count: 2,
            },
        };
        expect(modelToFrequencyProperties({ frequencyModel, start: dummyStart, isAllDay: true })).toEqual({
            rrule: {
                value: {
                    freq: 'WEEKLY',
                    byday: ['MO', 'SA'],
                    until: untilDateTime,
                },
            },
        });
    });
});

describe('frequency model to frequency properties, monthly recurring rule', () => {
    test('non-custom: single day, recursion ends', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.MONTHLY,
            frequency: FREQUENCY.MONTHLY,
        };
        expect(modelToFrequencyProperties({ frequencyModel, start: dummyStart })).toEqual({
            rrule: {
                value: {
                    freq: 'MONTHLY',
                },
            },
        });
    });

    test('every two months on the 20th, ends after two occurrences', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.MONTHLY,
            interval: 2,
            ends: {
                type: END_TYPE.AFTER_N_TIMES,
                count: 2,
            },
        };
        expect(modelToFrequencyProperties({ frequencyModel, start: dummyStart })).toEqual({
            rrule: {
                value: {
                    freq: 'MONTHLY',
                    interval: 2,
                    count: 2,
                },
            },
        });
    });

    test('every three months on the last Wednesday, recursion never ends', () => {
        const lastWednesdayStart = { date: new Date(2020, 0, 29) };
        const frequencyModel = {
            ...getInitialFrequencyModel(lastWednesdayStart.date),
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.MONTHLY,
            interval: 3,
            monthly: {
                type: MONTHLY_TYPE.ON_MINUS_NTH_DAY,
            },
        };
        expect(modelToFrequencyProperties({ frequencyModel, start: lastWednesdayStart })).toEqual({
            rrule: {
                value: {
                    freq: 'MONTHLY',
                    interval: 3,
                    bysetpos: -1,
                    byday: 'WE',
                },
            },
        });
    });

    test('every third Monday, ends on 30th January 2020 in Europe/Athens timezone', () => {
        const until = new Date(2020, 0, 30);
        const untilDateTime = { year: 2020, month: 1, day: 30, hours: 21, minutes: 59, seconds: 59, isUTC: true };

        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.MONTHLY,
            monthly: {
                type: MONTHLY_TYPE.ON_NTH_DAY,
            },
            ends: {
                type: END_TYPE.UNTIL,
                until,
                count: 2,
            },
        };
        expect(modelToFrequencyProperties({ frequencyModel, start: dummyStart })).toEqual({
            rrule: {
                value: {
                    freq: 'MONTHLY',
                    until: untilDateTime,
                    bysetpos: 3,
                    byday: 'MO',
                },
            },
        });
    });

    test('every month on the 20th, ends on 30th January 2020 in Pacific/Pago_Pago timezone', () => {
        const until = new Date(2020, 0, 30);
        const untilDateTime = { year: 2020, month: 1, day: 31, hours: 10, minutes: 59, seconds: 59, isUTC: true };

        const start = { ...dummyStart, tzid: 'Pacific/Pago_Pago' };
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.MONTHLY,
            ends: {
                type: END_TYPE.UNTIL,
                until,
                count: 2,
            },
        };
        expect(modelToFrequencyProperties({ start, frequencyModel })).toEqual({
            rrule: {
                value: {
                    freq: 'MONTHLY',
                    until: untilDateTime,
                },
            },
        });
    });

    test('An all-day event on the fourth Thursday, ends on 30th January 2021', () => {
        const fourthThursdayStart = { date: new Date(2020, 0, 23) };
        const until = new Date(2021, 0, 30);
        const untilDateTime = { year: 2021, month: 1, day: 30 };

        const frequencyModel = {
            ...getInitialFrequencyModel(fourthThursdayStart.date),
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.MONTHLY,
            interval: 6,
            monthly: {
                type: MONTHLY_TYPE.ON_NTH_DAY,
            },
            ends: {
                type: END_TYPE.UNTIL,
                until,
                count: 2,
            },
        };
        expect(modelToFrequencyProperties({ frequencyModel, start: fourthThursdayStart, isAllDay: true })).toEqual({
            rrule: {
                value: {
                    freq: 'MONTHLY',
                    interval: 6,
                    bysetpos: 4,
                    byday: 'TH',
                    until: untilDateTime,
                },
            },
        });
    });
});

describe('frequency model to frequency properties, yearly recurring rule', () => {
    test('non-custom: recursion ends', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.YEARLY,
            frequency: FREQUENCY.YEARLY,
        };
        expect(modelToFrequencyProperties({ frequencyModel, start: dummyStart })).toEqual({
            rrule: {
                value: {
                    freq: 'YEARLY',
                },
            },
        });
    });

    test('every other year, ends after two occurrences', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.YEARLY,
            interval: 2,
            ends: {
                type: END_TYPE.AFTER_N_TIMES,
                count: 2,
            },
        };
        expect(modelToFrequencyProperties({ frequencyModel, start: dummyStart })).toEqual({
            rrule: {
                value: {
                    freq: 'YEARLY',
                    interval: 2,
                    count: 2,
                },
            },
        });
    });

    test('ends on 30th January 2020 in Europe/Athens timezone', () => {
        const until = new Date(2020, 0, 30);
        const untilDateTime = { year: 2020, month: 1, day: 30, hours: 21, minutes: 59, seconds: 59, isUTC: true };

        const frequencyModel = {
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.YEARLY,
            ends: {
                type: END_TYPE.UNTIL,
                until,
                count: 2,
            },
        };
        expect(modelToFrequencyProperties({ frequencyModel, start: dummyStart })).toEqual({
            rrule: {
                value: {
                    freq: 'YEARLY',
                    interval: undefined,
                    until: untilDateTime,
                },
            },
        });
    });

    test('every other year, ends on 30th January 2020 in Pacific/Pago_Pago timezone', () => {
        const until = new Date(2020, 0, 30);
        const untilDateTime = { year: 2020, month: 1, day: 31, hours: 10, minutes: 59, seconds: 59, isUTC: true };

        const start = { ...dummyStart, tzid: 'Pacific/Pago_Pago' };
        const frequencyModel = {
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.YEARLY,
            interval: 2,
            ends: {
                type: END_TYPE.UNTIL,
                until,
                count: 2,
            },
        };
        expect(modelToFrequencyProperties({ start, frequencyModel })).toEqual({
            rrule: {
                value: {
                    freq: 'YEARLY',
                    interval: 2,
                    until: untilDateTime,
                },
            },
        });
    });

    test('every two days, all-day event, ends on 30th January 2020', () => {
        const until = new Date(2020, 0, 30);
        const untilDateTime = { year: 2020, month: 1, day: 30 };

        const frequencyModel = {
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.YEARLY,
            interval: 2,
            ends: {
                type: END_TYPE.UNTIL,
                until,
                count: 2,
            },
        };
        expect(modelToFrequencyProperties({ frequencyModel, isAllDay: true, start: dummyStart })).toEqual({
            rrule: {
                value: {
                    freq: 'YEARLY',
                    interval: 2,
                    until: untilDateTime,
                },
            },
        });
    });
});

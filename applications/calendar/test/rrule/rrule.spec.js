import { enUS } from 'date-fns/locale';
import { getFormattedWeekdays } from 'proton-shared/lib/date/date';
import { getTimezonedFrequencyString } from '../../src/app/helpers/rrule';
import { END_TYPE, FREQUENCY, MONTHLY_TYPE, WEEKLY_TYPE } from '../../src/app/constants';
import { getInitialFrequencyModel } from '../../src/app/components/eventModal/eventForm/state';

const weekdays = getFormattedWeekdays('cccc', { locale: enUS });
const options = { weekdays, locale: enUS };

const dummyStart = { date: new Date(2020, 0, 20), tzid: 'Europe/Athens' };
const dummyFrequencyModel = getInitialFrequencyModel(dummyStart.date);

describe('getTimezonedFrequencyString should produce the expected string for daily recurring events', () => {
    test('for a standard daily recurring event', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.DAILY,
            frequency: FREQUENCY.DAILY
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Daily');
    });

    test('for a custom daily recurring event that is actually standard', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.DAILY
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Daily');
    });

    test('for a custom daily recurring event happening every 2 days', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.DAILY,
            interval: 2
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Every 2 days');
    });

    test('for a custom daily recurring event happening every three days, lasting 5 times', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.DAILY,
            interval: 3,
            ends: {
                type: END_TYPE.AFTER_N_TIMES,
                count: 5
            }
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Every 3 days, 5 times');
    });

    test('for a custom daily recurring event, until 20th February 2020', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.DAILY,
            ends: {
                type: END_TYPE.UNTIL,
                until: new Date(2020, 1, 20)
            }
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Daily until 20 Feb 2020');
    });

    test('for a custom weekly recurring event happening every two days, lasting 1 time on a different timezone', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.DAILY,
            interval: 2,
            ends: {
                type: END_TYPE.AFTER_N_TIMES,
                count: 1
            }
        };
        const extendedOptions = { ...options, currentTzid: 'Europe/Athens', startTzid: 'Pacific/Tahiti' };
        expect(getTimezonedFrequencyString(frequencyModel, extendedOptions)).toEqual('Every 2 days, 1 time');
    });

    test('for a custom daily event, until 20th February 2020 on a different timezone', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.DAILY,
            ends: {
                type: END_TYPE.UNTIL,
                until: new Date(2020, 1, 20)
            }
        };
        const extendedOptions = { ...options, currentTzid: 'Europe/Athens', startTzid: 'Pacific/Tahiti' };
        expect(getTimezonedFrequencyString(frequencyModel, extendedOptions)).toEqual(
            'Daily until 20 Feb 2020 (Pacific/Tahiti)'
        );
    });
});

describe('getTimezonedFrequencyString should produce the expected string for weekly recurring events', () => {
    test('for a standard weekly recurring event', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.WEEKLY,
            frequency: FREQUENCY.WEEKLY,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [2]
            }
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Weekly on Tuesday');
    });

    test('for a standard weekly recurring event, on a different timezone', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.WEEKLY,
            frequency: FREQUENCY.WEEKLY,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [2]
            }
        };
        const extendedOptions = { ...options, currentTzid: 'Europe/Athens', startTzid: 'Pacific/Tahiti' };
        expect(getTimezonedFrequencyString(frequencyModel, extendedOptions)).toEqual(
            'Weekly on Tuesday (Pacific/Tahiti)'
        );
    });

    test('for a custom weekly recurring event that is actually standard', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [2]
            }
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Weekly on Tuesday');
    });

    test('for a custom weekly recurring event happening every 2 weeks', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            interval: 2,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [2]
            }
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Every 2 weeks on Tuesday');
    });

    test('for a custom weekly recurring event happening every 2 weeks, on Monday and Tuesday', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            interval: 2,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [1, 2]
            }
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Every 2 weeks on Monday, Tuesday');
    });

    test('for a custom weekly recurring event happening on all days of the week', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            interval: 1,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [0, 1, 2, 3, 4, 5, 6]
            }
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Weekly on all days');
    });

    test('for a custom weekly recurring event happening every three weeks, on all days of the week, lasting 5 times', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            interval: 3,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [0, 1, 2, 3, 4, 5, 6]
            },
            ends: {
                type: END_TYPE.AFTER_N_TIMES,
                count: 5
            }
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Every 3 weeks on all days; 5 times');
    });

    test('for a custom weekly recurring event happening on Monday and Wednesday, until 20th February 2020', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [1, 3]
            },
            ends: {
                type: END_TYPE.UNTIL,
                until: new Date(2020, 1, 20)
            }
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual(
            'Weekly on Monday, Wednesday; until 20 Feb 2020'
        );
    });

    test('for a custom weekly recurring event happening weekly on Tuesday, on a different timezone', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [2]
            },
            ends: {
                type: END_TYPE.UNTIL,
                until: new Date(2020, 1, 20)
            }
        };
        const extendedOptions = { ...options, currentTzid: 'Europe/Athens', startTzid: 'Pacific/Tahiti' };
        expect(getTimezonedFrequencyString(frequencyModel, extendedOptions)).toEqual(
            'Weekly on Tuesday; until 20 Feb 2020 (Pacific/Tahiti)'
        );
    });

    test('for a custom weekly recurring event happening every 2 weeks on all days, until 20th February 2020 on a different timezone', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            interval: 2,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [0, 1, 2, 3, 4, 5, 6]
            },
            ends: {
                type: END_TYPE.UNTIL,
                until: new Date(2020, 1, 20)
            }
        };
        const extendedOptions = { ...options, currentTzid: 'Europe/Athens', startTzid: 'Pacific/Tahiti' };
        expect(getTimezonedFrequencyString(frequencyModel, extendedOptions)).toEqual(
            'Every 2 weeks on all days; until 20 Feb 2020 (Pacific/Tahiti)'
        );
    });

    test('for a custom weekly recurring event happening every 2 weeks on all days, 1 time on a different timezone', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            interval: 2,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [0, 1, 2, 3, 4, 5, 6]
            },
            ends: {
                type: END_TYPE.AFTER_N_TIMES,
                count: 1
            }
        };
        const extendedOptions = { ...options, currentTzid: 'Europe/Athens', startTzid: 'Pacific/Tahiti' };
        expect(getTimezonedFrequencyString(frequencyModel, extendedOptions)).toEqual(
            'Every 2 weeks on all days; 1 time'
        );
    });
});

describe('getTimezonedFrequencyString should produce the expected string for monthly recurring events', () => {
    const dummyOptions = { ...options, ...dummyStart };

    test('for a standard monthly recurring event', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.MONTHLY,
            frequency: FREQUENCY.MONTHLY
        };
        expect(getTimezonedFrequencyString(frequencyModel, dummyOptions)).toEqual('Monthly on day 20');
    });

    test('for a standard monthly recurring event, on a different timezone', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.MONTHLY,
            frequency: FREQUENCY.MONTHLY
        };
        const extendedOptions = { ...dummyOptions, currentTzid: 'Europe/Athens', startTzid: 'Pacific/Tahiti' };
        expect(getTimezonedFrequencyString(frequencyModel, extendedOptions)).toEqual(
            'Monthly on day 20 (Pacific/Tahiti)'
        );
    });

    test('for a custom monthly recurring event that is actually standard', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.MONTHLY
        };
        expect(getTimezonedFrequencyString(frequencyModel, dummyOptions)).toEqual('Monthly on day 20');
    });

    test('for a custom monthly recurring event happening every 2 months', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.MONTHLY,
            interval: 2
        };
        expect(getTimezonedFrequencyString(frequencyModel, dummyOptions)).toEqual('Every 2 months on day 20');
    });

    test('for a custom monthly recurring event happening every 2 months, on the fourth Thursday', () => {
        const fourthThursdayStart = { date: new Date(2020, 0, 23) };
        const frequencyModel = {
            ...getInitialFrequencyModel(fourthThursdayStart.date),
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.MONTHLY,
            interval: 2,
            monthly: {
                type: MONTHLY_TYPE.ON_NTH_DAY
            }
        };
        const extendedOptions = { ...dummyOptions, ...fourthThursdayStart };
        expect(getTimezonedFrequencyString(frequencyModel, extendedOptions)).toEqual(
            'Every 2 months on the fourth Thursday'
        );
    });

    test('for a custom monthly recurring event, on the first Monday, different timezone', () => {
        const firstMondayStart = { date: new Date(2020, 0, 6) };
        const frequencyModel = {
            ...getInitialFrequencyModel(firstMondayStart.date),
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.MONTHLY,
            monthly: {
                type: MONTHLY_TYPE.ON_NTH_DAY
            }
        };
        const extendedOptions = {
            ...dummyOptions,
            ...firstMondayStart,
            currentTzid: 'Europe/Athens',
            startTzid: 'Pacific/Tahiti'
        };
        expect(getTimezonedFrequencyString(frequencyModel, extendedOptions)).toEqual(
            'Monthly on the first Monday (Pacific/Tahiti)'
        );
    });

    test('for a custom monthly recurring event happening every 2 months, on the last Wednesday, lasting 3 times', () => {
        const lastWednesdayStart = { date: new Date(2020, 0, 29) };
        const frequencyModel = {
            ...getInitialFrequencyModel(lastWednesdayStart.date),
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.MONTHLY,
            interval: 2,
            monthly: {
                type: MONTHLY_TYPE.ON_MINUS_NTH_DAY
            },
            ends: {
                type: END_TYPE.AFTER_N_TIMES,
                count: 3
            }
        };
        const extendedOptions = { ...dummyOptions, ...lastWednesdayStart };
        expect(getTimezonedFrequencyString(frequencyModel, extendedOptions)).toEqual(
            'Every 2 months on the last Wednesday, 3 times'
        );
    });

    test('for a custom monthly recurring event happening on a fifth and last Thursday, until 20th February 2020', () => {
        const lastThursdayStart = { date: new Date(2020, 0, 30) };
        const frequencyModel = {
            ...getInitialFrequencyModel(lastThursdayStart.date),
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.MONTHLY,
            monthly: {
                type: MONTHLY_TYPE.ON_MINUS_NTH_DAY
            },
            ends: {
                type: END_TYPE.UNTIL,
                until: new Date(2020, 1, 20)
            }
        };
        const extendedOptions = { ...dummyOptions, ...lastThursdayStart };
        expect(getTimezonedFrequencyString(frequencyModel, extendedOptions)).toEqual(
            'Monthly on the last Thursday, until 20 Feb 2020'
        );
    });

    test('for a custom monthly recurring event happening on a fifth and last Thursday, until 20th February 2020 on a different timezone', () => {
        const lastThursdayStart = { date: new Date(2020, 0, 30) };
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.MONTHLY,
            monthly: {
                type: MONTHLY_TYPE.ON_MINUS_NTH_DAY
            },
            ends: {
                type: END_TYPE.UNTIL,
                until: new Date(2020, 1, 20)
            }
        };
        const extendedOptions = {
            ...dummyOptions,
            ...lastThursdayStart,
            currentTzid: 'Europe/Athens',
            startTzid: 'Pacific/Tahiti'
        };
        expect(getTimezonedFrequencyString(frequencyModel, extendedOptions)).toEqual(
            'Monthly on the last Thursday, until 20 Feb 2020 (Pacific/Tahiti)'
        );
    });
});

describe('getTimezonedFrequencyString should produce the expected string for yearly recurring events', () => {
    test('for a standard yearly recurring event', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.YEARLY,
            frequency: FREQUENCY.YEARLY
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Yearly');
    });

    test('for a custom yearly recurring event that is actually standard', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.YEARLY
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Yearly');
    });

    test('for a custom yearly recurring event happening every 2 years', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.YEARLY,
            interval: 2
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Every 2 years');
    });

    test('for a custom yearly recurring event happening every three years, lasting 5 times', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.YEARLY,
            interval: 3,
            ends: {
                type: END_TYPE.AFTER_N_TIMES,
                count: 5
            }
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Every 3 years, 5 times');
    });

    test('for a custom yearly recurring event, until 20th February 2020', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.YEARLY,
            interval: 1,
            ends: {
                type: END_TYPE.UNTIL,
                until: new Date(2020, 1, 20)
            }
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Yearly until 20 Feb 2020');
    });

    test('for a custom weekly recurring event happening every two years, lasting 1 time on a different timezone', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.YEARLY,
            interval: 2,
            ends: {
                type: END_TYPE.AFTER_N_TIMES,
                count: 1
            }
        };
        const extendedOptions = { ...options, currentTzid: 'Europe/Athens', startTzid: 'Pacific/Tahiti' };
        expect(getTimezonedFrequencyString(frequencyModel, extendedOptions)).toEqual('Every 2 years, 1 time');
    });

    test('for a custom yearly event, until 20th February 2020 on a different timezone', () => {
        const frequencyModel = {
            ...dummyFrequencyModel,
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.YEARLY,
            ends: {
                type: END_TYPE.UNTIL,
                until: new Date(2020, 1, 20)
            }
        };
        const extendedOptions = { ...options, currentTzid: 'Europe/Athens', startTzid: 'Pacific/Tahiti' };
        expect(getTimezonedFrequencyString(frequencyModel, extendedOptions)).toEqual(
            'Yearly until 20 Feb 2020 (Pacific/Tahiti)'
        );
    });
});

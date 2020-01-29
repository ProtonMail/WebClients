import { enUS } from 'date-fns/locale';
import { getFormattedWeekdays } from 'proton-shared/lib/date/date';
import { getTimezonedFrequencyString } from '../../src/app/helpers/rrule';
import { END_TYPE, FREQUENCY, MONTHLY_TYPE, WEEKLY_TYPE, YEARLY_TYPE } from '../../src/app/constants';

const weekdays = getFormattedWeekdays('cccc', { locale: enUS });
const options = { weekdays, locale: enUS };

describe('getTimezonedFrequencyString should produce the expected string', () => {
    test('for a standard weekly recurring event', () => {
        const frequencyModel = {
            type: FREQUENCY.WEEKLY,
            frequency: FREQUENCY.WEEKLY,
            interval: 1,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [2]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.ON_YEAR_DAY
            },
            ends: {
                type: END_TYPE.NEVER
            }
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Weekly on Tuesday');
    });

    test('for a custom weekly recurring event that is actually standard', () => {
        const frequencyModel = {
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            interval: 1,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [2]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.ON_YEAR_DAY
            },
            ends: {
                type: END_TYPE.NEVER
            }
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Weekly on Tuesday');
    });

    test('for a custom weekly recurring event happening every 2 weeks', () => {
        const frequencyModel = {
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            interval: 2,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [2]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.ON_YEAR_DAY
            },
            ends: {
                type: END_TYPE.NEVER
            }
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Every 2 weeks on Tuesday');
    });

    test('for a custom weekly recurring event happening every 2 weeks, on Monday and Tuesday', () => {
        const frequencyModel = {
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            interval: 2,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [1, 2]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.ON_YEAR_DAY
            },
            ends: {
                type: END_TYPE.NEVER
            }
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Every 2 weeks on Monday, Tuesday');
    });

    test('for a custom weekly recurring event happening on all days of the week', () => {
        const frequencyModel = {
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            interval: 1,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [0, 1, 2, 3, 4, 5, 6]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.ON_YEAR_DAY
            },
            ends: {
                type: END_TYPE.NEVER
            }
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Weekly on all days');
    });

    test('for a custom weekly recurring event happening every three weeks, on all days of the week, lasting 5 times', () => {
        const frequencyModel = {
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            interval: 3,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [0, 1, 2, 3, 4, 5, 6]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.ON_YEAR_DAY
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
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            interval: 1,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [1, 3]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.ON_YEAR_DAY
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
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            interval: 1,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [2]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.ON_YEAR_DAY
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
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            interval: 2,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [0, 1, 2, 3, 4, 5, 6]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.ON_YEAR_DAY
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

    test('for a custom weekly recurring event happening every 2 weeks on all days, 5 times on a different timezone', () => {
        const frequencyModel = {
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.WEEKLY,
            interval: 2,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [0, 1, 2, 3, 4, 5, 6]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.ON_YEAR_DAY
            },
            ends: {
                type: END_TYPE.AFTER_N_TIMES,
                count: 5
            }
        };
        const extendedOptions = { ...options, currentTzid: 'Europe/Athens', startTzid: 'Pacific/Tahiti' };
        expect(getTimezonedFrequencyString(frequencyModel, extendedOptions)).toEqual(
            'Every 2 weeks on all days; 5 times'
        );
    });
});

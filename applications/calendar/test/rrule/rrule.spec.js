import { enUS } from 'date-fns/locale';
import { getFormattedWeekdays } from 'proton-shared/lib/date/date';
import { getTimezonedFrequencyString } from '../../src/app/helpers/rrule';
import { DAILY_TYPE, END_TYPE, FREQUENCY, MONTHLY_TYPE, WEEKLY_TYPE, YEARLY_TYPE } from '../../src/app/constants';

const weekdays = getFormattedWeekdays('cccc', { locale: enUS });
const options = { weekdays, locale: enUS };

describe('getTimezonedFrequencyString should produce the expected string for daily recurring events', () => {
    test('for a standard daily recurring event', () => {
        const frequencyModel = {
            type: FREQUENCY.DAILY,
            frequency: FREQUENCY.DAILY,
            interval: 1,
            daily: {
                type: DAILY_TYPE.ALL_DAYS
            },
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [2]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.BY_MONTH_ON_MONTH_DAY
            },
            ends: {
                type: END_TYPE.NEVER
            }
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Daily');
    });

    test('for a custom daily recurring event that is actually standard', () => {
        const frequencyModel = {
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.DAILY,
            interval: 1,
            daily: {
                type: DAILY_TYPE.ALL_DAYS
            },
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [2]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.BY_MONTH_ON_MONTH_DAY
            },
            ends: {
                type: END_TYPE.NEVER
            }
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Daily');
    });

    test('for a custom daily recurring event happening every 2 days', () => {
        const frequencyModel = {
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.DAILY,
            interval: 2,
            daily: {
                type: DAILY_TYPE.ALL_DAYS
            },
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [2]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.BY_MONTH_ON_MONTH_DAY
            },
            ends: {
                type: END_TYPE.NEVER
            }
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Every 2 days');
    });

    test('for a custom daily recurring event happening every three days, lasting 5 times', () => {
        const frequencyModel = {
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.DAILY,
            interval: 3,
            daily: {
                type: DAILY_TYPE.ALL_DAYS
            },
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [0, 1, 2, 3, 4, 5, 6]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.BY_MONTH_ON_MONTH_DAY
            },
            ends: {
                type: END_TYPE.AFTER_N_TIMES,
                count: 5
            }
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Every 3 days, 5 times');
    });

    test('for a custom daily recurring event, until 20th February 2020', () => {
        const frequencyModel = {
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.DAILY,
            interval: 1,
            daily: {
                type: DAILY_TYPE.ALL_DAYS
            },
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [1, 3]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.BY_MONTH_ON_MONTH_DAY
            },
            ends: {
                type: END_TYPE.UNTIL,
                until: new Date(2020, 1, 20)
            }
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Daily until 20 Feb 2020');
    });

    test('for a custom weekly recurring event happening every two days, lasting 1 time on a different timezone', () => {
        const frequencyModel = {
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.DAILY,
            interval: 2,
            daily: {
                type: DAILY_TYPE.ALL_DAYS
            },
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [2]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.BY_MONTH_ON_MONTH_DAY
            },
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
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.DAILY,
            interval: 1,
            daily: {
                type: DAILY_TYPE.ALL_DAYS
            },
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [0, 1, 2, 3, 4, 5, 6]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.BY_MONTH_ON_MONTH_DAY
            },
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
                type: YEARLY_TYPE.BY_MONTH_ON_MONTH_DAY
            },
            ends: {
                type: END_TYPE.NEVER
            }
        };
        const extendedOptions = { ...options, currentTzid: 'Europe/Athens', startTzid: 'Pacific/Tahiti' };
        expect(getTimezonedFrequencyString(frequencyModel, extendedOptions)).toEqual(
            'Weekly on Tuesday (Pacific/Tahiti)'
        );
    });

    test('for a standard weekly recurring event, on a different timezone', () => {
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
                type: YEARLY_TYPE.BY_MONTH_ON_MONTH_DAY
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
                type: YEARLY_TYPE.BY_MONTH_ON_MONTH_DAY
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
                type: YEARLY_TYPE.BY_MONTH_ON_MONTH_DAY
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
                type: YEARLY_TYPE.BY_MONTH_ON_MONTH_DAY
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
                type: YEARLY_TYPE.BY_MONTH_ON_MONTH_DAY
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
                type: YEARLY_TYPE.BY_MONTH_ON_MONTH_DAY
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
                type: YEARLY_TYPE.BY_MONTH_ON_MONTH_DAY
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
                type: YEARLY_TYPE.BY_MONTH_ON_MONTH_DAY
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
                type: YEARLY_TYPE.BY_MONTH_ON_MONTH_DAY
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
                type: YEARLY_TYPE.BY_MONTH_ON_MONTH_DAY
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

describe('getTimezonedFrequencyString should produce the expected string for yearly recurring events', () => {
    test('for a standard yearly recurring event', () => {
        const frequencyModel = {
            type: FREQUENCY.YEARLY,
            frequency: FREQUENCY.YEARLY,
            interval: 1,
            daily: {
                type: DAILY_TYPE.ALL_DAYS
            },
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [2]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.BY_MONTH_ON_MONTH_DAY
            },
            ends: {
                type: END_TYPE.NEVER
            }
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Yearly');
    });

    test('for a custom yearly recurring event that is actually standard', () => {
        const frequencyModel = {
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.YEARLY,
            interval: 1,
            daily: {
                type: DAILY_TYPE.ALL_DAYS
            },
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [2]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.BY_MONTH_ON_MONTH_DAY
            },
            ends: {
                type: END_TYPE.NEVER
            }
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Yearly');
    });

    test('for a custom yearly recurring event happening every 2 years', () => {
        const frequencyModel = {
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.YEARLY,
            interval: 2,
            daily: {
                type: DAILY_TYPE.ALL_DAYS
            },
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [2]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.BY_MONTH_ON_MONTH_DAY
            },
            ends: {
                type: END_TYPE.NEVER
            }
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Every 2 years');
    });

    test('for a custom yearly recurring event happening every three years, lasting 5 times', () => {
        const frequencyModel = {
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.YEARLY,
            interval: 3,
            daily: {
                type: DAILY_TYPE.ALL_DAYS
            },
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [0, 1, 2, 3, 4, 5, 6]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.BY_MONTH_ON_MONTH_DAY
            },
            ends: {
                type: END_TYPE.AFTER_N_TIMES,
                count: 5
            }
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Every 3 years, 5 times');
    });

    test('for a custom yearly recurring event, until 20th February 2020', () => {
        const frequencyModel = {
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.YEARLY,
            interval: 1,
            daily: {
                type: DAILY_TYPE.ALL_DAYS
            },
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [1, 3]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.BY_MONTH_ON_MONTH_DAY
            },
            ends: {
                type: END_TYPE.UNTIL,
                until: new Date(2020, 1, 20)
            }
        };
        expect(getTimezonedFrequencyString(frequencyModel, options)).toEqual('Yearly until 20 Feb 2020');
    });

    test('for a custom weekly recurring event happening every two years, lasting 1 time on a different timezone', () => {
        const frequencyModel = {
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.YEARLY,
            interval: 2,
            daily: {
                type: DAILY_TYPE.ALL_DAYS
            },
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [2]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.BY_MONTH_ON_MONTH_DAY
            },
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
            type: FREQUENCY.CUSTOM,
            frequency: FREQUENCY.YEARLY,
            interval: 1,
            daily: {
                type: DAILY_TYPE.ALL_DAYS
            },
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [0, 1, 2, 3, 4, 5, 6]
            },
            monthly: {
                type: MONTHLY_TYPE.ON_MONTH_DAY
            },
            yearly: {
                type: YEARLY_TYPE.BY_MONTH_ON_MONTH_DAY
            },
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

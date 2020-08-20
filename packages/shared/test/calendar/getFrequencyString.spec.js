import { enUS } from 'date-fns/locale';
import { getFormattedWeekdays } from '../../lib/date/date';
import { getTimezonedFrequencyString } from '../../lib/calendar/integration/getFrequencyString';

import { getDateTimeProperty, getUntilProperty } from '../../lib/calendar/vcalConverter';
import { FREQUENCY } from '../../lib/calendar/constants';

const weekdays = getFormattedWeekdays('cccc', { locale: enUS });
const dummyTzid = 'Europe/Athens';
const options = { currentTzid: dummyTzid, weekdays, locale: enUS };
const dummyStart = getDateTimeProperty({ year: 2020, month: 1, day: 20 }, dummyTzid);
const dummyUntil = getUntilProperty({ year: 2020, month: 2, day: 20 }, false, dummyTzid);
const dummyRruleValue = {
    freq: FREQUENCY.DAILY,
};
const getRrule = (value) => ({ value: { ...dummyRruleValue, ...value } });
const otherTzOptions = { ...options, currentTzid: 'Pacific/Tahiti' };

describe('getTimezonedFrequencyString should produce the expected string for daily recurring events', () => {
    it('should get a standard daily recurring event', () => {
        expect(getTimezonedFrequencyString(getRrule(dummyRruleValue), dummyStart, options)).toEqual('Daily');
    });

    it('should get a custom daily recurring event that is actually standard', () => {
        const rrule = getRrule();
        expect(getTimezonedFrequencyString(rrule, dummyStart, options)).toEqual('Daily');
    });

    it('should get a custom daily recurring event happening every 2 days', () => {
        const rrule = getRrule({
            interval: 2,
        });
        expect(getTimezonedFrequencyString(rrule, dummyStart, options)).toEqual('Every 2 days');
    });

    it('should get a custom daily recurring event happening every three days, lasting 5 times', () => {
        const rrule = getRrule({
            interval: 3,
            count: 5,
        });
        expect(getTimezonedFrequencyString(rrule, dummyStart, options)).toEqual('Every 3 days, 5 times');
    });

    it('should get a custom daily recurring event, until 20th February 2020', () => {
        const rrule = getRrule({
            until: dummyUntil,
        });
        expect(getTimezonedFrequencyString(rrule, dummyStart, options)).toEqual('Daily, until Feb 20, 2020');
    });

    it('should get a custom daily recurring event happening every two days, lasting 1 time on a different timezone', () => {
        const rrule = getRrule({
            interval: 2,
            count: 1,
        });
        expect(getTimezonedFrequencyString(rrule, dummyStart, options)).toEqual('Every 2 days, 1 time');
    });

    it('should get a custom daily event, until 20th February 2020 on a different timezone', () => {
        const rrule = getRrule({
            until: dummyUntil,
        });
        expect(getTimezonedFrequencyString(rrule, dummyStart, otherTzOptions)).toEqual(
            'Daily, until Feb 20, 2020 (Europe/Athens)'
        );
    });

    it('should get a custom daily event happening every two days, until 20th February 2020 on a different timezone', () => {
        const rrule = getRrule({
            interval: 2,
            until: dummyUntil,
        });
        const extendedOptions = otherTzOptions;
        expect(getTimezonedFrequencyString(rrule, dummyStart, extendedOptions)).toEqual(
            'Every 2 days, until Feb 20, 2020 (Europe/Athens)'
        );
    });
});

describe('getTimezonedFrequencyString should produce the expected string for weekly recurring events', () => {
    const getWeeklyRrule = (rrule) => getRrule({ ...rrule, freq: FREQUENCY.WEEKLY });

    it('should get a standard weekly recurring event', () => {
        const rrule = getWeeklyRrule();
        expect(getTimezonedFrequencyString(rrule, dummyStart, options)).toEqual('Weekly on Monday');
    });

    it('should get a standard weekly recurring event, on a different timezone', () => {
        const rrule = getWeeklyRrule();
        expect(getTimezonedFrequencyString(rrule, dummyStart, otherTzOptions)).toEqual(
            'Weekly on Monday (Europe/Athens)'
        );
    });

    it('should get a custom weekly recurring event that is actually standard', () => {
        const rrule = getWeeklyRrule({
            byday: ['MO'],
        });
        expect(getTimezonedFrequencyString(rrule, dummyStart, options)).toEqual('Weekly on Monday');
    });

    it('should get a custom weekly recurring event happening every 2 weeks', () => {
        const rrule = getWeeklyRrule({
            interval: 2,
            byday: ['MO'],
        });
        expect(getTimezonedFrequencyString(rrule, dummyStart, options)).toEqual('Every 2 weeks on Monday');
    });

    it('should get a custom weekly recurring event happening every 2 weeks, on Monday and Tuesday, lasting 1 time', () => {
        const rrule = getWeeklyRrule({
            interval: 2,
            byday: ['MO', 'TU'],
            count: 1,
        });
        expect(getTimezonedFrequencyString(rrule, dummyStart, options)).toEqual(
            'Every 2 weeks on Monday, Tuesday, 1 time'
        );
    });

    it('should get a custom weekly recurring event happening on all days of the week', () => {
        const rrule = getWeeklyRrule({
            interval: 1,
            byday: ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'],
        });
        expect(getTimezonedFrequencyString(rrule, dummyStart, options)).toEqual('Weekly on all days');
    });

    it('should get a custom weekly recurring event happening every three weeks, on all days of the week, lasting 5 times', () => {
        const rrule = getWeeklyRrule({
            interval: 3,
            byday: ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'],
            count: 5,
        });
        expect(getTimezonedFrequencyString(rrule, dummyStart, options)).toEqual('Every 3 weeks on all days, 5 times');
    });

    it('should get a custom weekly recurring event happening every three weeks, on all days of the week, until 20th February 2020', () => {
        const rrule = getWeeklyRrule({
            interval: 3,
            byday: ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'],
            until: dummyUntil,
        });
        expect(getTimezonedFrequencyString(rrule, dummyStart, options)).toEqual(
            'Every 3 weeks on all days, until Feb 20, 2020'
        );
    });

    it('should get a custom weekly recurring event happening on Monday and Wednesday, until 20th February 2020', () => {
        const rrule = getWeeklyRrule({
            byday: ['MO', 'WE'],
            until: dummyUntil,
        });
        expect(getTimezonedFrequencyString(rrule, dummyStart, options)).toEqual(
            'Weekly on Monday, Wednesday, until Feb 20, 2020'
        );
    });

    it('should get a custom weekly recurring event happening every 2 weeks on Monday and Wednesday, until 20th February 2020', () => {
        const rrule = getWeeklyRrule({
            interval: 2,
            byday: ['MO', 'WE'],
            until: dummyUntil,
        });
        expect(getTimezonedFrequencyString(rrule, dummyStart, options)).toEqual(
            'Every 2 weeks on Monday, Wednesday, until Feb 20, 2020'
        );
    });

    it('should get a custom weekly recurring event happening weekly on Monday, on a different timezone', () => {
        const rrule = getWeeklyRrule({
            interval: 1,
            byday: ['MO'],
            until: dummyUntil,
        });
        expect(getTimezonedFrequencyString(rrule, dummyStart, { ...options, currentTzid: 'Pacific/Tahiti ' })).toEqual(
            'Weekly on Monday, until Feb 20, 2020 (Europe/Athens)'
        );
    });

    it('should get a custom weekly recurring event happening every 2 weeks on all days, until 20th February 2020 on a different timezone', () => {
        const rrule = getWeeklyRrule({
            interval: 2,
            byday: ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'],
            until: dummyUntil,
        });
        expect(getTimezonedFrequencyString(rrule, dummyStart, otherTzOptions)).toEqual(
            'Every 2 weeks on all days, until Feb 20, 2020 (Europe/Athens)'
        );
    });

    it('should get a custom weekly recurring event happening every 2 weeks on all days, 2 times on a different timezone', () => {
        const rrule = getWeeklyRrule({
            interval: 2,
            byday: ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'],
            count: 2,
        });
        expect(getTimezonedFrequencyString(rrule, dummyStart, otherTzOptions)).toEqual(
            'Every 2 weeks on all days, 2 times'
        );
    });
});

describe('getTimezonedFrequencyString should produce the expected string for monthly recurring events', () => {
    const getMonthlyRrule = (rrule = {}) => getRrule({ ...rrule, freq: FREQUENCY.MONTHLY });

    it('should get a standard monthly recurring event', () => {
        expect(getTimezonedFrequencyString(getMonthlyRrule(), dummyStart, options)).toEqual('Monthly on day 20');
    });

    it('should get a standard monthly recurring event, on a different timezone', () => {
        expect(getTimezonedFrequencyString(getMonthlyRrule(), dummyStart, otherTzOptions)).toEqual(
            'Monthly on day 20 (Europe/Athens)'
        );
    });

    it('should get a custom monthly recurring event happening every 2 months', () => {
        const rrule = getMonthlyRrule({
            interval: 2,
        });
        expect(getTimezonedFrequencyString(rrule, dummyStart, options)).toEqual('Every 2 months on day 20');
    });

    it('should get a custom monthly recurring event happening every 2 months, on the third Monday', () => {
        const rrule = getMonthlyRrule({
            interval: 2,
            bysetpos: 4,
            byday: 'MO',
        });
        expect(getTimezonedFrequencyString(rrule, dummyStart, options)).toEqual('Every 2 months on the third Monday');
    });

    it('should get a custom monthly recurring event, on the first Monday, different timezone', () => {
        const rrule = getMonthlyRrule({
            bysetpos: 1,
            byday: 'MO',
        });
        const start = getDateTimeProperty({ year: 2020, month: 1, day: 6 }, dummyTzid);
        expect(getTimezonedFrequencyString(rrule, start, otherTzOptions)).toEqual(
            'Monthly on the first Monday (Europe/Athens)'
        );
    });

    it('should get a custom monthly recurring event happening every 2 months, on the last Wednesday, lasting 3 times', () => {
        const start = getDateTimeProperty({ year: 2020, month: 1, day: 29 }, dummyTzid);
        const rrule = getMonthlyRrule({
            interval: 2,
            bysetpos: -1,
            byday: 'WE',
            count: 3,
        });
        expect(getTimezonedFrequencyString(rrule, start, options)).toEqual(
            'Every 2 months on the last Wednesday, 3 times'
        );
    });

    it('should get a custom monthly recurring event happening every 2 months, on the last Wednesday, lasting 1 time', () => {
        const start = getDateTimeProperty({ year: 2020, month: 1, day: 29 }, dummyTzid);
        const rrule = getMonthlyRrule({
            interval: 2,
            bysetpos: -1,
            byday: 'WE',
            count: 1,
        });
        expect(getTimezonedFrequencyString(rrule, start, options)).toEqual(
            'Every 2 months on the last Wednesday, 1 time'
        );
    });

    it('should get a custom monthly recurring event happening on a fifth and last Thursday, until 20th February 2020', () => {
        const start = getDateTimeProperty({ year: 2020, month: 1, day: 30 }, dummyTzid);
        const rrule = getMonthlyRrule({
            bysetpos: -1,
            byday: 'TH',
            until: dummyUntil,
        });
        expect(getTimezonedFrequencyString(rrule, start, options)).toEqual(
            'Monthly on the last Thursday, until Feb 20, 2020'
        );
    });

    it('should get a custom monthly recurring event happening every three months on a fifth and last Thursday, until 20th February 2020', () => {
        const start = getDateTimeProperty({ year: 2020, month: 1, day: 30 }, dummyTzid);
        const rrule = getMonthlyRrule({
            freq: FREQUENCY.MONTHLY,
            interval: 3,
            bysetpos: -1,
            byday: 'TH',
            until: dummyUntil,
        });
        expect(getTimezonedFrequencyString(rrule, start, options)).toEqual(
            'Every 3 months on the last Thursday, until Feb 20, 2020'
        );
    });

    it('should get a custom monthly recurring event happening on a fifth and last Thursday, until 20th February 2020 on a different timezone', () => {
        const start = getDateTimeProperty({ year: 2020, month: 1, day: 30 }, dummyTzid);
        const rrule = getMonthlyRrule({
            bysetpos: -1,
            byday: 'TH',
            until: dummyUntil,
        });
        expect(getTimezonedFrequencyString(rrule, start, otherTzOptions)).toEqual(
            'Monthly on the last Thursday, until Feb 20, 2020 (Europe/Athens)'
        );
    });
});

describe('getTimezonedFrequencyString should produce the expected string for yearly recurring events', () => {
    const getYearlyRrule = (rrule = {}) => getRrule({ ...rrule, freq: FREQUENCY.YEARLY });

    it('should get a standard yearly recurring event', () => {
        expect(getTimezonedFrequencyString(getYearlyRrule(), dummyStart, options)).toEqual('Yearly');
    });

    it('should get a custom yearly recurring event happening every 2 years, lasting 1 time', () => {
        const rrule = getYearlyRrule({
            interval: 2,
            count: 1,
        });
        expect(getTimezonedFrequencyString(rrule, dummyStart, options)).toEqual('Every 2 years, 1 time');
    });

    it('should get a custom yearly recurring event happening every three years, lasting 5 times', () => {
        const rrule = getYearlyRrule({
            interval: 3,
            count: 5,
        });
        expect(getTimezonedFrequencyString(rrule, dummyStart, options)).toEqual('Every 3 years, 5 times');
    });

    it('should get a custom yearly recurring event, until 20th February 2020', () => {
        const rrule = getYearlyRrule({
            interval: 1,
            until: dummyUntil,
        });
        expect(getTimezonedFrequencyString(rrule, dummyStart, options)).toEqual('Yearly, until Feb 20, 2020');
    });

    it('should get a custom weekly recurring event happening every year, lasting 8 times on a different timezone', () => {
        const rrule = getYearlyRrule({
            count: 8,
        });
        expect(getTimezonedFrequencyString(rrule, dummyStart, otherTzOptions)).toEqual('Yearly, 8 times');
    });

    it('should get a custom weekly recurring event happening every two years, lasting 2 times on a different timezone', () => {
        const rrule = getYearlyRrule({
            interval: 2,
            count: 2,
        });
        expect(getTimezonedFrequencyString(rrule, dummyStart, otherTzOptions)).toEqual('Every 2 years, 2 times');
    });

    it('should get a custom yearly event, until 20th February 2020 on a different timezone', () => {
        const rrule = getYearlyRrule({
            until: dummyUntil,
        });
        expect(getTimezonedFrequencyString(rrule, dummyStart, otherTzOptions)).toEqual(
            'Yearly, until Feb 20, 2020 (Europe/Athens)'
        );
    });

    it('should get a custom yearly event happening every ten years until 20th February 2020 on a different timezone', () => {
        const rrule = getYearlyRrule({
            interval: 10,
            until: dummyUntil,
        });
        expect(getTimezonedFrequencyString(rrule, dummyStart, otherTzOptions)).toEqual(
            'Every 10 years, until Feb 20, 2020 (Europe/Athens)'
        );
    });
});

describe('getTimezonedFrequencyString should produce the expected string for unsupported recurring rules', () => {
    const getCustomRrule = (rrule) => getRrule({ ...rrule, x: 'test' });
    it('should get a non-supported daily recurring event', () => {
        const rrule = getCustomRrule({
            freq: FREQUENCY.DAILY,
        });
        expect(getTimezonedFrequencyString(rrule, dummyStart, options)).toEqual('Custom daily');
    });

    it('shold get a non-supported weekly recurring event', () => {
        const rrule = getCustomRrule({
            freq: FREQUENCY.WEEKLY,
        });
        expect(getTimezonedFrequencyString(rrule, dummyStart, options)).toEqual('Custom weekly');
    });

    it('should get a non-supported monthly recurring event', () => {
        const rrule = getCustomRrule({
            freq: FREQUENCY.MONTHLY,
        });
        expect(getTimezonedFrequencyString(rrule, dummyStart, options)).toEqual('Custom monthly');
    });

    it('should geta non-supported yearly recurring event', () => {
        const rrule = getCustomRrule({
            freq: FREQUENCY.YEARLY,
        });
        expect(getTimezonedFrequencyString(rrule, dummyStart, options)).toEqual('Custom yearly');
    });
});

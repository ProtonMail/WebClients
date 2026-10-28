import { enUS, fr } from 'date-fns/locale';

import type { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { setDateLocales, setLocales } from '@proton/shared/lib/i18n';

import type { RecurrenceRule } from '../../../../components/RecurrenceRuleFieldset/types';
import { ALWAYS_LOCAL_TIMEZONE_ID } from '../../../../components/RecurrenceRuleFieldset/types';
import { getScheduleCadenceLabel, getScheduleShortCadenceLabel } from './cadence-label';

const time = { hour: 7, minute: 45, timezone: ALWAYS_LOCAL_TIMEZONE_ID };

describe('getScheduleCadenceLabel', () => {
    beforeEach(() => {
        setLocales({ localeCode: 'en_US' });
        setDateLocales({ dateLocale: enUS });
    });

    afterEach(() => {
        setLocales({ localeCode: 'en_US' });
        setDateLocales({ dateLocale: enUS });
    });

    it.each<{ name: string; rule: RecurrenceRule; weekStartsOn: WeekStartsOn; expected: string }>([
        {
            name: 'daily',
            rule: { ...time, frequency: 'DAILY' },
            weekStartsOn: 1,
            expected: 'Daily at 7:45 AM',
        },
        {
            name: 'weekdays regardless of input order',
            rule: { ...time, frequency: 'WEEKLY', byWeekDay: ['FR', 'WE', 'MO', 'TH', 'TU'] },
            weekStartsOn: 0,
            expected: 'Weekdays at 7:45 AM',
        },
        {
            name: 'a single weekday with its full name',
            rule: { ...time, frequency: 'WEEKLY', byWeekDay: ['FR'] },
            weekStartsOn: 1,
            expected: 'Every Friday at 7:45 AM',
        },
        {
            name: 'multiple weekdays in Monday-first order',
            rule: { ...time, frequency: 'WEEKLY', byWeekDay: ['SU', 'WE', 'MO'] },
            weekStartsOn: 1,
            expected: 'Weekly on Mon, Wed, Sun at 7:45 AM',
        },
        {
            name: 'multiple weekdays in Sunday-first order',
            rule: { ...time, frequency: 'WEEKLY', byWeekDay: ['WE', 'MO', 'SU'] },
            weekStartsOn: 0,
            expected: 'Weekly on Sun, Mon, Wed at 7:45 AM',
        },
        {
            name: 'a Saturday week start',
            rule: { ...time, frequency: 'WEEKLY', byWeekDay: ['MO', 'SU', 'SA'] },
            weekStartsOn: 6,
            expected: 'Weekly on Sat, Sun, Mon at 7:45 AM',
        },
        {
            name: 'all seven days without treating them as weekdays',
            rule: { ...time, frequency: 'WEEKLY', byWeekDay: ['SU', 'SA', 'FR', 'TH', 'WE', 'TU', 'MO'] },
            weekStartsOn: 1,
            expected: 'Weekly on Mon, Tue, Wed, Thu, Fri, Sat, Sun at 7:45 AM',
        },
        {
            name: 'sorted monthly ordinal days',
            rule: { ...time, frequency: 'MONTHLY', byMonthDay: [31, 3, 21, 1, 2] },
            weekStartsOn: 1,
            expected: 'Monthly on 1st, 2nd, 3rd, 21st, 31st at 7:45 AM',
        },
        {
            name: 'a one-time date and time',
            rule: { ...time, frequency: 'ONCE', date: '2026-12-31', hour: 23, minute: 5 },
            weekStartsOn: 1,
            expected: 'Once on 12/31/26, 11:05 PM',
        },
        {
            name: 'fixed-timezone wall-clock fields without converting them to the browser timezone',
            rule: { ...time, frequency: 'DAILY', timezone: 'America/New_York' },
            weekStartsOn: 1,
            expected: 'Daily at 7:45 AM',
        },
        {
            name: 'midnight',
            rule: { ...time, frequency: 'DAILY', hour: 0, minute: 0 },
            weekStartsOn: 1,
            expected: 'Daily at 12:00 AM',
        },
        {
            name: 'noon',
            rule: { ...time, frequency: 'DAILY', hour: 12, minute: 0 },
            weekStartsOn: 1,
            expected: 'Daily at 12:00 PM',
        },
    ])('formats $name', ({ rule, weekStartsOn, expected }) => {
        expect(getScheduleCadenceLabel(rule, weekStartsOn)).toBe(expected);
    });

    it('does not reorder the rule arrays in place', () => {
        const byWeekDay = ['SU', 'MO', 'WE'] as const;
        const weekly: RecurrenceRule = { ...time, frequency: 'WEEKLY', byWeekDay: [...byWeekDay] };
        const monthly: RecurrenceRule = { ...time, frequency: 'MONTHLY', byMonthDay: [31, 1, 15] };

        getScheduleCadenceLabel(weekly, 1);
        getScheduleCadenceLabel(monthly, 1);

        expect(weekly.byWeekDay).toEqual(byWeekDay);
        expect(monthly.byMonthDay).toEqual([31, 1, 15]);
    });

    it('uses the configured date locale for weekday names and time formatting', () => {
        setLocales({ localeCode: 'fr_FR' });
        setDateLocales({ dateLocale: fr });

        expect(getScheduleCadenceLabel({ ...time, frequency: 'WEEKLY', byWeekDay: ['FR'] }, 1)).toBe(
            'Every vendredi at 07:45'
        );
    });
});

describe('getScheduleShortCadenceLabel', () => {
    afterEach(() => setLocales({ localeCode: 'en_US' }));

    it.each<[RecurrenceRule, string]>([
        [{ ...time, frequency: 'DAILY' }, 'Daily'],
        [{ ...time, frequency: 'WEEKLY', byWeekDay: ['FR', 'TU', 'WE', 'MO', 'TH'] }, 'Weekdays'],
        [{ ...time, frequency: 'WEEKLY', byWeekDay: ['MO'] }, 'Weekly'],
        [{ ...time, frequency: 'WEEKLY', byWeekDay: ['SA', 'SU'] }, 'Weekly'],
        [{ ...time, frequency: 'MONTHLY', byMonthDay: [1, 15] }, 'Monthly'],
    ])('formats %j without a time', (rule, expected) => {
        expect(getScheduleShortCadenceLabel(rule)).toBe(expected);
    });

    it.each([
        ['en_US', '12/30/26'],
        ['en_GB', '30/12/26'],
    ])('localizes a one-time date in %s', (localeCode, expected) => {
        setLocales({ localeCode });
        expect(getScheduleShortCadenceLabel({ ...time, frequency: 'ONCE', date: '2026-12-30' })).toBe(expected);
    });
});

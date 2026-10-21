import { DAY, HOUR, MINUTE } from '@proton/shared/lib/constants';

import type { RecurrenceRule } from '../../../../components/RecurrenceRuleFieldset/types';
import { ALWAYS_LOCAL_TIMEZONE_ID } from '../../../../components/RecurrenceRuleFieldset/types';
import { getNextScheduleRun, getScheduleNextRunLabel } from './next-run';

const time = { hour: 7, minute: 45, timezone: 'UTC' };

describe('getNextScheduleRun', () => {
    it.each<{ name: string; rule: RecurrenceRule; now: string; expected: string | undefined }>([
        {
            name: 'today when the daily time is still in the future',
            rule: { ...time, frequency: 'DAILY' },
            now: '2026-10-19T07:44:59.999Z',
            expected: '2026-10-19T07:45:00.000Z',
        },
        {
            name: 'tomorrow when now is exactly the daily run time',
            rule: { ...time, frequency: 'DAILY' },
            now: '2026-10-19T07:45:00Z',
            expected: '2026-10-20T07:45:00.000Z',
        },
        {
            name: 'the next year after a daily time has passed on December 31',
            rule: { ...time, frequency: 'DAILY' },
            now: '2026-12-31T08:00:00Z',
            expected: '2027-01-01T07:45:00.000Z',
        },
        {
            name: 'the nearest selected weekday rather than the first input token',
            rule: { ...time, frequency: 'WEEKLY', byWeekDay: ['FR', 'WE'] },
            now: '2026-10-19T08:00:00Z',
            expected: '2026-10-21T07:45:00.000Z',
        },
        {
            name: 'the following week when the only selected day has just run',
            rule: { ...time, frequency: 'WEEKLY', byWeekDay: ['MO'] },
            now: '2026-10-19T07:45:00Z',
            expected: '2026-10-26T07:45:00.000Z',
        },
        {
            name: 'the nearest selected monthly date regardless of input order',
            rule: { ...time, frequency: 'MONTHLY', byMonthDay: [31, 20, 1] },
            now: '2026-10-19T08:00:00Z',
            expected: '2026-10-20T07:45:00.000Z',
        },
        {
            name: 'March 31 when February has no monthly 31st',
            rule: { ...time, frequency: 'MONTHLY', byMonthDay: [31] },
            now: '2026-01-31T07:45:00Z',
            expected: '2026-03-31T07:45:00.000Z',
        },
        {
            name: 'February 29 in a leap year',
            rule: { ...time, frequency: 'MONTHLY', byMonthDay: [29] },
            now: '2028-02-01T00:00:00Z',
            expected: '2028-02-29T07:45:00.000Z',
        },
        {
            name: 'March 29 in a non-leap year',
            rule: { ...time, frequency: 'MONTHLY', byMonthDay: [29] },
            now: '2026-02-01T00:00:00Z',
            expected: '2026-03-29T07:45:00.000Z',
        },
        {
            name: 'no run for an empty weekday selection',
            rule: { ...time, frequency: 'WEEKLY', byWeekDay: [] },
            now: '2026-10-19T00:00:00Z',
            expected: undefined,
        },
        {
            name: 'no run for an empty monthly selection',
            rule: { ...time, frequency: 'MONTHLY', byMonthDay: [] },
            now: '2026-10-19T00:00:00Z',
            expected: undefined,
        },
        {
            name: 'a future one-time run',
            rule: { ...time, frequency: 'ONCE', date: '2026-10-20' },
            now: '2026-10-19T00:00:00Z',
            expected: '2026-10-20T07:45:00.000Z',
        },
        {
            name: 'no one-time run at exactly now',
            rule: { ...time, frequency: 'ONCE', date: '2026-10-19' },
            now: '2026-10-19T07:45:00Z',
            expected: undefined,
        },
        {
            name: 'no one-time run in the past',
            rule: { ...time, frequency: 'ONCE', date: '2026-10-18' },
            now: '2026-10-19T00:00:00Z',
            expected: undefined,
        },
        {
            name: 'the schedule timezone weekday when UTC is already Monday',
            rule: {
                ...time,
                frequency: 'WEEKLY',
                byWeekDay: ['SU'],
                hour: 21,
                minute: 0,
                timezone: 'America/New_York',
            },
            now: '2026-10-19T00:30:00Z',
            expected: '2026-10-19T01:00:00.000Z',
        },
        {
            name: 'the next calendar day in a timezone ahead of UTC',
            rule: { ...time, frequency: 'DAILY', hour: 8, minute: 0, timezone: 'Asia/Taipei' },
            now: '2026-10-19T23:00:00Z',
            expected: '2026-10-20T00:00:00.000Z',
        },
        {
            name: 'a one-time local date that falls in the previous UTC year',
            rule: { ...time, frequency: 'ONCE', date: '2027-01-01', hour: 0, minute: 15, timezone: 'Asia/Taipei' },
            now: '2026-12-31T16:00:00Z',
            expected: '2026-12-31T16:15:00.000Z',
        },
        {
            name: 'the same wall-clock time across the 23-hour spring DST day',
            rule: { ...time, frequency: 'DAILY', hour: 9, minute: 0, timezone: 'America/New_York' },
            now: '2026-03-07T14:00:00Z',
            expected: '2026-03-08T13:00:00.000Z',
        },
        {
            name: 'the same wall-clock time across the 25-hour autumn DST day',
            rule: { ...time, frequency: 'DAILY', hour: 9, minute: 0, timezone: 'America/New_York' },
            now: '2026-10-31T13:00:00Z',
            expected: '2026-11-01T14:00:00.000Z',
        },
    ])('returns $name', ({ rule, now, expected }) => {
        expect(getNextScheduleRun(rule, new Date(now))?.toISOString()).toBe(expected);
    });

    it('runs an always-local daily rule in the browser timezone', () => {
        const now = new Date(2026, 9, 19, 8, 0);
        const rule: RecurrenceRule = { ...time, frequency: 'DAILY', timezone: ALWAYS_LOCAL_TIMEZONE_ID };

        expect(getNextScheduleRun(rule, now)).toEqual(new Date(2026, 9, 20, 7, 45));
        expect(now).toEqual(new Date(2026, 9, 19, 8, 0));
    });

    it('interprets an always-local one-time date as a local calendar date', () => {
        const rule: RecurrenceRule = {
            ...time,
            frequency: 'ONCE',
            date: '2026-10-20',
            timezone: ALWAYS_LOCAL_TIMEZONE_ID,
        };

        expect(getNextScheduleRun(rule, new Date(2026, 9, 19, 8, 0))).toEqual(new Date(2026, 9, 20, 7, 45));
    });
});

describe('getScheduleNextRunLabel', () => {
    const rule: RecurrenceRule = { frequency: 'ONCE', date: '2026-10-20', hour: 12, minute: 0, timezone: 'UTC' };
    const runAt = new Date('2026-10-20T12:00:00Z').getTime();

    it.each([
        [1, 'Next run in 1 minute'],
        [MINUTE, 'Next run in 1 minute'],
        [MINUTE + 1, 'Next run in 2 minutes'],
        [HOUR - 1, 'Next run in 60 minutes'],
        [HOUR, 'Next run in 60 minutes'],
        [HOUR + 1, 'Next run in 61 minutes'],
        [2 * HOUR - 1, 'Next run in 120 minutes'],
        [2 * HOUR, 'Next run in 2 hours'],
        [2 * HOUR + 1, 'Next run in 2 hours'],
        [DAY - 1, 'Next run in 23 hours'],
        [DAY, 'Next run in 24 hours'],
        [DAY + 1, 'Next run in 24 hours'],
        [2 * DAY - 1, 'Next run in 47 hours'],
        [2 * DAY, 'Next run in 2 days'],
        [2 * DAY + 1, 'Next run in 2 days'],
    ])('formats %i milliseconds remaining as "%s"', (remaining, expected) => {
        expect(getScheduleNextRunLabel(rule, new Date(runAt - remaining))).toBe(expected);
    });

    it.each([0, 1])('omits the label when the one-time run is %i milliseconds in the past', (elapsed) => {
        expect(getScheduleNextRunLabel(rule, new Date(runAt + elapsed))).toBeUndefined();
    });

    it('omits the label when a recurring rule has no selected days', () => {
        expect(
            getScheduleNextRunLabel({ ...time, frequency: 'WEEKLY', byWeekDay: [] }, new Date(runAt))
        ).toBeUndefined();
    });
});

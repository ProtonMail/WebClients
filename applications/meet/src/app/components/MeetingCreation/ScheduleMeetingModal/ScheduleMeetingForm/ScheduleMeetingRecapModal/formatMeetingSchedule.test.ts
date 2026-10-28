import { SETTINGS_TIME_FORMAT } from '@proton/shared/lib/interfaces';

import { formatMeetingSchedule } from './formatMeetingSchedule';

const now = new Date('2026-02-24T09:00:00Z');

const baseInput = {
    startTime: new Date('2026-02-27T10:00:00Z'),
    endTime: new Date('2026-02-27T11:00:00Z'),
    timeZone: 'Europe/Zurich',
    rrule: null,
    timeFormat: SETTINGS_TIME_FORMAT.H12,
    now,
    deviceTimeZone: 'Europe/Zurich',
};

describe('formatMeetingSchedule dateTime', () => {
    it('labels the current day as Today', () => {
        const { dateTime } = formatMeetingSchedule({
            ...baseInput,
            startTime: new Date('2026-02-24T10:00:00Z'),
            endTime: new Date('2026-02-24T11:00:00Z'),
        });

        expect(dateTime).toBe('Today · Feb 24, 11am to 12pm');
    });

    it('labels the next day as Tomorrow', () => {
        const { dateTime } = formatMeetingSchedule({
            ...baseInput,
            startTime: new Date('2026-02-25T10:00:00Z'),
            endTime: new Date('2026-02-25T11:00:00Z'),
        });

        expect(dateTime).toBe('Tomorrow · Feb 25, 11am to 12pm');
    });

    it('compares days in the meeting timezone instead of UTC', () => {
        const { dateTime } = formatMeetingSchedule({
            ...baseInput,
            startTime: new Date('2026-02-24T23:30:00Z'),
            endTime: new Date('2026-02-25T00:30:00Z'),
        });

        expect(dateTime).toBe('Tomorrow · Feb 25, 12:30am to 1:30am');
    });

    it('omits the year for a later date in the current year', () => {
        expect(formatMeetingSchedule(baseInput).dateTime).toBe('Fri, Feb 27, 11am to 12pm');
    });

    it('shows the year for a date in another year', () => {
        const { dateTime } = formatMeetingSchedule({
            ...baseInput,
            startTime: new Date('2027-03-05T10:00:00Z'),
            endTime: new Date('2027-03-05T11:00:00Z'),
        });

        expect(dateTime).toBe('Fri, Mar 5, 2027, 11am to 12pm');
    });

    it('keeps minutes in 12 hour times when they are not zero', () => {
        const { dateTime } = formatMeetingSchedule({
            ...baseInput,
            startTime: new Date('2026-02-27T10:30:00Z'),
            endTime: new Date('2026-02-27T11:45:00Z'),
        });

        expect(dateTime).toBe('Fri, Feb 27, 11:30am to 12:45pm');
    });

    it('uses 24 hour times with leading zeros', () => {
        const { dateTime } = formatMeetingSchedule({
            ...baseInput,
            timeFormat: SETTINGS_TIME_FORMAT.H24,
            startTime: new Date('2026-02-27T08:05:00Z'),
            endTime: new Date('2026-02-27T10:00:00Z'),
        });

        expect(dateTime).toBe('Fri, Feb 27, 09:05 to 11:00');
    });

    it('uses 12 hour times for the locale default in en-US', () => {
        const { dateTime } = formatMeetingSchedule({
            ...baseInput,
            timeFormat: SETTINGS_TIME_FORMAT.LOCALE_DEFAULT,
        });

        expect(dateTime).toBe('Fri, Feb 27, 11am to 12pm');
    });

    it('repeats both dates when the meeting ends on another day', () => {
        const { dateTime } = formatMeetingSchedule({
            ...baseInput,
            startTime: new Date('2026-02-27T22:00:00Z'),
            endTime: new Date('2026-02-28T00:00:00Z'),
        });

        expect(dateTime).toBe('Fri, Feb 27, 11pm to Sat, Feb 28, 1am');
    });

    it('appends the timezone when it differs from the device timezone', () => {
        const { dateTime } = formatMeetingSchedule({
            ...baseInput,
            timeZone: 'America/New_York',
            startTime: new Date('2026-02-27T16:00:00Z'),
            endTime: new Date('2026-02-27T17:00:00Z'),
        });

        expect(dateTime).toBe('Fri, Feb 27, 11am to 12pm (America/New_York)');
    });
});

describe('formatMeetingSchedule recurrence', () => {
    const recurrenceFor = (rrule: string | null) => formatMeetingSchedule({ ...baseInput, rrule }).recurrence;

    it('has no recurrence without an rrule', () => {
        expect(recurrenceFor(null)).toBeNull();
    });

    it('has no recurrence for an unparseable rrule', () => {
        expect(recurrenceFor('not a rule')).toBeNull();
    });

    it('describes a daily rule', () => {
        expect(recurrenceFor('FREQ=DAILY')).toBe('Repeats daily');
    });

    it('describes a daily rule with an interval', () => {
        expect(recurrenceFor('FREQ=DAILY;INTERVAL=3')).toBe('Repeats every 3 days');
    });

    it('describes Monday to Friday as every weekday', () => {
        expect(recurrenceFor('FREQ=WEEKLY;BYDAY=FR,MO,TU,WE,TH')).toBe('Repeats every weekday');
    });

    it('uses the start weekday when a weekly rule has no BYDAY', () => {
        expect(recurrenceFor('FREQ=WEEKLY')).toBe('Repeats every Friday');
    });

    it('describes a biweekly rule on one day', () => {
        expect(recurrenceFor('FREQ=WEEKLY;INTERVAL=2;BYDAY=FR')).toBe('Repeats every 2 weeks on Friday');
    });

    it('lists several weekly days Monday first', () => {
        expect(recurrenceFor('FREQ=WEEKLY;BYDAY=FR,MO,WE')).toBe('Repeats every Mon, Wed, and Fri');
    });

    it('lists several days for a weekly interval', () => {
        expect(recurrenceFor('FREQ=WEEKLY;INTERVAL=3;BYDAY=MO,WE,FR')).toBe(
            'Repeats every 3 weeks on Mon, Wed, and Fri'
        );
    });

    it('does not treat a weekday preset with an interval as every weekday', () => {
        expect(recurrenceFor('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,TU,WE,TH,FR')).toBe(
            'Repeats every 2 weeks on Mon, Tue, Wed, Thu, and Fri'
        );
    });

    it('describes a monthly rule on the start day', () => {
        expect(recurrenceFor('FREQ=MONTHLY')).toBe('Repeats on the 27th of each month');
    });

    it('describes a monthly rule with BYMONTHDAY and an interval', () => {
        expect(recurrenceFor('FREQ=MONTHLY;INTERVAL=2;BYMONTHDAY=1')).toBe('Repeats every 2 months on the 1st');
    });

    it('describes a yearly rule', () => {
        expect(recurrenceFor('FREQ=YEARLY')).toBe('Repeats every year on Feb 27');
    });

    it('describes a yearly rule with an interval', () => {
        expect(recurrenceFor('FREQ=YEARLY;INTERVAL=2')).toBe('Repeats every 2 years on Feb 27');
    });

    it('falls back to the frequency for a monthly rule with an ordinal weekday', () => {
        expect(recurrenceFor('FREQ=MONTHLY;BYDAY=2TU')).toBe('Repeats monthly');
    });

    it('falls back to the frequency for BYSETPOS', () => {
        expect(recurrenceFor('FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1')).toBe('Repeats monthly');
    });

    it('ignores COUNT and UNTIL', () => {
        expect(recurrenceFor('FREQ=WEEKLY;BYDAY=FR;COUNT=4')).toBe('Repeats every Friday');
    });
});

import { differenceInMinutes, differenceInHours, differenceInDays, differenceInWeeks } from 'date-fns';
import { convertZonedDateTimeToUTC, convertUTCDateTimeToZone, toUTCDate } from 'proton-shared/lib/date/timezone';
import { enUS } from 'date-fns/locale';
import { pick } from 'proton-shared/lib/helpers/object';
import { SETTINGS_NOTIFICATION_TYPE } from 'proton-shared/lib/interfaces/calendar';
import { propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import { WEEK, DAY, HOUR, MINUTE, NOTIFICATION_UNITS, NOTIFICATION_WHEN } from '../../src/app/constants';
import {
    filterFutureNotifications,
    getAlarmMessage,
    getSupportedAlarm,
    getIsValidAlarm,
    normalizeTrigger,
} from '../../src/app/helpers/alarms';

const formatOptions = { locale: enUS };

describe('getAlarmMessage', () => {
    const tzidEurope = 'Europe/Zurich';
    const tzidAsia = 'Asia/Seoul';

    const testFakeZonedDate = { year: 2019, month: 10, day: 13, hours: 20, minutes: 0, seconds: 0 };
    const testComponent = {
        dtstart: {
            value: { ...testFakeZonedDate, isUTC: false },
            parameters: { tzid: tzidEurope },
        },
        summary: { value: 'test alarm' },
    };
    const testFulldayComponent = {
        dtstart: {
            value: pick(testFakeZonedDate, ['year', 'month', 'day']),
            parameters: { type: 'date' },
        },
        summary: { value: 'test alarm' },
    };
    const start = toUTCDate(convertZonedDateTimeToUTC(testFakeZonedDate, tzidEurope));

    test('it should display the right notification for events happening today', () => {
        const fakeZonedNow = { ...testFakeZonedDate, hours: 1 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(getAlarmMessage({ component: testComponent, start, now, tzid: tzidEurope, formatOptions })).toEqual(
            'test alarm will start at 8:00 PM'
        );
    });

    test('it should display the right notification for full-day events happening today', () => {
        const fakeZonedNow = { ...testFakeZonedDate, hours: 1 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(
            getAlarmMessage({ component: testFulldayComponent, start, now, tzid: tzidEurope, formatOptions })
        ).toEqual('test alarm starts today');
    });

    test('it should display the right notification for events happening tomorrow', () => {
        const fakeZonedNow = { ...testFakeZonedDate, day: 12 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(getAlarmMessage({ component: testComponent, start, now, tzid: tzidEurope, formatOptions })).toEqual(
            'test alarm will start tomorrow at 8:00 PM'
        );
    });

    test('it should display the right notification for full-day events happening tomorrow', () => {
        const fakeZonedNow = { ...testFakeZonedDate, day: 12 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(
            getAlarmMessage({ component: testFulldayComponent, start, now, tzid: tzidEurope, formatOptions })
        ).toEqual('test alarm will start tomorrow');
    });

    test('it should display the right notification for full-day events happening yesterday', () => {
        const fakeZonedNow = { ...testFakeZonedDate, day: 14 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(
            getAlarmMessage({ component: testFulldayComponent, start, now, tzid: tzidEurope, formatOptions })
        ).toEqual('test alarm started yesterday');
    });

    test('it should display the right notification for events happening yesterday', () => {
        const fakeZonedNow = { ...testFakeZonedDate, day: 14 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(getAlarmMessage({ component: testComponent, start, now, tzid: tzidEurope, formatOptions })).toEqual(
            'test alarm started yesterday at 8:00 PM'
        );
    });

    test('it should display the right notification for events happening later this month', () => {
        const fakeZonedNow = { ...testFakeZonedDate, day: 5 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(getAlarmMessage({ component: testComponent, start, now, tzid: tzidEurope, formatOptions })).toEqual(
            'test alarm will start on Sunday 13th at 8:00 PM'
        );
    });

    test('it should display the right notification for full-day events happening later this month', () => {
        const fakeZonedNow = { ...testFakeZonedDate, day: 5 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(
            getAlarmMessage({ component: testFulldayComponent, start, now, tzid: tzidEurope, formatOptions })
        ).toEqual('test alarm will start on Sunday 13th');
    });

    test('it should display the right notification for events happening earlier this month', () => {
        const fakeZonedNow = { ...testFakeZonedDate, day: 22 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(getAlarmMessage({ component: testComponent, start, now, tzid: tzidEurope, formatOptions })).toEqual(
            'test alarm started on Sunday 13th at 8:00 PM'
        );
    });

    test('it should display the right notification for full-day events happening earlier this month', () => {
        const fakeZonedNow = { ...testFakeZonedDate, day: 22 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(
            getAlarmMessage({ component: testFulldayComponent, start, now, tzid: tzidEurope, formatOptions })
        ).toEqual('test alarm started on Sunday 13th');
    });

    test('it should display the right notification for events happening later this year', () => {
        const fakeZonedNow = { ...testFakeZonedDate, month: 7 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(getAlarmMessage({ component: testComponent, start, now, tzid: tzidEurope, formatOptions })).toEqual(
            'test alarm will start on Sunday 13th October at 8:00 PM'
        );
    });

    test('it should display the right notification for full-day events happening later this year', () => {
        const fakeZonedNow = { ...testFakeZonedDate, month: 7 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(
            getAlarmMessage({ component: testFulldayComponent, start, now, tzid: tzidEurope, formatOptions })
        ).toEqual('test alarm will start on Sunday 13th October');
    });

    test('it should display the right notification for events happening earlier this year', () => {
        const fakeZonedNow = { ...testFakeZonedDate, month: 12 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(getAlarmMessage({ component: testComponent, start, now, tzid: tzidEurope, formatOptions })).toEqual(
            'test alarm started on Sunday 13th October at 8:00 PM'
        );
    });

    test('it should display the right notification for full-day events happening earlier this year', () => {
        const fakeZonedNow = { ...testFakeZonedDate, month: 12 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(
            getAlarmMessage({ component: testFulldayComponent, start, now, tzid: tzidEurope, formatOptions })
        ).toEqual('test alarm started on Sunday 13th October');
    });

    test('it should display the right notification for events happening in future years', () => {
        const fakeZonedNow = { ...testFakeZonedDate, year: 2002 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(getAlarmMessage({ component: testComponent, start, now, tzid: tzidEurope, formatOptions })).toEqual(
            'test alarm will start on Sunday, October 13th, 2019 at 8:00 PM'
        );
    });

    test('it should display the right notification for full-day events happening in future years', () => {
        const fakeZonedNow = { ...testFakeZonedDate, year: 2002 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(
            getAlarmMessage({ component: testFulldayComponent, start, now, tzid: tzidEurope, formatOptions })
        ).toEqual('test alarm will start on Sunday, October 13th, 2019');
    });

    test('it should display the right notification for events happening in past years', () => {
        const fakeZonedNow = { ...testFakeZonedDate, year: 2022 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(getAlarmMessage({ component: testComponent, start, now, tzid: tzidEurope, formatOptions })).toEqual(
            'test alarm started on Sunday, October 13th, 2019 at 8:00 PM'
        );
    });

    test('it should display the right notification for full-day events happening in past years', () => {
        const fakeZonedNow = { ...testFakeZonedDate, year: 2022 };
        const now = toUTCDate(convertUTCDateTimeToZone(fakeZonedNow, tzidEurope));
        expect(
            getAlarmMessage({ component: testFulldayComponent, start, now, tzid: tzidEurope, formatOptions })
        ).toEqual('test alarm started on Sunday, October 13th, 2019');
    });

    test('it should display the right notification for events happening both this month and next year', () => {
        const fakeZonedNow = { ...testFakeZonedDate, day: 5 };
        const now = toUTCDate(convertUTCDateTimeToZone(fakeZonedNow, tzidEurope));
        expect(getAlarmMessage({ component: testComponent, start, now, tzid: tzidEurope, formatOptions })).toEqual(
            'test alarm will start on Sunday 13th at 8:00 PM'
        );
    });

    test('it should display the right notification for events happening both this month and next year', () => {
        const fakeZonedNow = { ...testFakeZonedDate, day: 5 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(getAlarmMessage({ component: testComponent, start, now, tzid: tzidEurope, formatOptions })).toEqual(
            'test alarm will start on Sunday 13th at 8:00 PM'
        );
    });

    test('it should take into account day changes due to timezone differences', () => {
        const fakeZonedNow = { ...testFakeZonedDate, hours: 10 };
        const now = toUTCDate(convertZonedDateTimeToUTC(fakeZonedNow, tzidEurope));
        expect(getAlarmMessage({ component: testComponent, start, now, tzid: tzidEurope, formatOptions })).toEqual(
            'test alarm will start at 8:00 PM'
        );
        expect(getAlarmMessage({ component: testComponent, start, now, tzid: tzidAsia, formatOptions })).toEqual(
            'test alarm will start tomorrow at 3:00 AM'
        );
    });
});

describe('filterFutureNotifications', () => {
    test('it should filter future part-day notifications', () => {
        const isAllDay = false;
        const atSameTimeNotifications = [
            {
                unit: NOTIFICATION_UNITS.MINUTES,
                type: SETTINGS_NOTIFICATION_TYPE.EMAIL,
                when: NOTIFICATION_WHEN.AFTER,
                value: 0,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.DAY,
                type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                when: NOTIFICATION_WHEN.BEFORE,
                value: 0,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.DAY,
                type: SETTINGS_NOTIFICATION_TYPE.EMAIL,
                when: NOTIFICATION_WHEN.AFTER,
                value: 0,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.WEEK,
                type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                when: NOTIFICATION_WHEN.BEFORE,
                value: 0,
                isAllDay,
            },
        ];
        const beforeNotifications = [
            {
                unit: NOTIFICATION_UNITS.MINUTES,
                type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                when: NOTIFICATION_WHEN.BEFORE,
                value: 1,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.DAY,
                type: SETTINGS_NOTIFICATION_TYPE.EMAIL,
                when: NOTIFICATION_WHEN.BEFORE,
                value: 2,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.WEEK,
                type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                when: NOTIFICATION_WHEN.BEFORE,
                value: 1,
                isAllDay,
            },
        ];
        const afterNotifications = [
            {
                unit: NOTIFICATION_UNITS.MINUTES,
                type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                when: NOTIFICATION_WHEN.AFTER,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.MINUTES,
                type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                when: NOTIFICATION_WHEN.AFTER,
                value: 1,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.DAY,
                type: SETTINGS_NOTIFICATION_TYPE.EMAIL,
                when: NOTIFICATION_WHEN.AFTER,
                value: 2,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.WEEK,
                type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                when: NOTIFICATION_WHEN.AFTER,
                value: 1,
                isAllDay,
            },
        ];
        const notifications = [...beforeNotifications, ...atSameTimeNotifications, ...afterNotifications];
        const expected = [...beforeNotifications, ...atSameTimeNotifications];
        expect(filterFutureNotifications(notifications)).toEqual(expected);
    });

    test('it should filter future all-day notifications', () => {
        const isAllDay = true;
        const onSameDayNotifications = [
            {
                unit: NOTIFICATION_UNITS.DAY,
                type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                when: NOTIFICATION_WHEN.AFTER,
                value: 0,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.DAY,
                type: SETTINGS_NOTIFICATION_TYPE.EMAIL,
                when: NOTIFICATION_WHEN.BEFORE,
                value: 0,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.WEEK,
                type: SETTINGS_NOTIFICATION_TYPE.EMAIL,
                when: NOTIFICATION_WHEN.AFTER,
                value: 0,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.WEEK,
                type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                when: NOTIFICATION_WHEN.BEFORE,
                value: 0,
                isAllDay,
            },
        ];
        const beforeNotifications = [
            {
                unit: NOTIFICATION_UNITS.DAY,
                type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                when: NOTIFICATION_WHEN.BEFORE,
                value: 1,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.DAY,
                type: SETTINGS_NOTIFICATION_TYPE.EMAIL,
                when: NOTIFICATION_WHEN.BEFORE,
                value: 2,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.WEEK,
                type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                when: NOTIFICATION_WHEN.BEFORE,
                value: 1,
                isAllDay,
            },
        ];
        const afterNotifications = [
            {
                unit: NOTIFICATION_UNITS.DAY,
                type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                when: NOTIFICATION_WHEN.AFTER,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.DAY,
                type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                when: NOTIFICATION_WHEN.AFTER,
                value: 1,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.WEEK,
                type: SETTINGS_NOTIFICATION_TYPE.EMAIL,
                when: NOTIFICATION_WHEN.AFTER,
                value: 2,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.WEEK,
                type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                when: NOTIFICATION_WHEN.AFTER,
                value: 1,
                isAllDay,
            },
        ];
        const notifications = [...beforeNotifications, ...onSameDayNotifications, ...afterNotifications];
        const expected = [...beforeNotifications, ...onSameDayNotifications];
        expect(filterFutureNotifications(notifications)).toEqual(expected);
    });
});

describe('getIsValidAlarm', () => {
    const baseTriggerValue = { weeks: 0, days: 1, hours: 0, minutes: 0, seconds: 0, isNegative: true };
    const baseAlarm = {
        component: 'valarm',
        action: { value: 'AUDIO' },
        trigger: { value: baseTriggerValue },
    };

    test('it reject alarms with unknown action', () => {
        const alarm = { ...baseAlarm, action: { value: 'WHATEVER' } };
        expect(getIsValidAlarm(alarm)).toEqual(false);
    });

    test('it should reject alarms with repeat but no duration', () => {
        const alarm = { ...baseAlarm, repeat: { value: '1' } };
        expect(getIsValidAlarm(alarm)).toEqual(false);
    });

    test('it should reject alarms with a malformed trigger', () => {
        const alarm = {
            ...baseAlarm,
            trigger: {
                value: { year: 2020, month: 5, day: 2 },
                parameters: { type: 'date-time' },
            },
        };
        expect(getIsValidAlarm(alarm)).toEqual(false);
    });
});

describe('getSupportedAlarm', () => {
    const dtstartPartDay = {
        value: { year: 2020, month: 5, day: 11, hours: 12, minutes: 30, seconds: 0, isUTC: true },
    };
    const dtstartAllDay = { value: { year: 2020, month: 5, day: 11 }, parameters: { type: 'date' } };
    const baseTriggerValue = { weeks: 0, days: 1, hours: 0, minutes: 0, seconds: 0, isNegative: true };
    const baseAlarm = {
        component: 'valarm',
        action: { value: 'AUDIO' },
        trigger: { value: baseTriggerValue },
    };

    test('it should filter out alarms with trigger related to end time', () => {
        const alarm = {
            ...baseAlarm,
            trigger: {
                value: { ...baseTriggerValue },
                parameters: { related: 'END' },
            },
        };
        expect(getSupportedAlarm(alarm, dtstartPartDay)).toEqual(undefined);
    });

    test('it should filter out attendees', () => {
        const alarm = {
            ...baseAlarm,
            action: { value: 'EMAIL' },
            description: { value: 'test' },
            summary: { value: 'test' },
            attendee: [{ value: 'mailto:wild@west.org' }],
            trigger: {
                value: { ...baseTriggerValue },
            },
        };
        expect(getSupportedAlarm(alarm, dtstartPartDay)).toEqual({ ...alarm, attendee: undefined });
    });

    test('it should filter out future notifications', () => {
        const alarm = {
            ...baseAlarm,
            trigger: {
                value: { ...baseTriggerValue, isNegative: false },
            },
        };
        expect(getSupportedAlarm(alarm, dtstartPartDay)).toEqual(undefined);
        expect(getSupportedAlarm(alarm, dtstartAllDay)).toEqual(undefined);
    });

    test('it should normalize triggers for part-day events', () => {
        const alarms = [
            {
                ...baseAlarm,
                trigger: {
                    value: { weeks: 0, days: 1, hours: 2, minutes: 1, seconds: 30, isNegative: true },
                },
            },
            {
                ...baseAlarm,
                trigger: {
                    value: { year: 2020, month: 4, day: 12, hours: 9, minutes: 30, seconds: 0, isUTC: true },
                    parameters: { type: 'date-time' },
                },
            },
        ];
        const expected = [
            {
                ...baseAlarm,
                trigger: {
                    value: { weeks: 0, days: 0, hours: 0, minutes: 1561, seconds: 0, isNegative: true },
                },
            },
            {
                ...baseAlarm,
                trigger: {
                    value: { weeks: 0, days: 0, hours: 699, minutes: 0, seconds: 0, isNegative: true },
                },
            },
        ];
        const results = alarms.map((alarm) => getSupportedAlarm(alarm, dtstartPartDay));
        expect(results).toEqual(expected);
    });

    test('it should normalize triggers for all-day events', () => {
        const alarms = [
            {
                ...baseAlarm,
                trigger: {
                    value: { weeks: 0, days: 1, hours: 2, minutes: 1, seconds: 30, isNegative: true },
                },
            },
            {
                ...baseAlarm,
                trigger: {
                    value: { year: 2020, month: 4, day: 12, hours: 9, minutes: 30, seconds: 0, isUTC: true },
                    parameters: { type: 'date-time' },
                },
            },
        ];
        const expected = [
            {
                ...baseAlarm,
                trigger: {
                    value: { weeks: 0, days: 1, hours: 2, minutes: 1, seconds: 0, isNegative: true },
                },
            },
            {
                ...baseAlarm,
                trigger: {
                    value: { weeks: 0, days: 28, hours: 14, minutes: 30, seconds: 0, isNegative: true },
                },
            },
        ];
        const results = alarms.map((alarm) => getSupportedAlarm(alarm, dtstartAllDay));
        expect(results).toEqual(expected);
    });

    test('it should filter out notifications out of bounds for part-day events', () => {
        const alarms = [
            {
                ...baseAlarm,
                trigger: {
                    value: { weeks: 1000, days: 1, hours: 2, minutes: 1, seconds: 30, isNegative: true },
                },
            },
            {
                ...baseAlarm,
                trigger: {
                    value: { year: 1851, month: 4, day: 12, hours: 9, minutes: 30, seconds: 0, isUTC: true },
                    parameters: { type: 'date-time' },
                },
            },
        ];
        const expected = alarms.map(() => undefined);
        const results = alarms.map((alarm) => getSupportedAlarm(alarm, dtstartPartDay));
        expect(results).toEqual(expected);
    });

    test('it should filter out notifications out of bounds for all-day events', () => {
        const alarms = [
            {
                ...baseAlarm,
                trigger: {
                    value: { weeks: 1000, days: 1, hours: 2, minutes: 1, seconds: 30, isNegative: true },
                },
            },
            {
                ...baseAlarm,
                trigger: {
                    value: { year: 1851, month: 4, day: 12, hours: 9, minutes: 30, seconds: 0, isUTC: true },
                    parameters: { type: 'date-time' },
                },
            },
        ];
        const expected = alarms.map(() => undefined);
        const results = alarms.map((alarm) => getSupportedAlarm(alarm, dtstartAllDay));
        expect(results).toEqual(expected);
    });
});

describe('normalizeTrigger', () => {
    const dtstartPartDay = {
        value: { year: 2020, month: 5, day: 11, hours: 12, minutes: 30, seconds: 0, isUTC: true },
    };
    const dtstartAllDay = { value: { year: 2020, month: 5, day: 11 }, parameters: { type: 'date' } };
    const utcStartPartDay = propertyToUTCDate(dtstartPartDay);

    test('should keep just one component for part-day events with relative triggers', () => {
        const triggerValues = [
            { weeks: 1, days: 6, hours: 0, minutes: 30, seconds: 0, isNegative: true },
            { weeks: 0, days: 1, hours: 2, minutes: 1, seconds: 30, isNegative: false },
            { weeks: 1, days: 3, hours: 2, minutes: 0, seconds: 0, isNegative: true },
            { weeks: 2, days: 0, hours: 0, minutes: 0, seconds: 30, isNegative: false },
            { weeks: 2, days: 0, hours: 0, minutes: 0, seconds: 0, isNegative: true },
        ];
        const expected = [
            {
                weeks: 0,
                days: 0,
                hours: 0,
                minutes: (WEEK + 6 * DAY + 30 * MINUTE) / MINUTE,
                seconds: 0,
                isNegative: true,
            },
            { weeks: 0, days: 0, hours: 0, minutes: (DAY + 2 * HOUR + MINUTE) / MINUTE, seconds: 0, isNegative: false },
            { weeks: 0, days: 0, hours: (WEEK + 3 * DAY + 2 * HOUR) / HOUR, minutes: 0, seconds: 0, isNegative: true },
            { weeks: 2, days: 0, hours: 0, minutes: 0, seconds: 0, isNegative: false },
            { weeks: 2, days: 0, hours: 0, minutes: 0, seconds: 0, isNegative: true },
        ];
        const results = triggerValues.map((trigger) => normalizeTrigger({ value: trigger }, dtstartPartDay));
        expect(results).toEqual(expected);
    });

    test('should keep just one component for part-day events with absolute triggers', () => {
        const triggerValues = [
            { year: 2020, month: 5, day: 2, hours: 9, minutes: 0, seconds: 0, isUTC: true },
            { year: 2020, month: 4, day: 12, hours: 9, minutes: 30, seconds: 0, isUTC: true },
            { year: 2020, month: 5, day: 22, hours: 12, minutes: 30, seconds: 0, isUTC: true },
            { year: 2020, month: 8, day: 1, hours: 0, minutes: 15, seconds: 0, isUTC: true },
            { year: 2000, month: 5, day: 15, hours: 12, minutes: 30, seconds: 0, isUTC: true },
        ];
        const utcDates = triggerValues.map((dateTime) => propertyToUTCDate({ value: dateTime }));
        const expected = [
            {
                weeks: 0,
                days: 0,
                hours: 0,
                minutes: differenceInMinutes(utcStartPartDay, utcDates[0]),
                seconds: 0,
                isNegative: true,
            },
            {
                weeks: 0,
                days: 0,
                hours: differenceInHours(utcStartPartDay, utcDates[1]),
                minutes: 0,
                seconds: 0,
                isNegative: true,
            },
            {
                weeks: 0,
                days: -differenceInDays(utcStartPartDay, utcDates[2]),
                hours: 0,
                minutes: 0,
                seconds: 0,
                isNegative: false,
            },
            {
                weeks: 0,
                days: 0,
                hours: 0,
                minutes: -differenceInMinutes(utcStartPartDay, utcDates[3]),
                seconds: 0,
                isNegative: false,
            },
            {
                weeks: differenceInWeeks(utcStartPartDay, utcDates[4]),
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
                isNegative: true,
            },
        ];
        const results = triggerValues.map((triggerValue) => {
            const trigger = {
                value: triggerValue,
                parameters: { type: 'date-time' },
            };
            return normalizeTrigger(trigger, dtstartPartDay);
        });
        expect(results).toEqual(expected);
    });

    test('should keep all components for all-day events (except forbidden combinations of weeks and days) for relative triggers', () => {
        const triggerValues = [
            { weeks: 1, days: 6, hours: 0, minutes: 30, seconds: 0, isNegative: true },
            { weeks: 0, days: 1, hours: 2, minutes: 1, seconds: 30, isNegative: false },
            { weeks: 1, days: 3, hours: 2, minutes: 0, seconds: 0, isNegative: true },
            { weeks: 2, days: 0, hours: 0, minutes: 0, seconds: 30, isNegative: false },
            { weeks: 2, days: 0, hours: 0, minutes: 0, seconds: 0, isNegative: true },
        ];
        const expected = [
            { weeks: 1, days: 6, hours: 0, minutes: 30, seconds: 0, isNegative: true },
            { weeks: 0, days: 1, hours: 2, minutes: 1, seconds: 0, isNegative: false },
            { weeks: 0, days: 10, hours: 2, minutes: 0, seconds: 0, isNegative: true },
            { weeks: 2, days: 0, hours: 0, minutes: 0, seconds: 0, isNegative: false },
            { weeks: 0, days: 14, hours: 0, minutes: 0, seconds: 0, isNegative: true },
        ];
        const results = triggerValues.map((trigger) => normalizeTrigger({ value: trigger }, dtstartAllDay));
        expect(results).toEqual(expected);
    });

    test('should keep all components for all-day events (except forbidden combinations of weeks and days) for absolute  triggers', () => {
        const triggerValues = [
            { year: 2020, month: 5, day: 2, hours: 9, minutes: 0, seconds: 0, isUTC: true },
            { year: 2020, month: 4, day: 12, hours: 9, minutes: 30, seconds: 0, isUTC: true },
            { year: 2020, month: 5, day: 22, hours: 12, minutes: 30, seconds: 0, isUTC: true },
            { year: 2020, month: 8, day: 1, hours: 0, minutes: 15, seconds: 0, isUTC: true },
            { year: 2000, month: 5, day: 15, hours: 12, minutes: 30, seconds: 0, isUTC: true },
        ];
        const expected = [
            { weeks: 0, days: 8, hours: 15, minutes: 0, seconds: 0, isNegative: true },
            { weeks: 0, days: 28, hours: 14, minutes: 30, seconds: 0, isNegative: true },
            { weeks: 0, days: 11, hours: 12, minutes: 30, seconds: 0, isNegative: false },
            { weeks: 0, days: 82, hours: 0, minutes: 15, seconds: 0, isNegative: false },
            { weeks: 1042, days: 6, hours: 11, minutes: 30, seconds: 0, isNegative: true },
        ];
        const results = triggerValues.map((triggerValue) => {
            const trigger = {
                value: triggerValue,
                parameters: { type: 'date-time' },
            };
            return normalizeTrigger(trigger, dtstartAllDay);
        });
        expect(results).toEqual(expected);
    });
});

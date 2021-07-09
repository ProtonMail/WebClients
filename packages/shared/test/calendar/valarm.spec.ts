import { getIsValidAlarm, getSupportedAlarm } from '../../lib/calendar/icsSurgery/valarm';
import { VcalDateProperty, VcalValarmComponent } from '../../lib/interfaces/calendar';

describe('getIsValidAlarm', () => {
    const baseTriggerValue = { weeks: 0, days: 1, hours: 0, minutes: 0, seconds: 0, isNegative: true };
    const baseAlarm = {
        component: 'valarm',
        action: { value: 'DISPLAY' },
        trigger: { value: baseTriggerValue },
    } as VcalValarmComponent;

    it('it reject alarms with unknown action', () => {
        const alarm = { ...baseAlarm, action: { value: 'WHATEVER' } };
        expect(getIsValidAlarm(alarm)).toEqual(false);
    });

    it('it should reject alarms with repeat but no duration', () => {
        const alarm = { ...baseAlarm, repeat: { value: '1' } };
        expect(getIsValidAlarm(alarm)).toEqual(false);
    });

    it('it should reject alarms with a malformed trigger', () => {
        const alarm = {
            ...baseAlarm,
            trigger: {
                value: { year: 2020, month: 5, day: 2 },
                parameters: { type: 'date-time' },
            },
        } as VcalValarmComponent;
        expect(getIsValidAlarm(alarm)).toEqual(false);
    });
});

describe('getSupportedAlarm', () => {
    const dtstartPartDay = {
        value: { year: 2020, month: 5, day: 11, hours: 12, minutes: 30, seconds: 0, isUTC: true },
    };
    const dtstartAllDay = {
        value: { year: 2020, month: 5, day: 11 },
        parameters: { type: 'date' },
    } as VcalDateProperty;
    const baseTriggerValue = { weeks: 0, days: 1, hours: 0, minutes: 0, seconds: 0, isNegative: true };
    const baseAlarm = {
        component: 'valarm',
        action: { value: 'DISPLAY' },
        trigger: { value: baseTriggerValue },
    } as VcalValarmComponent;

    it('it should filter out alarms with trigger related to end time', () => {
        const alarm = {
            ...baseAlarm,
            trigger: {
                value: { ...baseTriggerValue },
                parameters: { related: 'END' },
            },
        };
        expect(getSupportedAlarm(alarm, dtstartPartDay)).toEqual(undefined);
    });

    it('it should filter out attendees, description and summary', () => {
        const alarm = {
            ...baseAlarm,
            action: { value: 'DISPLAY' },
            description: { value: 'test' },
            summary: { value: 'test' },
            attendee: [{ value: 'mailto:wild@west.org' }],
            trigger: {
                value: { ...baseTriggerValue },
            },
        };
        const expected = {
            ...baseAlarm,
            action: { value: 'DISPLAY' },
            trigger: {
                value: { ...baseTriggerValue },
            },
        };
        expect(getSupportedAlarm(alarm, dtstartPartDay)).toEqual(expected);
    });

    it('it should filter out email notifications', () => {
        const alarm = {
            ...baseAlarm,
            action: { value: 'EMAIL' },
        };
        expect(getSupportedAlarm(alarm, dtstartPartDay)).toEqual(undefined);
        expect(getSupportedAlarm(alarm, dtstartAllDay)).toEqual(undefined);
    });

    it('it should filter out future notifications', () => {
        const alarm = {
            ...baseAlarm,
            trigger: {
                value: { ...baseTriggerValue, isNegative: false },
            },
        };
        expect(getSupportedAlarm(alarm, dtstartPartDay)).toEqual(undefined);
        expect(getSupportedAlarm(alarm, dtstartAllDay)).toEqual(undefined);
    });

    it('it should normalize triggers for part-day events', () => {
        const alarms: VcalValarmComponent[] = [
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

    it('it should normalize triggers for all-day events', () => {
        const alarms: VcalValarmComponent[] = [
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

    it('it should filter out notifications out of bounds for part-day events', () => {
        const alarms: VcalValarmComponent[] = [
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

    it('it should filter out notifications out of bounds for all-day events', () => {
        const alarms: VcalValarmComponent[] = [
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

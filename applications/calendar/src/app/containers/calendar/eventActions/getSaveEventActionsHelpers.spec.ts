import { ACCENT_COLORS_MAP } from '@proton/shared/lib/colors';
import { omit } from '@proton/shared/lib/helpers/object';
import { VcalValarmComponent, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';

import { getHasModifiedNotifications, getUpdateSingleEditMergeVevent } from './getSaveEventActionsHelpers';

describe('getUpdateSingleEditMergeVevent()', () => {
    const baseVevent: VcalVeventComponent = {
        component: 'vevent',
        uid: { value: 'vLuqif_R99XqZlDXKmotcoBkJZ4j@proton.me' },
        sequence: { value: 0 },
        components: [],
        summary: { value: 'test 10' },
        location: { value: 'THE coffee shop' },
        organizer: { value: 'mailto:unlimited@proton.me', parameters: { cn: 'unlimited' } },
        attendee: [
            { value: 'mailto:test1@proton.me', parameters: { cn: 'test1' } },
            { value: 'mailto:test2@proton.me', parameters: { cn: 'test2' } },
        ],
        dtstart: {
            value: { year: 2023, month: 5, day: 31, hours: 9, minutes: 0, seconds: 0, isUTC: false },
            parameters: { tzid: 'Europe/Oslo' },
        },
        dtend: {
            value: { year: 2023, month: 5, day: 31, hours: 9, minutes: 30, seconds: 0, isUTC: false },
            parameters: { tzid: 'Europe/Oslo' },
        },
        dtstamp: { value: { year: 2023, month: 5, day: 25, hours: 11, minutes: 46, seconds: 41, isUTC: true } },
        color: { value: ACCENT_COLORS_MAP.strawberry.color },
    };

    it('should capture a modified title', () => {
        const newVevent = {
            ...baseVevent,
            summary: { value: 'new title' },
        };
        expect(getUpdateSingleEditMergeVevent(newVevent, baseVevent)).toEqual({
            summary: { value: 'new title' },
        });
    });

    it('should capture a modified location', () => {
        const newVevent = {
            ...baseVevent,
            location: { value: 'new location' },
        };
        expect(getUpdateSingleEditMergeVevent(newVevent, baseVevent)).toEqual({
            location: { value: 'new location' },
        });
    });

    it('should capture a modified description', () => {
        const newVevent = {
            ...baseVevent,
            description: { value: 'new description' },
        };
        expect(getUpdateSingleEditMergeVevent(newVevent, baseVevent)).toEqual({
            description: { value: 'new description' },
        });
    });

    it('should capture a modified color', () => {
        const newVevent = {
            ...baseVevent,
            color: { value: ACCENT_COLORS_MAP.cobalt.color },
        };
        expect(getUpdateSingleEditMergeVevent(newVevent, baseVevent)).toEqual({
            color: { value: ACCENT_COLORS_MAP.cobalt.color },
        });
    });

    it('should capture a modified notification for events with the same all-day type', () => {
        const valarm: VcalValarmComponent = {
            action: { value: 'DISPLAY' },
            component: 'valarm',
            trigger: {
                value: {
                    weeks: 0,
                    days: 0,
                    hours: 0,
                    minutes: 5,
                    seconds: 0,
                    isNegative: false,
                },
            },
        };
        const newVevent = {
            ...baseVevent,
            components: [valarm],
        };
        expect(getUpdateSingleEditMergeVevent(newVevent, baseVevent)).toEqual({
            components: [valarm],
        });
    });

    it('should ignore modified notifications for events with different all-day type', () => {
        const valarm: VcalValarmComponent = {
            action: { value: 'DISPLAY' },
            component: 'valarm',
            trigger: {
                value: { year: 2023, month: 4, day: 12, hours: 9, minutes: 30, seconds: 0, isUTC: true },
                parameters: { type: 'date-time' },
            },
        };
        const newVevent: VcalVeventComponent = {
            ...baseVevent,
            dtstart: {
                value: { year: 2023, month: 5, day: 30 },
                parameters: { type: 'date' },
            },
            dtend: {
                value: { year: 2023, month: 5, day: 31 },
                parameters: { type: 'date' },
            },
            components: [valarm],
        };
        expect(getUpdateSingleEditMergeVevent(newVevent, baseVevent)).toEqual({
            dtstart: {
                value: { year: 2023, month: 5, day: 30 },
                parameters: { type: 'date' },
            },
            dtend: {
                value: { year: 2023, month: 5, day: 31 },
                parameters: { type: 'date' },
            },
        });
    });

    it('should capture a modified dtstart timezone', () => {
        const newVevent = {
            ...baseVevent,
            dtstart: {
                value: { year: 2023, month: 5, day: 31, hours: 9, minutes: 0, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Helsinki' },
            },
        };
        expect(getUpdateSingleEditMergeVevent(newVevent, baseVevent)).toEqual({
            dtstart: {
                value: { year: 2023, month: 5, day: 31, hours: 9, minutes: 0, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Helsinki' },
            },
        });
    });

    it('should capture a modified dtend timezone', () => {
        const newVevent = {
            ...baseVevent,
            dtend: {
                value: { year: 2023, month: 5, day: 31, hours: 9, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Helsinki' },
            },
        };
        expect(getUpdateSingleEditMergeVevent(newVevent, baseVevent)).toEqual({
            dtend: {
                value: { year: 2023, month: 5, day: 31, hours: 9, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Helsinki' },
            },
        });
    });

    it('should capture multiple modified shared fields', () => {
        const newVevent = {
            ...baseVevent,
            summary: { value: 'new title' },
            description: { value: 'new description' },
            color: { value: ACCENT_COLORS_MAP.plum.color },
        };
        expect(getUpdateSingleEditMergeVevent(newVevent, baseVevent)).toEqual({
            summary: { value: 'new title' },
            description: { value: 'new description' },
            color: { value: ACCENT_COLORS_MAP.plum.color },
        });
    });

    it('should capture removed fields', () => {
        const newVevent = omit(baseVevent, ['summary', 'location']);
        expect(getUpdateSingleEditMergeVevent(newVevent, baseVevent)).toEqual({
            summary: { value: '' },
            location: { value: '' },
        });
    });

    it('should capture added attendees', () => {
        const newVevent = {
            ...baseVevent,
            attendee: [...baseVevent.attendee!, { value: 'mailto:test3@proton.me', parameters: { cn: 'test3' } }],
        };
        expect(getUpdateSingleEditMergeVevent(newVevent, baseVevent)).toEqual({
            attendee: [
                { value: 'mailto:test1@proton.me', parameters: { cn: 'test1' } },
                { value: 'mailto:test2@proton.me', parameters: { cn: 'test2' } },
                { value: 'mailto:test3@proton.me', parameters: { cn: 'test3' } },
            ],
        });
    });

    it('should capture removed attendees', () => {
        const newVevent = {
            ...baseVevent,
            attendee: [{ value: 'mailto:test1@proton.me', parameters: { cn: 'test1' } }],
        };
        expect(getUpdateSingleEditMergeVevent(newVevent, baseVevent)).toEqual({
            attendee: [{ value: 'mailto:test1@proton.me', parameters: { cn: 'test1' } }],
        });
    });

    it('should capture removed attendees (when removing all)', () => {
        const newVevent = omit(baseVevent, ['attendee']);
        expect(getUpdateSingleEditMergeVevent(newVevent, baseVevent)).toEqual({
            attendee: [],
        });
    });
});

describe('getHasModifiedNotifications', () => {
    const valarm1 = {
        action: { value: 'EMAIL' },
        component: 'valarm',
        trigger: {
            value: {
                weeks: 0,
                days: 0,
                hours: 0,
                minutes: 10,
                seconds: 0,
                isNegative: false,
            },
        },
    };
    const valarm2 = {
        action: { value: 'DISPLAY' },
        component: 'valarm',
        trigger: {
            value: {
                weeks: 0,
                days: 0,
                hours: 0,
                minutes: 10,
                seconds: 0,
                isNegative: false,
            },
        },
    };
    const valarm3 = {
        action: { value: 'DISPLAY' },
        component: 'valarm',
        trigger: {
            value: {
                weeks: 0,
                days: 0,
                hours: 0,
                minutes: 5,
                seconds: 0,
                isNegative: false,
            },
        },
    };

    it('should return false when notifications are not modified', () => {
        const vevent1 = {
            components: [valarm1, valarm2],
        } as VcalVeventComponent;
        const vevent2 = {
            components: [valarm2, valarm1],
        } as VcalVeventComponent;

        const noAlarmVevent = {
            components: undefined,
        } as VcalVeventComponent;

        expect(getHasModifiedNotifications(vevent1, vevent2)).toBeFalsy();
        expect(getHasModifiedNotifications(noAlarmVevent, noAlarmVevent)).toBeFalsy();
    });

    it('should return true when notifications are modified', () => {
        const vevent1 = {
            components: [valarm1, valarm2],
        } as VcalVeventComponent;
        const vevent2 = {
            components: [valarm2, valarm3],
        } as VcalVeventComponent;
        const vevent3 = {
            components: [valarm1, valarm2, valarm3],
        } as VcalVeventComponent;

        const noAlarmVevent = {
            components: undefined,
        } as VcalVeventComponent;

        expect(getHasModifiedNotifications(vevent1, vevent2)).toBeTruthy();
        expect(getHasModifiedNotifications(vevent1, vevent3)).toBeTruthy();
        expect(getHasModifiedNotifications(noAlarmVevent, vevent1)).toBeTruthy();
        expect(getHasModifiedNotifications(vevent1, noAlarmVevent)).toBeTruthy();
    });
});

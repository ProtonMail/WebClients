import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';

import { CALENDAR_CARD_TYPE } from '../../lib/calendar/constants';
import { parse } from '../../lib/calendar/vcal';
import { getVeventParts, withMandatoryPublishFields, withoutRedundantDtEnd } from '../../lib/calendar/veventHelper';
import { toCRLF } from '../../lib/helpers/string';

const { ENCRYPTED_AND_SIGNED, SIGNED, CLEAR_TEXT } = CALENDAR_CARD_TYPE;

describe('getVeventParts()', () => {
    it('should split shared parts', () => {
        const y = parse(`BEGIN:VEVENT
UID:abc
DTSTART;TZID=Europe/Zurich:20200311T100000
DTEND;TZID=Europe/Zurich:20200312T100000
DESCRIPTION:bca
SUMMARY:dcf
SEQUENCE:2
LOCATION:asd
END:VEVENT
`) as VcalVeventComponent;
        const result = getVeventParts(y);

        expect(result).toEqual({
            sharedPart: {
                [SIGNED]: toCRLF(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:abc
DTSTART;TZID=Europe/Zurich:20200311T100000
DTEND;TZID=Europe/Zurich:20200312T100000
SEQUENCE:2
END:VEVENT
END:VCALENDAR`),
                [ENCRYPTED_AND_SIGNED]: toCRLF(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:abc
DESCRIPTION:bca
SUMMARY:dcf
LOCATION:asd
END:VEVENT
END:VCALENDAR`),
            },
            calendarPart: { [SIGNED]: undefined, [ENCRYPTED_AND_SIGNED]: undefined },
            personalPart: { [SIGNED]: undefined, [ENCRYPTED_AND_SIGNED]: undefined },
            attendeesPart: { [CLEAR_TEXT]: [], [SIGNED]: undefined, [ENCRYPTED_AND_SIGNED]: undefined },
            notificationsPart: [],
        });
    });

    it('should split shared, calendar, and personal parts', () => {
        const y = parse(`BEGIN:VEVENT
UID:abc
DTSTART;TZID=Europe/Zurich:20200311T100000
DTEND;TZID=Europe/Zurich:20200312T100000
STATUS:TENTATIVE
COMMENT:my comment
DESCRIPTION:bca
TRANSP:TRANSPARENT
SUMMARY:dcf
LOCATION:asd
SEQUENCE:1
BEGIN:VALARM
UID:abc
TRIGGER:-PT15H
ACTION:DISPLAY
DESCRIPTION:asd
END:VALARM
END:VEVENT
`) as VcalVeventComponent;
        const result = getVeventParts(y);
        expect(result).toEqual({
            sharedPart: {
                [SIGNED]: toCRLF(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:abc
DTSTART;TZID=Europe/Zurich:20200311T100000
DTEND;TZID=Europe/Zurich:20200312T100000
SEQUENCE:1
END:VEVENT
END:VCALENDAR`),
                [ENCRYPTED_AND_SIGNED]: toCRLF(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:abc
DESCRIPTION:bca
SUMMARY:dcf
LOCATION:asd
END:VEVENT
END:VCALENDAR`),
            },
            calendarPart: {
                [SIGNED]: toCRLF(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:abc
STATUS:TENTATIVE
TRANSP:TRANSPARENT
END:VEVENT
END:VCALENDAR`),
                [ENCRYPTED_AND_SIGNED]: toCRLF(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:abc
COMMENT:my comment
END:VEVENT
END:VCALENDAR`),
            },
            personalPart: {
                [SIGNED]: toCRLF(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:abc
BEGIN:VALARM
UID:abc
TRIGGER:-PT15H
ACTION:DISPLAY
DESCRIPTION:asd
END:VALARM
END:VEVENT
END:VCALENDAR`),
                [ENCRYPTED_AND_SIGNED]: undefined,
            },
            attendeesPart: { [CLEAR_TEXT]: [], [SIGNED]: undefined, [ENCRYPTED_AND_SIGNED]: undefined },
            notificationsPart: [{ Type: 1, Trigger: '-PT15H' }],
        });
    });
});

describe('withMandatoryPublishFields()', () => {
    it('should add description for display alarms, and description, summary and attendee for email ones', () => {
        const vevent = parse(`BEGIN:VEVENT
UID:abc
DTSTART;TZID=Europe/Zurich:20200311T100000
DTSTAMP:20200308T134254Z
STATUS:TENTATIVE
COMMENT:my comment
DESCRIPTION:bca
TRANSP:TRANSPARENT
SUMMARY:dcf
LOCATION:asd
SEQUENCE:1
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
END:VALARM
BEGIN:VALARM
TRIGGER:PT15H
ACTION:DISPLAY
END:VALARM
BEGIN:VALARM
TRIGGER:-PT1W2D
ACTION:EMAIL
END:VALARM
END:VEVENT
`) as VcalVeventComponent;
        const expected: VcalVeventComponent = {
            component: 'vevent',
            uid: { value: 'abc' },
            dtstart: {
                value: { year: 2020, month: 3, day: 11, hours: 10, minutes: 0, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Zurich' },
            },
            dtstamp: {
                value: { year: 2020, month: 3, day: 8, hours: 13, minutes: 42, seconds: 54, isUTC: true },
            },
            status: { value: 'TENTATIVE' },
            comment: [{ value: 'my comment' }],
            description: { value: 'bca' },
            transp: { value: 'TRANSPARENT' },
            summary: { value: 'dcf' },
            location: { value: 'asd' },
            sequence: { value: 1 },
            components: [
                {
                    component: 'valarm',
                    action: {
                        value: 'DISPLAY',
                    },
                    trigger: {
                        value: {
                            days: 0,
                            hours: 0,
                            isNegative: true,
                            minutes: 15,
                            seconds: 0,
                            weeks: 0,
                        },
                    },
                    description: { value: 'dcf' },
                },
                {
                    component: 'valarm',
                    action: {
                        value: 'DISPLAY',
                    },
                    trigger: {
                        value: {
                            days: 0,
                            hours: 15,
                            isNegative: false,
                            minutes: 0,
                            seconds: 0,
                            weeks: 0,
                        },
                    },
                    description: { value: 'dcf' },
                },
                {
                    component: 'valarm',
                    action: {
                        value: 'EMAIL',
                    },
                    trigger: {
                        value: {
                            days: 2,
                            hours: 0,
                            isNegative: true,
                            minutes: 0,
                            seconds: 0,
                            weeks: 1,
                        },
                    },
                    summary: { value: 'dcf' },
                    description: { value: 'dcf' },
                    attendee: [{ value: 'mailto:protonlovestesting@proton.me' }],
                },
            ],
        };

        expect(withMandatoryPublishFields(vevent, 'protonlovestesting@proton.me')).toEqual(expected);
    });

    it('should add a null summary if the event has no title', () => {
        const vevent = parse(`BEGIN:VEVENT
UID:abc
DTSTART;TZID=Europe/Zurich:20200311T100000
DTSTAMP:20200308T134254Z
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
END:VALARM
BEGIN:VALARM
TRIGGER:-PT1W2D
ACTION:EMAIL
END:VALARM
END:VEVENT
`) as VcalVeventComponent;
        const expected: VcalVeventComponent = {
            component: 'vevent',
            uid: { value: 'abc' },
            dtstart: {
                value: { year: 2020, month: 3, day: 11, hours: 10, minutes: 0, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Zurich' },
            },
            dtstamp: {
                value: { year: 2020, month: 3, day: 8, hours: 13, minutes: 42, seconds: 54, isUTC: true },
            },
            summary: { value: '' },
            components: [
                {
                    component: 'valarm',
                    action: {
                        value: 'DISPLAY',
                    },
                    trigger: {
                        value: {
                            days: 0,
                            hours: 0,
                            isNegative: true,
                            minutes: 15,
                            seconds: 0,
                            weeks: 0,
                        },
                    },
                    description: { value: '(no title)' },
                },
                {
                    component: 'valarm',
                    action: {
                        value: 'EMAIL',
                    },
                    trigger: {
                        value: {
                            days: 2,
                            hours: 0,
                            isNegative: true,
                            minutes: 0,
                            seconds: 0,
                            weeks: 1,
                        },
                    },
                    summary: { value: '(no title)' },
                    description: { value: '(no title)' },
                    attendee: [{ value: 'mailto:protonlovestesting@proton.me' }],
                },
            ],
        };

        expect(withMandatoryPublishFields(vevent, 'protonlovestesting@proton.me')).toEqual(expected);
    });
});

describe('withoutRedundantDtEnd', () => {
    describe('full day', () => {
        it('should remove redundant dtend', () => {
            const ALL_DAY_COMPONENT = parse(`BEGIN:VEVENT
UID:abc
DTSTAMP:20230614T101702Z
DTSTART;VALUE=DATE:20190812
DTEND;VALUE=DATE:20190813
SUMMARY:text
RRULE:FREQ=DAILY
END:VEVENT`) as VcalVeventComponent;

            expect(withoutRedundantDtEnd(ALL_DAY_COMPONENT)).toEqual({
                component: 'vevent',
                uid: { value: 'abc' },
                dtstart: { value: { year: 2019, month: 8, day: 12 }, parameters: { type: 'date' } },
                dtstamp: { value: { year: 2023, month: 6, day: 14, hours: 10, minutes: 17, seconds: 2, isUTC: true } },
                summary: { value: 'text' },
                rrule: { value: { freq: 'DAILY' } },
            });
        });

        it('should not remove dtend', () => {
            const ALL_DAY_COMPONENT = parse(`BEGIN:VEVENT
UID:abc
DTSTAMP:20230614T101702Z
DTSTART;VALUE=DATE:20190812
DTEND;VALUE=DATE:20190814
SUMMARY:text
RRULE:FREQ=DAILY
END:VEVENT`) as VcalVeventComponent;

            expect(withoutRedundantDtEnd(ALL_DAY_COMPONENT)).toEqual({
                component: 'vevent',
                uid: { value: 'abc' },
                dtstart: { value: { year: 2019, month: 8, day: 12 }, parameters: { type: 'date' } },
                dtstamp: { value: { year: 2023, month: 6, day: 14, hours: 10, minutes: 17, seconds: 2, isUTC: true } },
                dtend: { value: { year: 2019, month: 8, day: 14 }, parameters: { type: 'date' } },
                summary: { value: 'text' },
                rrule: { value: { freq: 'DAILY' } },
            });
        });
    });

    describe('part day', () => {
        it('should remove redundant dtend', () => {
            const PART_DAY_COMPONENT = parse(`BEGIN:VEVENT
UID:abc
DTSTAMP:20230614T101702Z
DTSTART;TZID=Europe/Zurich:20190719T120000
DTEND;TZID=Europe/Zurich:20190719T120000
SUMMARY:text
RRULE:FREQ=DAILY
END:VEVENT`) as VcalVeventComponent;

            expect(withoutRedundantDtEnd(PART_DAY_COMPONENT)).toEqual({
                component: 'vevent',
                uid: { value: 'abc' },
                dtstamp: { value: { year: 2023, month: 6, day: 14, hours: 10, minutes: 17, seconds: 2, isUTC: true } },
                dtstart: {
                    value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: false },
                    parameters: {
                        tzid: 'Europe/Zurich',
                    },
                },
                summary: { value: 'text' },
                rrule: { value: { freq: 'DAILY' } },
            });
        });

        it('should not remove dtend', () => {
            const PART_DAY_COMPONENT = parse(`BEGIN:VEVENT
UID:abc
DTSTAMP:20230614T101702Z
DTSTART;TZID=Europe/Zurich:20190719T120000
DTEND:20190719T160000Z
SUMMARY:text
RRULE:FREQ=DAILY
END:VEVENT`) as VcalVeventComponent;

            expect(withoutRedundantDtEnd(PART_DAY_COMPONENT)).toEqual({
                component: 'vevent',
                uid: { value: 'abc' },
                dtstamp: { value: { year: 2023, month: 6, day: 14, hours: 10, minutes: 17, seconds: 2, isUTC: true } },
                dtstart: {
                    value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: false },
                    parameters: { tzid: 'Europe/Zurich' },
                },
                dtend: { value: { year: 2019, month: 7, day: 19, hours: 16, minutes: 0, seconds: 0, isUTC: true } },
                summary: { value: 'text' },
                rrule: { value: { freq: 'DAILY' } },
            });
        });
    });
});

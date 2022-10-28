import { enUS } from 'date-fns/locale';

import truncate from '@proton/utils/truncate';

import { ICAL_CALSCALE, ICAL_METHOD, MAX_LENGTHS_API } from '../../lib/calendar/constants';
import { getSupportedEvent } from '../../lib/calendar/icsSurgery/vevent';
import {
    extractSupportedEvent,
    getComponentIdentifier,
    getSupportedEvents,
    parseIcs,
} from '../../lib/calendar/import/import';
import { parse } from '../../lib/calendar/vcal';
import { getIcalMethod } from '../../lib/calendar/vcalHelper';
import { omit } from '../../lib/helpers/object';
import {
    VcalDateTimeProperty,
    VcalVcalendar,
    VcalVeventComponent,
    VcalVtimezoneComponent,
} from '../../lib/interfaces/calendar/VcalModel';

describe('getComponentIdentifier', () => {
    it('should return the empty string if passed an error', () => {
        expect(getComponentIdentifier({ error: new Error('error') })).toEqual('');
    });

    it('should return the tzid for a VTIMEZONE', () => {
        const vtimezone = `BEGIN:VTIMEZONE
TZID:Europe/Vilnius
BEGIN:DAYLIGHT
TZOFFSETFROM:+0200
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
DTSTART:20030330T030000
TZNAME:EEST
TZOFFSETTO:+0300
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0300
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
DTSTART:20031026T040000
TZNAME:EET
TZOFFSETTO:+0200
END:STANDARD
END:VTIMEZONE`;
        const timezone = parse(vtimezone) as VcalVtimezoneComponent;
        expect(getComponentIdentifier(timezone)).toEqual('Europe/Vilnius');
    });

    it('should return the uid for an event with a normal uid', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;TZID=America/New_York:20690312T083000
DTEND;TZID=America/New_York:20690312T093000
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(getComponentIdentifier(event)).toEqual('test-event');
    });

    it('should return the original uid for an event with a hash uid', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:sha1-uid-b8ae0238d0011a4961a2d259e33bd383672b9229-original-uid-stmyce9lb3ef@domain.com
DTSTART;TZID=America/New_York:20690312T083000
DTEND;TZID=America/New_York:20690312T093000
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(getComponentIdentifier(event)).toEqual('stmyce9lb3ef@domain.com');
    });

    it('should return the title when the event had no original uid', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:sha1-uid-b8ae0238d0011a4961a2d259e33bd383672b9229
DTSTART;TZID=America/New_York:20690312T083000
DTEND;TZID=America/New_York:20690312T093000
SUMMARY:Test event
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(getComponentIdentifier(event)).toEqual('Test event');
    });

    it('should return the date-time when the part-day event has no uid and no title', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
DTSTART;TZID=America/New_York:20690312T083000
DTEND;TZID=America/New_York:20690312T093000
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(getComponentIdentifier(event, { locale: enUS })).toEqual('Mar 12, 2069, 8:30:00 AM');
    });

    it('should return the date when the all-day event has no uid and no title', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
DTSTART;VALUE=DATE:20690312
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(getComponentIdentifier(event, { locale: enUS })).toEqual('Mar 12, 2069');
    });
});

describe('getSupportedEvent', () => {
    it('should catch events with start time before 1970', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;TZID=America/New_York:19690312T083000
DTEND;TZID=/America/New_York:19690312T093000
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(() =>
            getSupportedEvent({ vcalVeventComponent: event, hasXWrTimezone: false, guessTzid: 'Asia/Seoul' })
        ).toThrowError('Start time out of bounds');
    });

    it('should catch events with start time after 2038', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;VALUE=DATE:20380101
DTEND;VALUE=DATE:20380102
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(() =>
            getSupportedEvent({ vcalVeventComponent: event, hasXWrTimezone: false, guessTzid: 'Asia/Seoul' })
        ).toThrowError('Start time out of bounds');
    });

    it('should catch malformed all-day events', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;VALUE=DATE:20180101
DTEND:20191231T203000Z
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(() =>
            getSupportedEvent({ vcalVeventComponent: event, hasXWrTimezone: false, guessTzid: 'Asia/Seoul' })
        ).toThrowError('Malformed all-day event');
    });

    it('should catch events with start and end time after 2038 and take time zones into account', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;TZID=America/New_York:20371231T203000
DTEND;TZID=America/New_York:20380101T003000
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(() =>
            getSupportedEvent({ vcalVeventComponent: event, hasXWrTimezone: false, guessTzid: 'Asia/Seoul' })
        ).toThrowError('Start time out of bounds');
    });

    it('should accept events with sequence', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;TZID=America/New_York:20020312T083000
DTEND;TZID=America/New_York:20020312T082959
SEQUENCE:11
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(
            getSupportedEvent({ vcalVeventComponent: event, hasXWrTimezone: false, guessTzid: 'Asia/Seoul' })
        ).toEqual({
            component: 'vevent',
            uid: { value: 'test-event' },
            dtstamp: {
                value: { year: 1998, month: 3, day: 9, hours: 23, minutes: 10, seconds: 0, isUTC: true },
            },
            dtstart: {
                value: { year: 2002, month: 3, day: 12, hours: 8, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'America/New_York' },
            },
            sequence: { value: 11 },
        });
    });

    it('should accept (and re-format) events with negative duration and negative sequence', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;TZID=/America/New_York:20020312T083000
DTEND;TZID=/America/New_York:20020312T082959
LOCATION:1CP Conference Room 4350
SEQUENCE:-1
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(
            getSupportedEvent({ vcalVeventComponent: event, hasXWrTimezone: false, guessTzid: 'Asia/Seoul' })
        ).toEqual({
            component: 'vevent',
            uid: { value: 'test-event' },
            dtstamp: {
                value: { year: 1998, month: 3, day: 9, hours: 23, minutes: 10, seconds: 0, isUTC: true },
            },
            dtstart: {
                value: { year: 2002, month: 3, day: 12, hours: 8, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'America/New_York' },
            },
            location: { value: '1CP Conference Room 4350' },
            sequence: { value: 0 },
        });
    });

    it('should drop DTEND for part-day events with zero duration', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;TZID=/mozilla.org/20050126_1/America/New_York:20020312T083000
DTEND;TZID=/mozilla.org/20050126_1/America/New_York:20020312T083000
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(
            getSupportedEvent({ vcalVeventComponent: event, hasXWrTimezone: false, guessTzid: 'Asia/Seoul' })
        ).toEqual({
            component: 'vevent',
            uid: { value: 'test-event' },
            dtstamp: {
                value: { year: 1998, month: 3, day: 9, hours: 23, minutes: 10, seconds: 0, isUTC: true },
            },
            dtstart: {
                value: { year: 2002, month: 3, day: 12, hours: 8, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'America/New_York' },
            },
            location: { value: '1CP Conference Room 4350' },
            sequence: { value: 0 },
        });
    });

    it('should drop DTEND for all-day events with zero duration', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;VALUE=DATE:20020312
DTEND;VALUE=DATE:20020312
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(
            getSupportedEvent({ vcalVeventComponent: event, hasXWrTimezone: false, guessTzid: 'Asia/Seoul' })
        ).toEqual({
            component: 'vevent',
            uid: { value: 'test-event' },
            dtstamp: {
                value: { year: 1998, month: 3, day: 9, hours: 23, minutes: 10, seconds: 0, isUTC: true },
            },
            dtstart: {
                value: { year: 2002, month: 3, day: 12 },
                parameters: { type: 'date' },
            },
            location: { value: '1CP Conference Room 4350' },
            sequence: { value: 0 },
        });
    });

    it('should modify events whose duration is specified to convert that into a dtend', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;TZID=America/New_York:20020312T083000
DURATION:PT1H0M0S
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(
            getSupportedEvent({ vcalVeventComponent: event, hasXWrTimezone: false, guessTzid: 'Asia/Seoul' })
        ).toEqual({
            component: 'vevent',
            uid: { value: 'test-event' },
            dtstamp: { value: { year: 1998, month: 3, day: 9, hours: 23, minutes: 10, seconds: 0, isUTC: true } },
            dtstart: {
                value: { year: 2002, month: 3, day: 12, hours: 8, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'America/New_York' },
            },
            location: { value: '1CP Conference Room 4350' },
            sequence: { value: 0 },
            dtend: {
                value: { year: 2002, month: 3, day: 12, hours: 9, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'America/New_York' },
            },
        });
    });

    it('should filter out notifications out of bounds', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;TZID=America/New_York:19990312T083000
DTEND;TZID=America/New_York:19990312T093000
BEGIN:VALARM
ACTION:DISPLAY
TRIGGER:-PT10000M
END:VALARM
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(
            getSupportedEvent({ vcalVeventComponent: event, hasXWrTimezone: false, guessTzid: 'Asia/Seoul' })
        ).toEqual({
            component: 'vevent',
            uid: { value: 'test-event' },
            dtstamp: {
                value: { year: 1998, month: 3, day: 9, hours: 23, minutes: 10, seconds: 0, isUTC: true },
            },
            dtstart: {
                value: { year: 1999, month: 3, day: 12, hours: 8, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'America/New_York' },
            },
            dtend: {
                value: { year: 1999, month: 3, day: 12, hours: 9, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'America/New_York' },
            },
            location: { value: '1CP Conference Room 4350' },
            sequence: { value: 0 },
        });
    });

    it('should normalize notifications', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;VALUE=DATE:19990312
DTEND;VALUE=DATE:19990313
BEGIN:VALARM
ACTION:DISPLAY
TRIGGER;VALUE=DATE-TIME:19960401T005545Z
END:VALARM
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(
            getSupportedEvent({ vcalVeventComponent: event, hasXWrTimezone: false, guessTzid: 'Asia/Seoul' })
        ).toEqual({
            component: 'vevent',
            uid: { value: 'test-event' },
            dtstamp: {
                value: { year: 1998, month: 3, day: 9, hours: 23, minutes: 10, seconds: 0, isUTC: true },
            },
            dtstart: {
                value: { year: 1999, month: 3, day: 12 },
                parameters: { type: 'date' },
            },
            location: { value: '1CP Conference Room 4350' },
            sequence: { value: 0 },
            components: [
                {
                    component: 'valarm',
                    action: { value: 'DISPLAY' },
                    trigger: {
                        value: {
                            weeks: 0,
                            days: 1074,
                            hours: 23,
                            minutes: 4,
                            seconds: 0,
                            isNegative: true,
                        },
                    },
                },
            ],
        });
    });

    it('should catch inconsistent rrules', () => {
        const veventNoOccurrenceOnDtstart = `BEGIN:VEVENT
DTSTART;TZID=Europe/Vilnius:20200503T150000
DTEND;TZID=Europe/Vilnius:20200503T160000
RRULE:FREQ=MONTHLY;BYDAY=1MO
DTSTAMP:20200508T121218Z
UID:71hdoqnevmnq80hfaeadnq8d0v@google.com
END:VEVENT`;
        const eventNoOccurrenceOnDtstart = parse(veventNoOccurrenceOnDtstart) as VcalVeventComponent;
        expect(() =>
            getSupportedEvent({
                vcalVeventComponent: eventNoOccurrenceOnDtstart,
                hasXWrTimezone: false,
                guessTzid: 'Asia/Seoul',
            })
        ).toThrowError('Malformed recurring event');

        const veventWithByyeardayNotYearly = `BEGIN:VEVENT
DTSTART;TZID=Europe/Vilnius:20200103T150000
RRULE:FREQ=MONTHLY;BYYEARDAY=3
DTSTAMP:20200508T121218Z
UID:71hdoqnevmnq80hfaeadnq8d0v@google.com
END:VEVENT`;
        const eventWithByyeardayNotYearly = parse(veventWithByyeardayNotYearly) as VcalVeventComponent;
        expect(() =>
            getSupportedEvent({
                vcalVeventComponent: eventWithByyeardayNotYearly,
                hasXWrTimezone: false,
                guessTzid: 'Asia/Seoul',
            })
        ).toThrowError('Malformed recurring event');
    });

    it('should catch malformed rrules', () => {
        const vevent = `BEGIN:VEVENT
DTSTART;TZID=Europe/Vilnius:20200503T150000
DTEND;TZID=Europe/Vilnius:20200503T160000
EXDATE;TZID=Europe/Vilnius:20200503T150000
DTSTAMP:20200508T121218Z
UID:71hdoqnevmnq80hfaeadnq8d0v@google.com
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(() =>
            getSupportedEvent({ vcalVeventComponent: event, hasXWrTimezone: false, guessTzid: 'Asia/Seoul' })
        ).toThrowError('Malformed recurring event');
    });

    it('should catch inconsistent rrules after reformatting bad untils', () => {
        const vevent = `BEGIN:VEVENT
DTSTART;TZID=Europe/Vilnius:20200503T150000
DTEND;TZID=Europe/Vilnius:20200503T160000
RRULE:FREQ=MONTHLY;BYDAY=1MO;UNTIL=20000101T000000Z
DTSTAMP:20200508T121218Z
UID:71hdoqnevmnq80hfaeadnq8d0v@google.com
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(() =>
            getSupportedEvent({ vcalVeventComponent: event, hasXWrTimezone: false, guessTzid: 'Asia/Seoul' })
        ).toThrowError('Malformed recurring event');
    });

    it('should catch recurring single edits', () => {
        const vevent = `BEGIN:VEVENT
DTSTART;TZID=Europe/Vilnius:20200503T150000
DTEND;TZID=Europe/Vilnius:20200503T160000
RRULE:DAILY
RECURRENCE-ID;TZID=Europe/Vilnius:20200505T150000
DTSTAMP:20200508T121218Z
UID:71hdoqnevmnq80hfaeadnq8d0v@google.com
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(() =>
            getSupportedEvent({ vcalVeventComponent: event, hasXWrTimezone: false, guessTzid: 'Asia/Seoul' })
        ).toThrowError('Edited event not supported');
    });

    it('should catch recurring events with no occurrences because of EXDATE', () => {
        const vevent = `BEGIN:VEVENT
DTSTART;TZID=Europe/Warsaw:20130820T145000
DTEND;TZID=Europe/Warsaw:20130820T152000
RRULE:FREQ=DAILY;UNTIL=20130822T125000Z
EXDATE;TZID=Europe/Warsaw:20130820T145000
EXDATE;TZID=Europe/Warsaw:20130821T145000
EXDATE;TZID=Europe/Warsaw:20130822T145000
DTSTAMP:20200708T215912Z
UID:qkbndaqtgkuj4nfr21adr86etk@google.com
CREATED:20130902T220905Z
DESCRIPTION:
LAST-MODIFIED:20130902T220905Z
LOCATION:Twinpigs - Żory\\, Katowicka 4
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:Scenka: napad na bank
TRANSP:OPAQUE
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(() =>
            getSupportedEvent({ vcalVeventComponent: event, hasXWrTimezone: false, guessTzid: 'Asia/Seoul' })
        ).toThrowError('Recurring event has no occurrences');
    });

    it('should catch recurring events with no occurrences because of COUNT', () => {
        const vevent = `BEGIN:VEVENT
DTSTART;TZID=Europe/Warsaw:20211020T145000
DTEND;TZID=Europe/Warsaw:20211020T152000
RRULE:FREQ=WEEKLY;COUNT=0
DTSTAMP:20200708T215912Z
UID:qkbndaqtgkuj4nfr21adr86etk@google.com
CREATED:20130902T220905Z
DESCRIPTION:
LAST-MODIFIED:20130902T220905Z
LOCATION:Twinpigs - Żory\\, Katowicka 4
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:Scenka: napad na bank
TRANSP:OPAQUE
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(() =>
            getSupportedEvent({ vcalVeventComponent: event, hasXWrTimezone: false, guessTzid: 'Asia/Seoul' })
        ).toThrowError('Recurring event has no occurrences');
    });

    it('should catch malformed recurring events with no occurrences (throw because of malformed)', () => {
        const vevent = `BEGIN:VEVENT
DTSTART;TZID=Europe/Warsaw:20211020T145000
DTEND;TZID=Europe/Warsaw:20211020T152000
RRULE:FREQ=WEEKLY;WKST=MO;BYDAY=SA;COUNT=0
DTSTAMP:20200708T215912Z
UID:qkbndaqtgkuj4nfr21adr86etk@google.com
CREATED:20130902T220905Z
DESCRIPTION:
LAST-MODIFIED:20130902T220905Z
LOCATION:Twinpigs - Żory\\, Katowicka 4
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:Scenka: napad na bank
TRANSP:OPAQUE
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(() =>
            getSupportedEvent({ vcalVeventComponent: event, hasXWrTimezone: false, guessTzid: 'Asia/Seoul' })
        ).toThrowError('Malformed recurring event');
    });

    it('should catch non-supported rrules', () => {
        const vevent = `BEGIN:VEVENT
DTSTART;TZID=Europe/Vilnius:20200518T150000
DTEND;TZID=Europe/Vilnius:20200518T160000
RRULE:FREQ=MONTHLY;BYDAY=-2MO
DTSTAMP:20200508T121218Z
UID:71hdoqnevmnq80hfaeadnq8d0v@google.com
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(() =>
            getSupportedEvent({ vcalVeventComponent: event, hasXWrTimezone: false, guessTzid: 'Asia/Seoul' })
        ).toThrowError('Recurring rule not supported');
    });

    it('should normalize exdate', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;TZID=W. Europe Standard Time:20021230T203000
RRULE:FREQ=DAILY
EXDATE;TZID=W. Europe Standard Time:20200610T170000,20200611T170000
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(
            getSupportedEvent({ vcalVeventComponent: event, hasXWrTimezone: false, guessTzid: 'Asia/Seoul' })
        ).toEqual({
            component: 'vevent',
            uid: { value: 'test-event' },
            dtstamp: {
                value: { year: 1998, month: 3, day: 9, hours: 23, minutes: 10, seconds: 0, isUTC: true },
            },
            dtstart: {
                value: { year: 2002, month: 12, day: 30, hours: 20, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Berlin' },
            },
            sequence: { value: 0 },
            exdate: [
                {
                    parameters: {
                        tzid: 'Europe/Berlin',
                    },
                    value: {
                        day: 10,
                        hours: 17,
                        isUTC: false,
                        minutes: 0,
                        month: 6,
                        seconds: 0,
                        year: 2020,
                    },
                },
                {
                    parameters: {
                        tzid: 'Europe/Berlin',
                    },
                    value: {
                        day: 11,
                        hours: 17,
                        isUTC: false,
                        minutes: 0,
                        month: 6,
                        seconds: 0,
                        year: 2020,
                    },
                },
            ],
            rrule: {
                value: {
                    freq: 'DAILY',
                },
            },
        });
    });

    it('should reformat some invalid exdates', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;VALUE=DATE:20021230
RRULE:FREQ=DAILY
EXDATE;TZID=W. Europe Standard Time:20200610T170000,20200611T170000
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(
            getSupportedEvent({ vcalVeventComponent: event, hasXWrTimezone: false, guessTzid: 'Asia/Seoul' })
        ).toEqual({
            component: 'vevent',
            uid: { value: 'test-event' },
            dtstamp: {
                value: { year: 1998, month: 3, day: 9, hours: 23, minutes: 10, seconds: 0, isUTC: true },
            },
            dtstart: {
                value: { year: 2002, month: 12, day: 30 },
                parameters: { type: 'date' },
            },
            sequence: { value: 0 },
            exdate: [
                {
                    parameters: { type: 'date' },
                    value: { day: 10, month: 6, year: 2020 },
                },
                {
                    parameters: { type: 'date' },
                    value: { day: 11, month: 6, year: 2020 },
                },
            ],
            rrule: { value: { freq: 'DAILY' } },
        });
    });

    it('should support unofficial time zones in our database and normalize recurrence-id', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;TZID=Mountain Time (U.S. & Canada):20021230T203000
DTEND;TZID=W. Europe Standard Time:20030101T003000
RECURRENCE-ID;TZID=Sarajevo, Skopje, Sofija, Vilnius, Warsaw, Zagreb:20030102T003000
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(
            getSupportedEvent({ vcalVeventComponent: event, hasXWrTimezone: false, guessTzid: 'Asia/Seoul' })
        ).toEqual({
            component: 'vevent',
            uid: { value: 'test-event' },
            dtstamp: {
                value: { year: 1998, month: 3, day: 9, hours: 23, minutes: 10, seconds: 0, isUTC: true },
            },
            dtstart: {
                value: { year: 2002, month: 12, day: 30, hours: 20, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'America/Denver' },
            },
            dtend: {
                value: { year: 2003, month: 1, day: 1, hours: 0, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Berlin' },
            },
            sequence: { value: 0 },
            'recurrence-id': {
                value: { year: 2003, month: 1, day: 2, hours: 0, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Sarajevo' },
            },
            location: { value: '1CP Conference Room 4350' },
        });
    });

    it('should localize Zulu times in the presence of a calendar time zone for non-recurring events', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART:20110613T150000Z
DTEND:20110613T160000Z
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(
            getSupportedEvent({
                vcalVeventComponent: event,
                hasXWrTimezone: true,
                calendarTzid: 'Europe/Zurich',
                guessTzid: 'Asia/Seoul',
            })
        ).toEqual({
            component: 'vevent',
            uid: { value: 'test-event' },
            dtstamp: {
                value: { year: 1998, month: 3, day: 9, hours: 23, minutes: 10, seconds: 0, isUTC: true },
            },
            dtstart: {
                value: { year: 2011, month: 6, day: 13, hours: 17, minutes: 0, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Zurich' },
            },
            dtend: {
                value: { year: 2011, month: 6, day: 13, hours: 18, minutes: 0, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Zurich' },
            },
            sequence: { value: 0 },
            location: { value: '1CP Conference Room 4350' },
        });
    });

    it('should not localize Zulu times in the presence of a calendar time zone for recurring events', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART:20110613T150000Z
DTEND:20110613T160000Z
RECURRENCE-ID:20110618T150000Z
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(
            getSupportedEvent({
                vcalVeventComponent: event,
                hasXWrTimezone: true,
                calendarTzid: 'Europe/Zurich',
                guessTzid: 'Asia/Seoul',
            })
        ).toEqual({
            component: 'vevent',
            uid: { value: 'test-event' },
            dtstamp: {
                value: { year: 1998, month: 3, day: 9, hours: 23, minutes: 10, seconds: 0, isUTC: true },
            },
            dtstart: {
                value: { year: 2011, month: 6, day: 13, hours: 15, minutes: 0, seconds: 0, isUTC: true },
            },
            dtend: {
                value: { year: 2011, month: 6, day: 13, hours: 16, minutes: 0, seconds: 0, isUTC: true },
            },
            'recurrence-id': {
                value: { year: 2011, month: 6, day: 18, hours: 15, minutes: 0, seconds: 0, isUTC: true },
            },
            location: { value: '1CP Conference Room 4350' },
            sequence: { value: 0 },
        });
    });

    it('should localize events with floating times with the guess time zone if no global time zone has been specified', () => {
        const vevent = `
BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART:20021231T203000
DTEND:20030101T003000
RECURRENCE-ID:20030102T003000
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(
            getSupportedEvent({
                vcalVeventComponent: event,
                hasXWrTimezone: false,
                guessTzid: 'Asia/Seoul',
            })
        ).toEqual({
            ...event,
            dtstart: { value: event.dtstart.value, parameters: { tzid: 'Asia/Seoul' } } as VcalDateTimeProperty,
            dtend: { value: event.dtend!.value, parameters: { tzid: 'Asia/Seoul' } } as VcalDateTimeProperty,
            'recurrence-id': {
                value: event['recurrence-id']!.value,
                parameters: { tzid: 'Asia/Seoul' },
            } as VcalDateTimeProperty,
            sequence: { value: 0 },
        });
    });

    it(`should reject events with floating times if a non-supported global time zone has been specified`, () => {
        const vevent = `
BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART:20021231T203000
DTEND:20030101T003000
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(() =>
            getSupportedEvent({ vcalVeventComponent: event, hasXWrTimezone: true, guessTzid: 'Asia/Seoul' })
        ).toThrowError('Calendar time zone not supported');
    });

    it('should support floating times if a supported global time zone has been specified', () => {
        const vevent = `
BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART:20021231T203000
DTEND:20030101T003000
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const tzid = 'Europe/Brussels';
        const event = parse(vevent) as VcalVeventComponent & Required<Pick<VcalVeventComponent, 'dtend'>>;
        expect(
            getSupportedEvent({
                vcalVeventComponent: event,
                calendarTzid: tzid,
                hasXWrTimezone: true,
                guessTzid: 'Asia/Seoul',
            })
        ).toEqual({
            ...event,
            dtstart: { value: event.dtstart.value, parameters: { tzid } } as VcalDateTimeProperty,
            dtend: { value: event.dtend.value, parameters: { tzid } } as VcalDateTimeProperty,
            sequence: { value: 0 },
        });
    });

    it('should ignore global time zone if part-day event time is not floating', () => {
        const vevent = `
BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;TZID=Europe/Vilnius:20200518T150000
DTEND;TZID=Europe/Vilnius:20200518T160000
LOCATION:1CP Conference Room 4350
SEQUENCE:0
END:VEVENT`;
        const tzid = 'Europe/Brussels';
        const event = parse(vevent) as VcalVeventComponent;
        expect(
            getSupportedEvent({
                vcalVeventComponent: event,
                calendarTzid: tzid,
                hasXWrTimezone: true,
                guessTzid: 'Asia/Seoul',
            })
        ).toEqual(event);
    });

    it('should ignore global time zone for all-day events', () => {
        const vevent = `
BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;VALUE=DATE:20200518
DTEND;VALUE=DATE:20200520
LOCATION:1CP Conference Room 4350
SEQUENCE:1
END:VEVENT`;
        const tzid = 'Europe/Brussels';
        const event = parse(vevent) as VcalVeventComponent;
        expect(
            getSupportedEvent({
                vcalVeventComponent: event,
                calendarTzid: tzid,
                hasXWrTimezone: true,
                guessTzid: 'Asia/Seoul',
            })
        ).toEqual(event);
    });

    it('should not support other time zones not in our list', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;TZID=Chamorro Standard Time:20021231T203000
DTEND;TZID=Chamorro Standard Time:20030101T003000
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(() =>
            getSupportedEvent({ vcalVeventComponent: event, hasXWrTimezone: false, guessTzid: 'Asia/Seoul' })
        ).toThrowError('Time zone not supported');
    });

    it('should crop long UIDs and truncate titles, descriptions and locations', () => {
        const loremIpsum =
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Commodo quis imperdiet massa tincidunt nunc pulvinar sapien et. Ac tincidunt vitae semper quis lectus nulla at volutpat. Egestas congue quisque egestas diam in arcu. Cras adipiscing enim eu turpis. Ullamcorper eget nulla facilisi etiam dignissim diam quis. Vulputate enim nulla aliquet porttitor lacus luctus accumsan tortor posuere. Pulvinar mattis nunc sed blandit libero volutpat sed. Enim nec dui nunc mattis enim ut tellus elementum. Vulputate dignissim suspendisse in est ante in nibh mauris. Malesuada pellentesque elit eget gravida cum. Amet aliquam id diam maecenas ultricies. Aliquam sem fringilla ut morbi tincidunt augue interdum velit. Nec sagittis aliquam malesuada bibendum arcu vitae elementum curabitur. Adipiscing elit duis tristique sollicitudin nibh sit. Pulvinar proin gravida hendrerit lectus. Sit amet justo donec enim diam. Purus sit amet luctus venenatis lectus magna. Iaculis at erat pellentesque adipiscing commodo. Morbi quis commodo odio aenean. Sed cras ornare arcu dui vivamus arcu felis bibendum. Viverra orci sagittis eu volutpat. Tempor orci eu lobortis elementum nibh tellus molestie nunc non. Turpis egestas integer eget aliquet. Venenatis lectus magna fringilla urna porttitor. Neque gravida in fermentum et sollicitudin. Tempor commodo ullamcorper a lacus vestibulum sed arcu non odio. Ac orci phasellus egestas tellus rutrum tellus pellentesque eu. Et magnis dis parturient montes nascetur ridiculus mus mauris. Massa sapien faucibus et molestie ac feugiat sed lectus. Et malesuada fames ac turpis. Tristique nulla aliquet enim tortor at auctor urna. Sit amet luctus venenatis lectus magna fringilla urna porttitor rhoncus. Enim eu turpis egestas pretium aenean pharetra magna ac. Lacus luctus accumsan tortor posuere ac ut. Volutpat ac tincidunt vitae semper quis lectus nulla. Egestas sed sed risus pretium quam vulputate dignissim suspendisse in. Mauris in aliquam sem fringilla ut morbi tincidunt augue interdum. Pharetra et ultrices neque ornare aenean euismod. Vitae aliquet nec ullamcorper sit amet risus nullam eget felis. Egestas congue quisque egestas diam in arcu cursus euismod. Tellus rutrum tellus pellentesque eu. Nunc scelerisque viverra mauris in aliquam sem fringilla ut. Morbi tristique senectus et netus et malesuada fames ac. Risus sed vulputate odio ut enim blandit volutpat. Pellentesque sit amet porttitor eget. Pharetra convallis posuere morbi leo urna molestie at. Tempor commodo ullamcorper a lacus vestibulum sed. Convallis tellus id interdum velit laoreet id donec ultrices. Nec ultrices dui sapien eget mi proin sed libero enim. Sit amet mauris commodo quis imperdiet massa. Sagittis purus sit amet volutpat consequat mauris nunc. Neque aliquam vestibulum morbi blandit cursus risus at ultrices. Id aliquet risus feugiat in ante metus dictum at tempor. Dignissim sodales ut eu sem integer vitae justo. Laoreet sit amet cursus sit. Eget aliquet nibh praesent tristique. Scelerisque varius morbi enim nunc faucibus. In arcu cursus euismod quis viverra nibh. At volutpat diam ut venenatis tellus in. Sodales neque sodales ut etiam sit amet nisl. Turpis in eu mi bibendum neque egestas congue quisque. Eu consequat ac felis donec et odio. Rutrum quisque non tellus orci ac auctor augue mauris augue. Mollis nunc sed id semper risus. Euismod in pellentesque massa placerat duis ultricies lacus sed turpis. Tellus orci ac auctor augue mauris augue neque gravida. Mi sit amet mauris commodo quis imperdiet massa. Ullamcorper velit sed ullamcorper morbi tincidunt ornare massa eget egestas. Ipsum faucibus vitae aliquet nec ullamcorper sit amet. Massa tincidunt dui ut ornare lectus sit.';
        const longUID =
            'this-is-gonna-be-a-loooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong-uid@proton.me';
        const croppedUID = longUID.substring(longUID.length - MAX_LENGTHS_API.UID, longUID.length);
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:this-is-gonna-be-a-loooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong-uid@proton.me
DTSTART;VALUE=DATE:20080101
DTEND;VALUE=DATE:20080102
SUMMARY:Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Commodo quis imperdiet massa tincidunt nunc pulvinar sapien et. Ac tincidunt vitae semper quis lectus nulla at volutpat. Egestas congue quisque egestas diam in arcu. Cras adipiscing enim eu turpis. Ullamcorper eget nulla facilisi etiam dignissim diam quis. Vulputate enim nulla aliquet porttitor lacus luctus accumsan tortor posuere. Pulvinar mattis nunc sed blandit libero volutpat sed. Enim nec dui nunc mattis enim ut tellus elementum. Vulputate dignissim suspendisse in est ante in nibh mauris. Malesuada pellentesque elit eget gravida cum. Amet aliquam id diam maecenas ultricies. Aliquam sem fringilla ut morbi tincidunt augue interdum velit. Nec sagittis aliquam malesuada bibendum arcu vitae elementum curabitur. Adipiscing elit duis tristique sollicitudin nibh sit. Pulvinar proin gravida hendrerit lectus. Sit amet justo donec enim diam.
DESCRIPTION:Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Commodo quis imperdiet massa tincidunt nunc pulvinar sapien et. Ac tincidunt vitae semper quis lectus nulla at volutpat. Egestas congue quisque egestas diam in arcu. Cras adipiscing enim eu turpis. Ullamcorper eget nulla facilisi etiam dignissim diam quis. Vulputate enim nulla aliquet porttitor lacus luctus accumsan tortor posuere. Pulvinar mattis nunc sed blandit libero volutpat sed. Enim nec dui nunc mattis enim ut tellus elementum. Vulputate dignissim suspendisse in est ante in nibh mauris. Malesuada pellentesque elit eget gravida cum. Amet aliquam id diam maecenas ultricies. Aliquam sem fringilla ut morbi tincidunt augue interdum velit. Nec sagittis aliquam malesuada bibendum arcu vitae elementum curabitur. Adipiscing elit duis tristique sollicitudin nibh sit. Pulvinar proin gravida hendrerit lectus. Sit amet justo donec enim diam. Purus sit amet luctus venenatis lectus magna. Iaculis at erat pellentesque adipiscing commodo. Morbi quis commodo odio aenean. Sed cras ornare arcu dui vivamus arcu felis bibendum. Viverra orci sagittis eu volutpat. Tempor orci eu lobortis elementum nibh tellus molestie nunc non. Turpis egestas integer eget aliquet. Venenatis lectus magna fringilla urna porttitor. Neque gravida in fermentum et sollicitudin. Tempor commodo ullamcorper a lacus vestibulum sed arcu non odio. Ac orci phasellus egestas tellus rutrum tellus pellentesque eu. Et magnis dis parturient montes nascetur ridiculus mus mauris. Massa sapien faucibus et molestie ac feugiat sed lectus. Et malesuada fames ac turpis. Tristique nulla aliquet enim tortor at auctor urna. Sit amet luctus venenatis lectus magna fringilla urna porttitor rhoncus. Enim eu turpis egestas pretium aenean pharetra magna ac. Lacus luctus accumsan tortor posuere ac ut. Volutpat ac tincidunt vitae semper quis lectus nulla. Egestas sed sed risus pretium quam vulputate dignissim suspendisse in. Mauris in aliquam sem fringilla ut morbi tincidunt augue interdum. Pharetra et ultrices neque ornare aenean euismod. Vitae aliquet nec ullamcorper sit amet risus nullam eget felis. Egestas congue quisque egestas diam in arcu cursus euismod. Tellus rutrum tellus pellentesque eu. Nunc scelerisque viverra mauris in aliquam sem fringilla ut. Morbi tristique senectus et netus et malesuada fames ac. Risus sed vulputate odio ut enim blandit volutpat. Pellentesque sit amet porttitor eget. Pharetra convallis posuere morbi leo urna molestie at. Tempor commodo ullamcorper a lacus vestibulum sed. Convallis tellus id interdum velit laoreet id donec ultrices. Nec ultrices dui sapien eget mi proin sed libero enim. Sit amet mauris commodo quis imperdiet massa. Sagittis purus sit amet volutpat consequat mauris nunc. Neque aliquam vestibulum morbi blandit cursus risus at ultrices. Id aliquet risus feugiat in ante metus dictum at tempor. Dignissim sodales ut eu sem integer vitae justo. Laoreet sit amet cursus sit. Eget aliquet nibh praesent tristique. Scelerisque varius morbi enim nunc faucibus. In arcu cursus euismod quis viverra nibh. At volutpat diam ut venenatis tellus in. Sodales neque sodales ut etiam sit amet nisl. Turpis in eu mi bibendum neque egestas congue quisque. Eu consequat ac felis donec et odio. Rutrum quisque non tellus orci ac auctor augue mauris augue. Mollis nunc sed id semper risus. Euismod in pellentesque massa placerat duis ultricies lacus sed turpis. Tellus orci ac auctor augue mauris augue neque gravida. Mi sit amet mauris commodo quis imperdiet massa. Ullamcorper velit sed ullamcorper morbi tincidunt ornare massa eget egestas. Ipsum faucibus vitae aliquet nec ullamcorper sit amet. Massa tincidunt dui ut ornare lectus sit.
LOCATION:Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Commodo quis imperdiet massa tincidunt nunc pulvinar sapien et. Ac tincidunt vitae semper quis lectus nulla at volutpat. Egestas congue quisque egestas diam in arcu. Cras adipiscing enim eu turpis. Ullamcorper eget nulla facilisi etiam dignissim diam quis. Vulputate enim nulla aliquet porttitor lacus luctus accumsan tortor posuere. Pulvinar mattis nunc sed blandit libero volutpat sed. Enim nec dui nunc mattis enim ut tellus elementum. Vulputate dignissim suspendisse in est ante in nibh mauris. Malesuada pellentesque elit eget gravida cum. Amet aliquam id diam maecenas ultricies. Aliquam sem fringilla ut morbi tincidunt augue interdum velit. Nec sagittis aliquam malesuada bibendum arcu vitae elementum curabitur. Adipiscing elit duis tristique sollicitudin nibh sit. Pulvinar proin gravida hendrerit lectus. Sit amet justo donec enim diam.
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(croppedUID.length === MAX_LENGTHS_API.UID);
        expect(
            getSupportedEvent({ vcalVeventComponent: event, hasXWrTimezone: false, guessTzid: 'Asia/Seoul' })
        ).toEqual({
            ...omit(event, ['dtend']),
            uid: { value: croppedUID },
            summary: { value: truncate(loremIpsum, MAX_LENGTHS_API.TITLE) },
            location: { value: truncate(loremIpsum, MAX_LENGTHS_API.LOCATION) },
            description: { value: truncate(loremIpsum, MAX_LENGTHS_API.EVENT_DESCRIPTION) },
            sequence: { value: 0 },
        });
    });
});

describe('extractSupportedEvent', () => {
    it('should add a uid if the event has none', async () => {
        const vevent = `
BEGIN:VEVENT
DTSTAMP:19980309T231000Z
DTSTART;TZID=Europe/Brussels:20021231T203000
DTEND;TZID=Europe/Brussels:20030101T003000
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const tzid = 'Europe/Brussels';
        const event = parse(vevent) as VcalVeventComponent & Required<Pick<VcalVeventComponent, 'dtend'>>;
        const supportedEvent = await extractSupportedEvent({
            method: ICAL_METHOD.PUBLISH,
            vcalComponent: event,
            calendarTzid: tzid,
            hasXWrTimezone: true,
            guessTzid: 'Europe/Zurich',
        });
        expect(supportedEvent).toEqual({
            component: 'vevent',
            uid: { value: 'sha1-uid-0ff30d1f26a94abe627d9f715db16714b01be84c' },
            dtstamp: {
                value: { year: 1998, month: 3, day: 9, hours: 23, minutes: 10, seconds: 0, isUTC: true },
            },
            dtstart: {
                value: { year: 2002, month: 12, day: 31, hours: 20, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Brussels' },
            },
            dtend: {
                value: { year: 2003, month: 1, day: 1, hours: 0, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Brussels' },
            },
            location: { value: '1CP Conference Room 4350' },
            sequence: { value: 0 },
        });
    });

    it('should override the uid if the event is an invitation, preserve it in the new uid, and drop recurrence-id', async () => {
        const vevent = `
BEGIN:VEVENT
UID:lalalala
DTSTAMP:19980309T231000Z
DTSTART;TZID=Europe/Brussels:20021231T203000
DTEND;TZID=Europe/Brussels:20030101T003000
RECURRENCE-ID:20110618T150000Z
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const tzid = 'Europe/Brussels';
        const event = parse(vevent) as VcalVeventComponent & Required<Pick<VcalVeventComponent, 'dtend'>>;
        const supportedEvent = await extractSupportedEvent({
            method: ICAL_METHOD.REQUEST,
            vcalComponent: event,
            calendarTzid: tzid,
            hasXWrTimezone: true,
            guessTzid: 'Europe/Zurich',
        });
        expect(supportedEvent).toEqual({
            component: 'vevent',
            uid: { value: 'sha1-uid-d39ba53e577d2eae6ba0baf8539e1fa468fbeabb-original-uid-lalalala' },
            dtstamp: {
                value: { year: 1998, month: 3, day: 9, hours: 23, minutes: 10, seconds: 0, isUTC: true },
            },
            dtstart: {
                value: { year: 2002, month: 12, day: 31, hours: 20, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Brussels' },
            },
            dtend: {
                value: { year: 2003, month: 1, day: 1, hours: 0, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Brussels' },
            },
            location: { value: '1CP Conference Room 4350' },
            sequence: { value: 0 },
        });
    });

    it('should drop the recurrence id if we overrode the uid', async () => {
        const vevent = `
BEGIN:VEVENT
DTSTAMP:19980309T231000Z
DTSTART;TZID=Europe/Brussels:20021231T203000
DTEND;TZID=Europe/Brussels:20030101T003000
RECURRENCE-ID:20110618T150000Z
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const tzid = 'Europe/Brussels';
        const event = parse(vevent) as VcalVeventComponent & Required<Pick<VcalVeventComponent, 'dtend'>>;
        const supportedEvent = await extractSupportedEvent({
            method: ICAL_METHOD.PUBLISH,
            vcalComponent: event,
            calendarTzid: tzid,
            hasXWrTimezone: true,
            guessTzid: 'Europe/Zurich',
        });
        expect(supportedEvent).toEqual({
            component: 'vevent',
            uid: { value: 'sha1-uid-ab36432982bccb6dad294500ece330c5829f93ad' },
            dtstamp: {
                value: { year: 1998, month: 3, day: 9, hours: 23, minutes: 10, seconds: 0, isUTC: true },
            },
            dtstart: {
                value: { year: 2002, month: 12, day: 31, hours: 20, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Brussels' },
            },
            dtend: {
                value: { year: 2003, month: 1, day: 1, hours: 0, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Brussels' },
            },
            location: { value: '1CP Conference Room 4350' },
            sequence: { value: 0 },
        });
    });

    it('should fix bad DTSTAMPs', async () => {
        const vevent = `BEGIN:VEVENT
DTSTART;TZID=America/New_York:20221012T171500
DTEND;TZID=America/New_York:20221012T182500
DTSTAMP;TZID=America/New_York:20221007T151646
UID:11353R6@voltigeursbourget.com
SEQUENCE:0
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent & Required<Pick<VcalVeventComponent, 'dtend'>>;
        const supportedEvent = await extractSupportedEvent({
            method: ICAL_METHOD.PUBLISH,
            vcalComponent: event,
            hasXWrTimezone: false,
            guessTzid: 'Europe/Zurich',
        });
        expect(supportedEvent).toEqual({
            component: 'vevent',
            uid: { value: '11353R6@voltigeursbourget.com' },
            dtstamp: {
                value: { year: 2022, month: 10, day: 7, hours: 19, minutes: 16, seconds: 46, isUTC: true },
            },
            dtstart: {
                value: { year: 2022, month: 10, day: 12, hours: 17, minutes: 15, seconds: 0, isUTC: false },
                parameters: { tzid: 'America/New_York' },
            },
            dtend: {
                value: { year: 2022, month: 10, day: 12, hours: 18, minutes: 25, seconds: 0, isUTC: false },
                parameters: { tzid: 'America/New_York' },
            },
            sequence: { value: 0 },
        });
    });

    it('should generate DTSTAMP if not present', async () => {
        const vevent = `BEGIN:VEVENT
DTSTART;TZID=America/New_York:20221012T171500
DTEND;TZID=America/New_York:20221012T182500
UID:11353R6@voltigeursbourget.com
SEQUENCE:0
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent & Required<Pick<VcalVeventComponent, 'dtend'>>;
        const supportedEvent = await extractSupportedEvent({
            method: ICAL_METHOD.PUBLISH,
            vcalComponent: event,
            hasXWrTimezone: false,
            guessTzid: 'Europe/Zurich',
        });
        expect(Object.keys(supportedEvent)).toContain('dtstamp');
    });

    it('should not import alarms for invitations', async () => {
        const vevent = `
BEGIN:VEVENT
UID:test-event
DTSTAMP:19980309T231000Z
DTSTART;TZID=Europe/Brussels:20021231T203000
DTEND;TZID=Europe/Brussels:20030101T003000
LOCATION:1CP Conference Room 4350
BEGIN:VALARM
TRIGGER:-PT15H
ACTION:DISPLAY
END:VALARM
BEGIN:VALARM
TRIGGER:-PT1W2D
ACTION:EMAIL
END:VALARM
END:VEVENT`;
        const tzid = 'Europe/Brussels';
        const event = parse(vevent) as VcalVeventComponent & Required<Pick<VcalVeventComponent, 'dtend'>>;
        const supportedEvent = await extractSupportedEvent({
            method: ICAL_METHOD.REQUEST,
            vcalComponent: event,
            calendarTzid: tzid,
            hasXWrTimezone: true,
            guessTzid: 'Europe/Zurich',
        });
        expect(supportedEvent).toEqual({
            component: 'vevent',
            uid: { value: 'sha1-uid-a9c06d78f4755f736bfd046b3deb3d76f99ab285-original-uid-test-event' },
            dtstamp: {
                value: { year: 1998, month: 3, day: 9, hours: 23, minutes: 10, seconds: 0, isUTC: true },
            },
            dtstart: {
                value: { year: 2002, month: 12, day: 31, hours: 20, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Brussels' },
            },
            dtend: {
                value: { year: 2003, month: 1, day: 1, hours: 0, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Brussels' },
            },
            location: { value: '1CP Conference Room 4350' },
            sequence: { value: 0 },
        });
    });
});

describe('getSupportedEvents', () => {
    describe('should guess a time zone to localize floating dates', () => {
        const generateVcalSetup = (
            primaryTimezone = 'Asia/Seoul',
            xWrTimezone = '',
            vtimezonesTzids: string[] = []
        ) => {
            const xWrTimezoneString = xWrTimezone ? `X-WR-TIMEZONE:${xWrTimezone}` : '';
            const vtimezonesString = vtimezonesTzids
                .map(
                    (tzid) => `BEGIN:VTIMEZONE
TZID:${tzid}
END:VTIMEZONE`
                )
                .join('\n');
            const vcal = `BEGIN:VCALENDAR
PRODID:Proton Calendar
VERSION:2.0
METHOD:PUBLISH
CALSCALE:GREGORIAN
${xWrTimezoneString}
${vtimezonesString}
BEGIN:VEVENT
UID:test-uid
DTSTAMP:19980309T231000Z
DTSTART:20021231T203000
DTEND:20030101T003000
SUMMARY:Floating date-time
END:VEVENT
END:VCALENDAR`;
            const {
                components = [],
                calscale: calscaleProperty,
                'x-wr-timezone': xWrTimezoneProperty,
                method: methodProperty,
            } = parse(vcal) as VcalVcalendar;
            return {
                components,
                calscale: calscaleProperty?.value,
                xWrTimezone: xWrTimezoneProperty?.value,
                method: getIcalMethod(methodProperty) || ICAL_METHOD.PUBLISH,
                primaryTimezone,
            };
        };
        const localizedVevent = (tzid: string) => ({
            component: 'vevent',
            uid: { value: 'test-uid' },
            dtstamp: {
                value: { year: 1998, month: 3, day: 9, hours: 23, minutes: 10, seconds: 0, isUTC: true },
            },
            dtstart: {
                value: { year: 2002, month: 12, day: 31, hours: 20, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid },
            },
            dtend: {
                value: { year: 2003, month: 1, day: 1, hours: 0, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid },
            },
            summary: { value: 'Floating date-time' },
            sequence: { value: 0 },
        });

        it('when there is both x-wr-timezone and single vtimezone (use x-wr-timezone)', async () => {
            const [supportedEvent] = await getSupportedEvents(
                generateVcalSetup('Asia/Seoul', 'Europe/Brussels', ['America/New_York'])
            );
            expect(supportedEvent).toEqual(localizedVevent('Europe/Brussels'));
        });

        it('when there is a single vtimezone and no x-wr-timezone', async () => {
            const [supportedEvent] = await getSupportedEvents(generateVcalSetup('Asia/Seoul', '', ['Europe/Vilnius']));
            expect(supportedEvent).toEqual(localizedVevent('Europe/Vilnius'));
        });

        it('when there is a single vtimezone and x-wr-timezone is not supported', async () => {
            await expectAsync(
                getSupportedEvents(generateVcalSetup('Asia/Seoul', 'Moon/Tranquility', ['Europe/Vilnius']))
            ).toBeResolvedTo([new Error('Calendar time zone not supported')]);
        });

        it('when there is no vtimezone nor x-wr-timezone (fall back to primary time zone)', async () => {
            const [supportedEvent] = await getSupportedEvents(generateVcalSetup('Asia/Seoul'));
            expect(supportedEvent).toEqual({
                component: 'vevent',
                uid: { value: 'test-uid' },
                dtstamp: {
                    value: {
                        year: 1998,
                        month: 3,
                        day: 9,
                        hours: 23,
                        minutes: 10,
                        seconds: 0,
                        isUTC: true,
                    },
                },
                dtstart: {
                    value: {
                        year: 2002,
                        month: 12,
                        day: 31,
                        hours: 20,
                        minutes: 30,
                        seconds: 0,
                        isUTC: false,
                    },
                    parameters: { tzid: 'Asia/Seoul' },
                },
                summary: { value: 'Floating date-time' },
                sequence: { value: 0 },
                dtend: {
                    value: {
                        year: 2003,
                        month: 1,
                        day: 1,
                        hours: 0,
                        minutes: 30,
                        seconds: 0,
                        isUTC: false,
                    },
                    parameters: { tzid: 'Asia/Seoul' },
                },
            });
        });

        it('when there is no x-wr-timezone and more than one vtimezone (fall back to primary time zone)', async () => {
            const [supportedEvent] = await getSupportedEvents(
                generateVcalSetup('Asia/Seoul', '', ['Europe/Vilnius', 'America/New_York'])
            );
            expect(supportedEvent).toEqual({
                component: 'vevent',
                uid: { value: 'test-uid' },
                dtstamp: {
                    value: {
                        year: 1998,
                        month: 3,
                        day: 9,
                        hours: 23,
                        minutes: 10,
                        seconds: 0,
                        isUTC: true,
                    },
                },
                dtstart: {
                    value: {
                        year: 2002,
                        month: 12,
                        day: 31,
                        hours: 20,
                        minutes: 30,
                        seconds: 0,
                        isUTC: false,
                    },
                    parameters: { tzid: 'Asia/Seoul' },
                },
                summary: { value: 'Floating date-time' },
                sequence: { value: 0 },
                dtend: {
                    value: {
                        year: 2003,
                        month: 1,
                        day: 1,
                        hours: 0,
                        minutes: 30,
                        seconds: 0,
                        isUTC: false,
                    },
                    parameters: { tzid: 'Asia/Seoul' },
                },
            });
        });
    });
});

describe('parseIcs', () => {
    it('should parse an ics with no method or version', async () => {
        const icsString = `BEGIN:VCALENDAR
PRODID:-//github.com/rianjs/ical.net//NONSGML ical.net 4.0//EN
BEGIN:VTIMEZONE
TZID:UTC
X-LIC-LOCATION:UTC
BEGIN:STANDARD
DTSTART:20200101T000000
RRULE:FREQ=YEARLY;BYDAY=1WE;BYMONTH=1
TZNAME:UTC
TZOFFSETFROM:+0000
TZOFFSETTO:+0000
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
ATTENDEE;CN=Ham Burger;RSVP=TRUE:mailto:hamburgerc@pm.me
CLASS:PUBLIC
DESCRIPTION:\\nHi there\\,\\nThis is a very weird description
  with tabs and \\n\t\t\tline
 jumps\\n\t\t\ta few\\n\t\t\tjumps\\n\t\t\tyaaay
DTEND:20210430T203000
DTSTAMP:20210429T171519Z
DTSTART:20210430T183000
ORGANIZER;CN=:mailto:belzebu@evil.com
SEQUENCE:0
SUMMARY:Another one bites the dust
UID:81383944-3775313411-20210429T131519@howdyhow.com
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Reminder
TRIGGER:-PT1H
END:VALARM
END:VEVENT
END:VCALENDAR`;
        const ics = new File([new Blob([icsString])], 'invite.ics');
        const expectedVtimezone = {
            component: 'vtimezone',
            components: [
                {
                    component: 'standard',
                    dtstart: {
                        value: { year: 2020, month: 1, day: 1, hours: 0, minutes: 0, seconds: 0, isUTC: false },
                    },
                    rrule: { value: { freq: 'YEARLY', byday: '1WE', bymonth: 1 } },
                    tzname: [{ value: 'UTC' }],
                    tzoffsetfrom: [{ value: '+00:00' }],
                    tzoffsetto: [{ value: '+00:00' }],
                },
            ],
            tzid: { value: 'UTC' },
            'x-lic-location': [{ value: 'UTC' }],
        } as VcalVtimezoneComponent;
        const expectedVevent = {
            component: 'vevent',
            uid: { value: '81383944-3775313411-20210429T131519@howdyhow.com' },
            class: { value: 'PUBLIC' },
            dtstamp: {
                value: { year: 2021, month: 4, day: 29, hours: 17, minutes: 15, seconds: 19, isUTC: true },
            },
            dtstart: {
                value: { year: 2021, month: 4, day: 30, hours: 18, minutes: 30, seconds: 0, isUTC: false },
            },
            dtend: {
                value: { year: 2021, month: 4, day: 30, hours: 20, minutes: 30, seconds: 0, isUTC: false },
            },
            summary: {
                value: 'Another one bites the dust',
            },
            description: {
                value: '\nHi there,\nThis is a very weird description with tabs and \n\t\t\tlinejumps\n\t\t\ta few\n\t\t\tjumps\n\t\t\tyaaay',
            },
            sequence: { value: 0 },
            organizer: {
                value: 'mailto:belzebu@evil.com',
                parameters: { cn: '' },
            },
            attendee: [
                {
                    value: 'mailto:hamburgerc@pm.me',
                    parameters: { cn: 'Ham Burger', rsvp: 'TRUE' },
                },
            ],
            components: [
                {
                    component: 'valarm',
                    action: { value: 'DISPLAY' },
                    description: { value: 'Reminder' },
                    trigger: { value: { weeks: 0, days: 0, hours: 1, minutes: 0, seconds: 0, isNegative: true } },
                },
            ],
        };
        expect(await parseIcs(ics)).toEqual({
            method: ICAL_METHOD.PUBLISH,
            calscale: ICAL_CALSCALE.GREGORIAN,
            xWrTimezone: undefined,
            components: [expectedVtimezone, expectedVevent],
        });
    });

    it('should trim calscale and method', async () => {
        const icsString = `BEGIN:VCALENDAR
PRODID:-//Company Inc//Product Application//EN
CALSCALE: GREGORIAN
VERSION:2.0
METHOD:    Publish
BEGIN:VEVENT
DTSTART:20220530T143000Z
DTEND:20220530T153000Z
DTSTAMP:20220528T075010Z
ORGANIZER;CN=:
UID:6c56b58d-488a-41bf-90a2-9b0d555c3780
CREATED:20220528T075010Z
X-ALT-DESC;FMTTYPE=text/html:
LAST-MODIFIED:20220528T075010Z
LOCATION:Sunny danny 8200 Aarhus N
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:Optical transform
TRANSP:OPAQUE
BEGIN:VALARM
TRIGGER:-PT30M
REPEAT:
DURATION:PTM
ACTION:DISPLAY
DESCRIPTION:
END:VALARM
END:VEVENT
END:VCALENDAR`;
        const ics = new File([new Blob([icsString])], 'invite.ics');
        const parsedIcs = await parseIcs(ics);
        expect(parsedIcs.calscale).toEqual(ICAL_CALSCALE.GREGORIAN);
        expect(parsedIcs.method).toEqual(ICAL_METHOD.PUBLISH);
    });

    it('should not recognize unknown calscales', async () => {
        const icsString = `BEGIN:VCALENDAR
PRODID:-//Company Inc//Product Application//EN
CALSCALE: GREGORIANO
VERSION:2.0
BEGIN:VEVENT
DTSTART:20220530T143000Z
DTEND:20220530T153000Z
DTSTAMP:20220528T075010Z
ORGANIZER;CN=:
UID:6c56b58d-488a-41bf-90a2-9b0d555c3780
CREATED:20220528T075010Z
X-ALT-DESC;FMTTYPE=text/html:
LAST-MODIFIED:20220528T075010Z
LOCATION:Sunny danny 8200 Aarhus N
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:Optical transform
TRANSP:OPAQUE
BEGIN:VALARM
TRIGGER:-PT30M
REPEAT:
DURATION:PTM
ACTION:DISPLAY
DESCRIPTION:
END:VALARM
END:VEVENT
END:VCALENDAR`;
        const ics = new File([new Blob([icsString])], 'invite.ics');
        const parsedIcs = await parseIcs(ics);
        expect(parsedIcs.calscale).toEqual(undefined);
    });

    it('should throw for unknown methods', async () => {
        const icsString = `BEGIN:VCALENDAR
PRODID:-//Company Inc//Product Application//EN
VERSION:2.0
METHOD:ATTEND
BEGIN:VEVENT
DTSTART:20220530T143000Z
DTEND:20220530T153000Z
DTSTAMP:20220528T075010Z
ORGANIZER;CN=:
UID:6c56b58d-488a-41bf-90a2-9b0d555c3780
CREATED:20220528T075010Z
X-ALT-DESC;FMTTYPE=text/html:
LAST-MODIFIED:20220528T075010Z
LOCATION:Sunny danny 8200 Aarhus N
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:Optical transform
TRANSP:OPAQUE
BEGIN:VALARM
TRIGGER:-PT30M
REPEAT:
DURATION:PTM
ACTION:DISPLAY
DESCRIPTION:
END:VALARM
END:VEVENT
END:VCALENDAR`;
        const ics = new File([new Blob([icsString])], 'invite.ics');
        await expectAsync(parseIcs(ics)).toBeRejectedWithError(
            'Your file "invite.ics" has an invalid method and cannot be imported.'
        );
    });
});

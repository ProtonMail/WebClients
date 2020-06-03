import { parse } from 'proton-shared/lib/calendar/vcal';
import { truncate } from 'proton-shared/lib/helpers/string';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { MAX_LENGTHS } from '../../src/app/constants';
import { getSupportedEvent } from '../../src/app/helpers/import';

describe('getSupportedEvent', () => {
    test('should catch events with start time before 1970', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;TZID=America/New_York:19690312T083000
DTEND;TZID=America/New_York:19690312T093000
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(() => getSupportedEvent({ vcalComponent: event, hasXWrTimezone: false })).toThrowError(
            'Start time out of bounds'
        );
    });

    test('should catch events with start time after 2038', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;VALUE=DATE:20380101
DTEND;VALUE=DATE:20380102
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(() => getSupportedEvent({ vcalComponent: event, hasXWrTimezone: false })).toThrowError(
            'Start time out of bounds'
        );
    });

    test('should catch malformed all-day events', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;VALUE=DATE:20180101
DTEND:20191231T203000Z
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(() => getSupportedEvent({ vcalComponent: event, hasXWrTimezone: false })).toThrowError(
            'Malformed all-day event'
        );
    });

    test('should catch events with start and end time after 2038 and take timezones into account', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;TZID=America/New_York:20371231T203000
DTEND;TZID=America/New_York:20380101T003000
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(() => getSupportedEvent({ vcalComponent: event, hasXWrTimezone: false })).toThrowError(
            'Start time out of bounds'
        );
    });

    test('should catch events with negative duration', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;TZID=America/New_York:20020312T083000
DTEND;TZID=America/New_York:20010312T083000
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(() => getSupportedEvent({ vcalComponent: event, hasXWrTimezone: false })).toThrowError(
            'Negative duration'
        );
    });

    test('should filter out notifications out of bounds', () => {
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
        expect(getSupportedEvent({ vcalComponent: event, hasXWrTimezone: false })).toEqual({
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
        });
    });

    test('should normalize notifications', () => {
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
        expect(getSupportedEvent({ vcalComponent: event, hasXWrTimezone: false })).toEqual({
            component: 'vevent',
            uid: { value: 'test-event' },
            dtstamp: {
                value: { year: 1998, month: 3, day: 9, hours: 23, minutes: 10, seconds: 0, isUTC: true },
            },
            dtstart: {
                value: { year: 1999, month: 3, day: 12 },
                parameters: { type: 'date' },
            },
            dtend: {
                value: { year: 1999, month: 3, day: 13 },
                parameters: { type: 'date' },
            },
            location: { value: '1CP Conference Room 4350' },
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

    test('should catch inconsistent rrules', () => {
        const vevent = `BEGIN:VEVENT
DTSTART;TZID=Europe/Vilnius:20200503T150000
DTEND;TZID=Europe/Vilnius:20200503T160000
RRULE:FREQ=MONTHLY;BYDAY=1MO
DTSTAMP:20200508T121218Z
UID:71hdoqnevmnq80hfaeadnq8d0v@google.com
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(() => getSupportedEvent({ vcalComponent: event, hasXWrTimezone: false })).toThrowError(
            'Recurring rule inconsistent'
        );
    });

    test('should catch non-supported rrules', () => {
        const vevent = `BEGIN:VEVENT
DTSTART;TZID=Europe/Vilnius:20200518T150000
DTEND;TZID=Europe/Vilnius:20200518T160000
RRULE:FREQ=MONTHLY;BYDAY=-2MO
DTSTAMP:20200508T121218Z
UID:71hdoqnevmnq80hfaeadnq8d0v@google.com
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(() => getSupportedEvent({ vcalComponent: event, hasXWrTimezone: false })).toThrowError(
            'Recurring rule not supported'
        );
    });

    test('should support unofficial timezones in our database', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;TZID=Mountain Time (U.S. & Canada):20021230T203000
DTEND;TZID=W. Europe Standard Time:20030101T003000
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(getSupportedEvent({ vcalComponent: event, hasXWrTimezone: false })).toEqual({
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
            location: { value: '1CP Conference Room 4350' },
        });
    });

    test('should localize Zulu times in the presence of a calendar timezone', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART:20110613T150000Z
DTEND:20110613T160000Z
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(
            getSupportedEvent({ vcalComponent: event, hasXWrTimezone: true, calendarTzid: 'Europe/Zurich' })
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
            location: { value: '1CP Conference Room 4350' },
        });
    });

    test('should reject events with floating times if no global timezone has been specified', () => {
        const vevent = `
BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART:20021231T203000
DTEND:20030101T003000
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(() => getSupportedEvent({ vcalComponent: event, hasXWrTimezone: false })).toThrowError(
            'Floating times not supported'
        );
    });

    test('should reject events with floating times if a non-supported global timezone has been specified', () => {
        const vevent = `
BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART:20021231T203000
DTEND:20030101T003000
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(() => getSupportedEvent({ vcalComponent: event, hasXWrTimezone: true })).toThrowError(
            'Calendar timezone not supported'
        );
    });

    test('should support floating times if a supported global timezone has been specified', () => {
        const vevent = `
BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART:20021231T203000
DTEND:20030101T003000
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const tzid = 'Europe/Brussels';
        const event = parse(vevent) as VcalVeventComponent;
        expect(getSupportedEvent({ vcalComponent: event, calendarTzid: tzid, hasXWrTimezone: true })).toEqual({
            ...event,
            dtstart: { value: event.dtstart.value, parameters: { tzid } },
            dtend: { value: event.dtend.value, parameters: { tzid } },
        });
    });

    test('should ignore global timezone if part-day event time is not floating', () => {
        const vevent = `
BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;TZID=Europe/Vilnius:20200518T150000
DTEND;TZID=Europe/Vilnius:20200518T160000
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const tzid = 'Europe/Brussels';
        const event = parse(vevent) as VcalVeventComponent;
        expect(getSupportedEvent({ vcalComponent: event, calendarTzid: tzid, hasXWrTimezone: true })).toEqual(event);
    });

    test('should ignore global timezone for all-day events', () => {
        const vevent = `
BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;VALUE=DATE:20200518
DTEND;VALUE=DATE:20200519
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const tzid = 'Europe/Brussels';
        const event = parse(vevent) as VcalVeventComponent;
        expect(getSupportedEvent({ vcalComponent: event, calendarTzid: tzid, hasXWrTimezone: true })).toEqual(event);
    });

    test('should not support other timezones not in our list', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;TZID=Chamorro Standard Time:20021231T203000
DTEND;TZID=Chamorro Standard Time:20030101T003000
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(() => getSupportedEvent({ vcalComponent: event, hasXWrTimezone: false })).toThrowError(
            'Timezone not supported'
        );
    });

    test('should crop long UIDs and truncate titles, descriptions and locations', () => {
        const loremIpsum =
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Commodo quis imperdiet massa tincidunt nunc pulvinar sapien et. Ac tincidunt vitae semper quis lectus nulla at volutpat. Egestas congue quisque egestas diam in arcu. Cras adipiscing enim eu turpis. Ullamcorper eget nulla facilisi etiam dignissim diam quis. Vulputate enim nulla aliquet porttitor lacus luctus accumsan tortor posuere. Pulvinar mattis nunc sed blandit libero volutpat sed. Enim nec dui nunc mattis enim ut tellus elementum. Vulputate dignissim suspendisse in est ante in nibh mauris. Malesuada pellentesque elit eget gravida cum. Amet aliquam id diam maecenas ultricies. Aliquam sem fringilla ut morbi tincidunt augue interdum velit. Nec sagittis aliquam malesuada bibendum arcu vitae elementum curabitur. Adipiscing elit duis tristique sollicitudin nibh sit. Pulvinar proin gravida hendrerit lectus. Sit amet justo donec enim diam. Purus sit amet luctus venenatis lectus magna. Iaculis at erat pellentesque adipiscing commodo. Morbi quis commodo odio aenean. Sed cras ornare arcu dui vivamus arcu felis bibendum. Viverra orci sagittis eu volutpat. Tempor orci eu lobortis elementum nibh tellus molestie nunc non. Turpis egestas integer eget aliquet. Venenatis lectus magna fringilla urna porttitor. Neque gravida in fermentum et sollicitudin. Tempor commodo ullamcorper a lacus vestibulum sed arcu non odio. Ac orci phasellus egestas tellus rutrum tellus pellentesque eu. Et magnis dis parturient montes nascetur ridiculus mus mauris. Massa sapien faucibus et molestie ac feugiat sed lectus. Et malesuada fames ac turpis. Tristique nulla aliquet enim tortor at auctor urna. Sit amet luctus venenatis lectus magna fringilla urna porttitor rhoncus. Enim eu turpis egestas pretium aenean pharetra magna ac. Lacus luctus accumsan tortor posuere ac ut. Volutpat ac tincidunt vitae semper quis lectus nulla. Egestas sed sed risus pretium quam vulputate dignissim suspendisse in. Mauris in aliquam sem fringilla ut morbi tincidunt augue interdum. Pharetra et ultrices neque ornare aenean euismod. Vitae aliquet nec ullamcorper sit amet risus nullam eget felis. Egestas congue quisque egestas diam in arcu cursus euismod. Tellus rutrum tellus pellentesque eu. Nunc scelerisque viverra mauris in aliquam sem fringilla ut. Morbi tristique senectus et netus et malesuada fames ac. Risus sed vulputate odio ut enim blandit volutpat. Pellentesque sit amet porttitor eget. Pharetra convallis posuere morbi leo urna molestie at. Tempor commodo ullamcorper a lacus vestibulum sed. Convallis tellus id interdum velit laoreet id donec ultrices. Nec ultrices dui sapien eget mi proin sed libero enim. Sit amet mauris commodo quis imperdiet massa. Sagittis purus sit amet volutpat consequat mauris nunc. Neque aliquam vestibulum morbi blandit cursus risus at ultrices. Id aliquet risus feugiat in ante metus dictum at tempor. Dignissim sodales ut eu sem integer vitae justo. Laoreet sit amet cursus sit. Eget aliquet nibh praesent tristique. Scelerisque varius morbi enim nunc faucibus. In arcu cursus euismod quis viverra nibh. At volutpat diam ut venenatis tellus in. Sodales neque sodales ut etiam sit amet nisl. Turpis in eu mi bibendum neque egestas congue quisque. Eu consequat ac felis donec et odio. Rutrum quisque non tellus orci ac auctor augue mauris augue. Mollis nunc sed id semper risus. Euismod in pellentesque massa placerat duis ultricies lacus sed turpis. Tellus orci ac auctor augue mauris augue neque gravida. Mi sit amet mauris commodo quis imperdiet massa. Ullamcorper velit sed ullamcorper morbi tincidunt ornare massa eget egestas. Ipsum faucibus vitae aliquet nec ullamcorper sit amet. Massa tincidunt dui ut ornare lectus sit.';
        const longUID =
            'this-is-gonna-be-a-loooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong-uid@proton.me';
        const croppedUID = longUID.substring(longUID.length - MAX_LENGTHS.UID, longUID.length);
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
        expect(croppedUID.length === MAX_LENGTHS.UID);
        expect(getSupportedEvent({ vcalComponent: event, hasXWrTimezone: false })).toEqual({
            ...event,
            uid: { value: croppedUID },
            summary: { value: truncate(loremIpsum, MAX_LENGTHS.TITLE) },
            location: { value: truncate(loremIpsum, MAX_LENGTHS.LOCATION) },
            description: { value: truncate(loremIpsum, MAX_LENGTHS.EVENT_DESCRIPTION) },
        });
    });
});

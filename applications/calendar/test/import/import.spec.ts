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
        expect(() => getSupportedEvent(event)).toThrowError('Start time out of bounds');
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
        expect(() => getSupportedEvent(event)).toThrowError('Start time out of bounds');
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
        expect(() => getSupportedEvent(event)).toThrowError('Malformed all-day event');
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
        expect(() => getSupportedEvent(event)).toThrowError('Start time out of bounds');
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
        expect(() => getSupportedEvent(event)).toThrowError('Negative duration');
    });

    test('should catch notifications out of bounds', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;TZID=America/New_York:19990312T083000
DTEND;TZID=America/New_York:19990312T093000
BEGIN:VALARM
TRIGGER:-PT10000M
END:VALARM
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(() => getSupportedEvent(event)).toThrowError('Notification out of bounds');
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
        expect(() => getSupportedEvent(event)).toThrowError('Recurring rule inconsistent');
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
        expect(() => getSupportedEvent(event)).toThrowError('Recurring rule not supported');
    });

    test('should support Outlook timezones', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;TZID=China Standard Time:20021231T203000
DTEND;TZID=W. Europe Standard Time:20030101T003000
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(getSupportedEvent(event)).toEqual({
            component: 'vevent',
            uid: { value: 'test-event' },
            dtstamp: {
                value: { year: 1998, month: 3, day: 9, hours: 23, minutes: 10, seconds: 0, isUTC: true }
            },
            dtstart: {
                value: { year: 2002, month: 12, day: 31, hours: 20, minutes: 30, seconds: 0, isUTC: false },
                parameters: { ...event.dtend.parameters, tzid: 'Asia/Hong_Kong' }
            },
            dtend: {
                value: { year: 2003, month: 1, day: 1, hours: 0, minutes: 30, seconds: 0, isUTC: false },
                parameters: { ...event.dtend.parameters, tzid: 'Europe/Berlin' }
            },
            location: { value: '1CP Conference Room 4350' }
        });
    });

    test('should not support Chamorro timezone', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;TZID=Chamorro Standard Time:20021231T203000
DTEND;TZID=Chamorro Standard Time:20030101T003000
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(() => getSupportedEvent(event)).toThrowError('Unsupported timezone');
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
        expect(getSupportedEvent(event)).toMatchObject({
            ...event,
            uid: { value: croppedUID },
            summary: { value: truncate(loremIpsum, MAX_LENGTHS.TITLE) },
            location: { value: truncate(loremIpsum, MAX_LENGTHS.LOCATION) },
            description: { value: truncate(loremIpsum, MAX_LENGTHS.EVENT_DESCRIPTION) }
        });
    });
});

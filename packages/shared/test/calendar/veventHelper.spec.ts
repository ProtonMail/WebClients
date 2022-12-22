import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';

import { CALENDAR_CARD_TYPE } from '../../lib/calendar/constants';
import { parse } from '../../lib/calendar/vcal';
import { getVeventParts } from '../../lib/calendar/veventHelper';
import { toCRLF } from '../../lib/helpers/string';

const { ENCRYPTED_AND_SIGNED, SIGNED, CLEAR_TEXT } = CALENDAR_CARD_TYPE;

describe('veventHelper', () => {
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

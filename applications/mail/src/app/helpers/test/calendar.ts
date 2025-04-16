import { getUnixTime } from 'date-fns';

import type { PrivateKeyReference, PublicKeyReference } from '@proton/crypto';
import { ATTENDEE_MORE_ATTENDEES } from '@proton/shared/lib/calendar/constants';
import { createCalendarEvent } from '@proton/shared/lib/calendar/serialize';
import { getDtendProperty, propertyToUTCDate } from '@proton/shared/lib/calendar/vcalConverter';
import { getPropertyTzid } from '@proton/shared/lib/calendar/vcalHelper';
import { getIsAllDay } from '@proton/shared/lib/calendar/veventHelper';
import { booleanToNumber } from '@proton/shared/lib/helpers/boolean';
import type {
    Attendee,
    CalendarEvent,
    CalendarEventData,
    VcalVeventComponent,
} from '@proton/shared/lib/interfaces/calendar';

const withAuthorCard = (card: Omit<CalendarEventData, 'Author'>, author: string): CalendarEventData => {
    return {
        ...card,
        Author: author,
    };
};
const toApiAttendees = (attende: Omit<Attendee, 'ID' | 'UpdateTime'>[], updateTime = getUnixTime(new Date())) => {
    return attende.map(({ Token, Status }, index) => ({
        ID: `attendee-${index + 1}`,
        UpdateTime: updateTime,
        Token,
        Status,
    }));
};

export const generateApiCalendarEvent = async ({
    eventComponent,
    author,
    publicKey,
    privateKey,
    eventID,
    sharedEventID,
    calendarID,
    isOrganizer = true,
    isProtonProtonInvite = false,
    isPersonalSingleEdit = false,
}: {
    eventComponent: VcalVeventComponent;
    author: string;
    publicKey: PublicKeyReference;
    privateKey: PrivateKeyReference;
    eventID: string;
    sharedEventID: string;
    calendarID: string;
    isOrganizer?: boolean;
    isProtonProtonInvite?: boolean;
    isPersonalSingleEdit?: boolean;
}): Promise<CalendarEvent> => {
    const {
        SharedEventContent = [],
        SharedKeyPacket,
        CalendarEventContent = [],
        CalendarKeyPacket,
        Notifications,
        AttendeesEventContent = [],
        Attendees = [],
    } = await createCalendarEvent({
        eventComponent,
        publicKey,
        privateKey,
        isCreateEvent: true,
        isSwitchCalendar: false,
        hasDefaultNotifications: true,
    });
    const nowTimestamp = getUnixTime(new Date());
    const { dtstart, uid } = eventComponent;
    const dtend = getDtendProperty(eventComponent);

    return {
        ID: eventID,
        SharedEventID: sharedEventID,
        CalendarID: calendarID,
        CreateTime: nowTimestamp,
        ModifyTime: nowTimestamp,
        Permissions: 1,
        IsOrganizer: booleanToNumber(isOrganizer),
        IsProtonProtonInvite: isProtonProtonInvite ? 1 : 0,
        IsPersonalSingleEdit: isPersonalSingleEdit,
        Author: author,
        StartTime: getUnixTime(propertyToUTCDate(dtstart)),
        StartTimezone: getPropertyTzid(dtstart) || 'UTC',
        EndTime: getUnixTime(propertyToUTCDate(dtend)),
        EndTimezone: getPropertyTzid(dtend) || 'UTC',
        FullDay: +getIsAllDay(eventComponent),
        RRule: null,
        UID: uid.value,
        RecurrenceID: null,
        Exdates: [],
        CalendarKeyPacket: CalendarKeyPacket || null,
        CalendarEvents: CalendarEventContent.map((card) => withAuthorCard(card, author)),
        SharedKeyPacket: SharedKeyPacket || null,
        SharedEvents: SharedEventContent.map((card) => withAuthorCard(card, author)),
        AddressKeyPacket: null,
        AddressID: null,
        Notifications,
        AttendeesEvents: AttendeesEventContent.map((card) => withAuthorCard(card, author)),
        AttendeesInfo: {
            Attendees: toApiAttendees(Attendees),
            MoreAttendees: ATTENDEE_MORE_ATTENDEES.NO,
        },
        Color: null,
    };
};

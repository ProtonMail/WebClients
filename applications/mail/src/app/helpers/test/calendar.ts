import { getUnixTime } from 'date-fns';

import { PrivateKeyReference, PublicKeyReference } from '@proton/crypto';
import { createCalendarEvent } from '@proton/shared/lib/calendar/serialize';
import { getDtendProperty, propertyToUTCDate } from '@proton/shared/lib/calendar/vcalConverter';
import { getIsAllDay, getPropertyTzid } from '@proton/shared/lib/calendar/vcalHelper';
import { booleanToNumber } from '@proton/shared/lib/helpers/boolean';
import {
    Attendee,
    CalendarEventData,
    CalendarEventWithMetadata,
    CalendarPersonalEventData,
    VcalVeventComponent,
} from '@proton/shared/lib/interfaces/calendar';

const withAuthorCard = (card: Omit<CalendarEventData, 'Author'>, author: string): CalendarEventData => {
    return {
        ...card,
        Author: author,
    };
};
const toApiPersonalEvent = (
    card: Omit<CalendarEventData, 'Author'>,
    author: string,
    memberID: string
): CalendarPersonalEventData => {
    return {
        ...card,
        Author: author,
        MemberID: memberID,
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
    memberID,
    publicKey,
    privateKey,
    eventID,
    sharedEventID,
    calendarID,
    isOrganizer = true,
    isProtonProtonInvite = false,
}: {
    eventComponent: VcalVeventComponent;
    author: string;
    memberID: string;
    publicKey: PublicKeyReference;
    privateKey: PrivateKeyReference;
    eventID: string;
    sharedEventID: string;
    calendarID: string;
    isOrganizer?: boolean;
    isProtonProtonInvite?: boolean;
}) => {
    const {
        SharedEventContent = [],
        SharedKeyPacket,
        CalendarEventContent = [],
        CalendarKeyPacket,
        PersonalEventContent,
        AttendeesEventContent = [],
        Attendees = [],
    } = await createCalendarEvent({
        eventComponent,
        publicKey,
        privateKey,
        isCreateEvent: true,
        isSwitchCalendar: false,
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
        IsProtonProtonInvite: +isProtonProtonInvite,
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
        CalendarKeyPacket,
        CalendarEvents: CalendarEventContent.map((card) => withAuthorCard(card, author)),
        SharedKeyPacket,
        SharedEvents: SharedEventContent.map((card) => withAuthorCard(card, author)),
        AddressKeyPacket: null,
        AddressID: null,
        PersonalEvents: PersonalEventContent ? [toApiPersonalEvent(PersonalEventContent, author, memberID)] : undefined,
        AttendeesEvents: AttendeesEventContent.map((card) => withAuthorCard(card, author)),
        Attendees: toApiAttendees(Attendees),
    } as CalendarEventWithMetadata;
};

import { CreateCalendarEventBlobData, createEvent, updateEvent } from '../../api/calendars';
import { CalendarEventSharedData } from '../../interfaces/calendar';

interface UpdateArguments {
    memberID: string;
    data: CreateCalendarEventBlobData;
    Event: CalendarEventSharedData;
}
export const getUpdateCalendarEvent = ({ Event, memberID, data }: UpdateArguments) => {
    return updateEvent(Event.CalendarID, Event.ID, {
        ...data,
        MemberID: memberID,
        Permissions: 3 // TODO what?
    });
};

interface CreateArguments {
    calendarID: string;
    memberID: string;
    data: CreateCalendarEventBlobData;
}
export const getCreateCalendarEvent = ({ calendarID, data, memberID }: CreateArguments) => {
    return createEvent(calendarID, {
        ...data,
        MemberID: memberID,
        Permissions: 3 // TODO what?
    });
};

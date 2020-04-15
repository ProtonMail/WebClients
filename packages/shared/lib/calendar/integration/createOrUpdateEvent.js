import { addSharedEvent, createEvent, updateEvent } from '../../api/calendars';

export const getSwitchCalendarEvent = ({ calendarID, data, UID, memberID }) => {
    return addSharedEvent(calendarID, {
        ...data,
        UID,
        Overwrite: 1,
        MemberID: memberID,
        Permissions: 3 // TODO what?
    });
};

export const getUpdateCalendarEvent = ({ Event, memberID, data }) => {
    return updateEvent(Event.CalendarID, Event.ID, {
        ...data,
        MemberID: memberID,
        Permissions: 3 // TODO what?
    });
};

export const getCreateCalendarEvent = ({ calendarID, data, memberID }) => {
    return createEvent(calendarID, {
        ...data,
        MemberID: memberID,
        Permissions: 3 // TODO what?
    });
};

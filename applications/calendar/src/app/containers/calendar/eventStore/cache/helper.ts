import { CalendarEvent, CalendarEventWithoutBlob } from 'proton-shared/lib/interfaces/calendar';

export const getIsCalendarEvent = (event: CalendarEvent | CalendarEventWithoutBlob): event is CalendarEvent => {
    return (event as CalendarEvent).SharedEvents !== undefined;
};

import { CalendarEvent, CalendarEventSharedData } from '@proton/shared/lib/interfaces/calendar';

export const getIsCalendarEvent = (event: CalendarEvent | CalendarEventSharedData): event is CalendarEvent => {
    return (event as CalendarEvent).SharedEvents !== undefined;
};

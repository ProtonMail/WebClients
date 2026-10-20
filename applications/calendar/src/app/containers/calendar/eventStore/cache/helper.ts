import type { CalendarEvent, CalendarEventSharedData } from '@proton/shared/lib/interfaces/calendar/Event';

export const getIsCalendarEvent = (
    event: CalendarEvent | CalendarEventSharedData | undefined
): event is CalendarEvent => {
    return (event as CalendarEvent)?.SharedEvents !== undefined;
};

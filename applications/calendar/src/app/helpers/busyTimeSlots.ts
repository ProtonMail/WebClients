import { CalendarViewBusyEvent, CalendarViewEvent } from '../containers/calendar/interface';

export const isBusyTimesSlotEvent = (
    event: CalendarViewEvent | CalendarViewBusyEvent
): event is CalendarViewBusyEvent => {
    return 'type' in event && event.type === 'busy';
};

import { CalendarViewBusyEvent, CalendarViewEvent } from '../containers/calendar/interface';

export const isBusySlotEvent = (event: CalendarViewEvent | CalendarViewBusyEvent): event is CalendarViewBusyEvent => {
    return 'type' in event && event.type === 'busy';
};

import { EVENT_ACTIONS } from '../constants';
import {
    CalendarEventManager,
    CalendarEventManagerCreate,
    CalendarEventManagerDelete,
    CalendarEventManagerUpdate,
} from '../interfaces/calendar/EventManager';

export const getIsCalendarEventManagerDelete = (event: CalendarEventManager): event is CalendarEventManagerDelete => {
    return event.Action === EVENT_ACTIONS.DELETE;
};

export const getIsCalendarEventManagerCreate = (event: CalendarEventManager): event is CalendarEventManagerCreate => {
    return event.Action === EVENT_ACTIONS.CREATE;
};

export const getIsCalendarEventManagerUpdate = (event: CalendarEventManager): event is CalendarEventManagerUpdate => {
    return event.Action === EVENT_ACTIONS.UPDATE;
};

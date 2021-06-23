import { EVENT_ACTIONS } from '../../constants';
import { Calendar, CALENDAR_SUBSCRIPTION_STATUS, CALENDAR_TYPE, SubscribedCalendar } from '../../interfaces/calendar';
import {
    CalendarSubscriptionEventManager,
    CalendarSubscriptionEventManagerCreate,
    CalendarSubscriptionEventManagerDelete,
    CalendarSubscriptionEventManagerUpdate,
} from '../../interfaces/calendar/EventManager';

export const getIsCalendarSubscriptionEventManagerDelete = (
    event: CalendarSubscriptionEventManager
): event is CalendarSubscriptionEventManagerDelete => {
    return event.Action === EVENT_ACTIONS.DELETE;
};
export const getIsCalendarSubscriptionEventManagerCreate = (
    event: CalendarSubscriptionEventManager
): event is CalendarSubscriptionEventManagerCreate => {
    return event.Action === EVENT_ACTIONS.CREATE;
};
export const getIsCalendarSubscriptionEventManagerUpdate = (
    event: CalendarSubscriptionEventManager
): event is CalendarSubscriptionEventManagerUpdate => {
    return event.Action === EVENT_ACTIONS.UPDATE;
};

export const getIsPersonalCalendar = (calendar: Calendar | SubscribedCalendar): calendar is SubscribedCalendar => {
    return calendar.Type === CALENDAR_TYPE.PERSONAL;
};

export const getIsSubscribedCalendar = (calendar: Calendar | SubscribedCalendar): calendar is SubscribedCalendar => {
    return calendar.Type === CALENDAR_TYPE.SUBSCRIPTION;
};

export const getCalendarHasSubscriptionParameters = (
    calendar: Calendar | SubscribedCalendar
): calendar is SubscribedCalendar => {
    return !!(calendar as SubscribedCalendar).SubscriptionParameters;
};

export const getCalendarIsSynced = (calendar: SubscribedCalendar) => {
    return calendar.SubscriptionParameters.Status !== CALENDAR_SUBSCRIPTION_STATUS.OK;
};

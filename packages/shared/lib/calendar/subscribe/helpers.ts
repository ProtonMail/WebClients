import { c } from 'ttag';
import { EVENT_ACTIONS, HOUR } from '../../constants';
import { Calendar, CALENDAR_SUBSCRIPTION_STATUS, CALENDAR_TYPE, SubscribedCalendar } from '../../interfaces/calendar';
import {
    CalendarSubscriptionEventManager,
    CalendarSubscriptionEventManagerCreate,
    CalendarSubscriptionEventManagerDelete,
    CalendarSubscriptionEventManagerUpdate,
} from '../../interfaces/calendar/EventManager';

const {
    OK,
    INVALID_ICS,
    ICS_SIZE_EXCEED_LIMIT,
    SYNCHRONIZING,
    HTTP_REQUEST_FAILED_BAD_REQUEST,
    HTTP_REQUEST_FAILED_UNAUTHORIZED,
    HTTP_REQUEST_FAILED_FORBIDDEN,
    HTTP_REQUEST_FAILED_NOT_FOUND,
    HTTP_REQUEST_FAILED_GENERIC,
    HTTP_REQUEST_FAILED_INTERNAL_SERVER_ERROR,
    HTTP_REQUEST_FAILED_TIMEOUT,
    INTERNAL_CALENDAR_URL_NOT_FOUND,
    INTERNAL_CALENDAR_UNDECRYPTABLE,
} = CALENDAR_SUBSCRIPTION_STATUS;

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

export const getIsPersonalCalendar = (calendar: Calendar | SubscribedCalendar): calendar is Calendar => {
    return calendar.Type === CALENDAR_TYPE.PERSONAL;
};

export const getPersonalCalendars = (calendars: Calendar[]): Calendar[] => {
    return calendars.filter(getIsPersonalCalendar);
};

export const getIsSubscribedCalendar = (calendar: Calendar | SubscribedCalendar): calendar is SubscribedCalendar => {
    return calendar.Type === CALENDAR_TYPE.SUBSCRIPTION;
};

export const getCalendarHasSubscriptionParameters = (
    calendar: Calendar | SubscribedCalendar
): calendar is SubscribedCalendar => {
    return !!(calendar as SubscribedCalendar).SubscriptionParameters;
};

export const getSyncingInfo = (text: string) => ({
    label: c('Calendar status').t`Syncing`,
    text,
});

export const getNotSyncedInfo = (text: string) => ({
    label: c('Calendar status').t`Not synced`,
    text,
});

export const getCalendarIsNotSyncedInfo = (calendar: SubscribedCalendar) => {
    const { Status, LastUpdateTime } = calendar.SubscriptionParameters;

    if (LastUpdateTime === 0) {
        return getSyncingInfo(c('Calendar subscription not synced error').t`Calendar is syncing`);
    }

    if (Date.now() - LastUpdateTime * 1000 > 12 * HOUR) {
        return getNotSyncedInfo(
            c('Calendar subscription not synced error').t`More than 12 hours passed since last update`
        );
    }

    if (Status === OK) {
        return;
    }

    if (Status === INVALID_ICS) {
        return getNotSyncedInfo(c('Calendar subscription not synced error').t`Unsupported calendar format`);
    }

    if (Status === ICS_SIZE_EXCEED_LIMIT) {
        return getNotSyncedInfo(c('Calendar subscription not synced error').t`Calendar is too big`);
    }

    if (Status === SYNCHRONIZING) {
        return getSyncingInfo(c('Calendar subscription not synced error').t`Calendar is syncing`);
    }

    if (
        [
            HTTP_REQUEST_FAILED_BAD_REQUEST,
            HTTP_REQUEST_FAILED_UNAUTHORIZED,
            HTTP_REQUEST_FAILED_FORBIDDEN,
            HTTP_REQUEST_FAILED_NOT_FOUND,
            INTERNAL_CALENDAR_URL_NOT_FOUND,
        ].includes(Status)
    ) {
        return getNotSyncedInfo(c('Calendar subscription not synced error').t`Calendar link is not accessible`);
    }

    if (
        [HTTP_REQUEST_FAILED_GENERIC, HTTP_REQUEST_FAILED_INTERNAL_SERVER_ERROR, HTTP_REQUEST_FAILED_TIMEOUT].includes(
            Status
        )
    ) {
        return getNotSyncedInfo(
            c('Calendar subscription not synced error').t`Calendar link is temporarily inaccessible`
        );
    }

    if (Status === INTERNAL_CALENDAR_UNDECRYPTABLE) {
        return getNotSyncedInfo(c('Calendar subscription not synced error').t`Calendar could not be decrypted`);
    }

    return getNotSyncedInfo(c('Calendar subscription not synced error').t`Failed to sync calendar`);
};

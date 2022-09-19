import { c } from 'ttag';

import { EVENT_ACTIONS, HOUR } from '../../constants';
import {
    CALENDAR_SUBSCRIPTION_STATUS,
    CALENDAR_TYPE,
    Calendar,
    SubscribedCalendar,
    VisualCalendar,
} from '../../interfaces/calendar';
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

export const getIsSubscribedCalendar = (
    calendar: Calendar | VisualCalendar | SubscribedCalendar
): calendar is SubscribedCalendar => {
    return calendar.Type === CALENDAR_TYPE.SUBSCRIPTION;
};

export const getCalendarHasSubscriptionParameters = (
    calendar: Calendar | SubscribedCalendar
): calendar is SubscribedCalendar => {
    return !!(calendar as SubscribedCalendar).SubscriptionParameters;
};

export const getSyncingInfo = (text: string, longText = '') => ({
    label: c('Calendar status').t`Syncing`,
    text,
    longText: longText ? longText : `${text}.`,
    isSyncing: true,
});

export const getNotSyncedInfo = (text: string, longText = '') => ({
    label: c('Calendar status').t`Not synced`,
    text,
    longText: longText ? longText : `${text}.`,
    isSyncing: false,
});

export const getCalendarStatusInfo = (status: CALENDAR_SUBSCRIPTION_STATUS) => {
    if (status === OK) {
        return;
    }

    if (status === INVALID_ICS) {
        return getNotSyncedInfo(c('Calendar subscription not synced error').t`Unsupported calendar format`);
    }

    if (status === ICS_SIZE_EXCEED_LIMIT) {
        return getNotSyncedInfo(c('Calendar subscription not synced error').t`Calendar is too big`);
    }

    if (status === SYNCHRONIZING) {
        return getSyncingInfo(
            c('Calendar subscription not synced error').t`Calendar is syncing`,
            c('Calendar subscription not synced error')
                .t`Calendar is syncing: it may take several minutes for all of its events to show up.`
        );
    }

    if (
        [
            HTTP_REQUEST_FAILED_BAD_REQUEST,
            HTTP_REQUEST_FAILED_UNAUTHORIZED,
            HTTP_REQUEST_FAILED_FORBIDDEN,
            HTTP_REQUEST_FAILED_NOT_FOUND,
            INTERNAL_CALENDAR_URL_NOT_FOUND,
        ].includes(status)
    ) {
        return getNotSyncedInfo(
            c('Calendar subscription not synced error').t`Calendar link is not accessible`,
            c('Calendar subscription not synced error; long version')
                .t`Calendar link is not accessible from outside the calendar provider's ecosystem.`
        );
    }

    if (
        [HTTP_REQUEST_FAILED_GENERIC, HTTP_REQUEST_FAILED_INTERNAL_SERVER_ERROR, HTTP_REQUEST_FAILED_TIMEOUT].includes(
            status
        )
    ) {
        return getNotSyncedInfo(
            c('Calendar subscription not synced error').t`Calendar link is temporarily inaccessible`,
            c('Calendar subscription not synced error; long version')
                .t`Calendar link is temporarily inaccessible. Please verify that the link from the calendar provider is still valid.`
        );
    }

    if (status === INTERNAL_CALENDAR_UNDECRYPTABLE) {
        return getNotSyncedInfo(c('Calendar subscription not synced error').t`Calendar could not be decrypted`);
    }

    return getNotSyncedInfo(c('Calendar subscription not synced error').t`Failed to sync calendar`);
};

export const getCalendarIsNotSyncedInfo = (calendar: SubscribedCalendar) => {
    const { Status, LastUpdateTime } = calendar.SubscriptionParameters;

    if (LastUpdateTime === 0) {
        return getSyncingInfo(
            c('Calendar subscription not synced error').t`Calendar is syncing`,
            c('Calendar subscription not synced error')
                .t`Calendar is syncing: it may take several minutes for all of its events to show up.`
        );
    }

    if (Date.now() - LastUpdateTime * 1000 > 12 * HOUR) {
        return getNotSyncedInfo(
            c('Calendar subscription not synced error').t`More than 12 hours passed since last update`,
            c('Calendar subscription not synced error; long version')
                .t`More than 12 hours passed since last update — Proton Calendar will try to update the calendar in a few hours.`
        );
    }

    return getCalendarStatusInfo(Status);
};

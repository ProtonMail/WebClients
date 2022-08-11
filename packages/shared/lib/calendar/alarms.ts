import truncate from '@proton/utils/truncate';
import uniqueBy from '@proton/utils/uniqueBy';

import { MINUTE } from '../constants';
import { convertUTCDateTimeToZone, fromUTCDate, getTimezoneOffset, toUTCDate } from '../date/timezone';
import { omit } from '../helpers/object';
import {
    NotificationModel,
    VcalDurationValue,
    VcalValarmRelativeComponent,
    VcalVeventComponent,
} from '../interfaces/calendar';
import { NOTIFICATION_UNITS, NOTIFICATION_WHEN, SETTINGS_NOTIFICATION_TYPE } from './constants';
import getAlarmMessageText from './getAlarmMessageText';
import { getValarmTrigger } from './getValarmTrigger';
import { getDisplayTitle } from './helper';
import { normalizeDurationToUnit } from './trigger';
import { getMillisecondsFromTriggerString } from './vcal';
import { propertyToUTCDate } from './vcalConverter';
import { getIsAllDay } from './vcalHelper';

/**
 * Given a raw event, (optionally) its starting date, the date now and a timezone id,
 * generate a notification message for the event
 */
interface Arguments {
    component: VcalVeventComponent;
    start?: Date;
    now: Date;
    tzid: string;
    formatOptions: any;
}
export const getAlarmMessage = ({ component, start, now, tzid, formatOptions }: Arguments) => {
    const { dtstart, summary } = component;
    const title = truncate(getDisplayTitle(summary?.value), 100);
    const utcStartDate = start || propertyToUTCDate(dtstart);

    // To determine if the event is happening in timezoned today, tomorrow, this month or this year,
    // we pass fake UTC dates to the getAlarmMessage helper
    const startFakeUTCDate = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(utcStartDate), tzid));
    const nowFakeUTCDate = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(now), tzid));
    const isAllDay = getIsAllDay(component);

    return getAlarmMessageText({
        title,
        isAllDay,
        startFakeUTCDate,
        nowFakeUTCDate,
        formatOptions,
    });
};

/**
 * Given the UNIX timestamp for the occurrence of an alarm, and the trigger string of this alarm,
 * return the timestamp in milliseconds the occurrence of the corresponding event.
 * The computation must take into account possible DST shifts
 */
interface Params {
    Occurrence: number;
    Trigger: string;
    tzid: string;
}
export const getNextEventTime = ({ Occurrence, Trigger, tzid }: Params) => {
    const alarmTime = Occurrence * 1000;
    const eventTime = alarmTime - getMillisecondsFromTriggerString(Trigger);
    const offsetAlarmTime = getTimezoneOffset(new Date(alarmTime), tzid).offset;
    const offsetEventTime = getTimezoneOffset(new Date(eventTime), tzid).offset;
    const offsetDifference = offsetAlarmTime - offsetEventTime;
    // correct eventTime in case we jumped across an odd number of DST changes
    return eventTime - offsetDifference * MINUTE;
};

/**
 * Filter out future notifications
 */
export const filterFutureNotifications = (notifications: NotificationModel[]) => {
    return notifications.filter(({ when, value }) => {
        if (when === NOTIFICATION_WHEN.BEFORE) {
            return true;
        }
        return value === 0;
    });
};

export const sortNotificationsByAscendingTrigger = (notifications: NotificationModel[]) =>
    [...notifications].sort((a: NotificationModel, b: NotificationModel) => {
        const triggerA = getValarmTrigger(a);
        const triggerB = getValarmTrigger(b);
        const triggerAMinutes =
            normalizeDurationToUnit(triggerA, NOTIFICATION_UNITS.MINUTE) * (triggerA.isNegative ? -1 : 1);
        const triggerBMinutes =
            normalizeDurationToUnit(triggerB, NOTIFICATION_UNITS.MINUTE) * (triggerB.isNegative ? -1 : 1);

        return triggerAMinutes - triggerBMinutes;
    });

const sortNotificationsByAscendingValue = (a: NotificationModel, b: NotificationModel) =>
    (a.value || 0) - (b.value || 0);

const uniqueNotificationComparator = (notification: NotificationModel) => {
    const trigger = getValarmTrigger(notification);

    return `${notification.type}-${
        normalizeDurationToUnit(trigger, NOTIFICATION_UNITS.MINUTE) * (trigger.isNegative ? -1 : 1)
    }`;
};

export const dedupeNotifications = (notifications: NotificationModel[]) => {
    const sortedNotifications = [...notifications].sort(sortNotificationsByAscendingValue);

    return uniqueBy(sortedNotifications, uniqueNotificationComparator);
};

const getSmallestNonZeroNumericValueFromDurationValue = (object: VcalDurationValue) =>
    Math.min(...Object.values(omit(object, ['isNegative'])).filter(Boolean));

const sortAlarmsByAscendingTriggerValue = (a: VcalValarmRelativeComponent, b: VcalValarmRelativeComponent) => {
    const aMin = getSmallestNonZeroNumericValueFromDurationValue(a.trigger.value);
    const bMin = getSmallestNonZeroNumericValueFromDurationValue(b.trigger.value);

    return aMin - bMin;
};

const uniqueAlarmComparator = (alarm: VcalValarmRelativeComponent) => {
    const triggerValue = alarm.trigger.value;
    const isTriggerNegative = 'isNegative' in triggerValue && triggerValue.isNegative;

    return `${alarm.action.value}-${
        normalizeDurationToUnit(triggerValue, NOTIFICATION_UNITS.MINUTE) * (isTriggerNegative ? -1 : 1)
    }`;
};

/*
 * ATTENTION
 * This function will deduplicate alarms with any type of relative trigger,
 * but if you expect it to pick the nicest triggers (i.e. 2 days instead of 1 day and 24 hours)
 * you must pass normalized triggers
 */
export const dedupeAlarmsWithNormalizedTriggers = (alarms: VcalValarmRelativeComponent[]) => {
    const sortedAlarms = [...alarms].sort(sortAlarmsByAscendingTriggerValue);

    return uniqueBy(sortedAlarms, uniqueAlarmComparator);
};

export const isEmailNotification = ({ type }: NotificationModel) => type === SETTINGS_NOTIFICATION_TYPE.EMAIL;

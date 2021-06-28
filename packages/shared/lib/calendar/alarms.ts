import { differenceInMinutes } from 'date-fns';
import { convertUTCDateTimeToZone, fromUTCDate, getTimezoneOffset, toUTCDate } from '../date/timezone';
import { uniqueBy } from '../helpers/array';
import { omit } from '../helpers/object';
import { truncate } from '../helpers/string';
import {
    NotificationModel,
    VcalDateOrDateTimeProperty,
    VcalDateTimeProperty,
    VcalDurationValue,
    VcalTriggerProperty,
    VcalValarmRelativeComponent,
    VcalVeventComponent,
} from '../interfaces/calendar';
import { NOTIFICATION_UNITS, NOTIFICATION_WHEN, SETTINGS_NOTIFICATION_TYPE } from './constants';
import getAlarmMessageText from './getAlarmMessageText';
import { getValarmTrigger } from './getValarmTrigger';
import { getDisplayTitle } from './helper';
import { getMillisecondsFromTriggerString } from './vcal';
import { propertyToUTCDate } from './vcalConverter';
import { getIsAllDay, getIsPropertyAllDay } from './vcalHelper';

const MINUTE = 60;
const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

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
    return eventTime - offsetDifference * MINUTE * 1000;
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

export const isAbsoluteTrigger = (trigger: VcalTriggerProperty): trigger is VcalDateTimeProperty => {
    return (trigger as VcalDateTimeProperty).parameters?.type === 'date-time';
};
const absoluteToRelative = (trigger: VcalDateTimeProperty, dtstart: VcalDateOrDateTimeProperty) => {
    const utcStartDate = propertyToUTCDate(dtstart);
    const triggerDate = propertyToUTCDate(trigger);
    const durationInMinutes = differenceInMinutes(utcStartDate, triggerDate);
    const duration = Math.abs(durationInMinutes * MINUTE);
    const weeks = Math.floor(duration / WEEK);
    const days = Math.floor((duration % WEEK) / DAY);
    const hours = Math.floor((duration % DAY) / HOUR);
    const minutes = Math.floor((duration % HOUR) / MINUTE);
    return { weeks, days, hours, minutes, seconds: 0, isNegative: durationInMinutes >= 0 };
};

/**
 * If you import this function, notice unit has to be in seconds, not milliseconds
 */
export const normalizeDurationToUnit = (duration: Partial<VcalDurationValue>, unit: number) => {
    const normalizedUnits = [
        Math.floor(((duration.weeks || 0) * WEEK) / unit),
        Math.floor(((duration.days || 0) * DAY) / unit),
        Math.floor(((duration.hours || 0) * HOUR) / unit),
        Math.floor(((duration.minutes || 0) * MINUTE) / unit),
        Math.floor((duration.seconds || 0) / unit),
    ];
    return normalizedUnits.reduce((acc, curr) => acc + curr, 0);
};

export const normalizeTrigger = (trigger: VcalTriggerProperty, dtstart: VcalDateOrDateTimeProperty) => {
    const duration = isAbsoluteTrigger(trigger) ? absoluteToRelative(trigger, dtstart) : trigger.value;
    const { weeks, days } = duration;
    if (getIsPropertyAllDay(dtstart)) {
        // the API admits all trigger components for all-day events,
        // but we do not support arbitrary combinations non-zero values for weeks and days
        const mustNormalize = duration.isNegative ? weeks > 0 && days !== 6 : weeks > 0 && days !== 0;
        return mustNormalize
            ? { ...duration, weeks: 0, days: days + 7 * weeks, seconds: 0 }
            : { ...duration, seconds: 0 };
    }
    // we only admit one trigger component for part-day events
    const result = { weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isNegative: duration.isNegative };
    if (duration.minutes % 60 !== 0) {
        return { ...result, minutes: normalizeDurationToUnit(duration, MINUTE) };
    }
    if (duration.hours % 24 !== 0) {
        return { ...result, hours: normalizeDurationToUnit(duration, HOUR) };
    }
    if (duration.days % 7 !== 0) {
        return { ...result, days: normalizeDurationToUnit(duration, DAY) };
    }
    return { ...result, weeks: normalizeDurationToUnit(duration, WEEK) };
};

/**
 * Filter out email notifications
 */
export const filterEmailNotifications = (notifications: NotificationModel[]) => {
    return notifications.filter(({ type }) => {
        return type !== SETTINGS_NOTIFICATION_TYPE.EMAIL;
    });
};

export const sortNotificationsByAscendingTrigger = (notifications: NotificationModel[]) =>
    [...notifications].sort((a: NotificationModel, b: NotificationModel) => {
        const triggerA = getValarmTrigger(a);
        const triggerB = getValarmTrigger(b);
        const triggerAMinutes =
            normalizeDurationToUnit(triggerA, NOTIFICATION_UNITS.MINUTES) * (triggerA.isNegative ? -1 : 1);
        const triggerBMinutes =
            normalizeDurationToUnit(triggerB, NOTIFICATION_UNITS.MINUTES) * (triggerB.isNegative ? -1 : 1);

        return triggerAMinutes - triggerBMinutes;
    });

const sortNotificationsByAscendingValue = (a: NotificationModel, b: NotificationModel) =>
    (a.value || 0) - (b.value || 0);

const uniqueNotificationComparator = (notification: NotificationModel) => {
    const trigger = getValarmTrigger(notification);

    return `${notification.type}-${
        normalizeDurationToUnit(trigger, NOTIFICATION_UNITS.MINUTES) * (trigger.isNegative ? -1 : 1)
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
        normalizeDurationToUnit(triggerValue, NOTIFICATION_UNITS.MINUTES) * (isTriggerNegative ? -1 : 1)
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

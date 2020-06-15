import { differenceInMinutes } from 'date-fns';
import { getMillisecondsFromTriggerString } from 'proton-shared/lib/calendar/vcal';
import { propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import { convertUTCDateTimeToZone, fromUTCDate, getTimezoneOffset, toUTCDate } from 'proton-shared/lib/date/timezone';
import { truncate } from 'proton-shared/lib/helpers/string';
import { getIsPropertyAllDay, getIsDateTimeValue, getIsAllDay } from 'proton-shared/lib/calendar/vcalHelper';
import {
    VcalDateOrDateTimeProperty,
    VcalDateTimeProperty,
    VcalDurationValue,
    VcalTriggerProperty,
    VcalValarmComponent,
    VcalVeventComponent,
} from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { DAY, HOUR, MINUTE, NOTIFICATION_UNITS, NOTIFICATION_UNITS_MAX, NOTIFICATION_WHEN, WEEK } from '../constants';
import { DateTimeValue } from '../interfaces/DateTime';
import { NotificationModel } from '../interfaces/NotificationModel';
import { getDisplayTitle } from './event';
import getAlarmMessageText from './getAlarmMessageText';

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

const isAbsoluteTrigger = (trigger: VcalTriggerProperty): trigger is VcalDateTimeProperty => {
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
    if (duration.minutes % MINUTE !== 0) {
        return { ...result, minutes: normalizeDurationToUnit(duration, MINUTE) };
    }
    if (duration.hours % HOUR !== 0) {
        return { ...result, hours: normalizeDurationToUnit(duration, HOUR) };
    }
    if (duration.days % DAY !== 0) {
        return { ...result, days: normalizeDurationToUnit(duration, DAY) };
    }
    return { ...result, weeks: normalizeDurationToUnit(duration, WEEK) };
};

/**
 * Determine if a VALARM component is correct according to the RFC
 */
export const getIsValidAlarm = (alarm: VcalValarmComponent) => {
    const { action, trigger, duration, repeat } = alarm;
    if (!['AUDIO', 'DISPLAY', 'EMAIL'].includes(action?.value)) {
        return false;
    }
    if (!trigger) {
        return false;
    }
    // absolute triggers should have the right format
    if (isAbsoluteTrigger(trigger) && !getIsDateTimeValue(trigger.value as DateTimeValue)) {
        return false;
    }
    // duration and repeat must be both present or absent
    if (+!duration ^ +!repeat) {
        return false;
    }
    return true;
};

/**
 * Given a VALARM component, try to transform it into something that we support.
 * Return undefined otherwise
 */
export const getSupportedAlarm = (
    alarm: VcalValarmComponent,
    dtstart: VcalDateOrDateTimeProperty
): VcalValarmComponent | undefined => {
    if (!getIsValidAlarm(alarm)) {
        return;
    }

    const { trigger } = alarm;

    if (!isAbsoluteTrigger(trigger) && trigger.parameters?.related?.toLocaleLowerCase() === 'end') {
        return;
    }

    const actionValue = alarm.action.value === 'EMAIL' ? 'EMAIL' : 'DISPLAY';
    const normalizedTrigger = normalizeTrigger(trigger, dtstart);
    const triggerDurationInSeconds = normalizeDurationToUnit(normalizedTrigger, 1);

    const inFuture = getIsPropertyAllDay(dtstart)
        ? !normalizedTrigger.isNegative && triggerDurationInSeconds >= DAY
        : !normalizedTrigger.isNegative && triggerDurationInSeconds !== 0;
    const nonSupportedTrigger =
        normalizedTrigger.seconds !== 0 ||
        normalizedTrigger.minutes > NOTIFICATION_UNITS_MAX[NOTIFICATION_UNITS.MINUTES] ||
        normalizedTrigger.hours > NOTIFICATION_UNITS_MAX[NOTIFICATION_UNITS.HOURS] ||
        normalizedTrigger.days > NOTIFICATION_UNITS_MAX[NOTIFICATION_UNITS.DAY] ||
        normalizedTrigger.weeks > NOTIFICATION_UNITS_MAX[NOTIFICATION_UNITS.WEEK];

    if (inFuture || nonSupportedTrigger) {
        return;
    }

    return {
        component: 'valarm',
        action: { value: actionValue },
        trigger: { value: normalizedTrigger },
    };
};

export const filterFutureNotifications = (notifications: NotificationModel[]) => {
    return notifications.filter(({ when, value }) => {
        if (when === NOTIFICATION_WHEN.BEFORE) {
            return true;
        }
        return value === 0;
    });
};

import { differenceInMinutes } from 'date-fns';
import isTruthy from '../helpers/isTruthy';
import {
    VcalDateOrDateTimeProperty,
    VcalDateTimeProperty,
    VcalDurationValue,
    VcalTriggerProperty,
} from '../interfaces/calendar';
import { propertyToUTCDate } from './vcalConverter';
import { getIsPropertyAllDay } from './vcalHelper';

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

export const transformBeforeAt = (at: Date) => {
    const minutes = 60 - (at.getMinutes() || 60);
    const hours = 24 - (at.getHours() || 24) - (minutes > 0 ? 1 : 0);
    return new Date(at.getFullYear(), at.getMonth(), at.getDate(), hours, minutes);
};

export const getIsAbsoluteTrigger = (trigger: VcalTriggerProperty): trigger is VcalDateTimeProperty => {
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

export const normalizeRelativeTrigger = (duration: VcalDurationValue, isAllDay: boolean) => {
    const { minutes, hours, weeks, days, isNegative } = duration;
    if (isAllDay) {
        // the API admits all trigger components for all-day events,
        // but we do not support arbitrary combinations of non-zero values for weeks and days
        const isMidNightAlarm = hours === 0 && minutes === 0;
        const mustKeepWeeks = !isNegative || isMidNightAlarm ? days === 0 : days === 6;
        return mustKeepWeeks
            ? { ...duration, seconds: 0 }
            : { ...duration, weeks: 0, days: days + 7 * weeks, seconds: 0 };
    }
    // We only admit one trigger component for part-day events
    // If that's the case already, no need to normalize
    if ([minutes, hours, weeks, days].filter(isTruthy).length <= 1) {
        return { ...duration, seconds: 0 };
    }
    // Otherwise, normalize to a single component
    const result = { weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isNegative };
    const totalMinutes = normalizeDurationToUnit(duration, MINUTE);
    if (totalMinutes % 60 !== 0) {
        return { ...result, minutes: totalMinutes };
    }
    const totalHours = Math.floor(totalMinutes / 60);
    if (totalHours % 24 !== 0) {
        return { ...result, hours: totalHours };
    }
    const totalDays = Math.floor(totalHours / 24);
    if (totalDays % 7 !== 0) {
        return { ...result, days: totalDays };
    }
    const totalWeeks = Math.floor(totalDays / 7);
    return { ...result, weeks: totalWeeks };
};

export const normalizeTrigger = (trigger: VcalTriggerProperty, dtstart: VcalDateOrDateTimeProperty) => {
    const duration = getIsAbsoluteTrigger(trigger) ? absoluteToRelative(trigger, dtstart) : trigger.value;
    return normalizeRelativeTrigger(duration, getIsPropertyAllDay(dtstart));
};

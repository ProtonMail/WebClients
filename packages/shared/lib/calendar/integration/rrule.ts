import { getOccurrences } from '../recurring';
import { propertyToUTCDate } from '../vcalConverter';
import { getIsDateTimeValue, getIsPropertyAllDay, getPropertyTzid } from '../vcalHelper';
import { convertUTCDateTimeToZone, convertZonedDateTimeToUTC, toLocalDate, toUTCDate } from '../../date/timezone';
import { omit, pick } from '../../helpers/object';
import {
    VcalDateOrDateTimeValue,
    VcalDaysKeys,
    VcalRruleProperty,
    VcalRrulePropertyValue,
    VcalVeventComponent,
} from '../../interfaces/calendar/VcalModel';
import { MAXIMUM_DATE, MAXIMUM_DATE_UTC, FREQUENCY, FREQUENCY_COUNT_MAX, FREQUENCY_INTERVALS_MAX } from '../constants';

export const getIsStandardByday = (byday = ''): byday is VcalDaysKeys => {
    return /^(SU|MO|TU|WE|TH|FR|SA)$/.test(byday);
};

export const getIsStandardBydayArray = (byday: (string | undefined)[]): byday is VcalDaysKeys[] => {
    return !byday.some((day) => !getIsStandardByday(day));
};

export const getDayAndSetpos = (byday?: string, bysetpos?: number) => {
    if (byday) {
        const alternativeBydayMatch = /^([-+]?\d{1})(SU|MO|TU|WE|TH|FR|SA$)/.exec(byday);
        if (alternativeBydayMatch) {
            const [, pos, day] = alternativeBydayMatch;
            return { day, setpos: +pos };
        }
    }
    return { day: byday, setpos: bysetpos };
};

export const SUPPORTED_RRULE_PROPERTIES = [
    'freq',
    'count',
    'interval',
    'until',
    'wkst',
    'bysetpos',
    'byday',
    'bymonthday',
    'bymonth',
    'byyearday',
];
export const SUPPORTED_RRULE_PROPERTIES_DAILY: (keyof VcalRrulePropertyValue)[] = [
    'freq',
    'count',
    'interval',
    'until',
    'wkst',
];
export const SUPPORTED_RRULE_PROPERTIES_WEEKLY: (keyof VcalRrulePropertyValue)[] = [
    'freq',
    'count',
    'interval',
    'until',
    'wkst',
    'byday',
];
export const SUPPORTED_RRULE_PROPERTIES_MONTHLY: (keyof VcalRrulePropertyValue)[] = [
    'freq',
    'count',
    'interval',
    'until',
    'wkst',
    'bymonthday',
    'byday',
    'bysetpos',
];
export const SUPPORTED_RRULE_PROPERTIES_YEARLY: (keyof VcalRrulePropertyValue)[] = [
    'freq',
    'count',
    'interval',
    'until',
    'wkst',
    'bymonthday',
    'bymonth',
    'byyearday',
];
const ALLOWED_BYSETPOS = [-1, 1, 2, 3, 4];

export const getIsSupportedSetpos = (setpos: number) => {
    return ALLOWED_BYSETPOS.includes(setpos);
};

/**
 * Given an rrule property, return true if it's one of our custom rules.
 * If the event is not recurring or the rrule is not supported, return false.
 */
export const getIsRruleCustom = (rrule?: VcalRrulePropertyValue): boolean => {
    if (!rrule) {
        return false;
    }
    const nonEmptyFields = Object.entries(rrule)
        .filter(([, value]) => value !== undefined)
        .map(([field]) => field) as (keyof VcalRrulePropertyValue)[];
    const { freq, count, interval, until, bysetpos, byday, bymonth, bymonthday, byyearday } = rrule;
    const hasUnsupportedFields = nonEmptyFields.some((field) => !SUPPORTED_RRULE_PROPERTIES.includes(field));
    if (!freq || hasUnsupportedFields) {
        return false;
    }
    const isBasicCustom = (interval && interval > 1) || (count && count >= 1) || !!until;
    if (freq === FREQUENCY.DAILY) {
        if (nonEmptyFields.some((field) => !SUPPORTED_RRULE_PROPERTIES_DAILY.includes(field))) {
            return false;
        }
        return isBasicCustom;
    }
    if (freq === FREQUENCY.WEEKLY) {
        if (nonEmptyFields.some((field) => !SUPPORTED_RRULE_PROPERTIES_WEEKLY.includes(field))) {
            return false;
        }
        return Array.isArray(byday) || isBasicCustom;
    }
    if (freq === FREQUENCY.MONTHLY) {
        if (nonEmptyFields.some((field) => !SUPPORTED_RRULE_PROPERTIES_MONTHLY.includes(field))) {
            return false;
        }
        if (Array.isArray(byday) || Array.isArray(bymonthday) || Array.isArray(bysetpos)) {
            return false;
        }
        const { setpos } = getDayAndSetpos(byday, bysetpos);
        return (setpos && !!byday) || isBasicCustom;
    }
    if (freq === FREQUENCY.YEARLY) {
        if (nonEmptyFields.some((field) => !SUPPORTED_RRULE_PROPERTIES_YEARLY.includes(field))) {
            return false;
        }
        if (Array.isArray(bymonthday) || Array.isArray(bymonth) || Array.isArray(byyearday)) {
            return false;
        }
        return isBasicCustom;
    }
    return false;
};

export const getIsRruleSupported = (rruleProperty?: VcalRrulePropertyValue) => {
    if (!rruleProperty) {
        return false;
    }
    const rruleProperties = Object.keys(rruleProperty) as (keyof VcalRrulePropertyValue)[];
    if (rruleProperties.some((property) => !SUPPORTED_RRULE_PROPERTIES.includes(property))) {
        return false;
    }
    const { freq, interval = 1, count, until, byday, bysetpos, bymonthday, bymonth, byyearday } = rruleProperty;
    if (count) {
        if (count > FREQUENCY_COUNT_MAX) {
            return false;
        }
    }
    if (until) {
        if ('isUTC' in until && until.isUTC) {
            if (+toUTCDate(until) > +MAXIMUM_DATE_UTC) {
                return false;
            }
        }
        if (+toLocalDate(until) > +MAXIMUM_DATE) {
            return false;
        }
    }
    if (freq === 'DAILY') {
        if (interval > FREQUENCY_INTERVALS_MAX[freq]) {
            return false;
        }
        if (rruleProperties.some((property) => !SUPPORTED_RRULE_PROPERTIES_DAILY.includes(property))) {
            return false;
        }
        return true;
    }
    if (freq === 'WEEKLY') {
        if (interval > FREQUENCY_INTERVALS_MAX[freq]) {
            return false;
        }
        if (rruleProperties.some((property) => !SUPPORTED_RRULE_PROPERTIES_WEEKLY.includes(property))) {
            return false;
        }
        return true;
    }
    if (freq === 'MONTHLY') {
        if (interval > FREQUENCY_INTERVALS_MAX[freq]) {
            return false;
        }
        if (rruleProperties.some((property) => !SUPPORTED_RRULE_PROPERTIES_MONTHLY.includes(property))) {
            return false;
        }
        if (Array.isArray(byday) || Array.isArray(bysetpos) || Array.isArray(bymonthday)) {
            return false;
        }
        // byday and bysetpos must both be absent or both present. If they are present, bymonthday should not be present
        const { setpos, day } = getDayAndSetpos(byday, bysetpos);
        if (!!day && !!setpos) {
            return getIsStandardByday(day) && getIsSupportedSetpos(setpos) && !bymonthday;
        }
        if (+!!day ^ +!!setpos) {
            return false;
        }
        return true;
    }
    if (freq === 'YEARLY') {
        if (interval > FREQUENCY_INTERVALS_MAX[freq]) {
            return false;
        }
        if (rruleProperties.some((property) => !SUPPORTED_RRULE_PROPERTIES_YEARLY.includes(property))) {
            return false;
        }
        if (Array.isArray(bymonthday) || Array.isArray(bymonth) || Array.isArray(byyearday)) {
            return false;
        }
        return true;
    }
    return false;
};

export const getSupportedUntil = (until: VcalDateOrDateTimeValue, isAllDay: boolean, tzid = 'UTC') => {
    // According to the RFC, we should use UTC dates if and only if the event is not all-day.
    if (isAllDay) {
        // we should use a floating date in this case
        return {
            year: until.year,
            month: until.month,
            day: until.day,
        };
    }
    const zonedUntilDateTime = getIsDateTimeValue(until)
        ? pick(until, ['year', 'month', 'day', 'hours', 'minutes', 'seconds'])
        : { ...pick(until, ['year', 'month', 'day']), hours: 0, minutes: 0, seconds: 0 };
    const zonedUntil = convertUTCDateTimeToZone(zonedUntilDateTime, tzid);
    // Pick end of day in the event start date timezone
    const zonedEndOfDay = { ...zonedUntil, hours: 23, minutes: 59, seconds: 59 };
    const utcEndOfDay = convertZonedDateTimeToUTC(zonedEndOfDay, tzid);
    return { ...utcEndOfDay, isUTC: true };
};

export const getSupportedRrule = (vevent: VcalVeventComponent): VcalRruleProperty | undefined => {
    if (!vevent.rrule?.value) {
        return;
    }
    const { dtstart, rrule } = vevent;
    const { until } = rrule.value;
    const supportedRrule = { ...rrule };

    if (until) {
        const supportedUntil = getSupportedUntil(until, getIsPropertyAllDay(dtstart), getPropertyTzid(dtstart));
        supportedRrule.value.until = supportedUntil;
    }
    if (!getIsRruleSupported(rrule.value)) {
        return;
    }
    return supportedRrule;
};

export const getHasConsistentRrule = (vevent: VcalVeventComponent) => {
    const { dtstart, rrule } = vevent;

    if (!rrule?.value) {
        return true;
    }

    const { until } = rrule.value;
    if (until) {
        // UNTIL should happen before DTSTART
        const startDateUTC = propertyToUTCDate(dtstart);
        const untilDateUTC = toUTCDate(until);
        if (+startDateUTC > +untilDateUTC) {
            return false;
        }
    }

    // make sure the event generates some occurrence
    const [firstOccurrence] = getOccurrences({ component: vevent, maxCount: 1 });
    if (!firstOccurrence) {
        return false;
    }

    // make sure DTSTART matches the pattern of the recurring series
    const [first] = getOccurrences({ component: omit(vevent, ['exdate']), maxCount: 1 });
    if (!first) {
        return false;
    }
    if (+first.localStart !== +toUTCDate(vevent.dtstart.value)) {
        return false;
    }
    return true;
};

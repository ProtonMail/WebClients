import { RequireSome } from '../interfaces';
import { getOccurrences } from './recurring';
import { propertyToUTCDate } from './vcalConverter';
import { getIsDateTimeValue, getIsPropertyAllDay, getPropertyTzid } from './vcalHelper';
import {
    convertUTCDateTimeToZone,
    convertZonedDateTimeToUTC,
    fromUTCDate,
    toLocalDate,
    toUTCDate,
} from '../date/timezone';
import { omit, pick } from '../helpers/object';
import {
    VcalDateOrDateTimeProperty,
    VcalDateOrDateTimeValue,
    VcalDaysKeys,
    VcalRruleProperty,
    VcalRrulePropertyValue,
    VcalVeventComponent,
} from '../interfaces/calendar/VcalModel';
import {
    FREQUENCY,
    FREQUENCY_COUNT_MAX,
    FREQUENCY_COUNT_MAX_INVITATION,
    FREQUENCY_INTERVALS_MAX,
    MAXIMUM_DATE,
    MAXIMUM_DATE_UTC,
} from './constants';

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
    const result: { day?: string; setpos?: number } = {};
    if (byday) {
        result.day = byday;
    }
    if (bysetpos) {
        result.setpos = bysetpos;
    }
    return result;
};

export const getRruleValue = (rrule: VcalRruleProperty | undefined) => {
    if (!rrule) {
        return;
    }
    return { ...rrule.value };
};

export const getSupportedRruleProperties = (rrule: VcalRrulePropertyValue, isInvitation = false) => {
    const { freq } = rrule;

    if (isInvitation) {
        return [
            'freq',
            'count',
            'interval',
            'until',
            'wkst',
            'bysetpos',
            'bysecond',
            'byminute',
            'byhour',
            'byday',
            'byweekno',
            'bymonthday',
            'bymonth',
            'byyearday',
        ];
    }
    if (freq === 'DAILY') {
        return [
            'freq',
            'count',
            'interval',
            'until',
            'wkst',
            'byyearday', // supported but invalid
        ];
    }
    if (freq === 'WEEKLY') {
        return [
            'freq',
            'count',
            'interval',
            'until',
            'wkst',
            'byday',
            'byyearday', // supported but invalid
        ];
    }
    if (freq === 'MONTHLY') {
        return [
            'freq',
            'count',
            'interval',
            'until',
            'wkst',
            'bymonthday',
            'byday',
            'bysetpos',
            'byyearday', // supported but invalid
        ];
    }
    if (freq === 'YEARLY') {
        return ['freq', 'count', 'interval', 'until', 'wkst', 'bymonthday', 'bymonth', 'byyearday'];
    }
    return ['freq', 'count', 'interval', 'until', 'wkst', 'bysetpos', 'byday', 'bymonthday', 'bymonth', 'byyearday'];
};
const ALLOWED_BYSETPOS = [-1, 1, 2, 3, 4];

export const getIsSupportedSetpos = (setpos: number) => {
    return ALLOWED_BYSETPOS.includes(setpos);
};

const isLongArray = <T>(arg: T | T[] | undefined): arg is T[] => {
    return Array.isArray(arg) && arg.length > 1;
};

const getHasUnsupportedProperties = (rruleProperty: VcalRrulePropertyValue, isInvitation = false) => {
    const rruleProperties = Object.entries(rruleProperty)
        .filter(([, value]) => value !== undefined)
        .map(([field]) => field);
    const supportedRruleProperties = getSupportedRruleProperties(rruleProperty, isInvitation);

    return rruleProperties.some((property) => !supportedRruleProperties.includes(property));
};

/**
 * Given an rrule, return true it's one of the non-custom rules that we support
 */
export const getIsRruleSimple = (rrule?: VcalRrulePropertyValue): boolean => {
    if (!rrule) {
        return false;
    }
    const { freq, count, interval, until, bysetpos, byday, bymonth, bymonthday, byyearday } = rrule;
    if (!freq || getHasUnsupportedProperties(rrule)) {
        return false;
    }
    const isBasicSimple = (!interval || interval === 1) && !count && !until;
    if (freq === FREQUENCY.DAILY) {
        return isBasicSimple;
    }
    if (freq === FREQUENCY.WEEKLY) {
        if (isLongArray(byday)) {
            return false;
        }
        return isBasicSimple;
    }
    if (freq === FREQUENCY.MONTHLY) {
        if (byday || isLongArray(bymonthday) || bysetpos) {
            return false;
        }
        return isBasicSimple;
    }
    if (freq === FREQUENCY.YEARLY) {
        if (isLongArray(bymonthday) || isLongArray(bymonth) || byyearday) {
            return false;
        }
        return isBasicSimple;
    }
    return false;
};

/**
 * Given an rrule property, return true if it's one of our custom rules (the limits for COUNT and interval are not taken into account).
 * If the event is not recurring or the rrule is not supported, return false.
 */
export const getIsRruleCustom = (rrule?: VcalRrulePropertyValue): boolean => {
    if (!rrule) {
        return false;
    }
    const { freq, count, interval, until, bysetpos, byday, bymonth, bymonthday, byyearday } = rrule;
    if (!freq || getHasUnsupportedProperties(rrule)) {
        return false;
    }
    const isBasicCustom = (interval && interval > 1) || (count && count >= 1) || !!until;
    if (freq === FREQUENCY.DAILY) {
        return isBasicCustom;
    }
    if (freq === FREQUENCY.WEEKLY) {
        return isLongArray(byday) || isBasicCustom;
    }
    if (freq === FREQUENCY.MONTHLY) {
        if (isLongArray(byday) || isLongArray(bymonthday) || isLongArray(bysetpos)) {
            return false;
        }
        const { setpos } = getDayAndSetpos(byday, bysetpos);
        return (setpos && !!byday) || isBasicCustom;
    }
    if (freq === FREQUENCY.YEARLY) {
        if (isLongArray(bymonthday) || isLongArray(bymonth) || isLongArray(byyearday)) {
            return false;
        }
        return isBasicCustom;
    }
    return false;
};

export const getIsRruleSupported = (rruleProperty?: VcalRrulePropertyValue, isInvitation = false) => {
    if (!rruleProperty) {
        return false;
    }
    if (getHasUnsupportedProperties(rruleProperty, isInvitation)) {
        return false;
    }
    const { freq, interval = 1, count, until, byday, bysetpos, bymonthday, bymonth, byyearday } = rruleProperty;
    if (count) {
        if (count > (isInvitation ? FREQUENCY_COUNT_MAX_INVITATION : FREQUENCY_COUNT_MAX)) {
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
        return true;
    }
    if (freq === 'WEEKLY') {
        if (interval > FREQUENCY_INTERVALS_MAX[freq]) {
            return false;
        }
        return true;
    }
    if (freq === 'MONTHLY') {
        if (interval > FREQUENCY_INTERVALS_MAX[freq]) {
            return false;
        }
        if (isLongArray(byday) || isLongArray(bysetpos) || isLongArray(bymonthday)) {
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
        if (isInvitation) {
            if (bymonthday && !bymonth) {
                // These RRULEs are problematic as ICAL.js does not expand them properly.
                // The API will reject them, so we want to block them as well
                return false;
            }
            return true;
        }
        if (isLongArray(bymonthday) || isLongArray(bymonth) || isLongArray(byyearday)) {
            return false;
        }
        if (bymonthday && !bymonth) {
            return false;
        }
        return true;
    }
    return false;
};

export const getSupportedUntil = ({
    until,
    dtstart,
    guessTzid = 'UTC',
}: {
    until: VcalDateOrDateTimeValue;
    dtstart: VcalDateOrDateTimeProperty;
    guessTzid?: string;
}) => {
    const isAllDay = getIsPropertyAllDay(dtstart);
    const tzid = getPropertyTzid(dtstart) || 'UTC';

    const startDateUTC = propertyToUTCDate(dtstart);
    const untilDateUTC = toUTCDate(until);
    const startsAfterUntil = +startDateUTC > +untilDateUTC;

    const adjustedUntil = startsAfterUntil ? fromUTCDate(startDateUTC) : until;

    // According to the RFC, we should use UTC dates if and only if the event is not all-day.
    if (isAllDay) {
        // we should use a floating date in this case
        if (getIsDateTimeValue(adjustedUntil)) {
            // try to guess the right UNTIL
            const untilGuess = convertUTCDateTimeToZone(adjustedUntil, guessTzid);
            return {
                year: untilGuess.year,
                month: untilGuess.month,
                day: untilGuess.day,
            };
        }
        return {
            year: adjustedUntil.year,
            month: adjustedUntil.month,
            day: adjustedUntil.day,
        };
    }

    const zonedUntilDateTime = getIsDateTimeValue(adjustedUntil)
        ? pick(adjustedUntil, ['year', 'month', 'day', 'hours', 'minutes', 'seconds'])
        : { ...pick(adjustedUntil, ['year', 'month', 'day']), hours: 0, minutes: 0, seconds: 0 };
    const zonedUntil = convertUTCDateTimeToZone(zonedUntilDateTime, tzid);
    // Pick end of day in the event start date timezone
    const zonedEndOfDay = { ...zonedUntil, hours: 23, minutes: 59, seconds: 59 };
    const utcEndOfDay = convertZonedDateTimeToUTC(zonedEndOfDay, tzid);

    return { ...utcEndOfDay, isUTC: true };
};

export const getSupportedRrule = (
    vevent: RequireSome<Partial<VcalVeventComponent>, 'dtstart'>,
    isInvitation = false,
    guessTzid?: string
): VcalRruleProperty | undefined => {
    if (!vevent.rrule?.value) {
        return;
    }
    const { dtstart, rrule } = vevent;
    const { until } = rrule.value;
    const supportedRrule = { ...rrule };

    if (until) {
        const supportedUntil = getSupportedUntil({
            until,
            dtstart,
            guessTzid,
        });
        supportedRrule.value.until = supportedUntil;
    }
    if (!getIsRruleSupported(rrule.value, isInvitation)) {
        return;
    }
    return supportedRrule;
};

export const getHasOccurrences = (vevent: RequireSome<Partial<VcalVeventComponent>, 'dtstart'>) =>
    !!getOccurrences({ component: vevent, maxCount: 1 }).length;

export const getHasConsistentRrule = (vevent: RequireSome<Partial<VcalVeventComponent>, 'dtstart'>) => {
    const { rrule } = vevent;

    if (!rrule?.value) {
        return true;
    }

    const { freq, until, count, byyearday } = rrule.value;

    if (byyearday && freq !== 'YEARLY') {
        // According to the RFC, the BYYEARDAY rule part MUST NOT be specified when the FREQ
        // rule part is set to DAILY, WEEKLY, or MONTHLY
        return false;
    }

    if (until && count !== undefined) {
        return false;
    }

    // make sure DTSTART matches the pattern of the recurring series (we exclude EXDATE and COUNT/UNTIL here)
    const rruleValueWithNoCountOrUntil = omit(rrule.value, ['count', 'until']);
    const [first] = getOccurrences({
        component: omit({ ...vevent, rrule: { value: rruleValueWithNoCountOrUntil } }, ['exdate']),
        maxCount: 1,
    });

    if (!first) {
        return false;
    }

    if (+first.localStart !== +toUTCDate(vevent.dtstart.value)) {
        return false;
    }

    return true;
};

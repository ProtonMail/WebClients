import {
    FREQUENCY,
    WEEKLY_TYPE,
    MONTHLY_TYPE,
    YEARLY_TYPE,
    END_TYPE,
    DAY_TO_NUMBER,
    DAILY_TYPE
} from '../../../constants';
import { propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import { convertUTCDateTimeToZone, fromUTCDate } from 'proton-shared/lib/date/timezone';

/**
 * Given a parsed recurrence rule in standard format,
 * parse it into the object that goes in the Event model
 * @param {Object} frequencyProperty        parsed using the parse helper in /lib/calendar/vcal
 * @param {Date} startDate
 * @param {String} startTzid
 * @return {Object}
 */
export const propertiesToFrequencyModel = ({ value: frequencyProperty } = {}, { date: startDate, tzid: startTzid }) => {
    const { freq, count, interval, until, bysetpos, byday, bymonthday, bymonth } = frequencyProperty || {};
    const isCustom = !!(count || interval || until || bysetpos || byday || bymonthday || bymonth);

    const type = isCustom ? FREQUENCY.CUSTOM : freq || FREQUENCY.ONCE;
    const frequency = freq || FREQUENCY.WEEKLY;

    const endType = (() => {
        // count and until cannot occur at the same time (see https://tools.ietf.org/html/rfc5545#page-37)
        if (count && count >= 1) {
            return END_TYPE.AFTER_N_TIMES;
        }
        if (until) {
            return END_TYPE.UNTIL;
        }
        return END_TYPE.NEVER;
    })();
    const monthType = (() => {
        if (bysetpos && byday) {
            return bysetpos > 0 ? MONTHLY_TYPE.ON_NTH_DAY : MONTHLY_TYPE.ON_MINUS_NTH_DAY;
        }
        return MONTHLY_TYPE.ON_MONTH_DAY;
    })();
    const untilDate = (() => {
        if (!until) {
            return undefined;
        }
        if (!until.isUTC) {
            // this will only occur for all-day events
            const { year, month, day } = until;
            return new Date(year, month - 1, day);
        }
        const utcDate = propertyToUTCDate({ value: until });
        const localDate = startTzid ? convertUTCDateTimeToZone(fromUTCDate(utcDate), startTzid) : fromUTCDate(utcDate);
        return new Date(localDate.year, localDate.month - 1, localDate.day);
    })();
    const weeklyDays = (() => {
        if (!byday) {
            return [startDate.getDay()];
        }
        if (Array.isArray(byday)) {
            return byday.map((DD) => DAY_TO_NUMBER[DD]);
        }
        return [DAY_TO_NUMBER[byday]];
    })();

    return {
        type,
        frequency,
        interval: interval || 1, // INTERVAL=1 is ignored when parsing a recurring rule
        daily: {
            type: DAILY_TYPE.ALL_DAYS
        },
        weekly: {
            type: WEEKLY_TYPE.ON_DAYS,
            days: weeklyDays
        },
        monthly: {
            type: monthType
        },
        yearly: {
            type: YEARLY_TYPE.ON_YEAR_DAY
        },
        ends: {
            type: endType,
            count: count || 2,
            until: untilDate
        }
    };
};

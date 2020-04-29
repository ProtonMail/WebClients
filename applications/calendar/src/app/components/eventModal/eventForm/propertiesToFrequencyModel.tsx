import { DAILY_TYPE, END_TYPE, FREQUENCY, MONTHLY_TYPE, WEEKLY_TYPE, YEARLY_TYPE } from '../../../constants';
import { dayToNumericDay, propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import { convertUTCDateTimeToZone, fromUTCDate } from 'proton-shared/lib/date/timezone';
import { DateTimeModel, FrequencyModel } from '../../../interfaces/EventModel';
import {
    VcalDaysKeys,
    VcalDateOrDateTimeValue,
    VcalDateTimeValue,
    VcalRruleFreqValue,
    VcalRruleProperty
} from 'proton-shared/lib/interfaces/calendar/VcalModel';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { unique } from 'proton-shared/lib/helpers/array';

const getEndType = (count?: number, until?: VcalDateOrDateTimeValue) => {
    // count and until cannot occur at the same time (see https://tools.ietf.org/html/rfc5545#page-37)
    if (count && count >= 1) {
        return END_TYPE.AFTER_N_TIMES;
    }
    if (until) {
        return END_TYPE.UNTIL;
    }
    return END_TYPE.NEVER;
};

const getMonthType = (bysetpos?: number, byday?: VcalDaysKeys | VcalDaysKeys[]) => {
    if (bysetpos && byday) {
        return bysetpos > 0 ? MONTHLY_TYPE.ON_NTH_DAY : MONTHLY_TYPE.ON_MINUS_NTH_DAY;
    }
    return MONTHLY_TYPE.ON_MONTH_DAY;
};

const getUntilDate = (until?: VcalDateOrDateTimeValue, startTzid?: string) => {
    if (!until) {
        return undefined;
    }
    if (!(until as VcalDateTimeValue).isUTC || !startTzid) {
        const { year, month, day } = until;
        return new Date(year, month - 1, day);
    }
    const utcDate = propertyToUTCDate({ value: until as VcalDateTimeValue });
    const localDate = convertUTCDateTimeToZone(fromUTCDate(utcDate), startTzid);
    return new Date(localDate.year, localDate.month - 1, localDate.day);
};

const getWeeklyDays = (startDate: Date, byday?: VcalDaysKeys | VcalDaysKeys[]) => {
    const DEFAULT = [startDate.getDay()];

    if (!byday) {
        return DEFAULT;
    }

    const bydayArray = Array.isArray(byday) ? byday : [byday];
    const bydayArraySafe = bydayArray.map(dayToNumericDay).filter(isTruthy);
    // Ensure the start date is included in the list
    return unique([...DEFAULT].concat(bydayArraySafe));
};

const getSafeFrequency = (freq: VcalRruleFreqValue): FREQUENCY | undefined => {
    if (!freq) {
        return;
    }
    return Object.values(FREQUENCY).find((value) => value.toLowerCase() === freq.toLowerCase());
};

const getType = (isCustom: boolean, freq: VcalRruleFreqValue) => {
    if (isCustom) {
        return FREQUENCY.CUSTOM;
    }
    return getSafeFrequency(freq) || FREQUENCY.ONCE;
};

const getFrequency = (freq: VcalRruleFreqValue) => {
    return getSafeFrequency(freq) || FREQUENCY.WEEKLY;
};

/**
 * Given a parsed recurrence rule in standard format,
 * parse it into the object that goes in the Event model
 */
export const propertiesToFrequencyModel = (
    { value: frequencyProperty }: Partial<VcalRruleProperty> = {},
    { date: startDate, tzid: startTzid }: DateTimeModel
): FrequencyModel => {
    const { freq, count, interval, until, bysetpos, byday, bymonthday, bymonth } = frequencyProperty || {};
    const isCustom = !!(count || interval || until || bysetpos || byday || bymonthday || bymonth);

    const type = getType(isCustom, freq);
    const frequency = getFrequency(freq);
    const endType = getEndType(count, until);
    const monthType = getMonthType(bysetpos, byday);
    const untilDate = getUntilDate(until, startTzid);
    const weeklyDays = getWeeklyDays(startDate, byday);

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
            type: YEARLY_TYPE.BY_MONTH_ON_MONTH_DAY
        },
        ends: {
            type: endType,
            count: count || 2,
            until: untilDate
        }
    };
};

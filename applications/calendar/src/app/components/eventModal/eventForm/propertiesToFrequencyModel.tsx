import { dayToNumericDay, propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import { convertUTCDateTimeToZone, fromUTCDate } from 'proton-shared/lib/date/timezone';
import { unique } from 'proton-shared/lib/helpers/array';
import {
    VcalDateOrDateTimeValue,
    VcalDateTimeValue,
    VcalDays,
    VcalRruleFreqValue,
    VcalRruleProperty,
} from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { DAILY_TYPE, END_TYPE, FREQUENCY, MONTHLY_TYPE, WEEKLY_TYPE, YEARLY_TYPE } from '../../../constants';
import { getDayAndSetpos, getIsRruleCustom, getIsStandardBydayArray } from '../../../helpers/rrule';
import { DateTimeModel, FrequencyModel } from '../../../interfaces/EventModel';

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

const getMonthType = (byday?: string | string[], bysetpos?: number | number[]) => {
    if (typeof byday === 'string' && !Array.isArray(bysetpos)) {
        const { setpos } = getDayAndSetpos(byday, bysetpos);
        if (setpos) {
            return setpos > 0 ? MONTHLY_TYPE.ON_NTH_DAY : MONTHLY_TYPE.ON_MINUS_NTH_DAY;
        }
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

const getWeeklyDays = (startDate: Date, byday?: string | string[]) => {
    const DEFAULT = [startDate.getDay()];
    const bydayArray = Array.isArray(byday) ? byday : [byday];
    if (!getIsStandardBydayArray(bydayArray)) {
        return DEFAULT;
    }
    const bydayArraySafe = bydayArray.map(dayToNumericDay).filter((value): value is VcalDays => value !== undefined);
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
    const { freq, count, interval, until, bysetpos, byday } = frequencyProperty || {};
    const isCustom = getIsRruleCustom(frequencyProperty || {});
    const type = getType(isCustom, freq);
    const frequency = getFrequency(freq);
    const endType = getEndType(count, until);
    const monthType = getMonthType(byday, bysetpos);
    const untilDate = getUntilDate(until, startTzid);
    const weeklyDays = getWeeklyDays(startDate, byday);

    return {
        type,
        frequency,
        interval: interval || 1, // INTERVAL=1 is ignored when parsing a recurring rule
        daily: {
            type: DAILY_TYPE.ALL_DAYS,
        },
        weekly: {
            type: WEEKLY_TYPE.ON_DAYS,
            days: weeklyDays,
        },
        monthly: {
            type: monthType,
        },
        yearly: {
            type: YEARLY_TYPE.BY_MONTH_ON_MONTH_DAY,
        },
        ends: {
            type: endType,
            count: count || 2,
            until: untilDate,
        },
    };
};

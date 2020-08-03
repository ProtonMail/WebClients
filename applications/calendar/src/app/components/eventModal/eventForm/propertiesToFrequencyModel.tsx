import {
    getUntilDate,
    getMonthType,
    getEndType,
    getWeeklyDays,
} from 'proton-shared/lib/calendar/integration/rruleProperties';
import { fromUTCDate, toLocalDate } from 'proton-shared/lib/date/timezone';
import { unique } from 'proton-shared/lib/helpers/array';
import { VcalRruleFreqValue, VcalRruleProperty } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { getIsRruleCustom, getIsRruleSupported } from 'proton-shared/lib/calendar/integration/rrule';
import { DAILY_TYPE, FREQUENCY, WEEKLY_TYPE, YEARLY_TYPE } from 'proton-shared/lib/calendar/constants';
import { DateTimeModel, FrequencyModel } from '../../../interfaces/EventModel';

const getSafeWeeklyDays = (startDate: Date, byday?: string | string[]) => {
    const DEFAULT = [startDate.getDay()];
    const days = getWeeklyDays(byday);
    return unique([...DEFAULT].concat(days));
};

const getSafeFrequency = (freq: VcalRruleFreqValue): FREQUENCY | undefined => {
    if (!freq) {
        return;
    }
    return Object.values(FREQUENCY).find((value) => value.toLowerCase() === freq.toLowerCase());
};

const getType = (isSupported: boolean, isCustom: boolean, freq: VcalRruleFreqValue) => {
    if (!isSupported) {
        return FREQUENCY.OTHER;
    }
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
    rrule: VcalRruleProperty | undefined,
    { date: startDate, tzid: startTzid }: DateTimeModel
): FrequencyModel => {
    const rruleValue = rrule?.value;
    const { freq, count, interval, until, bysetpos, byday } = rruleValue || {};
    const isSupported = getIsRruleSupported(rruleValue);
    const isCustom = isSupported ? getIsRruleCustom(rruleValue) : false;
    const type = !rrule ? FREQUENCY.ONCE : getType(isSupported, isCustom, freq);
    const frequency = getFrequency(freq);
    const endType = getEndType(count, until);
    const monthType = getMonthType(byday, bysetpos);
    const utcUntilDate = getUntilDate(until, startTzid);
    const untilDate = utcUntilDate ? toLocalDate(fromUTCDate(utcUntilDate)) : undefined;
    const weeklyDays = getSafeWeeklyDays(startDate, byday);

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

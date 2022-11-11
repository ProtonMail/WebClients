import { DAILY_TYPE, FREQUENCY, WEEKLY_TYPE, YEARLY_TYPE } from '@proton/shared/lib/calendar/constants';
import { getIsRruleCustom, getIsRruleSimple } from '@proton/shared/lib/calendar/recurrence/rrule';
import {
    getEndType,
    getMonthType,
    getUntilDate,
    getWeeklyDays,
} from '@proton/shared/lib/calendar/recurrence/rruleProperties';
import { fromUTCDate, toLocalDate } from '@proton/shared/lib/date/timezone';
import { DateTimeModel, FrequencyModel } from '@proton/shared/lib/interfaces/calendar';
import { VcalRruleFreqValue, VcalRruleProperty } from '@proton/shared/lib/interfaces/calendar/VcalModel';
import unique from '@proton/utils/unique';

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

const getType = (isSimple: boolean, isCustom: boolean, freq: VcalRruleFreqValue) => {
    if (!isSimple && !isCustom) {
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
    const isSimple = getIsRruleSimple(rruleValue);
    const isCustom = !isSimple ? getIsRruleCustom(rruleValue) : false;
    const type = !rrule ? FREQUENCY.ONCE : getType(isSimple, isCustom, freq);
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
        vcalRruleValue: rruleValue,
    };
};

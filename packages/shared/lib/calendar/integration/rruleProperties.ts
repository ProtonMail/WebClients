import { VcalDateOrDateTimeValue, VcalDateTimeValue, VcalDays } from '../../interfaces/calendar/VcalModel';
import { END_TYPE, MONTHLY_TYPE } from '../constants';
import { getDayAndSetpos, getIsStandardBydayArray } from '../rrule';
import { dayToNumericDay, propertyToUTCDate } from '../vcalConverter';
import { convertUTCDateTimeToZone, fromUTCDate } from '../../date/timezone';
import { unique } from '../../helpers/array';

export const getEndType = (count?: number, until?: VcalDateOrDateTimeValue) => {
    // count and until cannot occur at the same time (see https://tools.ietf.org/html/rfc5545#page-37)
    if (count && count >= 1) {
        return END_TYPE.AFTER_N_TIMES;
    }
    if (until) {
        return END_TYPE.UNTIL;
    }
    return END_TYPE.NEVER;
};

export const getMonthType = (byday?: string | string[], bysetpos?: number | number[]) => {
    if (typeof byday === 'string' && !Array.isArray(bysetpos)) {
        const { setpos } = getDayAndSetpos(byday, bysetpos);
        if (setpos) {
            return setpos > 0 ? MONTHLY_TYPE.ON_NTH_DAY : MONTHLY_TYPE.ON_MINUS_NTH_DAY;
        }
    }
    return MONTHLY_TYPE.ON_MONTH_DAY;
};

export const getUntilDate = (until?: VcalDateOrDateTimeValue, startTzid?: string) => {
    if (!until) {
        return undefined;
    }
    if (!(until as VcalDateTimeValue).isUTC || !startTzid) {
        const { year, month, day } = until;
        return new Date(Date.UTC(year, month - 1, day));
    }
    const utcDate = propertyToUTCDate({ value: until as VcalDateTimeValue });
    const localDate = convertUTCDateTimeToZone(fromUTCDate(utcDate), startTzid);
    return new Date(Date.UTC(localDate.year, localDate.month - 1, localDate.day));
};

export const getWeeklyDays = (byday?: string | string[]) => {
    if (byday === undefined) {
        return [];
    }
    const bydayArray = Array.isArray(byday) ? byday : [byday];
    if (!getIsStandardBydayArray(bydayArray)) {
        return [];
    }
    const bydayArraySafe = bydayArray.map(dayToNumericDay).filter((value): value is VcalDays => value !== undefined);
    // Ensure the start date is included in the list
    return unique(bydayArraySafe);
};

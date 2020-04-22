import { END_TYPE, FREQUENCY, MONTHLY_TYPE, NUMBER_TO_DAY } from '../../../constants';
import { unique } from 'proton-shared/lib/helpers/array';
import { convertZonedDateTimeToUTC, fromLocalDate } from 'proton-shared/lib/date/timezone';
import { getPositiveSetpos, getNegativeSetpos } from '../../../helpers/rrule';
import { EventModel } from '../../../interfaces/EventModel';
import { VcalByDayValues, VcalDateOrDateTimeValue, VcalRruleProperty } from '../../../interfaces/VcalModel';

export interface UntilDateArgument {
    year: number;
    month: number;
    day: number;
}
export const getUntilProperty = (
    untilDateTime: UntilDateArgument,
    isAllDay: boolean,
    tzid = 'UTC'
): VcalDateOrDateTimeValue => {
    // According to the RFC, we should use UTC dates if and only if the event is not all-day.
    if (isAllDay) {
        // we should use a floating date in this case
        return {
            year: untilDateTime.year,
            month: untilDateTime.month,
            day: untilDateTime.day
        };
    }
    // Pick end of day in the event start date timezone
    const zonedEndOfDay = { ...untilDateTime, hours: 23, minutes: 59, seconds: 59 };
    const utcEndOfDay = convertZonedDateTimeToUTC(zonedEndOfDay, tzid);
    return { ...utcEndOfDay, isUTC: true };
};

const modelToFrequencyProperties = ({ frequencyModel, start, isAllDay }: EventModel) => {
    const { type, frequency, interval, weekly, monthly, ends } = frequencyModel;
    const { date: startDate, tzid } = start;

    if ([FREQUENCY.DAILY, FREQUENCY.WEEKLY, FREQUENCY.MONTHLY, FREQUENCY.YEARLY].includes(type)) {
        const rrule = {
            value: { freq: type }
        };
        return {
            rrule
        };
    }

    if (type === FREQUENCY.CUSTOM) {
        if (ends.type === END_TYPE.AFTER_N_TIMES && ends.count && ends.count <= 1) {
            return;
        }
        const rrule = {
            value: {
                freq: frequency
            }
        } as VcalRruleProperty;

        if (interval && interval > 1) {
            rrule.value.interval = interval;
        }
        if (frequency === FREQUENCY.WEEKLY) {
            // weekly.days may include repeated days (cf. function getFrequencyModelChange)
            const weeklyDays = unique(weekly.days);
            if (!weeklyDays.length || !weeklyDays.includes(startDate.getDay())) {
                throw new Error('Inconsistent weekly rrule');
            }
            if (weeklyDays.length > 1) {
                rrule.value.byday = weeklyDays.map((day) => NUMBER_TO_DAY[day] as VcalByDayValues);
            }
        }
        if (frequency === FREQUENCY.MONTHLY) {
            if (monthly.type === MONTHLY_TYPE.ON_NTH_DAY) {
                rrule.value.byday = NUMBER_TO_DAY[startDate.getDay()] as VcalByDayValues;
                rrule.value.bysetpos = getPositiveSetpos(startDate);
            }
            if (monthly.type === MONTHLY_TYPE.ON_MINUS_NTH_DAY) {
                rrule.value.byday = NUMBER_TO_DAY[startDate.getDay()] as VcalByDayValues;
                rrule.value.bysetpos = getNegativeSetpos(startDate);
            }
        }
        if (frequency === FREQUENCY.YEARLY) {
            // rrule.value.bymonthday = startDate.getDate();
            // rrule.value.bymonth = startDate.getMonth() + 1;
        }
        if (ends.type === END_TYPE.AFTER_N_TIMES) {
            rrule.value.count = ends.count;
        }
        if (ends.type === END_TYPE.UNTIL && ends.until) {
            rrule.value.until = getUntilProperty(fromLocalDate(ends.until), isAllDay, tzid);
        }
        return {
            rrule
        };
    }
};

export default modelToFrequencyProperties;

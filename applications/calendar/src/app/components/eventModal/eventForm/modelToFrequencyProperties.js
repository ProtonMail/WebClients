import { END_TYPE, FREQUENCY, MONTHLY_TYPE, NUMBER_TO_DAY } from '../../../constants';
import { unique } from 'proton-shared/lib/helpers/array';
import { convertZonedDateTimeToUTC, fromLocalDate } from 'proton-shared/lib/date/timezone';
import { getPositiveSetpos, getNegativeSetpos } from '../../../helpers/rrule';

export const getUntilProperty = (untilDateTime, isAllDay, tzid) => {
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

const modelToFrequencyProperties = ({ frequencyModel = {}, start = {}, isAllDay }) => {
    const { type, frequency, interval, weekly, monthly, ends } = frequencyModel;
    const { date: startDate, tzid } = start;
    const properties = {};

    if ([FREQUENCY.DAILY, FREQUENCY.WEEKLY, FREQUENCY.MONTHLY, FREQUENCY.YEARLY].includes(type)) {
        properties.rrule = { value: { freq: type } };
    }
    if (type === FREQUENCY.CUSTOM && frequencyModel.ends.count > 1) {
        properties.rrule = {
            value: {
                freq: frequency,
                interval: interval === 1 ? undefined : interval
            }
        };
        if (frequency === FREQUENCY.WEEKLY) {
            // weekly.days may include repeated days (cf. function getFrequencyModelChange)
            const weeklyDays = unique(weekly.days);
            if (!weeklyDays.length || !weeklyDays.includes(startDate.getDay())) {
                throw new Error('Inconsistent weekly rrule');
            }
            if (weeklyDays.length > 1) {
                properties.rrule.value.byday = weeklyDays.map((day) => NUMBER_TO_DAY[day]).join(',');
            }
        }
        if (frequency === FREQUENCY.MONTHLY) {
            if (monthly.type === MONTHLY_TYPE.ON_NTH_DAY) {
                properties.rrule.value.byday = NUMBER_TO_DAY[startDate.getDay()];
                properties.rrule.value.bysetpos = getPositiveSetpos(startDate);
            }
            if (monthly.type === MONTHLY_TYPE.ON_MINUS_NTH_DAY) {
                properties.rrule.value.byday = NUMBER_TO_DAY[startDate.getDay()];
                properties.rrule.value.bysetpos = getNegativeSetpos(startDate);
            }
        }
        if (frequency === FREQUENCY.YEARLY) {
            // properties.rrule.value.bymonthday = startDate.getDate();
            // properties.rrule.value.bymonth = startDate.getMonth() + 1;
        }
        if (ends.type === END_TYPE.AFTER_N_TIMES) {
            properties.rrule.value.count = ends.count;
        }
        if (ends.type === END_TYPE.UNTIL) {
            properties.rrule.value.until = getUntilProperty(fromLocalDate(ends.until), isAllDay, tzid);
        }
    }
    return properties;
};

export default modelToFrequencyProperties;

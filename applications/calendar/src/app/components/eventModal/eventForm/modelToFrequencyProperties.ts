import { END_TYPE, FREQUENCY, MONTHLY_TYPE } from '@proton/shared/lib/calendar/constants';
import { getNegativeSetpos, getPositiveSetpos } from '@proton/shared/lib/calendar/recurrence/rrule';
import { getUntilProperty, numericDayToDay } from '@proton/shared/lib/calendar/vcalConverter';
import { fromLocalDate } from '@proton/shared/lib/date/timezone';
import type { EventModel } from '@proton/shared/lib/interfaces/calendar';
import type { VcalRruleProperty } from '@proton/shared/lib/interfaces/calendar/VcalModel';
import unique from '@proton/utils/unique';

const modelToFrequencyProperties = ({ frequencyModel, start, isAllDay, isAttendee }: EventModel) => {
    const { type, frequency, interval, weekly, monthly, ends, vcalRruleValue } = frequencyModel;
    const { date: startDate, tzid } = start;

    if (type === FREQUENCY.ONCE) {
        return;
    }

    if ((isAttendee || type === FREQUENCY.OTHER) && vcalRruleValue) {
        return {
            rrule: {
                value: vcalRruleValue,
            },
        };
    }

    if (type === FREQUENCY.CUSTOM && ends.type === END_TYPE.AFTER_N_TIMES && ends.count && ends.count < 1) {
        return;
    }
    const rrule = {
        value: {
            freq: type,
        },
    } as VcalRruleProperty;

    if (type === FREQUENCY.CUSTOM) {
        rrule.value = { freq: frequency };
    }

    if (interval && interval > 1) {
        rrule.value.interval = interval;
    }
    if (frequency === FREQUENCY.WEEKLY) {
        // weekly.days may include repeated days (cf. function getFrequencyModelChange)
        const weeklyDays = unique(weekly.days).sort();
        if (!weeklyDays.length || !weeklyDays.includes(startDate.getDay())) {
            throw new Error('Inconsistent weekly rrule');
        }
        if (weeklyDays.length > 1) {
            rrule.value.byday = weeklyDays.map(numericDayToDay);
        }
    }
    if (frequency === FREQUENCY.MONTHLY) {
        if (monthly.type === MONTHLY_TYPE.ON_NTH_DAY) {
            rrule.value.byday = numericDayToDay(startDate.getDay());
            rrule.value.bysetpos = getPositiveSetpos(startDate);
        }
        if (monthly.type === MONTHLY_TYPE.ON_MINUS_NTH_DAY) {
            rrule.value.byday = numericDayToDay(startDate.getDay());
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
        rrule,
    };
};

export default modelToFrequencyProperties;

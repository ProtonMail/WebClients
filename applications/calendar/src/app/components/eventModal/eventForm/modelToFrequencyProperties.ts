import { END_TYPE, FREQUENCY, MONTHLY_TYPE } from '@proton/shared/lib/calendar/constants';
import { getNegativeSetpos, getPositiveSetpos } from '@proton/shared/lib/calendar/helper';
import { getUntilProperty, numericDayToDay } from '@proton/shared/lib/calendar/vcalConverter';
import { fromLocalDate, toUTCDate } from '@proton/shared/lib/date/timezone';
import { EventModel } from '@proton/shared/lib/interfaces/calendar';
import { VcalRruleProperty } from '@proton/shared/lib/interfaces/calendar/VcalModel';
import unique from '@proton/utils/unique';

const modelToFrequencyProperties = ({ frequencyModel, start, isAllDay, isAttendee }: EventModel) => {
    const { type, frequency, interval, weekly, monthly, ends, vcalRruleValue } = frequencyModel;
    const { date: startDate, tzid } = start;

    if ((isAttendee || type === FREQUENCY.OTHER) && vcalRruleValue) {
        return {
            rrule: {
                value: vcalRruleValue,
            },
        };
    }

    if ([FREQUENCY.DAILY, FREQUENCY.WEEKLY, FREQUENCY.MONTHLY, FREQUENCY.YEARLY].includes(type)) {
        const rrule = {
            value: { freq: type },
        };
        return {
            rrule,
        };
    }

    if (type === FREQUENCY.CUSTOM) {
        if (ends.type === END_TYPE.AFTER_N_TIMES && ends.count && ends.count < 1) {
            return;
        }
        const rrule = {
            value: {
                freq: frequency,
            },
        } as VcalRruleProperty;

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
            const startFakeUtcDate = toUTCDate(fromLocalDate(startDate));
            if (monthly.type === MONTHLY_TYPE.ON_NTH_DAY) {
                rrule.value.byday = numericDayToDay(startFakeUtcDate.getUTCDay());
                rrule.value.bysetpos = getPositiveSetpos(startFakeUtcDate);
            }
            if (monthly.type === MONTHLY_TYPE.ON_MINUS_NTH_DAY) {
                rrule.value.byday = numericDayToDay(startFakeUtcDate.getUTCDay());
                rrule.value.bysetpos = getNegativeSetpos(startFakeUtcDate);
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
    }
};

export default modelToFrequencyProperties;

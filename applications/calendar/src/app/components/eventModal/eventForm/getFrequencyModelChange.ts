import { MONTHLY_TYPE, WEEKLY_TYPE } from '@proton/shared/lib/calendar/constants';
import { getNegativeSetpos, getPositiveSetpos } from '@proton/shared/lib/calendar/helper';
import { replace } from '@proton/shared/lib/helpers/array';
import { fromLocalDate, toUTCDate } from '@proton/shared/lib/date/timezone';
import { isBefore } from 'date-fns';

import { DateTimeModel, FrequencyModel } from '@proton/shared/lib/interfaces/calendar';

const getFrequencyModelChange = (
    oldStart: DateTimeModel,
    newStart: DateTimeModel,
    frequencyModel: FrequencyModel
): FrequencyModel => {
    // change days in weekly
    const oldStartDay = oldStart.date.getDay();
    const newStartDay = newStart.date.getDay();
    const oldDays = frequencyModel.weekly && frequencyModel.weekly.days;
    const newDays = oldDays ? replace(oldDays, oldStartDay, newStartDay).sort() : [];

    /**
     * Notice that after replacement we may end up with repeated days in the newDays array.
     * That would indicate that the user entered a multiple-day selection, and we want to keep track of that.
     * Notice that if we filtered by unique days, an initial two-day selection of e.g. MO and WE (oldDays = [1,3]), with
     * the recurring event starting on MO, would be changed into a one-day selection if the user moves
     * the starting starting date of the event to a WE, i.e. (newDays = [3]). If the user changes her mind again and moves
     * the starting date to a TH now, we would display a single-day selection (newDays = [4]), but from a UX
     * perspective it makes more sense to display a two-day selection WE and TH (i.e. newDays = [4, 4])
     */

    const startFakeUtcDate = toUTCDate(fromLocalDate(newStart.date));

    // change monthly type
    const changeToNthDay =
        frequencyModel.monthly.type === MONTHLY_TYPE.ON_MINUS_NTH_DAY && getNegativeSetpos(startFakeUtcDate) !== -1;

    const changeToMinusNthDay =
        frequencyModel.monthly.type === MONTHLY_TYPE.ON_NTH_DAY && getPositiveSetpos(startFakeUtcDate) === 5;

    const newFrequencyModel = {
        ...frequencyModel,
        weekly: {
            type: WEEKLY_TYPE.ON_DAYS,
            days: newDays,
        },
    };

    if (changeToNthDay) {
        return { ...newFrequencyModel, monthly: { type: MONTHLY_TYPE.ON_NTH_DAY } };
    }

    if (changeToMinusNthDay) {
        return { ...newFrequencyModel, monthly: { type: MONTHLY_TYPE.ON_MINUS_NTH_DAY } };
    }

    const {
        ends: { until: oldRecurringUntil },
    } = frequencyModel;

    if (oldRecurringUntil && isBefore(oldRecurringUntil, newStart.date)) {
        newFrequencyModel.ends = {
            ...frequencyModel.ends,
            until: newStart.date,
        };
    }

    return newFrequencyModel;
};

export default getFrequencyModelChange;

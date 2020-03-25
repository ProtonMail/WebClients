import { propertiesToFrequencyModel } from './propertiesToFrequencyModel';
import { MONTHLY_TYPE } from '../../../constants';
import { replace } from 'proton-shared/lib/helpers/array';
import propertiesToDateTimeModel from './propertiesToDateTimeModel';
import { getPositiveSetpos, getNegativeSetpos } from '../../../helpers/rrule';

const DEFAULT_TIME = {
    value: { year: 1970, month: 1, day: 1, hour: 0, minutes: 0 },
    parameters: { tzid: 'UTC' }
};

export const propertiesToModel = (component, isAllDay, tzid) => {
    const {
        uid,
        location,
        description,
        summary,
        dtstart = DEFAULT_TIME,
        dtend = DEFAULT_TIME,
        rrule,
        attendee,
        ...rest
    } = component;

    const { start, end } = propertiesToDateTimeModel(dtstart, dtend, isAllDay, tzid);

    return {
        uid: uid ? uid.value : undefined,
        frequencyModel: propertiesToFrequencyModel(rrule, start),
        title: summary ? summary.value : '',
        location: location ? location.value : '',
        description: description ? description.value : '',
        attendees: attendee
            ? attendee.map(
                  ({ value, parameters: { cn = '', rsvp = 'FALSE', ['x-pm-permissions']: permissions } = {} }) => ({
                      name: cn || '',
                      email: value,
                      permissions,
                      rsvp: rsvp !== 'FALSE'
                  })
              )
            : [],
        start,
        end,
        rest
    };
};

export const getFrequencyModelChange = (oldStart, newStart, frequencyModel) => {
    // change days in weekly
    const oldStartDay = oldStart.date.getDay();
    const newStartDay = newStart.date.getDay();
    const oldDays = frequencyModel.weekly && frequencyModel.weekly.days;
    const newDays = oldDays ? replace(oldDays, oldStartDay, newStartDay).sort() : undefined;
    /**
     * Notice that after replacement we may end up with repeated days in the newDays array.
     * That would indicate that the user entered a multiple-day selection, and we want to keep track of that.
     * Notice that if we filtered by unique days, an initial two-day selection of e.g. MO and WE (oldDays = [1,3]), with
     * the recurring event starting on MO, would be changed into a one-day selection if the user moves
     * the starting starting date of the event to a WE, i.e. (newDays = [3]). If the user changes her mind again and moves
     * the starting date to a TH now, we would display a single-day selection (newDays = [4]), but from a UX
     * perspective it makes more sense to display a two-day selection WE and TH (i.e. newDays = [4, 4])
     */

    // change monthly type
    const changeToNthDay =
        frequencyModel.monthly.type === MONTHLY_TYPE.ON_MINUS_NTH_DAY && getNegativeSetpos(newStart.date) !== -1;
    const changeToMinusNthDay =
        frequencyModel.monthly.type === MONTHLY_TYPE.ON_NTH_DAY && getPositiveSetpos(newStart.date) === 5;
    const newFrequencyModel = { ...frequencyModel, weekly: { days: newDays } };

    if (changeToNthDay) {
        return { ...newFrequencyModel, monthly: { type: MONTHLY_TYPE.ON_NTH_DAY } };
    }
    if (changeToMinusNthDay) {
        return { ...newFrequencyModel, monthly: { type: MONTHLY_TYPE.ON_MINUS_NTH_DAY } };
    }
    return newFrequencyModel;
};

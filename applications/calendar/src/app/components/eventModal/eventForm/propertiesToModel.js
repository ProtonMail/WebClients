import { toUTCDate } from 'proton-shared/lib/date/timezone';
import { addDays, max } from 'proton-shared/lib/date-fns-utc';
import { getDateTimeState } from './time';
import { transformBeforeAt } from './trigger';
import { propertiesToFrequencyModel } from './propertiesToFrequencyModel';
import { NOTIFICATION_TYPE, NOTIFICATION_UNITS, NOTIFICATION_WHEN } from '../../../constants';
import { replace } from 'proton-shared/lib/helpers/array';

export const propertiesToModel = (component) => {
    const { uid, location, description, summary, dtstart, rrule, attendee, ...rest } = component;

    return {
        uid: uid ? uid.value : undefined,
        frequencyModel: propertiesToFrequencyModel(rrule, dtstart),
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
        rest
    };
};

export const getFrequencyModelChange = (oldStart, newStart, frequencyModel) => {
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

    return { ...frequencyModel, weekly: { days: newDays } };
};

const getTzid = ({ value, parameters: { type, tzid } = {} }) => {
    if (type === 'date') {
        return;
    }
    return value.isUTC ? 'UTC' : tzid;
};

export const propertiesToDateTimeModel = ({ dtstart, dtend }, isAllDay, tzid) => {
    const tzStart = isAllDay ? undefined : getTzid(dtstart);
    const tzEnd = isAllDay ? undefined : getTzid(dtend);

    const start = toUTCDate(dtstart.value);
    const end = toUTCDate(dtend.value);
    // All day events date ranges are stored non-inclusively, so remove a full day from the end date
    const modifiedEnd = isAllDay ? addDays(end, -1) : end;
    const safeEnd = max(start, modifiedEnd);

    return {
        start: getDateTimeState(start, tzStart || tzid),
        end: getDateTimeState(safeEnd, tzEnd || tzid)
    };
};

const allDayTriggerToModel = ({ type, when, weeks, days, hours, minutes }) => {
    const isNegative = when === NOTIFICATION_WHEN.BEFORE;

    const at = new Date(2000, 0, 1, hours, minutes);
    const modifiedAt = isNegative ? transformBeforeAt(at) : at;
    const modifyNegativeDay = isNegative && (modifiedAt.getHours() > 0 || modifiedAt.getMinutes() > 0);

    const [value, unit] = (() => {
        // Transform for example -P1W6DT10H10M into 2 weeks at...
        if (weeks >= 0 && days === 6 && modifyNegativeDay) {
            return [weeks + 1, NOTIFICATION_UNITS.WEEK];
        }
        // Otherwise, if there is something in the week, and even if there are days in the trigger, the client will truncate this into a week notification since the selector is not more advanced than that.
        if (weeks > 0) {
            return [weeks, NOTIFICATION_UNITS.WEEK];
        }
        // Finally just return it as a day notification.
        return [days + modifyNegativeDay, NOTIFICATION_UNITS.DAY];
    })();

    return {
        unit,
        type,
        when,
        value,
        at: modifiedAt,
        isAllDay: true
    };
};

const partDayTriggerToModel = ({ type, when, weeks, days, hours, minutes }) => {
    const [value, unit] = (() => {
        if (weeks) {
            return [weeks, NOTIFICATION_UNITS.WEEK];
        }
        if (days) {
            return [days, NOTIFICATION_UNITS.DAY];
        }
        if (hours) {
            return [hours, NOTIFICATION_UNITS.HOURS];
        }
        return [minutes, NOTIFICATION_UNITS.MINUTES];
    })();

    return {
        unit,
        type,
        when,
        value,
        isAllDay: false
    };
};

const getInt = (value) => parseInt(value, 10) || 0;

export const triggerToModel = ({
    isAllDay,
    type,
    // eslint-disable-next-line no-unused-vars
    trigger: { weeks = 0, days = 0, hours = 0, minutes = 0, isNegative = false }
}) => {
    const parsedTrigger = {
        weeks: getInt(weeks),
        days: getInt(days),
        hours: getInt(hours),
        minutes: getInt(minutes)
    };
    const isSameTime =
        parsedTrigger.weeks === 0 &&
        parsedTrigger.days === 0 &&
        parsedTrigger.hours === 0 &&
        parsedTrigger.minutes === 0;
    // If it's a negative trigger, or force negative for PT0S
    const when = isNegative || isSameTime ? NOTIFICATION_WHEN.BEFORE : NOTIFICATION_WHEN.AFTER;
    if (isAllDay) {
        return allDayTriggerToModel({ type, when, ...parsedTrigger });
    }
    return partDayTriggerToModel({ type, when, ...parsedTrigger });
};

export const propertiesToNotificationModel = ({ components = [] } = {}, isAllDay) => {
    return components
        .filter(({ component }) => component === 'valarm')
        .map(({ trigger, action }) => {
            const type =
                action && action.value.toLowerCase() === 'email' ? NOTIFICATION_TYPE.EMAIL : NOTIFICATION_TYPE.DEVICE;
            return triggerToModel({
                trigger: trigger ? trigger.value : {},
                type,
                isAllDay
            });
        });
};

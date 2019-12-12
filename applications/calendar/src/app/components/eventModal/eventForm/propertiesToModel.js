import { toUTCDate } from 'proton-shared/lib/date/timezone';
import { getDateTimeState } from './state';
import { FREQUENCY, NOTIFICATION_TYPE, NOTIFICATION_UNITS, NOTIFICATION_WHEN } from '../../../constants';
import { transformBeforeAt } from '../../../helpers/notifications';

export const propertiesToModel = (component) => {
    const { uid, location, description, summary, rrule, attendee, ...rest } = component;

    return {
        uid: uid ? uid.value : undefined,
        frequency: rrule && rrule.value ? rrule.value.freq : FREQUENCY.ONCE,
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

const getTzid = ({ value, parameters: { type, tzid } = {} }) => {
    if (type === 'date') {
        return;
    }
    return value.isUTC ? 'UTC' : tzid;
};

export const propertiesToDateTimeModel = ({ dtstart, dtend }, isAllDay, tzid) => {
    const tzStart = isAllDay ? undefined : getTzid(dtstart);
    const tzEnd = isAllDay ? undefined : getTzid(dtend);

    const relativeStart = toUTCDate(dtstart.value);
    const relativeEnd = toUTCDate(dtend.value);

    return {
        start: getDateTimeState(relativeStart, tzStart || tzid),
        end: getDateTimeState(relativeEnd, tzEnd || tzid)
    };
};

const getTriggerUnit = ({ isAllDay, weeks, hours, days, minutes }) => {
    const getInt = (value) => parseInt(value, 10) || 0;
    if (weeks) {
        return [getInt(weeks), NOTIFICATION_UNITS.WEEK];
    }
    if (days) {
        return [getInt(days), NOTIFICATION_UNITS.DAY];
    }
    // For all day notifications, the unit can not be hours or minutes.
    if (isAllDay) {
        return [0, NOTIFICATION_UNITS.DAY];
    }
    if (hours) {
        return [getInt(hours), NOTIFICATION_UNITS.HOURS];
    }
    return [getInt(minutes), NOTIFICATION_UNITS.MINUTES];
};

const modifyAllDayTrigger = (result) => {
    const { at, unit, value, when } = result;

    const isNegative = when === NOTIFICATION_WHEN.BEFORE;
    const isDays = unit === NOTIFICATION_UNITS.DAY;

    const modifiedAt = isNegative ? transformBeforeAt(at) : at;

    const hours = modifiedAt.getHours();
    const minutes = modifiedAt.getMinutes();

    const modifiedDays = isNegative && hours === 0 && minutes === 0 ? Math.max(value, 1) : value + 1;

    return {
        ...result,
        value: isDays ? modifiedDays : value,
        at: modifiedAt
    };
};

export const triggerToModel = ({
    isAllDay,
    type,
    // eslint-disable-next-line no-unused-vars
    trigger: { weeks = 0, days = 0, hours = 0, minutes = 0, isNegative = false }
}) => {
    const [value, unit] = getTriggerUnit({ isAllDay, weeks, hours, days, minutes });

    //const when = isNegative ? NOTIFICATION_WHEN.BEFORE : NOTIFICATION_WHEN.AFTER;
    const when = NOTIFICATION_WHEN.BEFORE;

    const result = {
        type,
        unit,
        when,
        value,
        // Only used for all day notifications
        at: new Date(2000, 0, 1, hours, minutes),
        isAllDay
    };

    return isAllDay ? modifyAllDayTrigger(result) : result;
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

import {
    convertUTCDateTimeToZone,
    convertZonedDateTimeToUTC,
    fromUTCDate,
    toUTCDate
} from 'proton-shared/lib/date/timezone';
import { getDateTimeState } from './state';
import { FREQUENCY, NOTIFICATION_TYPE, NOTIFICATION_UNITS, NOTIFICATION_WHEN } from '../../../constants';

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

const getNewTime = (newTime, specificTzid, tzid) => {
    // If there is no original timezone specified, the time is already in the UTC time of the calendar,
    if (!specificTzid) {
        return newTime;
    }
    // First convert the new time into true UTC time (and not the UTC time of the calendar)
    const actualUtcTime = convertZonedDateTimeToUTC(fromUTCDate(newTime), tzid);
    // Then convert the UTC time into the original timezone.
    return toUTCDate(convertUTCDateTimeToZone(actualUtcTime, specificTzid));
};

export const propertiesToDateTimeModel = ({ dtstart, dtend }, isAllDay, tzid, newStart, newEnd) => {
    const tzStart = isAllDay ? undefined : getTzid(dtstart);
    const tzEnd = isAllDay ? undefined : getTzid(dtend);

    const relativeNewStart = newStart ? getNewTime(newStart, tzStart, tzid) : undefined;
    const relativeNewEnd = newEnd ? getNewTime(newEnd, tzEnd, tzid) : undefined;

    const relativeStart = toUTCDate(dtstart.value);
    const relativeEnd = toUTCDate(dtend.value);

    return {
        start: getDateTimeState(relativeNewStart || relativeStart, tzStart || tzid),
        end: getDateTimeState(relativeNewEnd || relativeEnd, tzEnd || tzid)
    };
};

const getTriggerUnit = ({ isAllDay, weeks, hours, days, minutes }) => {
    if (weeks) {
        return [weeks, NOTIFICATION_UNITS.WEEK];
    }
    if (days) {
        return [days, NOTIFICATION_UNITS.DAY];
    }
    // For all day notificiations, the unit can not be hours or minutes.
    if (isAllDay) {
        return [0, NOTIFICATION_UNITS.DAY];
    }
    if (hours) {
        return [hours, NOTIFICATION_UNITS.HOURS];
    }
    return [minutes, NOTIFICATION_UNITS.MINUTES];
};

export const triggerToModel = ({
    isAllDay,
    type,
    trigger: { weeks = 0, days = 0, hours = 0, minutes = 0, isNegative = false }
}) => {
    const [value, unit] = getTriggerUnit({ isAllDay, weeks, hours, days, minutes });
    return {
        type,
        unit,
        when: isNegative ? NOTIFICATION_WHEN.BEFORE : NOTIFICATION_WHEN.AFTER,
        value,
        // Only used for all day notifications
        at: new Date(2000, 0, 1, hours, minutes),
        isAllDay
    };
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

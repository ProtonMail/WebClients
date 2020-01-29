import { withRequiredProperties } from 'proton-shared/lib/calendar/veventHelper';
import { getDateProperty, getDateTimeProperty } from 'proton-shared/lib/calendar/vcalConverter';
import { fromLocalDate, convertZonedDateTimeToUTC } from 'proton-shared/lib/date/timezone';
import { unique } from 'proton-shared/lib/helpers/array';
import { addDays } from 'date-fns';

import { transformBeforeAt } from './trigger';
import {
    NOTIFICATION_TYPE,
    NOTIFICATION_UNITS,
    NOTIFICATION_WHEN,
    FREQUENCY,
    MAX_LENGTHS,
    NUMBER_TO_DAY,
    END_TYPE
} from '../../../constants';

const getValarmTriggerUnit = (unit) => {
    return (
        {
            [NOTIFICATION_UNITS.WEEK]: 'weeks',
            [NOTIFICATION_UNITS.DAY]: 'days',
            [NOTIFICATION_UNITS.HOURS]: 'hours',
            [NOTIFICATION_UNITS.MINUTES]: 'minutes'
        }[unit] || 'days'
    );
};

const getAllDayValarmTrigger = ({ isNegative, unit, value, at }) => {
    const modifiedAt = isNegative ? transformBeforeAt(at) : at;

    const hours = modifiedAt.getHours();
    const minutes = modifiedAt.getMinutes();

    const modifyNegativeDay = isNegative && (minutes > 0 || hours > 0);

    const [weeks, days] = (() => {
        const weeksValue = unit === NOTIFICATION_UNITS.WEEK ? value : 0;
        const daysValue = unit === NOTIFICATION_UNITS.DAY ? value : 0;

        if (modifyNegativeDay && weeksValue === 0) {
            return [0, daysValue - 1];
        }
        if (modifyNegativeDay && weeksValue >= 1) {
            return [weeksValue - 1, 6];
        }
        return [weeksValue, daysValue];
    })();

    return {
        weeks: Math.max(0, weeks),
        days: Math.max(0, days),
        hours,
        minutes,
        seconds: 0,
        isNegative
    };
};

const getPartDayValarmTrigger = ({ isNegative, unit, value }) => {
    return {
        weeks: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        [getValarmTriggerUnit(unit)]: value,
        isNegative
    };
};

export const getValarmTrigger = ({ isAllDay, unit, when, value, at }) => {
    const isNegative = when === NOTIFICATION_WHEN.BEFORE;
    return isAllDay
        ? getAllDayValarmTrigger({ isNegative, unit, value, at })
        : getPartDayValarmTrigger({ isNegative, unit, value });
};

const modelToDateProperty = ({ date, time, tzid }, isAllDay) => {
    const dateObject = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
    };

    if (isAllDay) {
        return getDateProperty(dateObject);
    }

    const dateTimeObject = {
        ...dateObject,
        hours: time.getHours(),
        minutes: time.getMinutes()
    };

    return getDateTimeProperty(dateTimeObject, tzid);
};

const modelToDateProperties = ({ start, end, isAllDay }) => {
    const dtstart = modelToDateProperty(start, isAllDay);

    // All day events date ranges are stored non-inclusively, so add a full day from the selected date to the end date
    const modifiedEnd = isAllDay ? { ...end, date: addDays(end.date, 1) } : end;
    const dtend = modelToDateProperty(modifiedEnd, isAllDay);

    return {
        dtstart,
        dtend
    };
};

export const modelToFrequencyProperties = ({ frequencyModel, start = {}, isAllDay }) => {
    const { type, frequency, interval, weekly, ends } = frequencyModel;
    const { tzid } = start;
    const properties = {};

    if ([FREQUENCY.DAILY, FREQUENCY.WEEKLY, FREQUENCY.MONTHLY, FREQUENCY.YEARLY].includes(type)) {
        properties.rrule = { value: { freq: type } };
    }
    if (type === FREQUENCY.CUSTOM) {
        properties.rrule = { value: { freq: frequency, interval } };
        if (frequency === FREQUENCY.WEEKLY && weekly.days && weekly.days.length) {
            // weekly.days may include repeated days (cf. function getFrequencyModelChange)
            const weeklyDays = unique(weekly.days);
            properties.rrule.value.byday = weeklyDays.map((day) => NUMBER_TO_DAY[day]).join(',');
        }
        if (ends.type === END_TYPE.AFTER_N_TIMES) {
            properties.rrule.value.count = ends.count;
        }
        if (ends.type === END_TYPE.UNTIL) {
            // According to the RFC, we should use UTC dates if and only if the event is not all-day.
            const untilDateTime = fromLocalDate(ends.until);
            if (isAllDay) {
                // we should use a floating date in this case
                properties.rrule.value.until = {
                    year: untilDateTime.year,
                    month: untilDateTime.month,
                    day: untilDateTime.day
                };
            } else {
                // pick end of day in the event start date timezone
                const zonedEndOfDay = { ...untilDateTime, hours: 23, minutes: 59, seconds: 59 };
                const utcEndOfDay = convertZonedDateTimeToUTC(zonedEndOfDay, tzid);
                properties.rrule.value.until = { ...utcEndOfDay, isUTC: true };
            }
        }
    }
    return properties;
};

export const modelToGeneralProperties = ({ uid, title, location, description, frequency, attendees, rest }) => {
    const properties = {
        summary: { value: title.trim().slice(0, MAX_LENGTHS.TITLE) },
        ...rest
    };

    if (uid) {
        properties.uid = { value: uid };
    }

    if (location) {
        properties.location = { value: location.slice(0, MAX_LENGTHS.LOCATION) };
    }

    if (description) {
        properties.description = { value: description.slice(0, MAX_LENGTHS.DESCRIPTION) };
    }

    if (frequency && frequency !== FREQUENCY.ONCE) {
        properties.rrule = { value: { freq: frequency } };
    }

    if (Array.isArray(attendees) && attendees.length) {
        /*
        properties.organizer = {
            value: organizer.email,
            parameters: {
                cn: organizer.name
            }
        };
         */
        properties.attendee = attendees.map(({ name, email, permissions, rsvp }) => ({
            value: email,
            parameters: {
                //cutype: 'INDIVIDUAL',
                cn: name,
                //role: rsvp ? 'REQ-PARTICIPANT' : 'NON-PARTICIPANT',
                rsvp: rsvp ? 'TRUE' : 'FALSE',
                'x-pm-permissions': permissions
            }
        }));
    }

    return properties;
};

const modelToValarmComponent = ({ type, ...rest }) => {
    return {
        component: 'valarm',
        trigger: {
            value: getValarmTrigger(rest)
        },
        action: {
            value: type === NOTIFICATION_TYPE.EMAIL ? 'EMAIL' : 'DISPLAY'
        }
    };
};

const modelToValarmComponents = ({ isAllDay, fullDayNotifications, partDayNotifications }) => {
    const notifications = isAllDay ? fullDayNotifications : partDayNotifications;
    return notifications.map((notification) => modelToValarmComponent(notification));
};

export const modelToVeventComponent = (model) => {
    const dateProperties = modelToDateProperties(model);
    const frequencyProperties = modelToFrequencyProperties(model);
    const generalProperties = modelToGeneralProperties(model);
    const valarmComponents = modelToValarmComponents(model);

    const components = [...valarmComponents];

    return withRequiredProperties({
        component: 'vevent',
        components,
        ...generalProperties,
        ...frequencyProperties,
        ...dateProperties
    });
};

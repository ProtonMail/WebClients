import { withRequiredProperties } from 'proton-shared/lib/calendar/veventHelper';
import { getDateProperty, getDateTimeProperty } from 'proton-shared/lib/calendar/vcalConverter';

import { NOTIFICATION_TYPE, NOTIFICATION_UNITS, NOTIFICATION_WHEN, FREQUENCY } from '../../../constants';

const getValarmTriggerAt = (date) => {
    return {
        hours: date.getHours(),
        minutes: date.getMinutes(),
        seconds: 0
    };
};

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

export const getValarmTrigger = ({ isAllDay, unit, when, value, at }) => {
    const isNegative = when === NOTIFICATION_WHEN.BEFORE;
    return {
        weeks: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        [getValarmTriggerUnit(unit)]: value,
        ...(isAllDay ? getValarmTriggerAt(at) : {}),
        isNegative
    };
};

export const modelToDateProperty = ({ isAllDay, date, time, tzid: specificTzid }, tzid) => {
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

    return getDateTimeProperty(dateTimeObject, specificTzid, tzid);
};

export const modelToGeneralProperties = ({ uid, title, location, description, frequency, attendees, rest }) => {
    const properties = {
        summary: { value: title },
        ...rest
    };

    if (uid) {
        properties.uid = { value: uid };
    }

    if (location) {
        properties.location = { value: location };
    }

    if (description) {
        properties.description = { value: description };
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

const modelToValarmComponents = (notifications) => {
    return notifications.map((notification) => modelToValarmComponent(notification));
};

export const modelToVeventComponent = (model, tzid, oldComponent) => {
    const { start, end, isAllDay, fullDayNotifications, partDayNotifications } = model;

    const dtStartProperty = modelToDateProperty({ ...start, isAllDay }, tzid);
    const dtEndProperty = modelToDateProperty({ ...end, isAllDay }, tzid);

    const generalProperties = modelToGeneralProperties(model);

    const valarmComponents = modelToValarmComponents(isAllDay ? fullDayNotifications : partDayNotifications);

    const components = [...valarmComponents];

    return withRequiredProperties({
        ...oldComponent,
        component: 'vevent',
        components,
        ...generalProperties,
        dtstart: dtStartProperty,
        dtend: dtEndProperty
    });
};

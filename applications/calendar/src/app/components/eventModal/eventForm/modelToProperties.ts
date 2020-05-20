import { withRequiredProperties } from 'proton-shared/lib/calendar/veventHelper';
import { getDateProperty, getDateTimeProperty } from 'proton-shared/lib/calendar/vcalConverter';
import { addDays } from 'date-fns';

import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import modelToFrequencyProperties from './modelToFrequencyProperties';
import { MAX_LENGTHS } from '../../../constants';
import { modelToValarmComponent } from './modelToValarm';
import { DateTimeModel, EventModel } from '../../../interfaces/EventModel';

const modelToDateProperty = ({ date, time, tzid }: DateTimeModel, isAllDay: boolean) => {
    const dateObject = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
    };

    if (isAllDay) {
        return getDateProperty(dateObject);
    }

    const dateTimeObject = {
        ...dateObject,
        hours: time.getHours(),
        minutes: time.getMinutes(),
        seconds: 0,
    };

    return getDateTimeProperty(dateTimeObject, tzid);
};

const modelToDateProperties = ({ start, end, isAllDay }: EventModel) => {
    const dtstart = modelToDateProperty(start, isAllDay);

    // All day events date ranges are stored non-inclusively, so add a full day from the selected date to the end date
    const modifiedEnd = isAllDay ? { ...end, date: addDays(end.date, 1) } : end;
    const dtend = modelToDateProperty(modifiedEnd, isAllDay);

    return {
        dtstart,
        dtend,
    };
};

export const modelToGeneralProperties = ({
    uid,
    title,
    location,
    description,
    attendees,
    rest,
}: Partial<EventModel>): VcalVeventComponent => {
    const properties = {
        ...rest,
    };

    if (title) {
        properties.summary = { value: title.trim().slice(0, MAX_LENGTHS.TITLE) };
    }

    if (uid) {
        properties.uid = { value: uid };
    }

    if (location) {
        properties.location = { value: location.slice(0, MAX_LENGTHS.LOCATION) };
    }

    if (description) {
        properties.description = { value: description.slice(0, MAX_LENGTHS.EVENT_DESCRIPTION) };
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
                // cutype: 'INDIVIDUAL',
                cn: name,
                // role: rsvp ? 'REQ-PARTICIPANT' : 'NON-PARTICIPANT',
                rsvp: rsvp ? 'TRUE' : 'FALSE',
                'x-pm-permissions': permissions,
            },
        }));
    }

    return properties;
};

const modelToValarmComponents = ({ isAllDay, fullDayNotifications, partDayNotifications }: EventModel) => {
    const notifications = isAllDay ? fullDayNotifications : partDayNotifications;
    return notifications.map((notification) => modelToValarmComponent(notification));
};

export const modelToVeventComponent = (model: EventModel) => {
    const dateProperties = modelToDateProperties(model);
    const frequencyProperties = modelToFrequencyProperties(model);
    const generalProperties = modelToGeneralProperties(model);
    const valarmComponents = modelToValarmComponents(model);

    const components = [...valarmComponents];

    return withRequiredProperties({
        ...generalProperties,
        ...frequencyProperties,
        ...dateProperties,
        component: 'vevent',
        components,
    });
};

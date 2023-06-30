import { addDays, isSameDay } from 'date-fns';

import { dedupeNotifications } from '@proton/shared/lib/calendar/alarms';
import { modelToValarmComponent } from '@proton/shared/lib/calendar/alarms/modelToValarm';
import { ICAL_EVENT_STATUS, MAX_CHARS_API } from '@proton/shared/lib/calendar/constants';
import {
    buildVcalOrganizer,
    getDateProperty,
    getDateTimeProperty,
    propertyToUTCDate,
} from '@proton/shared/lib/calendar/vcalConverter';
import { withRequiredProperties } from '@proton/shared/lib/calendar/veventHelper';
import { omit } from '@proton/shared/lib/helpers/object';
import { DateTimeModel, EventModel } from '@proton/shared/lib/interfaces/calendar';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';

import modelToFrequencyProperties from './modelToFrequencyProperties';

export const modelToDateProperty = ({ date, time, tzid }: DateTimeModel, isAllDay: boolean) => {
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

    const ignoreDtend = isAllDay
        ? isSameDay(start.date, end.date)
        : +propertyToUTCDate(dtstart) === +propertyToUTCDate(dtend);

    return ignoreDtend ? { dtstart } : { dtstart, dtend };
};

export const modelToGeneralProperties = ({
    uid,
    title,
    location,
    description,
    status,
    rest,
}: Partial<EventModel>): Omit<VcalVeventComponent, 'dtstart' | 'dtend'> => {
    const properties = omit(rest, ['dtstart', 'dtend']);

    if (title) {
        properties.summary = { value: title.trim().slice(0, MAX_CHARS_API.TITLE) };
    }

    if (uid) {
        properties.uid = { value: uid };
    }

    if (location) {
        properties.location = { value: location.slice(0, MAX_CHARS_API.LOCATION) };
    }

    if (description) {
        properties.description = { value: description.slice(0, MAX_CHARS_API.EVENT_DESCRIPTION) };
    }
    properties.status = { value: status || ICAL_EVENT_STATUS.CONFIRMED };

    return properties;
};

const modelToOrganizerProperties = ({ organizer }: EventModel) => {
    const organizerEmail = organizer?.email;
    if (!organizerEmail) {
        return {};
    }
    return {
        organizer: buildVcalOrganizer(organizerEmail, organizer?.cn || organizerEmail),
    };
};

const modelToAttendeeProperties = ({ attendees }: EventModel) => {
    if (!Array.isArray(attendees) || !attendees.length) {
        return {};
    }
    return {
        attendee: attendees.map(({ email, rsvp, role, token, partstat }) => ({
            value: email,
            parameters: {
                // cutype: 'INDIVIDUAL',
                cn: email,
                role,
                rsvp,
                partstat,
                'x-pm-token': token,
            },
        })),
    };
};

export const modelToValarmComponents = ({ isAllDay, fullDayNotifications, partDayNotifications }: EventModel) =>
    dedupeNotifications(isAllDay ? fullDayNotifications : partDayNotifications).map((notification) =>
        modelToValarmComponent(notification)
    );

export const modelToVeventComponent = (model: EventModel) => {
    const dateProperties = modelToDateProperties(model);
    const frequencyProperties = modelToFrequencyProperties(model);
    const organizerProperties = modelToOrganizerProperties(model);
    const attendeeProperties = modelToAttendeeProperties(model);
    const generalProperties = modelToGeneralProperties(model);
    const valarmComponents = modelToValarmComponents(model);

    const components = [...valarmComponents];

    return withRequiredProperties({
        ...generalProperties,
        ...frequencyProperties,
        ...dateProperties,
        ...organizerProperties,
        ...attendeeProperties,
        component: 'vevent',
        components,
    });
};

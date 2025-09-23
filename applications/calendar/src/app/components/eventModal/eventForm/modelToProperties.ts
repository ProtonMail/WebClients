import { addDays, isSameDay } from 'date-fns';

import {
    addVideoConfInfoToDescription,
    removeVideoConfInfoFromDescription,
} from '@proton/calendar/components/videoConferencing/videoConfHelpers';
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
import type { DateTimeModel, EventModel } from '@proton/shared/lib/interfaces/calendar';
import type { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';

import modelToFrequencyProperties from './modelToFrequencyProperties';
import { hasVideoConf } from './utils';

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
    status,
    color,
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

    if (color) {
        properties.color = { value: color };
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

const modelToVideoConferenceProperties = ({
    conferenceId,
    conferencePassword,
    conferenceUrl,
    conferenceHost,
    conferenceProvider,
    encryptedTitle,
}: Partial<EventModel>) => {
    if (!conferenceId || !conferenceUrl) {
        return;
    }

    return {
        'x-pm-conference-id': {
            value: conferenceId,
            parameters: {
                'x-pm-provider': String(conferenceProvider),
            },
        },
        'x-pm-conference-url': {
            value: conferenceUrl,
            parameters: {
                ...(conferencePassword && { 'x-pm-password': conferencePassword }),
                ...(conferenceHost && { 'x-pm-host': conferenceHost }),
            },
        },
        ...(encryptedTitle && { encryptedTitle: { value: encryptedTitle } }),
    };
};

const modelToDescriptionProperties = ({
    description,
    conferenceId,
    conferencePassword,
    conferenceUrl,
    conferenceHost,
    conferenceProvider,
}: Partial<EventModel>) => {
    const modelHasVideoConf = hasVideoConf(conferenceId, conferenceUrl, conferenceProvider);

    // Return an empty object if there is no description and no video conference
    if (!description && !modelHasVideoConf) {
        return {};
    }

    // Return the description if there is no video conference
    if (description && !modelHasVideoConf) {
        const cleanedDescription = removeVideoConfInfoFromDescription(description ?? '');
        return { description: { value: cleanedDescription?.slice(0, MAX_CHARS_API.EVENT_DESCRIPTION) } };
    }

    // We remove the video conferencing info from the description to avoid saving it twice
    const cleanedDescription = removeVideoConfInfoFromDescription(description ?? '');
    // We slice the description smaller to avoid too long descriptions with the generated video conferencing info
    const slicedDescription = cleanedDescription?.slice(0, MAX_CHARS_API.EVENT_DESCRIPTION);

    const newDescription = addVideoConfInfoToDescription({
        host: conferenceHost,
        meedingURL: conferenceUrl,
        password: conferencePassword,
        meetingId: conferenceId,
        description: slicedDescription,
        provider: conferenceProvider,
    });

    return {
        description: { value: newDescription },
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
    const descriptionProperties = modelToDescriptionProperties(model);
    const videoConferenceProperties = modelToVideoConferenceProperties(model);

    return withRequiredProperties({
        ...generalProperties,
        ...frequencyProperties,
        ...dateProperties,
        ...organizerProperties,
        ...attendeeProperties,
        ...videoConferenceProperties,
        ...descriptionProperties,
        component: 'vevent',
        components: [...valarmComponents],
    });
};

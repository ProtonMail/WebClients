import { c } from 'ttag';

import { apiNotificationsToModel } from '@proton/shared/lib/calendar/alarms/notificationsToModel';
import { ICAL_ATTENDEE_STATUS } from '@proton/shared/lib/calendar/constants';
import { canonicalizeEmail, canonicalizeEmailByGuess } from '@proton/shared/lib/helpers/email';
import { CalendarSettings, EventModel } from '@proton/shared/lib/interfaces/calendar';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { RequireOnly, SimpleMap } from '@proton/shared/lib/interfaces/utils';

import { DisplayNameEmail } from '../containers/calendar/interface';

const { NEEDS_ACTION, DECLINED, ACCEPTED, TENTATIVE } = ICAL_ATTENDEE_STATUS;

export const modifyEventModelPartstat = (
    model: RequireOnly<EventModel, 'isAllDay'>,
    partstat: ICAL_ATTENDEE_STATUS,
    calendarSettings: CalendarSettings
): Partial<EventModel> => {
    const { attendees = [], isAllDay, selfAttendeeIndex } = model;
    const selfAttendee = selfAttendeeIndex !== undefined ? attendees[selfAttendeeIndex] : undefined;
    let addDefaultNotifications = false;
    const modelWithPartstat = { ...model };
    const notificationsKey = isAllDay ? 'fullDayNotifications' : 'partDayNotifications';
    if (modelWithPartstat.attendees && selfAttendee && selfAttendeeIndex !== undefined) {
        addDefaultNotifications =
            [NEEDS_ACTION, DECLINED].includes(selfAttendee.partstat) &&
            [ACCEPTED, TENTATIVE].includes(partstat) &&
            model[notificationsKey]?.length === 0;
        modelWithPartstat.attendees[selfAttendeeIndex].partstat = partstat;
    }
    if (partstat === DECLINED) {
        return {
            ...modelWithPartstat,
            hasDefaultNotifications: false,
            partDayNotifications: [],
            fullDayNotifications: [],
        };
    }
    if (!addDefaultNotifications) {
        return modelWithPartstat;
    }

    const notifications = apiNotificationsToModel({ notifications: null, isAllDay, calendarSettings });
    return {
        ...modelWithPartstat,
        hasDefaultNotifications: true,
        [notificationsKey]: notifications,
    };
};

export const getOrganizerDisplayData = (
    organizer = { email: '', cn: '' },
    isSelfOrganizer: boolean,
    contactEmailsMap: SimpleMap<ContactEmail>,
    displayNameEmailMap: SimpleMap<DisplayNameEmail>
) => {
    const { email, cn } = organizer;
    if (!email) {
        // it should not happen
        return { name: '', title: '' };
    }

    const { displayName } = displayNameEmailMap[canonicalizeEmailByGuess(email)] || {};
    const { ContactID: contactID } = contactEmailsMap[canonicalizeEmail(email)] || {};

    if (isSelfOrganizer) {
        return {
            name: c('Event info. Organizer name').t`You`,
            title: `${email}`,
            contactID,
        };
    }

    const name = displayName || cn || email;
    const title = name === email ? email : `${name} <${email}>`;

    return { name, title, contactID };
};

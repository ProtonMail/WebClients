import { c } from 'ttag';

import { apiNotificationsToModel } from '@proton/shared/lib/calendar/alarms/notificationsToModel';
import { ICAL_ATTENDEE_STATUS } from '@proton/shared/lib/calendar/constants';
import { canonicalizeEmail, canonicalizeEmailByGuess } from '@proton/shared/lib/helpers/email';
import { getInitials } from '@proton/shared/lib/helpers/string';
import type { CalendarSettings, EventModel } from '@proton/shared/lib/interfaces/calendar';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import type { RequireOnly, SimpleMap } from '@proton/shared/lib/interfaces/utils';

import type { DisplayNameEmail } from '../containers/calendar/interface';

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
            [ICAL_ATTENDEE_STATUS.NEEDS_ACTION, ICAL_ATTENDEE_STATUS.DECLINED].includes(selfAttendee.partstat) &&
            [ICAL_ATTENDEE_STATUS.ACCEPTED, ICAL_ATTENDEE_STATUS.TENTATIVE].includes(partstat) &&
            model[notificationsKey]?.length === 0;
        modelWithPartstat.attendees[selfAttendeeIndex].partstat = partstat;
    }
    if (partstat === ICAL_ATTENDEE_STATUS.DECLINED) {
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
        return { name: '', title: '', initials: '' };
    }

    const { displayName } = displayNameEmailMap[canonicalizeEmailByGuess(email)] || {};
    const { ContactID: contactID } = contactEmailsMap[canonicalizeEmail(email)] || {};

    if (isSelfOrganizer) {
        return {
            name: c('Event info. Organizer name').t`You`,
            title: `${email}`,
            contactID,
            initials: getInitials(displayName || cn || email),
        };
    }

    const name = displayName || cn || email;
    const title = name === email ? email : `${name} <${email}>`;
    const initials = getInitials(name);

    return { name, title, contactID, initials };
};

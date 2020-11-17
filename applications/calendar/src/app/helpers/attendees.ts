import { c } from 'ttag';
import { ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import { CalendarSettings } from 'proton-shared/lib/interfaces/calendar';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { SimpleMap } from 'proton-shared/lib/interfaces/utils';
import { getDeviceNotifications } from '../components/eventModal/eventForm/notificationModel';
import { EventModel, OrganizerModel } from '../interfaces/EventModel';
import { notificationsToModel } from './notificationsToModel';

const { NEEDS_ACTION, DECLINED, ACCEPTED, TENTATIVE } = ICAL_ATTENDEE_STATUS;

export const modifyEventModelPartstat = (
    model: Partial<EventModel>,
    partstat: ICAL_ATTENDEE_STATUS,
    calendarSettings: CalendarSettings
): Partial<EventModel> => {
    const { attendees = [], isAllDay, selfAttendeeIndex } = model;
    const selfAttendee = selfAttendeeIndex !== undefined ? attendees[selfAttendeeIndex] : undefined;
    let addDefaultNotifications = false;
    const modelWithPartstat = { ...model };
    if (modelWithPartstat.attendees && selfAttendee && selfAttendeeIndex !== undefined) {
        addDefaultNotifications =
            [NEEDS_ACTION, DECLINED].includes(selfAttendee.partstat) &&
            [ACCEPTED, TENTATIVE].includes(partstat) &&
            (isAllDay ? model.fullDayNotifications?.length === 0 : model.partDayNotifications?.length === 0);
        modelWithPartstat.attendees[selfAttendeeIndex].partstat = partstat;
    }
    if (partstat === DECLINED) {
        return {
            ...modelWithPartstat,
            partDayNotifications: [],
            fullDayNotifications: [],
        };
    }
    if (!addDefaultNotifications) {
        return modelWithPartstat;
    }
    const { DefaultPartDayNotifications, DefaultFullDayNotifications } = calendarSettings;
    return {
        ...modelWithPartstat,
        partDayNotifications: getDeviceNotifications(notificationsToModel(DefaultPartDayNotifications, false)),
        fullDayNotifications: getDeviceNotifications(notificationsToModel(DefaultFullDayNotifications, true)),
    };
};

export const getOrganizerDisplayData = (
    organizer: OrganizerModel,
    isInvitation: boolean,
    contactEmailMap: SimpleMap<ContactEmail>
) => {
    const { email, cn } = organizer;
    if (!isInvitation) {
        return {
            name: c('Event info. Organizer name').t`You`,
            title: `${email}`,
        };
    }
    const contact = contactEmailMap[email];
    const safeCn = cn || email;
    const name = contact ? contact.Name : safeCn;
    const title = contact ? `${name} <${contact.Email}>` : `${safeCn} <${email}>`;
    return { name, title };
};

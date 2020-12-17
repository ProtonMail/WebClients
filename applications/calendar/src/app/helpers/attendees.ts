import { c } from 'ttag';
import { toIcsPartstat } from 'proton-shared/lib/calendar/attendees';
import { normalizeEmail, normalizeInternalEmail } from 'proton-shared/lib/helpers/email';
import { ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import { CalendarEvent, CalendarSettings } from 'proton-shared/lib/interfaces/calendar';
import { SimpleMap } from 'proton-shared/lib/interfaces/utils';
import { getDeviceNotifications } from '../components/eventModal/eventForm/notificationModel';
import { DisplayNameEmail } from '../containers/calendar/interface';
import { EventModel } from '../interfaces/EventModel';
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
    organizer = { email: '', cn: '' },
    isInvitation: boolean,
    displayNameEmailMap: SimpleMap<DisplayNameEmail>
) => {
    const { email, cn } = organizer;
    if (!email) {
        return {
            name: '',
            title: '',
        };
    }
    const normalizedEmail = isInvitation ? normalizeEmail(email) : normalizeInternalEmail(email);
    if (!isInvitation) {
        return {
            name: c('Event info. Organizer name').t`You`,
            title: `${email}`,
        };
    }
    const { displayName } = displayNameEmailMap[normalizedEmail] || {};
    const name = displayName || cn || email;
    const title = name === email ? email : `${name} (${email})`;
    return { name, title };
};

export const getHasAnsweredSingleEdits = (events: CalendarEvent[], token?: string) => {
    if (!token) {
        return false;
    }
    return events.some(({ Attendees }) => {
        const selfAttendee = Attendees.find(({ Token }) => Token === token);
        return selfAttendee && toIcsPartstat(selfAttendee.Status) !== ICAL_ATTENDEE_STATUS.NEEDS_ACTION;
    });
};

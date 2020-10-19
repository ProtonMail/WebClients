import { ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import { cleanEmail } from 'proton-shared/lib/helpers/email';
import { Address } from 'proton-shared/lib/interfaces';
import { CalendarSettings } from 'proton-shared/lib/interfaces/calendar';
import { getDeviceNotifications } from '../components/eventModal/eventForm/notificationModel';
import { AttendeeModel, EventModel } from '../interfaces/EventModel';
import { notificationsToModel } from './notificationsToModel';

const { NEEDS_ACTION, DECLINED, ACCEPTED, TENTATIVE } = ICAL_ATTENDEE_STATUS;

export const modifyEventModelPartstat = (
    model: Partial<EventModel>,
    partstat: ICAL_ATTENDEE_STATUS,
    addresses: Address[],
    calendarSettings: CalendarSettings
): Partial<EventModel> => {
    const { attendees = [], isAllDay } = model;
    const { modelWithPartstat, addDefaultNotifications } = addresses.reduce(
        (acc, { Email }) => {
            const attendeeIndex = attendees.findIndex(({ email }) => cleanEmail(email) === cleanEmail(Email));
            if (attendeeIndex !== -1 && model.attendees && acc.modelWithPartstat.attendees) {
                const oldPartsat = model.attendees[attendeeIndex].partstat;
                acc.modelWithPartstat.attendees[attendeeIndex].partstat = partstat;
                acc.addDefaultNotifications =
                    [NEEDS_ACTION, DECLINED].includes(oldPartsat) &&
                    [ACCEPTED, TENTATIVE].includes(partstat) &&
                    (isAllDay ? model.fullDayNotifications?.length === 0 : model.partDayNotifications?.length === 0);
            }
            return acc;
        },
        { modelWithPartstat: { ...model }, addDefaultNotifications: false }
    );
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

export const findUserAttendeeModel = (attendees: AttendeeModel[] = [], addresses: Address[]) => {
    const cleanUserEmails = addresses.map(({ Email }) => cleanEmail(Email));
    return attendees.reduce<{ userAttendee?: AttendeeModel; userAddress?: Address }>((acc, attendee) => {
        if (acc.userAttendee && acc.userAddress) {
            return acc;
        }
        const cleanAttendeeEmail = cleanEmail(attendee.email);
        const index = cleanUserEmails.findIndex((email) => email === cleanAttendeeEmail);
        if (index === -1) {
            return acc;
        }
        return { userAttendee: attendee, userAddress: addresses[index] };
    }, {});
};

import { c } from 'ttag';
import { cleanEmail, normalizeInternalEmail } from '../../helpers/email';
import { omit, pick } from '../../helpers/object';
import { Address } from '../../interfaces';
import { CalendarSettings, Participant, SETTINGS_NOTIFICATION_TYPE } from '../../interfaces/calendar';
import {
    VcalAttendeeProperty,
    VcalOrganizerProperty,
    VcalValarmComponent,
    VcalVcalendar,
    VcalVeventComponent,
    VcalVtimezoneComponent,
} from '../../interfaces/calendar/VcalModel';
import { ContactEmail } from '../../interfaces/contacts';
import { RequireSome } from '../../interfaces/utils';
import { getAttendeeEmail } from '../attendees';
import { ICAL_ATTENDEE_STATUS } from '../constants';
import { fromTriggerString, serialize } from '../vcal';
import { getAttendeePartstat, getAttendeeRole, getIsAlarmComponent, getIsAllDay } from '../vcalHelper';
import { withDtstamp } from '../veventHelper';

export const getParticipantHasAddressID = (
    participant: Participant
): participant is RequireSome<Participant, 'addressID'> => {
    return !!participant.addressID;
};

export const getParticipant = (
    participant: VcalAttendeeProperty | VcalOrganizerProperty,
    contactEmails: ContactEmail[],
    ownAddresses: Address[],
    emailTo?: string
): Participant => {
    const emailAddress = getAttendeeEmail(participant);
    const normalizedEmailAddress = normalizeInternalEmail(emailAddress);
    const selfAddress = ownAddresses.find(({ Email }) => normalizeInternalEmail(Email) === normalizedEmailAddress);
    const isYou = emailTo ? normalizeInternalEmail(emailTo) === normalizedEmailAddress : !!selfAddress;
    const contact = contactEmails.find(({ Email }) => cleanEmail(Email) === cleanEmail(emailAddress));
    const participantName = participant?.parameters?.cn || emailAddress;
    const displayName = selfAddress?.DisplayName || contact?.Name || participantName;
    const result: Participant = {
        vcalComponent: participant,
        name: participantName,
        emailAddress,
        displayName: isYou ? c('Participant name').t`You` : displayName,
        displayEmail: emailAddress,
    };
    const { partstat, role, email } = (participant as VcalAttendeeProperty).parameters || {};
    if (partstat) {
        result.partstat = getAttendeePartstat(participant);
    }
    if (role) {
        result.role = getAttendeeRole(participant);
    }
    if (email) {
        result.displayEmail = email;
    }
    if (selfAddress) {
        result.addressID = selfAddress.ID;
        // Use Proton form of the email address (important for sending email)
        result.emailAddress = selfAddress.Email;
    }
    return result;
};

interface CreateReplyIcsParams {
    prodId: string;
    emailTo: string;
    partstat: ICAL_ATTENDEE_STATUS;
    vevent: VcalVeventComponent;
    vtimezone?: VcalVtimezoneComponent;
    keepDtstamp?: boolean;
}

export const createReplyIcs = ({
    prodId,
    emailTo,
    partstat,
    vevent,
    vtimezone,
    keepDtstamp,
}: CreateReplyIcsParams): string => {
    // only put RFC-mandatory fields to make reply as short as possible
    // rrule, summary and location are also included for a better UI in the external provider widget
    const propertiesToKeep: (keyof VcalVeventComponent)[] = [
        'uid',
        'dtstart',
        'dtend',
        'sequence',
        'recurrence-id',
        'organizer',
        'rrule',
        'location',
        'summary',
    ];
    // use current time as dtstamp unless indicated otherwise
    if (keepDtstamp) {
        propertiesToKeep.push('dtstamp');
    }
    const replyVevent = withDtstamp({
        ...pick(vevent, propertiesToKeep),
        component: 'vevent',
        attendee: [
            {
                value: emailTo,
                parameters: { partstat },
            },
        ],
    });
    const replyVcal: RequireSome<VcalVcalendar, 'components'> = {
        component: 'vcalendar',
        components: [replyVevent],
        prodid: { value: prodId },
        version: { value: '2.0' },
        method: { value: 'REPLY' },
        calscale: { value: 'GREGORIAN' },
    };
    if (vtimezone) {
        replyVcal.components.unshift(vtimezone);
    }
    return serialize(replyVcal);
};

export const findAttendee = (email: string, attendees: VcalAttendeeProperty[] = []) => {
    const cleanedEmail = cleanEmail(email);
    const index = attendees.findIndex((attendee) => cleanEmail(getAttendeeEmail(attendee)) === cleanedEmail);
    const attendee = index !== -1 ? attendees[index] : undefined;
    return { index, attendee };
};

export function getSelfAttendeeData(attendees: VcalAttendeeProperty[] = [], addresses: Address[] = []) {
    const normalizedAttendeeEmails = attendees.map((attendee) => cleanEmail(getAttendeeEmail(attendee)));
    // start checking active addresses
    const activeAddresses = addresses.filter(({ Status }) => Status !== 0);
    const { selfActiveAttendee, selfActiveAddress, selfActiveAttendeeIndex } = activeAddresses.reduce<{
        selfActiveAttendee?: VcalAttendeeProperty;
        selfActiveAttendeeIndex?: number;
        selfActiveAddress?: Address;
        answeredAttendeeFound: boolean;
    }>(
        (acc, address) => {
            if (acc.answeredAttendeeFound) {
                return acc;
            }
            const cleanSelfEmail = cleanEmail(address.Email, true);
            const index = normalizedAttendeeEmails.findIndex((email) => email === cleanSelfEmail);
            if (index === -1) {
                return acc;
            }
            const attendee = attendees[index];
            const partstat = getAttendeePartstat(attendee);
            const answeredAttendeeFound = partstat !== ICAL_ATTENDEE_STATUS.NEEDS_ACTION;
            if (answeredAttendeeFound || !(acc.selfActiveAttendee && acc.selfActiveAddress)) {
                return {
                    selfActiveAttendee: attendee,
                    selfActiveAddress: address,
                    selfActiveAttendeeIndex: index,
                    answeredAttendeeFound,
                };
            }
            return acc;
        },
        { answeredAttendeeFound: false }
    );
    if (selfActiveAttendee && selfActiveAddress) {
        return {
            selfAttendee: selfActiveAttendee,
            selfAddress: selfActiveAddress,
            selfAttendeeIndex: selfActiveAttendeeIndex,
        };
    }
    const disabledAddresses = addresses.filter(({ Status }) => Status === 0);
    const { selfDisabledAttendee, selfDisabledAddress, selfDisabledAttendeeIndex } = disabledAddresses.reduce<{
        selfDisabledAttendee?: VcalAttendeeProperty;
        selfDisabledAttendeeIndex?: number;
        selfDisabledAddress?: Address;
        answeredAttendeeFound: boolean;
    }>(
        (acc, address) => {
            if (acc.answeredAttendeeFound) {
                return acc;
            }
            const cleanSelfEmail = cleanEmail(address.Email, true);
            const index = normalizedAttendeeEmails.findIndex((email) => email === cleanSelfEmail);
            if (index === -1) {
                return acc;
            }
            const attendee = attendees[index];
            const partstat = getAttendeePartstat(attendee);
            const answeredAttendeeFound = partstat !== ICAL_ATTENDEE_STATUS.NEEDS_ACTION;
            if (answeredAttendeeFound || !(acc.selfDisabledAttendee && acc.selfDisabledAddress)) {
                return {
                    selfDisabledAttendee: attendee,
                    selfDisabledAttendeeIndex: index,
                    selfDisabledAddress: address,
                    answeredAttendeeFound,
                };
            }
            return acc;
        },
        { answeredAttendeeFound: false }
    );
    return {
        selfAttendee: selfDisabledAttendee,
        selfAddress: selfDisabledAddress,
        selfAttendeeIndex: selfDisabledAttendeeIndex,
    };
}

export const getInvitedEventWithAlarms = (
    vevent: VcalVeventComponent,
    partstat: ICAL_ATTENDEE_STATUS,
    calendarSettings?: CalendarSettings,
    oldPartstat?: ICAL_ATTENDEE_STATUS
) => {
    const { components } = vevent;
    const otherComponents = components?.filter((component) => !getIsAlarmComponent(component));

    if ([ICAL_ATTENDEE_STATUS.DECLINED, ICAL_ATTENDEE_STATUS.NEEDS_ACTION].includes(partstat)) {
        // remove all alarms in this case
        if (otherComponents?.length) {
            return {
                ...vevent,
                components: otherComponents,
            };
        }
        return omit(vevent, ['components']);
    }
    if (oldPartstat && [ICAL_ATTENDEE_STATUS.ACCEPTED, ICAL_ATTENDEE_STATUS.TENTATIVE].includes(oldPartstat)) {
        // Leave alarms as they are
        return { ...vevent };
    }

    // otherwise add calendar alarms
    if (!calendarSettings) {
        throw new Error('Cannot retrieve calendar default notifications');
    }
    const isAllDay = getIsAllDay(vevent);
    const notifications = isAllDay
        ? calendarSettings.DefaultFullDayNotifications
        : calendarSettings.DefaultPartDayNotifications;
    const valarmComponents = notifications
        .filter(({ Type }) => Type === SETTINGS_NOTIFICATION_TYPE.DEVICE)
        .map<VcalValarmComponent>(({ Trigger }) => ({
            component: 'valarm',
            action: { value: 'DISPLAY' },
            trigger: { value: fromTriggerString(Trigger) },
        }));

    return {
        ...vevent,
        components: components ? components.concat(valarmComponents) : valarmComponents,
    };
};

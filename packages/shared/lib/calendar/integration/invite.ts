import { c } from 'ttag';
import { format as formatUTC } from '../../date-fns-utc';
import { formatTimezoneOffset, getTimezoneOffset, toUTCDate } from '../../date/timezone';
import { canonizeEmail, canonizeEmailByGuess, canonizeInternalEmail } from '../../helpers/email';
import isTruthy from '../../helpers/isTruthy';
import { omit, pick } from '../../helpers/object';
import { dateLocale } from '../../i18n';
import { Address, GetVTimezones } from '../../interfaces';
import {
    Attendee,
    CalendarSettings,
    Participant,
    SETTINGS_NOTIFICATION_TYPE,
    VcalAttendeeProperty,
    VcalOrganizerProperty,
    VcalValarmComponent,
    VcalVcalendar,
    VcalVeventComponent,
    VcalVtimezoneComponent,
} from '../../interfaces/calendar';
import { ContactEmail } from '../../interfaces/contacts';
import { RequireSome } from '../../interfaces/utils';
import { formatSubject, RE_PREFIX } from '../../mail/messages';
import { getAttendeeEmail } from '../attendees';
import { ICAL_ATTENDEE_STATUS, ICAL_METHOD } from '../constants';
import { getDisplayTitle } from '../helper';
import { getIsRruleEqual } from '../rruleEqual';
import { fromTriggerString, serialize } from '../vcal';
import { getAllDayInfo, getHasModifiedDateTimes, propertyToUTCDate } from '../vcalConverter';
import {
    getAttendeePartstat,
    getAttendeeRole,
    getIsAlarmComponent,
    getIsAllDay,
    getPropertyTzid,
    getSequence,
} from '../vcalHelper';
import { withDtstamp, withSummary } from '../veventHelper';

export const getParticipantHasAddressID = (
    participant: Participant
): participant is RequireSome<Participant, 'addressID'> => {
    return !!participant.addressID;
};

export const getParticipant = ({
    participant,
    contactEmails,
    addresses,
    emailTo,
    index,
    calendarAttendees,
}: {
    participant: VcalAttendeeProperty | VcalOrganizerProperty;
    contactEmails: ContactEmail[];
    addresses: Address[];
    emailTo?: string;
    index?: number;
    calendarAttendees?: Attendee[];
}): Participant => {
    const emailAddress = getAttendeeEmail(participant);
    const canonicalInternalEmail = canonizeInternalEmail(emailAddress);
    const canonicalEmail = canonizeEmailByGuess(emailAddress);
    const selfAddress = addresses.find(({ Email }) => canonizeInternalEmail(Email) === canonicalInternalEmail);
    const isYou = emailTo ? canonizeInternalEmail(emailTo) === canonicalInternalEmail : !!selfAddress;
    const contact = contactEmails.find(({ Email }) => canonizeEmail(Email) === canonicalEmail);
    const participantName = participant?.parameters?.cn || emailAddress;
    const displayName = selfAddress?.DisplayName || contact?.Name || participantName;
    const result: Participant = {
        vcalComponent: participant,
        name: participantName,
        emailAddress,
        displayName: isYou ? c('Participant name').t`You` : displayName,
        displayEmail: emailAddress,
    };
    const { partstat, role, email, 'x-pm-token': token } = (participant as VcalAttendeeProperty).parameters || {};
    const calendarAttendee = token ? calendarAttendees?.find(({ Token }) => Token === token) : undefined;
    if (partstat) {
        result.partstat = getAttendeePartstat(participant);
    }
    if (role) {
        result.role = getAttendeeRole(participant);
    }
    if (email) {
        result.displayEmail = email;
    }
    if (token) {
        result.token = token;
    }
    if (calendarAttendee) {
        result.updateTime = calendarAttendee.UpdateTime;
        result.attendeeID = calendarAttendee.ID;
    }
    if (selfAddress) {
        result.addressID = selfAddress.ID;
        // Use Proton form of the email address (important for sending email)
        result.emailAddress = selfAddress.Email;
        // Use Proton name when sending out the email
        result.name = selfAddress.DisplayName || participantName;
    }
    if (index !== undefined) {
        result.attendeeIndex = index;
    }
    return result;
};

interface CreateInviteVeventParams {
    method: ICAL_METHOD;
    attendeesTo?: VcalAttendeeProperty[];
    vevent: VcalVeventComponent;
    keepDtstamp?: boolean;
}

export const createInviteVevent = ({ method, attendeesTo, vevent, keepDtstamp }: CreateInviteVeventParams) => {
    if ([ICAL_METHOD.REPLY, ICAL_METHOD.CANCEL].includes(method) && attendeesTo?.length) {
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
        const attendee = attendeesTo.map(({ value, parameters }) => {
            const { partstat } = parameters || {};
            if (method === ICAL_METHOD.REPLY) {
                if (!partstat) {
                    throw new Error('Cannot reply without participant status');
                }
                return {
                    value,
                    parameters: { partstat },
                };
            }
            return { value };
        });
        return withDtstamp({
            ...pick(vevent, propertiesToKeep),
            component: 'vevent',
            attendee,
        });
    }
    if (method === ICAL_METHOD.REQUEST) {
        // strip alarms
        const propertiesToOmit: (keyof VcalVeventComponent)[] = ['components'];
        // use current time as dtstamp unless indicated otherwise
        if (!keepDtstamp) {
            propertiesToOmit.push('dtstamp');
        }
        // SUMMARY is mandatory in a REQUEST ics
        const veventWithSummary = withSummary(vevent);
        return withDtstamp(omit(veventWithSummary, propertiesToOmit) as VcalVeventComponent);
    }
};

interface CreateInviteIcsParams {
    method: ICAL_METHOD;
    prodId: string;
    vevent: VcalVeventComponent;
    attendeesTo?: VcalAttendeeProperty[];
    vtimezones?: VcalVtimezoneComponent[];
    keepDtstamp?: boolean;
}

export const createInviteIcs = ({
    method,
    prodId,
    attendeesTo,
    vevent,
    vtimezones,
    keepDtstamp,
}: CreateInviteIcsParams): string => {
    // use current time as dtstamp
    const inviteVevent = createInviteVevent({ method, vevent, attendeesTo, keepDtstamp });
    if (!inviteVevent) {
        throw new Error('Invite vevent failed to be created');
    }
    const inviteVcal: RequireSome<VcalVcalendar, 'components'> = {
        component: 'vcalendar',
        components: [inviteVevent],
        prodid: { value: prodId },
        version: { value: '2.0' },
        method: { value: method },
        calscale: { value: 'GREGORIAN' },
    };
    if (vtimezones?.length) {
        inviteVcal.components = [...vtimezones, ...inviteVcal.components];
    }
    return serialize(inviteVcal);
};

export const findAttendee = (email: string, attendees: VcalAttendeeProperty[] = []) => {
    // treat all emails as internal. This is not fully correct (TO BE IMPROVED),
    // but it's better to have some false positives rather than many false negatives
    const canonicalEmail = canonizeInternalEmail(email);
    const index = attendees.findIndex(
        (attendee) => canonizeInternalEmail(getAttendeeEmail(attendee)) === canonicalEmail
    );
    const attendee = index !== -1 ? attendees[index] : undefined;
    return { index, attendee };
};

export function getSelfAddressData({
    isOrganizer,
    organizer,
    attendees = [],
    addresses = [],
}: {
    isOrganizer: boolean;
    organizer?: VcalOrganizerProperty;
    attendees?: VcalAttendeeProperty[];
    addresses?: Address[];
}) {
    if (isOrganizer) {
        if (!organizer) {
            // old events will not have organizer
            return {};
        }
        const organizerEmail = canonizeInternalEmail(getAttendeeEmail(organizer));
        return {
            selfAddress: addresses.find(({ Email }) => canonizeInternalEmail(Email) === organizerEmail),
        };
    }
    const canonicalAttendeeEmails = attendees.map((attendee) => canonizeInternalEmail(getAttendeeEmail(attendee)));
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
            const canonicalSelfEmail = canonizeInternalEmail(address.Email);
            const index = canonicalAttendeeEmails.findIndex((email) => email === canonicalSelfEmail);
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
            const canonicalSelfEmail = canonizeInternalEmail(address.Email);
            const index = canonicalAttendeeEmails.findIndex((email) => email === canonicalSelfEmail);
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

export const getSelfAttendeeToken = (vevent?: VcalVeventComponent, addresses: Address[] = []) => {
    if (!vevent?.attendee) {
        return;
    }
    const { selfAddress, selfAttendeeIndex } = getSelfAddressData({
        isOrganizer: false,
        attendees: vevent.attendee,
        addresses,
    });
    if (!selfAddress || selfAttendeeIndex === undefined) {
        return;
    }
    return vevent.attendee[selfAttendeeIndex].parameters?.['x-pm-token'];
};

export const generateVtimezonesComponents = async (
    { dtstart, dtend }: VcalVeventComponent,
    getVTimezones: GetVTimezones
): Promise<VcalVtimezoneComponent[]> => {
    const startTimezone = getPropertyTzid(dtstart);
    const endTimezone = dtend ? getPropertyTzid(dtend) : undefined;
    const vtimezonesObject = getVTimezones([startTimezone, endTimezone].filter(isTruthy));
    return Object.values(vtimezonesObject).map(({ vtimezone }) => vtimezone);
};

export const generateEmailSubject = (method: ICAL_METHOD, vevent: VcalVeventComponent, isCreateEvent?: boolean) => {
    if ([ICAL_METHOD.REQUEST, ICAL_METHOD.CANCEL].includes(method)) {
        const { dtstart, dtend } = vevent;
        const { isAllDay, isSingleAllDay } = getAllDayInfo(dtstart, dtend);
        if (isAllDay) {
            const formattedStartDate = formatUTC(toUTCDate(dtstart.value), 'PP', { locale: dateLocale });
            if (isSingleAllDay) {
                if (method === ICAL_METHOD.CANCEL) {
                    return c('Email subject').t`Cancellation of an event on ${formattedStartDate}`;
                }
                return isCreateEvent
                    ? c('Email subject').t`Invitation for an event on ${formattedStartDate}`
                    : c('Email subject').t`Update for an event on ${formattedStartDate}`;
            }
            if (method === ICAL_METHOD.CANCEL) {
                return c('Email subject').t`Cancellation of an event starting on ${formattedStartDate}`;
            }
            return isCreateEvent
                ? c('Email subject').t`Invitation for an event starting on ${formattedStartDate}`
                : c('Email subject').t`Update for an event starting on ${formattedStartDate}`;
        }
        const formattedStartDateTime = formatUTC(toUTCDate(vevent.dtstart.value), 'PPp', { locale: dateLocale });
        const { offset } = getTimezoneOffset(propertyToUTCDate(dtstart), getPropertyTzid(dtstart) || 'UTC');
        const formattedOffset = `GMT${formatTimezoneOffset(offset)}`;
        if (method === ICAL_METHOD.CANCEL) {
            return c('Email subject')
                .t`Cancellation of an event starting on ${formattedStartDateTime} (${formattedOffset})`;
        }
        return isCreateEvent
            ? c('Email subject').t`Invitation for an event starting on ${formattedStartDateTime} (${formattedOffset})`
            : c('Email subject').t`Update for an event starting on ${formattedStartDateTime} (${formattedOffset})`;
    }
    if (method === ICAL_METHOD.REPLY) {
        const eventTitle = getDisplayTitle(vevent.summary?.value);
        return formatSubject(c('Email subject').t`Invitation: ${eventTitle}`, RE_PREFIX);
    }
    throw new Error('Unexpected method');
};

export const getHasUpdatedInviteData = ({
    newVevent,
    oldVevent,
    hasModifiedDateTimes,
}: {
    newVevent: VcalVeventComponent;
    oldVevent?: VcalVeventComponent;
    hasModifiedDateTimes?: boolean;
}) => {
    if (!oldVevent) {
        return;
    }
    const hasUpdatedDateTimes =
        hasModifiedDateTimes !== undefined ? hasModifiedDateTimes : getHasModifiedDateTimes(newVevent, oldVevent);
    const hasUpdatedTitle = newVevent.summary?.value !== oldVevent.summary?.value;
    const hasUpdatedDescription = newVevent.description?.value !== oldVevent.description?.value;
    const hasUpdatedLocation = newVevent.location?.value !== oldVevent.location?.value;
    const hasUpdatedRrule = !getIsRruleEqual(newVevent.rrule, oldVevent.rrule);
    return hasUpdatedDateTimes || hasUpdatedTitle || hasUpdatedDescription || hasUpdatedLocation || hasUpdatedRrule;
};

export const getUpdatedInviteVevent = (
    newVevent: VcalVeventComponent,
    oldVevent: VcalVeventComponent,
    method?: ICAL_METHOD
) => {
    if (method === ICAL_METHOD.REQUEST && getSequence(newVevent) > getSequence(oldVevent)) {
        if (!newVevent.attendee?.length) {
            return { ...newVevent };
        }
        const withResetPartstatAttendees = newVevent.attendee.map((attendee) => ({
            ...attendee,
            parameters: {
                ...attendee.parameters,
                partstat: ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
            },
        }));
        return { ...newVevent, attendee: withResetPartstatAttendees };
    }
    return { ...newVevent };
};

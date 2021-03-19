import { c } from 'ttag';
import { addDays, format as formatUTC } from '../../date-fns-utc';
import { Options } from '../../date-fns-utc/format';
import { formatTimezoneOffset, getTimezoneOffset, toUTCDate } from '../../date/timezone';
import { canonizeEmail, canonizeEmailByGuess, canonizeInternalEmail } from '../../helpers/email';
import isTruthy from '../../helpers/isTruthy';
import { omit, pick } from '../../helpers/object';
import { getCurrentUnixTimestamp } from '../../helpers/time';
import { dateLocale } from '../../i18n';
import { Address, GetVTimezones } from '../../interfaces';
import {
    Attendee,
    CalendarEvent,
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
import { getAttendeeEmail, toIcsPartstat } from '../attendees';
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
import { getIsEventCancelled, withDtstamp, withSummary } from '../veventHelper';

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
        partstat: getAttendeePartstat(participant),
        displayName: isYou ? c('Participant name').t`You` : displayName,
        displayEmail: emailAddress,
    };
    const { role, email, 'x-pm-token': token } = (participant as VcalAttendeeProperty).parameters || {};
    const calendarAttendee = token ? calendarAttendees?.find(({ Token }) => Token === token) : undefined;
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
    sharedEventID?: string;
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

export const getSelfAddressData = ({
    isOrganizer,
    organizer,
    attendees = [],
    addresses = [],
}: {
    isOrganizer: boolean;
    organizer?: VcalOrganizerProperty;
    attendees?: VcalAttendeeProperty[];
    addresses?: Address[];
}) => {
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
};

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

const getFormattedDateInfo = (vevent: VcalVeventComponent, options: Options = { locale: dateLocale }) => {
    const { dtstart, dtend } = vevent;
    const { isAllDay, isSingleAllDay } = getAllDayInfo(dtstart, dtend);
    if (isAllDay) {
        return {
            formattedStart: formatUTC(toUTCDate(dtstart.value), 'cccc PPP', options),
            formattedEnd: dtend ? formatUTC(addDays(toUTCDate(dtend.value), -1), 'cccc PPP', options) : undefined,
            isAllDay,
            isSingleAllDay,
        };
    }
    const formattedStartDateTime = formatUTC(toUTCDate(dtstart.value), 'cccc PPPp', options);
    const formattedEndDateTime = dtend
        ? formatUTC(toUTCDate(dtend.value), 'cccc PPPp', { locale: dateLocale })
        : undefined;
    const { offset: startOffset } = getTimezoneOffset(propertyToUTCDate(dtstart), getPropertyTzid(dtstart) || 'UTC');
    const { offset: endOffset } = dtend
        ? getTimezoneOffset(propertyToUTCDate(dtend), getPropertyTzid(dtstart) || 'UTC')
        : { offset: 0 };
    const formattedStartOffset = `GMT${formatTimezoneOffset(startOffset)}`;
    const formattedEndOffset = `GMT${formatTimezoneOffset(endOffset)}`;
    return {
        formattedStart: `${formattedStartDateTime} (${formattedStartOffset})`,
        formattedEnd: formattedEndDateTime ? `${formattedEndDateTime} (${formattedEndOffset})` : undefined,
        isAllDay,
        isSingleAllDay,
    };
};

export const generateEmailSubject = ({
    method,
    vevent,
    isCreateEvent,
    options,
}: {
    method: ICAL_METHOD;
    vevent: VcalVeventComponent;
    isCreateEvent?: boolean;
    options?: Options;
}) => {
    if ([ICAL_METHOD.REQUEST, ICAL_METHOD.CANCEL].includes(method)) {
        const { formattedStart, isAllDay, isSingleAllDay } = getFormattedDateInfo(vevent, options);
        if (isAllDay) {
            if (isSingleAllDay) {
                if (method === ICAL_METHOD.CANCEL) {
                    return c('Email subject').t`Cancellation of an event on ${formattedStart}`;
                }
                return isCreateEvent
                    ? c('Email subject').t`Invitation for an event on ${formattedStart}`
                    : c('Email subject').t`Update for an event on ${formattedStart}`;
            }
            if (method === ICAL_METHOD.CANCEL) {
                return c('Email subject').t`Cancellation of an event starting on ${formattedStart}`;
            }
            return isCreateEvent
                ? c('Email subject').t`Invitation for an event starting on ${formattedStart}`
                : c('Email subject').t`Update for an event starting on ${formattedStart}`;
        }
        if (method === ICAL_METHOD.CANCEL) {
            return c('Email subject').t`Cancellation of an event starting on ${formattedStart}`;
        }
        return isCreateEvent
            ? c('Email subject').t`Invitation for an event starting on ${formattedStart}`
            : c('Email subject').t`Update for an event starting on ${formattedStart}`;
    }
    if (method === ICAL_METHOD.REPLY) {
        const eventTitle = getDisplayTitle(vevent.summary?.value);
        return formatSubject(c('Email subject').t`Invitation: ${eventTitle}`, RE_PREFIX);
    }
    throw new Error('Unexpected method');
};

const getWhenText = (vevent: VcalVeventComponent, options?: Options) => {
    const { formattedStart, formattedEnd, isAllDay, isSingleAllDay } = getFormattedDateInfo(vevent, options);
    if (isAllDay) {
        return isSingleAllDay || !formattedEnd
            ? c('Email body for invitation (date part)').t`When: ${formattedStart} (all day)`
            : c('Email body for invitation (date part)').t`When: ${formattedStart} - ${formattedEnd}`;
    }
    return formattedEnd
        ? c('Email body for invitation (date part)').t`When: ${formattedStart} - ${formattedEnd}`
        : c('Email body for invitation (date part)').t`When: ${formattedStart}`;
};

const getEmailBodyTexts = (vevent: VcalVeventComponent, options?: Options) => {
    const { summary, location, description } = vevent;
    const eventTitle = getDisplayTitle(summary?.value);
    const eventLocation = location?.value;
    const eventDescription = description?.value;

    const whenText = getWhenText(vevent, options);
    const locationText = eventLocation
        ? c('Email body for invitation (location part)').t`Where: ${eventLocation}`
        : undefined;
    const descriptionText = eventDescription
        ? c('Email body for description (description part)').t`Description: ${eventDescription}`
        : undefined;
    const locationAndDescriptionText =
        locationText && descriptionText
            ? `${locationText}
${descriptionText}`
            : locationText || descriptionText
            ? `${locationText || descriptionText}`
            : '';
    const eventDetailsText = locationAndDescriptionText
        ? `${whenText}
${locationAndDescriptionText}`
        : `${whenText}`;

    return { eventTitle, eventDetailsText };
};

export const generateEmailBody = ({
    method,
    vevent,
    isCreateEvent,
    partstat,
    emailAddress,
    options,
}: {
    method: ICAL_METHOD;
    vevent: VcalVeventComponent;
    isCreateEvent?: boolean;
    emailAddress?: string;
    partstat?: ICAL_ATTENDEE_STATUS;
    options?: Options;
}) => {
    const { eventTitle, eventDetailsText } = getEmailBodyTexts(vevent, options);

    if (method === ICAL_METHOD.REQUEST) {
        if (isCreateEvent) {
            return c('Email body for invitation').t`You are invited to ${eventTitle}
${eventDetailsText}`;
        }
        return c('Email body for invitation').t`${eventTitle} has been updated.
${eventDetailsText}`;
    }
    if (method === ICAL_METHOD.CANCEL) {
        return c('Email body for invitation').t`${eventTitle} has been cancelled.`;
    }
    if (method === ICAL_METHOD.REPLY) {
        if (!partstat || !emailAddress) {
            throw new Error('Missing parameters for reply body');
        }
        if (partstat === ICAL_ATTENDEE_STATUS.ACCEPTED) {
            return c('Email body for response to invitation')
                .t`${emailAddress} has accepted your invitation to ${eventTitle}`;
        }
        if (partstat === ICAL_ATTENDEE_STATUS.TENTATIVE) {
            return c('Email body for response to invitation')
                .t`${emailAddress} has tentatively accepted your invitation to ${eventTitle}`;
        }
        if (partstat === ICAL_ATTENDEE_STATUS.DECLINED) {
            return c('Email body for response to invitation')
                .t`${emailAddress} has declined your invitation to ${eventTitle}`;
        }
        throw new Error('Unanswered partstat');
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

export const getResetPartstatActions = (
    singleEdits: CalendarEvent[],
    token: string,
    partstat: ICAL_ATTENDEE_STATUS
) => {
    const updateTime = getCurrentUnixTimestamp();
    const updatePartstatActions = singleEdits
        .map((event) => {
            if (getIsEventCancelled(event)) {
                // no need to reset the partsat as it should have been done already
                return;
            }
            const selfAttendee = event.Attendees.find(({ Token }) => Token === token);
            if (!selfAttendee) {
                return;
            }
            const oldPartstat = toIcsPartstat(selfAttendee.Status);
            if ([ICAL_ATTENDEE_STATUS.NEEDS_ACTION, partstat].includes(oldPartstat)) {
                // no need to reset the partstat as it's already reset or it coincides with the new partstat
                return;
            }
            return {
                attendeeID: selfAttendee.ID,
                eventID: event.ID,
                calendarID: event.CalendarID,
                updateTime,
                partstat: ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
            };
        })
        .filter(isTruthy);
    const updatePersonalPartActions = updatePartstatActions
        .map(({ eventID, calendarID }) => ({ eventID, calendarID }))
        .filter(isTruthy);

    return { updatePartstatActions, updatePersonalPartActions };
};

export const getHasNonCancelledSingleEdits = (singleEdits: CalendarEvent[]) => {
    return singleEdits.some((event) => !getIsEventCancelled(event));
};

export const getMustResetPartstat = (singleEdits: CalendarEvent[], token?: string, partstat?: ICAL_ATTENDEE_STATUS) => {
    if (!token || !partstat) {
        return false;
    }
    return singleEdits.some((event) => {
        if (getIsEventCancelled(event)) {
            return false;
        }
        const selfAttendee = event.Attendees.find(({ Token }) => Token === token);
        if (!selfAttendee) {
            return false;
        }
        const oldPartstat = toIcsPartstat(selfAttendee.Status);
        if ([ICAL_ATTENDEE_STATUS.NEEDS_ACTION, partstat].includes(oldPartstat)) {
            return false;
        }
        return true;
    });
};

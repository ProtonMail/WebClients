import { format as formatUTC } from 'proton-shared/lib/date-fns-utc';
import { getUnixTime } from 'date-fns';
import { ICAL_ATTENDEE_ROLE, ICAL_EXTENSIONS, ICAL_MIME_TYPE, MAX_LENGTHS } from 'proton-shared/lib/calendar/constants';
import { getHasConsistentRrule, getSupportedRrule } from 'proton-shared/lib/calendar/integration/rrule';
import {
    getIsDateOutOfBounds,
    getIsWellFormedDateOrDateTime,
    getSupportedUID
} from 'proton-shared/lib/calendar/support';
import { parseWithErrors } from 'proton-shared/lib/calendar/vcal';
import {
    getDateProperty,
    getDateTimeProperty,
    getDateTimePropertyInDifferentTimezone,
    getDtendProperty,
    propertyToUTCDate
} from 'proton-shared/lib/calendar/vcalConverter';
import {
    getHasDtStart,
    getHasUid,
    getIsCalendar,
    getIsEventComponent,
    getIsPropertyAllDay,
    getIsTimezoneComponent,
    getIsXOrIanaComponent,
    getPropertyTzid
} from 'proton-shared/lib/calendar/vcalHelper';
import { withDtstamp } from 'proton-shared/lib/calendar/veventHelper';
import { addDays, isNextDay } from 'proton-shared/lib/date-fns-utc';
import {
    convertUTCDateTimeToZone,
    formatTimezoneOffset,
    getSupportedTimezone,
    getTimezoneOffset
} from 'proton-shared/lib/date/timezone';
import { buildMailTo, cleanEmail, getEmailTo, normalizeInternalEmail } from 'proton-shared/lib/helpers/email';
import { splitExtension } from 'proton-shared/lib/helpers/file';
import { truncate } from 'proton-shared/lib/helpers/string';
import { Address, CachedKey } from 'proton-shared/lib/interfaces';
import { Calendar, CalendarEvent, CalendarSettings } from 'proton-shared/lib/interfaces/calendar';
import {
    VcalAttendeeProperty,
    VcalDateOrDateTimeProperty,
    VcalDateTimeProperty,
    VcalFloatingDateTimeProperty,
    VcalOrganizerProperty,
    VcalVcalendar,
    VcalVeventComponent,
    VcalVtimezoneComponent,
    VcalXOrIanaComponent
} from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { c } from 'ttag';
import { Attachment } from '../../models/attachment';
import { MessageExtended } from '../../models/message';
import { RequireSome } from '../../models/utils';
import { getOriginalTo } from '../message/messages';
import { EVENT_INVITATION_ERROR_TYPE, EventInvitationError } from './EventInvitationError';

export enum EVENT_TIME_STATUS {
    PAST,
    HAPPENING,
    FUTURE
}

export interface Participant {
    vcalComponent: VcalAttendeeProperty | VcalOrganizerProperty;
    name: string;
    emailAddress: string;
    partstat?: string;
    role?: string;
    addressID?: string;
    displayName?: string;
    index?: number;
}

export interface EventInvitation {
    originalVcalInvitation?: VcalVcalendar;
    vevent: VcalVeventComponent;
    calendarEvent?: CalendarEvent;
    method?: string;
    vtimezone?: VcalVtimezoneComponent;
    xOrIanaComponents?: VcalXOrIanaComponent[];
    organizer?: Participant;
    attendee?: Participant;
    participants?: Participant[];
}

export interface CalendarWidgetData {
    calendar: Calendar;
    memberID?: string;
    addressKeys?: CachedKey[];
    calendarKeys?: CachedKey[];
    calendarSettings?: CalendarSettings;
}

export interface InvitationModel {
    isOrganizerMode: boolean;
    timeStatus: EVENT_TIME_STATUS;
    hideSummary?: boolean;
    calendarData?: CalendarWidgetData;
    invitationIcs?: RequireSome<EventInvitation, 'method'>;
    invitationApi?: RequireSome<EventInvitation, 'calendarEvent'>;
    parentInvitationApi?: RequireSome<EventInvitation, 'calendarEvent'>;
    error?: EventInvitationError;
}

export const getHasInvitation = (model: InvitationModel): model is RequireSome<InvitationModel, 'invitationIcs'> => {
    return !!model.invitationIcs;
};

export const getInvitationHasEventID = (
    invitation?: EventInvitation
): invitation is RequireSome<EventInvitation, 'calendarEvent'> => {
    return invitation?.calendarEvent?.ID !== undefined;
};

export const filterAttachmentsForEvents = (attachments: Attachment[]): Attachment[] =>
    attachments.filter(
        ({ Name = '', MIMEType = '' }) =>
            ICAL_EXTENSIONS.includes(splitExtension(Name)[1]) && MIMEType === ICAL_MIME_TYPE
    );

export const getSequence = (event: VcalVeventComponent) => {
    const sequence = +(event.sequence?.value || 0);
    return Math.max(sequence, 0);
};

export const extractVevent = (vcal?: VcalVcalendar): VcalVeventComponent | undefined => {
    return vcal?.components?.find(getIsEventComponent);
};

export const extractVTimezone = (vcal?: VcalVcalendar): VcalVtimezoneComponent | undefined => {
    return vcal?.components?.find(getIsTimezoneComponent);
};

export const extractXOrIanaComponents = (vcal?: VcalVcalendar): VcalXOrIanaComponent[] | undefined => {
    return vcal?.components?.filter(getIsXOrIanaComponent);
};

export const getParticipant = (
    participant: VcalAttendeeProperty | VcalOrganizerProperty,
    contactEmails: ContactEmail[],
    ownAddresses: Address[],
    emailTo: string,
    index?: number
): Participant => {
    const emailAddress = getEmailTo(participant.value);
    const normalizedEmailAddress = normalizeInternalEmail(emailAddress);
    const isYou = normalizeInternalEmail(emailTo) === normalizedEmailAddress;
    const selfAddress = ownAddresses.find(({ Email }) => normalizeInternalEmail(Email) === normalizedEmailAddress);
    const contact = contactEmails.find(({ Email }) => cleanEmail(Email) === cleanEmail(emailAddress));
    const participantName = isYou
        ? c('Participant name').t`You`
        : selfAddress?.DisplayName || contact?.Name || participant?.parameters?.cn || emailAddress;
    const result: Participant = {
        vcalComponent: participant,
        name: participantName,
        emailAddress
    };
    const { partstat, role } = (participant as VcalAttendeeProperty).parameters || {};
    if (partstat) {
        result.partstat = partstat;
    }
    if (role) {
        result.role = role;
    }
    if (selfAddress) {
        result.addressID = selfAddress.ID;
        result.displayName = selfAddress.DisplayName;
        // Use Proton form of the email address (important for sending email)
        result.emailAddress = selfAddress.Email;
    }
    if (index !== undefined) {
        result.index = index;
    }
    return result;
};

export const findAttendee = (email: string, attendees: VcalAttendeeProperty[] = []) => {
    const index = attendees.findIndex((attendee) => cleanEmail(getEmailTo(attendee.value)) === cleanEmail(email));
    const attendee = index !== -1 ? attendees[index] : undefined;
    return { index, attendee };
};

const getIsEquivalentAttendee = (newAttendee: VcalAttendeeProperty, oldAttendee: VcalAttendeeProperty) => {
    if (newAttendee.value !== oldAttendee.value) {
        return false;
    }
    if (newAttendee.parameters?.partstat !== oldAttendee.parameters?.partstat) {
        return false;
    }
    if (newAttendee.parameters?.role !== oldAttendee.parameters?.role) {
        return false;
    }
    return true;
};

export const getHasModifiedAttendees = (
    newAttendees?: VcalAttendeeProperty[],
    oldAttendees?: VcalAttendeeProperty[]
) => {
    if (!newAttendees) {
        return !!oldAttendees;
    }
    if (!oldAttendees || oldAttendees.length !== newAttendees.length) {
        return true;
    }
    const modifiedAttendees = [...oldAttendees];
    newAttendees.forEach((attendee) => {
        const index = modifiedAttendees.findIndex((oldAttendee) => getIsEquivalentAttendee(oldAttendee, attendee));
        if (index === -1) {
            return true;
        }
        modifiedAttendees.splice(index, 1);
    });
    return false;
};

export const getIsOrganizerMode = (event: VcalVeventComponent, emailTo: string) => {
    if (!event.organizer) {
        return false;
    }
    const organizerEmail = getEmailTo(event.organizer.value);
    return cleanEmail(organizerEmail) === cleanEmail(emailTo);
};

/**
 * Determines if a event has already passed with respect to a UNIX timestamp
 */
export const getEventTimeStatus = (vevent: VcalVeventComponent, now: number) => {
    const nowTimestamp = getUnixTime(now);
    const startTimestamp = getUnixTime(propertyToUTCDate(vevent.dtstart));
    const endTimestamp = getUnixTime(propertyToUTCDate(getDtendProperty(vevent)));
    if (nowTimestamp >= endTimestamp) {
        return EVENT_TIME_STATUS.PAST;
    }
    if (nowTimestamp >= startTimestamp) {
        return EVENT_TIME_STATUS.HAPPENING;
    }
    return EVENT_TIME_STATUS.FUTURE;
};

export const getCalendarEventLink = (model: InvitationModel) => {
    const { calendarData, invitationApi } = model;
    const calendarID = calendarData?.calendar.ID;
    const eventID = invitationApi?.calendarEvent.ID;
    const recurrenceIDProperty = invitationApi?.vevent['recurrence-id'];
    const recurrenceID = recurrenceIDProperty ? getUnixTime(propertyToUTCDate(recurrenceIDProperty)) : undefined;
    if (!calendarID || !eventID) {
        return '';
    }
    const params = new URLSearchParams();
    params.set('Action', 'VIEW');
    params.set('EventID', eventID);
    params.set('CalendarID', calendarID);
    if (recurrenceID) {
        params.set('RecurrenceID', `${recurrenceID}`);
    }
    return `/event?${params.toString()}`;
};

export const getAllDayInfo = (dtstart: VcalDateOrDateTimeProperty, dtend?: VcalDateOrDateTimeProperty) => {
    const isAllDay = getIsPropertyAllDay(dtstart);
    if (!isAllDay) {
        return { isAllDay: false, isSingleAllDay: false };
    }
    if (!dtend) {
        return { isAllDay: true, isSingleAllDay: true };
    }
    const fakeUTCStart = propertyToUTCDate(dtstart);
    const fakeUTCEnd = propertyToUTCDate(dtend);
    return { isAllDay: true, isSingleAllDay: isNextDay(fakeUTCStart, fakeUTCEnd) };
};

export const formatDateTime = (
    property: VcalDateOrDateTimeProperty,
    locale: Locale,
    isAllDay: boolean,
    isSingleAllDay?: boolean
) => {
    if (isAllDay) {
        const utcDate = propertyToUTCDate(property);
        const formattedDate = formatUTC(utcDate, 'PP', { locale });
        if (isSingleAllDay) {
            return c('Invitation details (all-day event)').t`${formattedDate} (all day)`;
        }
        return formattedDate;
    }
    const dateTimeProperty = property as VcalDateTimeProperty;
    const fakeUTCDateProperty = { value: { ...dateTimeProperty.value, isUTC: true } };
    const fakeUTCDate = propertyToUTCDate(fakeUTCDateProperty);
    const date = propertyToUTCDate(property);
    const utcOffset = getTimezoneOffset(date, dateTimeProperty.parameters?.tzid || 'UTC').offset;
    return `${formatUTC(fakeUTCDate, 'PPp', { locale })} (GMT${formatTimezoneOffset(utcOffset)})`;
};

const getIsEventInvitationValid = (event: VcalVeventComponent | undefined): event is VcalVeventComponent => {
    if (!event || !getHasDtStart(event) || !getHasUid(event)) {
        return false;
    }
    return true;
};

export const parseEventInvitation = (data: string): VcalVcalendar | undefined => {
    try {
        if (!data) {
            return;
        }
        const parsedVcalendar = parseWithErrors(data) as VcalVcalendar;
        if (!getIsCalendar(parsedVcalendar)) {
            return;
        }
        return parsedVcalendar;
    } catch (e) {
        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID);
    }
};

export const processEventInvitation = <T>(
    invitation: EventInvitation & T,
    message: MessageExtended,
    contactEmails: ContactEmail[],
    ownAddresses: Address[]
): { isOrganizerMode: boolean; timeStatus: EVENT_TIME_STATUS; invitation: EventInvitation & T } => {
    const { vevent } = invitation;
    const timeStatus = getEventTimeStatus(vevent, Date.now());
    const attendees = vevent.attendee;
    const organizer = vevent.organizer;
    const originalTo = getOriginalTo(message.data);
    const isOrganizerMode = getIsOrganizerMode(vevent, originalTo);
    const { index, attendee } = isOrganizerMode
        ? findAttendee(message.data?.SenderAddress || '', attendees)
        : findAttendee(originalTo, attendees);

    const processed: EventInvitation & T = { ...invitation };

    if (attendees) {
        processed.participants = attendees.map((attendee) =>
            getParticipant(attendee, contactEmails, ownAddresses, originalTo)
        );
    }
    if (organizer) {
        processed.organizer = getParticipant(organizer, contactEmails, ownAddresses, originalTo);
    }
    if (attendee) {
        processed.attendee = getParticipant(attendee, contactEmails, ownAddresses, originalTo, index);
    }

    return { isOrganizerMode, timeStatus, invitation: processed };
};

export const getInitialInvitationModel = (
    invitationOrError: RequireSome<EventInvitation, 'method'> | EventInvitationError,
    message: MessageExtended,
    contactEmails: ContactEmail[],
    ownAddresses: Address[],
    calendar?: Calendar
) => {
    if (invitationOrError instanceof EventInvitationError) {
        return { isOrganizerMode: false, timeStatus: EVENT_TIME_STATUS.FUTURE, error: invitationOrError };
    }
    const { isOrganizerMode, timeStatus, invitation } = processEventInvitation(
        invitationOrError,
        message,
        contactEmails,
        ownAddresses
    );
    const result: InvitationModel = { isOrganizerMode, timeStatus, invitationIcs: invitation };
    if (calendar) {
        result.calendarData = { calendar };
    }
    return result;
};

interface GetSupportedDateOrDateTimePropertyArgs {
    property: VcalDateOrDateTimeProperty | VcalFloatingDateTimeProperty;
    hasXWrTimezone: boolean;
    calendarTzid?: string;
    isRecurring?: boolean;
}
export const getSupportedDateOrDateTimeProperty = ({
    property,
    hasXWrTimezone,
    calendarTzid,
    isRecurring = false
}: GetSupportedDateOrDateTimePropertyArgs) => {
    if (getIsPropertyAllDay(property)) {
        return getDateProperty(property.value);
    }

    const partDayProperty = property;

    // account for non-RFC-compliant Google Calendar exports
    // namely localize Zulu date-times for non-recurring events with x-wr-timezone if present and accepted by us
    if (partDayProperty.value.isUTC && !isRecurring && hasXWrTimezone && calendarTzid) {
        const localizedDateTime = convertUTCDateTimeToZone(partDayProperty.value, calendarTzid);
        return getDateTimeProperty(localizedDateTime, calendarTzid);
    }
    const partDayPropertyTzid = getPropertyTzid(partDayProperty);

    // A floating date-time property
    if (!partDayPropertyTzid) {
        if (!hasXWrTimezone) {
            throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED);
        }
        if (hasXWrTimezone && !calendarTzid) {
            throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED);
        }
        return getDateTimeProperty(partDayProperty.value, calendarTzid);
    }

    const supportedTzid = getSupportedTimezone(partDayPropertyTzid);
    if (!supportedTzid) {
        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED);
    }
    return getDateTimeProperty(partDayProperty.value, supportedTzid);
};

interface GetLinkedDateTimePropertyArgs {
    property: VcalDateOrDateTimeProperty;
    isAllDay: boolean;
    tzid?: string;
}
const getLinkedDateTimeProperty = ({
    property,
    isAllDay,
    tzid
}: GetLinkedDateTimePropertyArgs): VcalDateOrDateTimeProperty => {
    if (isAllDay) {
        return getDateProperty(property.value);
    }
    if (getIsPropertyAllDay(property)) {
        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID);
    }
    const supportedTzid = getPropertyTzid(property);
    if (!supportedTzid || !tzid) {
        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED);
    }
    if (tzid !== supportedTzid) {
        // the linked date-time property should have the same tzid as dtstart
        return getDateTimePropertyInDifferentTimezone(property, tzid, isAllDay);
    }
    return getDateTimeProperty(property.value, tzid);
};

export const getSupportedAttendee = (attendee: VcalAttendeeProperty) => {
    const { value, parameters: { cn, role, partstat, rsvp } = {} } = attendee;
    const emailAddress = getEmailTo(value);
    const supportedAttendee: RequireSome<VcalAttendeeProperty, 'parameters'> = {
        value: buildMailTo(emailAddress),
        parameters: {
            cn: cn ?? emailAddress
        }
    };
    const roleUpperCased = role?.toUpperCase();
    if (roleUpperCased === ICAL_ATTENDEE_ROLE.REQUIRED || roleUpperCased === ICAL_ATTENDEE_ROLE.OPTIONAL) {
        supportedAttendee.parameters.role = roleUpperCased;
    }
    if (rsvp?.toUpperCase() === 'TRUE') {
        supportedAttendee.parameters.rsvp = rsvp.toUpperCase();
    }
    if (partstat) {
        supportedAttendee.parameters.partstat = partstat.toUpperCase();
    }
    return supportedAttendee;
};

export const getSupportedEventInvitation = (
    vcalInvitation: VcalVcalendar
): RequireSome<EventInvitation, 'method'> | undefined => {
    const { version, calscale, 'x-wr-timezone': xWrTimezone, method } = vcalInvitation;
    if (!method?.value || method.value.toLowerCase() === 'publish') {
        // Ignore the ics. We don't know if it is an invitation
        return;
    }
    if ((calscale && calscale.value.toLowerCase() !== 'gregorian') || version?.value !== '2.0') {
        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED);
    }
    const vevent = extractVevent(vcalInvitation);
    const vtimezone = extractVTimezone(vcalInvitation);
    if (!getIsEventInvitationValid(vevent)) {
        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID);
    }
    try {
        const event = withDtstamp(vevent);
        const {
            component,
            uid,
            dtstamp,
            dtstart,
            dtend,
            rrule,
            exdate,
            description,
            summary,
            location,
            sequence,
            'recurrence-id': recurrenceId,
            organizer,
            attendee,
            duration
        } = event;
        const trimmedSummaryValue = summary?.value.trim();
        const trimmedDescriptionValue = description?.value.trim();
        const trimmedLocationValue = location?.value.trim();
        const isRecurring = !!rrule || !!recurrenceId;

        const validated: VcalVeventComponent & Required<Pick<VcalVeventComponent, 'uid' | 'dtstamp' | 'dtstart'>> = {
            component,
            uid: getSupportedUID(uid),
            dtstamp: { ...dtstamp },
            dtstart: { ...dtstart }
        };

        if (organizer) {
            validated.organizer = { ...organizer };
        }

        if (attendee) {
            validated.attendee = attendee.map((vcalAttendee) => getSupportedAttendee(vcalAttendee));
        }

        if (trimmedSummaryValue) {
            validated.summary = {
                ...summary,
                value: truncate(trimmedSummaryValue, MAX_LENGTHS.TITLE)
            };
        }
        if (trimmedDescriptionValue) {
            validated.description = {
                ...description,
                value: truncate(trimmedDescriptionValue, MAX_LENGTHS.EVENT_DESCRIPTION)
            };
        }
        if (trimmedLocationValue) {
            validated.location = {
                ...location,
                value: truncate(trimmedLocationValue, MAX_LENGTHS.LOCATION)
            };
        }
        const sequenceValue = sequence?.value || 0;
        const sequenceSafeValue = Number.isSafeInteger(sequenceValue) ? sequenceValue : 0;
        validated.sequence = { value: Math.max(0, sequenceSafeValue) };

        const hasXWrTimezone = !!xWrTimezone?.value;
        const calendarTzid = xWrTimezone ? getSupportedTimezone(xWrTimezone.value) : undefined;
        const isAllDayStart = getIsPropertyAllDay(validated.dtstart);
        const isAllDayEnd = dtend ? getIsPropertyAllDay(dtend) : undefined;
        if (isAllDayEnd !== undefined && +isAllDayStart ^ +isAllDayEnd) {
            throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID);
        }
        validated.dtstart = getSupportedDateOrDateTimeProperty({
            property: dtstart,
            hasXWrTimezone,
            calendarTzid,
            isRecurring
        });
        if (!getIsWellFormedDateOrDateTime(validated.dtstart)) {
            throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID);
        }
        if (getIsDateOutOfBounds(validated.dtstart)) {
            throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED);
        }
        if (exdate) {
            if (!rrule) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID);
            }
            const supportedExdate = exdate.map((property) =>
                getSupportedDateOrDateTimeProperty({
                    property,
                    hasXWrTimezone,
                    calendarTzid,
                    isRecurring
                })
            );
            validated.exdate = supportedExdate.map((property) =>
                getLinkedDateTimeProperty({
                    property,
                    isAllDay: getIsPropertyAllDay(validated.dtstart),
                    tzid: getPropertyTzid(validated.dtstart)
                })
            );
        }
        if (recurrenceId) {
            if (rrule) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED);
            }
            validated['recurrence-id'] = getSupportedDateOrDateTimeProperty({
                property: recurrenceId,
                hasXWrTimezone,
                calendarTzid,
                isRecurring
            });
        }
        if (dtend) {
            const supportedDtend = getSupportedDateOrDateTimeProperty({
                property: dtend,
                hasXWrTimezone,
                calendarTzid,
                isRecurring
            });
            if (!getIsWellFormedDateOrDateTime(supportedDtend)) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID);
            }
            if (getIsDateOutOfBounds(supportedDtend)) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED);
            }
            const startDateUTC = propertyToUTCDate(validated.dtstart);
            const endDateUTC = propertyToUTCDate(supportedDtend);
            // allow a non-RFC-compliant all-day event with DTSTART = DTEND
            const modifiedEndDateUTC =
                !isAllDayEnd || +startDateUTC === +endDateUTC ? endDateUTC : addDays(endDateUTC, -1);
            const duration = +modifiedEndDateUTC - +startDateUTC;

            if (duration > 0) {
                validated.dtend = supportedDtend;
            }
        } else if (duration) {
            throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED);
        }

        if (rrule) {
            const supportedRrule = getSupportedRrule({ ...validated, rrule }, true);
            if (!supportedRrule) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED);
            }
            validated.rrule = supportedRrule;
            if (!getHasConsistentRrule(validated)) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID);
            }
        }

        return {
            method: method.value,
            vevent: validated,
            vtimezone,
            originalVcalInvitation: vcalInvitation
        };
    } catch (error) {
        if (error instanceof EventInvitationError) {
            throw error;
        }
        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, error);
    }
};

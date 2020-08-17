import { getUnixTime, format } from 'date-fns';
import {
    getEventByUID,
    GetEventByUIDArguments,
    syncMultipleEvents,
    UpdateCalendarEventSyncData
} from 'proton-shared/lib/api/calendars';
import { ICAL_EVENT_STATUS, ICAL_METHOD, MAX_LENGTHS } from 'proton-shared/lib/calendar/constants';
import getCreationKeys from 'proton-shared/lib/calendar/integration/getCreationKeys';
import { getHasConsistentRrule, getSupportedRrule } from 'proton-shared/lib/calendar/integration/rrule';
import { createCalendarEvent } from 'proton-shared/lib/calendar/serialize';
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
    propertyToUTCDate
} from 'proton-shared/lib/calendar/vcalConverter';
import {
    getAttendeeHasPartStat,
    getHasDtStart,
    getHasUid,
    getIsEventComponent,
    getIsPropertyAllDay,
    getPropertyTzid
} from 'proton-shared/lib/calendar/vcalHelper';
import { withDtstamp } from 'proton-shared/lib/calendar/veventHelper';
import { API_CODES } from 'proton-shared/lib/constants';
import { addDays, isNextDay } from 'proton-shared/lib/date-fns-utc';
import {
    convertUTCDateTimeToZone,
    formatTimezoneOffset,
    getSupportedTimezone,
    getTimezoneOffset
} from 'proton-shared/lib/date/timezone';
import { normalizeInternalEmail, parseMailtoURL } from 'proton-shared/lib/helpers/email';
import { splitExtension } from 'proton-shared/lib/helpers/file';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { omit } from 'proton-shared/lib/helpers/object';
import { truncate } from 'proton-shared/lib/helpers/string';
import { Address, Api, CachedKey } from 'proton-shared/lib/interfaces';
import { Calendar, CalendarEvent } from 'proton-shared/lib/interfaces/calendar';
import {
    VcalAttendeeProperty,
    VcalDateOrDateTimeProperty,
    VcalDateTimeProperty,
    VcalFloatingDateTimeProperty,
    VcalOrganizerProperty,
    VcalVcalendar,
    VcalVeventComponent
} from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { c } from 'ttag';
import { SyncMultipleApiResponse } from 'proton-shared/lib/interfaces/calendar';
import { Attachment } from '../../models/attachment';
import { MessageExtended } from '../../models/message';
import { RequireSome, Unwrap } from '../../models/utils';
import { cleanEmail } from '../addresses';
import { getOriginalTo } from '../message/messages';
import { EVENT_INVITATION_ERROR_TYPE, EventInvitationError } from './EventInvitationError';

const ICAL_EXTENSIONS = ['ics', 'ical', 'ifb', 'icalendar'];
const ICAL_MIME_TYPE = 'text/calendar';

export interface Participant {
    vcalComponent: VcalAttendeeProperty | VcalOrganizerProperty;
    name: string;
    email: string;
    partstat?: string;
    role?: string;
}

export interface EventInvitationRaw {
    vevent: VcalVeventComponent;
    method: string;
    calscale?: string;
    xWrTimezone?: string;
}

export interface EventInvitation {
    vevent: VcalVeventComponent;
    eventID?: string;
    organizer?: Participant;
    attendee?: Participant;
    participants?: Participant[];
}

export interface InvitationModel {
    method: string;
    isOrganizerMode: boolean;
    calendar?: Calendar;
    invitationIcs?: EventInvitation;
    invitationApi?: RequireSome<EventInvitation, 'eventID'>;
    parentInvitationApi?: RequireSome<EventInvitation, 'eventID'>;
    error?: EventInvitationError;
}

export const getHasInvitation = (model: InvitationModel): model is RequireSome<InvitationModel, 'invitationIcs'> => {
    return !!model.invitationIcs;
};

export const getInvitationHasEventID = (
    invitation?: EventInvitation
): invitation is RequireSome<EventInvitation, 'eventID'> => {
    return invitation?.eventID !== undefined;
};

export const filterAttachmentsForEvents = (attachments: Attachment[]): Attachment[] =>
    attachments.filter(
        ({ Name = '', MIMEType = '' }) =>
            ICAL_EXTENSIONS.includes(splitExtension(Name)[1]) && MIMEType === ICAL_MIME_TYPE
    );

export const buildMailTo = (email = '') => `mailto:${email}`;

export const getEmailTo = (str: string): string => {
    try {
        const {
            to: [emailTo]
        } = parseMailtoURL(str);
        return emailTo;
    } catch (e) {
        return str;
    }
};

export const getSequence = (event: VcalVeventComponent) => {
    const sequence = +(event.sequence?.value || 0);
    return Math.max(sequence, 0);
};

export const getParticipant = (
    participant: VcalAttendeeProperty | VcalOrganizerProperty,
    contactEmails: ContactEmail[],
    ownAddresses: Address[]
): Participant => {
    const emailTo = getEmailTo(participant.value);
    const selfAddress = ownAddresses.find(
        ({ Email }) => normalizeInternalEmail(Email) === normalizeInternalEmail(emailTo)
    );
    const contact = contactEmails.find(({ Email }) => cleanEmail(Email) === cleanEmail(emailTo));
    const participantName = selfAddress
        ? c('Participant name').t`You`
        : contact?.Name || participant?.parameters?.cn || participant.value;
    const result: Participant = {
        vcalComponent: participant,
        name: participantName,
        email: emailTo
    };
    const { partstat, role } = (participant as VcalAttendeeProperty).parameters || {};
    if (partstat) {
        result.partstat = partstat;
    }
    if (role) {
        result.role = role;
    }
    return result;
};

export const findAttendee = (
    email: string,
    attendees: VcalAttendeeProperty[] = []
): VcalAttendeeProperty | undefined => {
    return attendees.find((attendee) => cleanEmail(getEmailTo(attendee.value)) === cleanEmail(email));
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
        const formattedDate = format(utcDate, 'PP', { locale });
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
    return `${format(fakeUTCDate, 'PPp', { locale })} (GMT${formatTimezoneOffset(utcOffset)})`;
};

const getIsEventInvitationValid = (event: VcalVeventComponent | undefined): event is VcalVeventComponent => {
    if (!event || !getHasDtStart(event) || !getHasUid(event)) {
        return false;
    }
    return true;
};

export const parseEventInvitation = (data: string): EventInvitationRaw | undefined => {
    try {
        if (!data) {
            return;
        }
        const parsedVcalendar = parseWithErrors(data) as VcalVcalendar;
        if (parsedVcalendar.component !== 'vcalendar') {
            return;
        }
        const { components = [], calscale, 'x-wr-timezone': xWrTimezone, method } = parsedVcalendar;
        const event = components.find(getIsEventComponent) as VcalVeventComponent;
        if (!getIsEventInvitationValid(event) || !method?.value) {
            throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID);
        }
        return { vevent: event, calscale: calscale?.value, method: method.value, xWrTimezone: xWrTimezone?.value };
    } catch (e) {
        return;
    }
};

export const processEventInvitation = (
    vevent: VcalVeventComponent,
    message: MessageExtended,
    contactEmails: ContactEmail[],
    ownAddresses: Address[]
) => {
    const attendees = vevent.attendee;
    const organizer = vevent.organizer;
    const originalTo = getOriginalTo(message.data);
    const isOrganizerMode = getIsOrganizerMode(vevent, originalTo);
    const attendee = isOrganizerMode
        ? findAttendee(message.data?.SenderAddress || '', attendees)
        : findAttendee(originalTo, attendees);

    const invitation: EventInvitation = { vevent };
    if (attendees) {
        invitation.participants = attendees.map((attendee) => getParticipant(attendee, contactEmails, ownAddresses));
    }
    if (organizer) {
        invitation.organizer = getParticipant(organizer, contactEmails, ownAddresses);
    }
    if (attendee) {
        invitation.attendee = getParticipant(attendee, contactEmails, ownAddresses);
    }

    return { isOrganizerMode, invitation };
};

export const getInitialInvitationModel = (
    invitationOrError: EventInvitationRaw | EventInvitationError,
    message: MessageExtended,
    contactEmails: ContactEmail[],
    ownAddresses: Address[],
    calendar?: Calendar
) => {
    if (invitationOrError instanceof EventInvitationError) {
        return { method: 'unknown', isOrganizerMode: false, error: invitationOrError };
    }
    const { method, vevent } = invitationOrError;
    const { isOrganizerMode, invitation } = processEventInvitation(vevent, message, contactEmails, ownAddresses);
    return { method, isOrganizerMode, calendar, invitationIcs: invitation };
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

export const getSupportedEventInvitation = ({ vevent, calscale, xWrTimezone, method }: EventInvitationRaw) => {
    if (calscale && calscale.toLowerCase() !== 'gregorian') {
        return;
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
            validated.attendee = [...attendee];
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

        const hasXWrTimezone = !!xWrTimezone;
        const calendarTzid = xWrTimezone ? getSupportedTimezone(xWrTimezone) : undefined;
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

        return { vevent: validated, method };
    } catch (error) {
        if (error instanceof EventInvitationError) {
            throw error;
        }
        return new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, error);
    }
};

type FetchEventInvitation = (args: {
    veventComponent: VcalVeventComponent;
    api: Api;
    getCalendarEventRaw: (event: CalendarEvent) => Promise<VcalVeventComponent>;
    calendars: Calendar[];
    message: MessageExtended;
    contactEmails: ContactEmail[];
    ownAddresses: Address[];
}) => Promise<{
    invitation?: RequireSome<EventInvitation, 'eventID'>;
    parentInvitation?: RequireSome<EventInvitation, 'eventID'>;
    calendar?: Calendar;
}>;
export const fetchEventInvitation: FetchEventInvitation = async ({
    veventComponent,
    api,
    getCalendarEventRaw,
    calendars,
    message,
    contactEmails,
    ownAddresses
}) => {
    const recurrenceID = veventComponent['recurrence-id'];
    const params: GetEventByUIDArguments[] = [{ UID: veventComponent.uid.value, Page: 0, PageSize: 1 }];
    if (recurrenceID) {
        const timestamp = getUnixTime(propertyToUTCDate(recurrenceID));
        params.unshift({ UID: veventComponent.uid.value, Page: 0, PageSize: 1, RecurrenceID: timestamp });
    }
    const response = await Promise.all(params.map((args) => api<{ Events: CalendarEvent[] }>(getEventByUID(args))));
    const events = response.map(({ Events: [event] = [] }) => event).filter(isTruthy);
    if (!events.length) {
        return {};
    }
    const vevents = await Promise.all(events.map((event) => getCalendarEventRaw(event)));
    if (!vevents.length) {
        return {};
    }
    const [vevent, parentVevent] = vevents;
    const [{ ID: veventID, CalendarID }] = events;
    const { invitation } = processEventInvitation(vevent, message, contactEmails, ownAddresses);
    const result: Unwrap<ReturnType<FetchEventInvitation>> = {
        invitation: { ...invitation, eventID: veventID },
        calendar: calendars.find(({ ID }) => ID === CalendarID) || undefined
    };
    if (parentVevent) {
        const { invitation: parentInvitation } = processEventInvitation(
            parentVevent,
            message,
            contactEmails,
            ownAddresses
        );
        result.parentInvitation = { ...parentInvitation, eventID: veventID };
    }
    return result;
};

interface UpdateEventArgs {
    eventID: string;
    vevent: VcalVeventComponent;
    api: Api;
    calendarID: string;
    memberID: string;
    addressKeys: CachedKey[];
    calendarKeys: CachedKey[];
}
const updateEventApi = async ({
    eventID,
    vevent,
    api,
    calendarID,
    memberID,
    addressKeys,
    calendarKeys
}: UpdateEventArgs) => {
    const data = await createCalendarEvent({
        eventComponent: vevent,
        isSwitchCalendar: false,
        ...(await getCreationKeys({ addressKeys, newCalendarKeys: calendarKeys }))
    });
    const Events: UpdateCalendarEventSyncData[] = [
        {
            ID: eventID,
            Event: { Permissions: 3, ...omit(data, ['SharedKeyPacket']) }
        }
    ];
    const {
        Responses: [
            {
                Response: { Code }
            }
        ]
    } = await api<SyncMultipleApiResponse>({
        ...syncMultipleEvents(calendarID, { MemberID: memberID, Events }),
        silence: true
    });
    if (Code !== API_CODES.SINGLE_SUCCESS) {
        throw new Error('Update unsuccessful');
    }
};

interface UpdateEventInvitationArgs
    extends RequireSome<InvitationModel, 'invitationIcs' | 'invitationApi' | 'calendar'> {
    api: Api;
    memberID: string;
    addressKeys: CachedKey[];
    calendarKeys: CachedKey[];
    message: MessageExtended;
    contactEmails: ContactEmail[];
    ownAddresses: Address[];
}
export const updateEventInvitation = async ({
    method,
    isOrganizerMode,
    calendar,
    invitationIcs,
    invitationApi,
    parentInvitationApi,
    memberID,
    addressKeys,
    calendarKeys,
    api,
    message,
    contactEmails,
    ownAddresses
}: UpdateEventInvitationArgs): Promise<undefined | RequireSome<EventInvitation, 'eventID'>> => {
    const eventIcs = invitationIcs.vevent;
    const attendeeIcs = invitationIcs.attendee?.vcalComponent;
    const recurrenceIdIcs = eventIcs['recurrence-id'];
    const eventApi = invitationApi.vevent;
    const attendeeApi = invitationApi.attendee?.vcalComponent;
    const eventID = invitationApi.eventID;

    if (isOrganizerMode) {
        if (method === ICAL_METHOD.REPLY) {
            if (!eventApi) {
                if (!recurrenceIdIcs) {
                    return;
                }
                // TODO: create single edit
            }
            if (!attendeeIcs) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.UPDATING_ERROR);
            }
            if (!attendeeApi) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.UPDATING_ERROR);
            }
            if (!getAttendeeHasPartStat(attendeeIcs) || !getAttendeeHasPartStat(attendeeApi)) {
                throw new Error('Participation status of attendees required');
            }
            const partStatIcs = attendeeIcs.parameters.partstat;
            const partStatApi = attendeeApi.parameters.partstat;
            if (partStatApi !== partStatIcs) {
                // TODO: update eventApi with partstatIcs
            }
        }
    }
    if (method === ICAL_METHOD.REQUEST) {
        const sequenceApi = +(eventApi?.sequence?.value || 0);
        const sequenceIcs = +(eventIcs.sequence?.value || 0);
        const sequenceDiff = sequenceIcs - sequenceApi;
        if (!eventApi) {
            // TODO: check for SharedEventID and create new event accordingly
            return;
        }
        if (sequenceDiff < 0) {
            return;
        }
        const hasUpdatedTitle = eventIcs.summary?.value !== eventApi.summary?.value;
        const hasUpdatedDescription = eventIcs.description?.value !== eventApi.description?.value;
        const hasUpdatedLocation = eventIcs.location?.value !== eventApi.location?.value;
        const hasUpdatedAttendees = getHasModifiedAttendees(eventIcs.attendee, eventApi.attendee);
        const isUpdated =
            sequenceDiff > 0 || hasUpdatedTitle || hasUpdatedDescription || hasUpdatedLocation || hasUpdatedAttendees;
        if (isUpdated) {
            // update the api event by the ics one
            try {
                await updateEventApi({
                    eventID,
                    vevent: eventIcs,
                    calendarID: calendar.ID,
                    api,
                    memberID,
                    addressKeys,
                    calendarKeys
                });
                const { invitation } = processEventInvitation(eventIcs, message, contactEmails, ownAddresses);
                return { ...invitation, eventID };
            } catch (error) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.UPDATING_ERROR);
            }
        }
        return;
    }
    if (method === ICAL_METHOD.CANCEL) {
        let cancel = false;
        if (eventApi) {
            if (eventApi.status?.value === ICAL_EVENT_STATUS.CANCELLED) {
                return;
            }
            cancel = true;
        } else {
            const parentExdates = parentInvitationApi?.vevent.exdate;
            if (!recurrenceIdIcs || !parentExdates) {
                return;
            }
            const isCancelled = parentExdates.find((exdate) => {
                return +propertyToUTCDate(exdate) === +propertyToUTCDate(recurrenceIdIcs);
            });
            cancel = !isCancelled;
        }
        // cancel API event if needed
        if (cancel) {
            try {
                await updateEventApi({
                    eventID,
                    vevent: { ...eventApi, status: { value: ICAL_EVENT_STATUS.CANCELLED } },
                    calendarID: calendar.ID,
                    api,
                    memberID,
                    addressKeys,
                    calendarKeys
                });
            } catch (error) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.CANCELLATION_ERROR);
            }
        }
    }
    return;
};

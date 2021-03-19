import { format, getUnixTime } from 'date-fns';
import { getAttendeeEmail, getSupportedAttendee } from 'proton-shared/lib/calendar/attendees';
import { getIsCalendarDisabled } from 'proton-shared/lib/calendar/calendar';
import {
    CALENDAR_FLAGS,
    ICAL_ATTENDEE_STATUS,
    ICAL_EXTENSIONS,
    ICAL_METHOD,
    ICAL_METHODS_ATTENDEE,
    ICAL_MIME_TYPE,
    MAX_LENGTHS,
} from 'proton-shared/lib/calendar/constants';
import { findAttendee, getParticipant, getSelfAddressData } from 'proton-shared/lib/calendar/integration/invite';
import { getOccurrencesBetween } from 'proton-shared/lib/calendar/recurring';

import { getHasConsistentRrule, getSupportedRrule } from 'proton-shared/lib/calendar/rrule';
import {
    getIsDateOutOfBounds,
    getIsWellFormedDateOrDateTime,
    getSupportedUID,
} from 'proton-shared/lib/calendar/support';
import { parseWithErrors } from 'proton-shared/lib/calendar/vcal';
import {
    buildVcalOrganizer,
    dateTimeToProperty,
    getDateProperty,
    getDateTimeProperty,
    getDateTimePropertyInDifferentTimezone,
    getDtendProperty,
    propertyToUTCDate,
} from 'proton-shared/lib/calendar/vcalConverter';
import {
    getHasDtStart,
    getHasRecurrenceId,
    getHasUid,
    getIcalMethod,
    getIsCalendar,
    getIsEventComponent,
    getIsPropertyAllDay,
    getIsRecurring,
    getIsTimezoneComponent,
    getIsValidMethod,
    getIsXOrIanaComponent,
    getPmSharedEventID,
    getPmSharedSessionKey,
    getPropertyTzid,
    getSequence,
} from 'proton-shared/lib/calendar/vcalHelper';
import { SECOND, APPS } from 'proton-shared/lib/constants';
import { addDays, format as formatUTC } from 'proton-shared/lib/date-fns-utc';
import { convertUTCDateTimeToZone, fromUTCDate, getSupportedTimezone } from 'proton-shared/lib/date/timezone';
import { unique } from 'proton-shared/lib/helpers/array';
import { hasBit } from 'proton-shared/lib/helpers/bitset';
import { canonizeInternalEmail } from 'proton-shared/lib/helpers/email';
import { splitExtension } from 'proton-shared/lib/helpers/file';
import { truncate } from 'proton-shared/lib/helpers/string';
import { Address } from 'proton-shared/lib/interfaces';
import {
    Calendar,
    CalendarEvent,
    CalendarEventWithMetadata,
    CalendarWidgetData,
    Participant,
    PmInviteData,
} from 'proton-shared/lib/interfaces/calendar';
import {
    VcalDateOrDateTimeProperty,
    VcalDateTimeProperty,
    VcalFloatingDateTimeProperty,
    VcalVcalendar,
    VcalVeventComponent,
    VcalVtimezoneComponent,
    VcalXOrIanaComponent,
} from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { Attachment, Message } from 'proton-shared/lib/interfaces/mail/Message';
import { RequireSome, Unwrap } from 'proton-shared/lib/interfaces/utils';
import { getOriginalTo } from 'proton-shared/lib/mail/messages';
import { c } from 'ttag';
import { getAppName } from 'proton-shared/lib/apps/helper';
import { MessageExtendedWithData } from '../../models/message';
import { EVENT_INVITATION_ERROR_TYPE, EventInvitationError } from './EventInvitationError';
import { FetchAllEventsByUID } from './inviteApi';

const calendarAppName = getAppName(APPS.PROTONCALENDAR);

export enum EVENT_TIME_STATUS {
    PAST,
    HAPPENING,
    FUTURE,
}

export interface EventInvitation {
    originalVcalInvitation?: VcalVcalendar;
    vevent: VcalVeventComponent;
    calendarEvent?: CalendarEvent;
    method?: ICAL_METHOD;
    vtimezone?: VcalVtimezoneComponent;
    xOrIanaComponents?: VcalXOrIanaComponent[];
    organizer?: Participant;
    attendee?: Participant;
    participants?: Participant[];
}

export enum UPDATE_ACTION {
    NONE,
    KEEP_PARTSTAT,
    RESET_PARTSTAT,
    UPDATE_PARTSTAT,
    CANCEL,
}

export interface InvitationModel {
    isOrganizerMode: boolean;
    timeStatus: EVENT_TIME_STATUS;
    isFreeUser: boolean;
    isPartyCrasher?: boolean;
    isAddressDisabled: boolean;
    canCreateCalendar: boolean;
    maxUserCalendarsDisabled: boolean;
    hasNoCalendars: boolean;
    isOutdated?: boolean;
    isFromFuture?: boolean;
    updateAction?: UPDATE_ACTION;
    hideSummary?: boolean;
    hideLink?: boolean;
    calendarData?: CalendarWidgetData;
    singleEditData?: CalendarEventWithMetadata[];
    pmData?: PmInviteData;
    invitationIcs?: RequireSome<EventInvitation, 'method'>;
    invitationApi?: RequireSome<EventInvitation, 'calendarEvent'>;
    parentInvitationApi?: RequireSome<EventInvitation, 'calendarEvent'>;
    error?: EventInvitationError;
    hasDecryptionError?: boolean;
}

export const getHasInvitation = (model: InvitationModel): model is RequireSome<InvitationModel, 'invitationIcs'> => {
    return !!model.invitationIcs;
};

export const getInvitationHasEventID = (
    invitation: EventInvitation
): invitation is RequireSome<EventInvitation, 'calendarEvent'> => {
    return invitation.calendarEvent?.ID !== undefined;
};

export const getInvitationHasAttendee = (
    invitation: EventInvitation
): invitation is RequireSome<EventInvitation, 'attendee'> => {
    return invitation.attendee !== undefined;
};

export const getHasFullCalendarData = (data?: CalendarWidgetData): data is Required<CalendarWidgetData> => {
    const { memberID, addressKeys, calendarKeys, calendarSettings } = data || {};
    return !!(memberID && addressKeys && calendarKeys && calendarSettings);
};

export const filterAttachmentsForEvents = (attachments: Attachment[]): Attachment[] =>
    attachments.filter(
        ({ Name = '', MIMEType = '' }) =>
            ICAL_EXTENSIONS.includes(splitExtension(Name)[1]) && MIMEType.includes(ICAL_MIME_TYPE)
    );

const withMessageDtstamp = <T>(properties: VcalVeventComponent & T, { Time }: Message): VcalVeventComponent & T => {
    if (properties.dtstamp) {
        return properties;
    }
    // use the received time of the mail as dtstamp
    return {
        ...properties,
        dtstamp: dateTimeToProperty(fromUTCDate(new Date(Time * SECOND)), true),
    };
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

export const getIsOrganizerMode = (event: VcalVeventComponent, emailTo: string) => {
    if (!event.organizer) {
        return false;
    }
    const organizerEmail = getAttendeeEmail(event.organizer);
    return canonizeInternalEmail(organizerEmail) === canonizeInternalEmail(emailTo);
};

export const getSingleEditWidgetData = ({
    otherEvents,
    otherParentEvents,
}: Unwrap<ReturnType<FetchAllEventsByUID>>) => {
    return (otherParentEvents || otherEvents).filter(({ RecurrenceID }) => !!RecurrenceID);
};

export const getIsInvitationOutdated = ({
    invitationIcs,
    invitationApi,
    isOrganizerMode,
}: {
    invitationIcs: EventInvitation;
    invitationApi?: EventInvitation;
    isOrganizerMode: boolean;
}) => {
    const veventIcs = invitationIcs.vevent;
    const veventApi = invitationApi?.vevent;
    const updateTime = invitationApi?.attendee?.updateTime;
    if (!veventApi) {
        return false;
    }
    // DTSTAMP should always be present, but just in case
    const timestampIcs = veventIcs.dtstamp ? getUnixTime(propertyToUTCDate(veventIcs.dtstamp)) : undefined;
    const timestampApi = veventApi.dtstamp ? getUnixTime(propertyToUTCDate(veventApi.dtstamp)) : undefined;
    const timestampDiff = timestampIcs !== undefined && timestampApi !== undefined ? timestampIcs - timestampApi : 0;
    const updateTimeDiff = timestampIcs !== undefined && updateTime !== undefined ? timestampIcs - updateTime : 0;
    const sequenceDiff = getSequence(veventIcs) - getSequence(veventApi);

    if (isOrganizerMode) {
        return sequenceDiff < 0 || updateTimeDiff < 0;
    }
    return sequenceDiff < 0 || timestampDiff < 0;
};

export const getIsInvitationFromFuture = ({
    invitationIcs,
    invitationApi,
    isOrganizerMode,
}: {
    invitationIcs: EventInvitation;
    invitationApi?: EventInvitation;
    isOrganizerMode: boolean;
}) => {
    const veventIcs = invitationIcs.vevent;
    const veventApi = invitationApi?.vevent;
    if (!veventApi) {
        return false;
    }
    const sequenceDiff = getSequence(veventIcs) - getSequence(veventApi);
    // return true when the attendee replies to an instance of the event with higher sequence
    return isOrganizerMode && sequenceDiff > 0;
};

/**
 * Determines if a single edit can be created from a parent. So basically check if the recurrence-id
 * matches a parent occurrence
 */
export const getCanCreateSingleEdit = (singleEditVevent: VcalVeventComponent, parentVevent: VcalVeventComponent) => {
    if (!getIsRecurring(parentVevent) || !getHasRecurrenceId(singleEditVevent)) {
        return false;
    }
    const utcStart = +propertyToUTCDate(singleEditVevent['recurrence-id']);
    const occurrencesAtStart = getOccurrencesBetween(parentVevent, utcStart, utcStart);
    return occurrencesAtStart.length === 1;
};

/**
 * Determines if a event has already passed with respect to a timestamp in milliseconds
 */
export const getEventTimeStatus = (vevent: VcalVeventComponent, now: number) => {
    if (vevent.rrule?.value) {
        // ignore complexity of recurring events for the moment
        return EVENT_TIME_STATUS.FUTURE;
    }
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

export const formatStartDateTime = (
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
    return format(propertyToUTCDate(dateTimeProperty), 'PPp', { locale });
};

export const formatEndDateTime = (property: VcalDateOrDateTimeProperty, locale: Locale, isAllDay: boolean) => {
    if (isAllDay) {
        const utcDate = propertyToUTCDate(property);
        const formattedDate = formatUTC(addDays(utcDate, -1), 'PP', { locale });
        return formattedDate;
    }
    const dateTimeProperty = property as VcalDateTimeProperty;
    return format(propertyToUTCDate(dateTimeProperty), 'PPp', { locale });
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
        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.PARSING_ERROR);
    }
};

interface ProcessedInvitation<T> {
    isOrganizerMode: boolean;
    timeStatus: EVENT_TIME_STATUS;
    isAddressDisabled: boolean;
    invitation: EventInvitation & T;
}
export const processEventInvitation = <T>(
    invitation: EventInvitation & T,
    message: MessageExtendedWithData,
    contactEmails: ContactEmail[],
    ownAddresses: Address[]
): ProcessedInvitation<T> => {
    const { vevent, calendarEvent } = invitation;
    const timeStatus = getEventTimeStatus(vevent, Date.now());
    const attendees = vevent.attendee || [];
    const { organizer } = vevent;
    const originalTo = getOriginalTo(message.data);
    const originalFrom = message.data.SenderAddress;
    const isOrganizerMode = getIsOrganizerMode(vevent, originalTo);
    const { selfAddress, selfAttendee } = getSelfAddressData({
        isOrganizer: isOrganizerMode,
        organizer,
        attendees,
        addresses: ownAddresses,
    });
    const isAddressDisabled = selfAddress ? selfAddress.Status === 0 : false;

    const processed: EventInvitation & T = { ...invitation };

    if (attendees) {
        processed.participants = attendees.map((attendee) =>
            getParticipant({
                participant: attendee,
                contactEmails,
                addresses: ownAddresses,
                emailTo: originalTo,
            })
        );
    }
    if (organizer) {
        processed.organizer = getParticipant({
            participant: organizer,
            contactEmails,
            addresses: ownAddresses,
            emailTo: originalTo,
        });
    }
    if (isOrganizerMode) {
        const { attendee, index } = findAttendee(originalFrom, attendees);
        if (attendee) {
            processed.attendee = getParticipant({
                participant: attendee,
                contactEmails,
                addresses: ownAddresses,
                emailTo: originalTo,
                index,
                calendarAttendees: calendarEvent?.Attendees,
            });
        }
    } else if (selfAttendee) {
        processed.attendee = getParticipant({
            participant: selfAttendee,
            contactEmails,
            addresses: ownAddresses,
            emailTo: originalTo,
        });
    }

    return { isOrganizerMode, timeStatus, isAddressDisabled, invitation: processed };
};

interface GetInitialInvitationModelArgs {
    invitationOrError: RequireSome<EventInvitation, 'method'> | EventInvitationError;
    message: MessageExtendedWithData;
    contactEmails: ContactEmail[];
    ownAddresses: Address[];
    calendar?: Calendar;
    isFreeUser: boolean;
    hasNoCalendars: boolean;
    canCreateCalendar: boolean;
    maxUserCalendarsDisabled: boolean;
}
export const getInitialInvitationModel = ({
    invitationOrError,
    message,
    contactEmails,
    ownAddresses,
    calendar,
    isFreeUser,
    hasNoCalendars,
    canCreateCalendar,
    maxUserCalendarsDisabled,
}: GetInitialInvitationModelArgs) => {
    if (invitationOrError instanceof EventInvitationError) {
        return {
            isOrganizerMode: false,
            isAddressDisabled: false,
            isFreeUser,
            canCreateCalendar,
            maxUserCalendarsDisabled,
            hasNoCalendars,
            timeStatus: EVENT_TIME_STATUS.FUTURE,
            error: invitationOrError,
        };
    }
    const { isOrganizerMode, timeStatus, isAddressDisabled, invitation } = processEventInvitation(
        invitationOrError,
        message,
        contactEmails,
        ownAddresses
    );
    const result: InvitationModel = {
        isOrganizerMode,
        timeStatus,
        isFreeUser,
        isAddressDisabled,
        canCreateCalendar,
        maxUserCalendarsDisabled,
        hasNoCalendars,
        invitationIcs: invitation,
        isPartyCrasher: isOrganizerMode ? false : !invitation.attendee,
    };
    if (calendar) {
        result.calendarData = {
            calendar,
            isCalendarDisabled: getIsCalendarDisabled(calendar),
            calendarNeedsUserAction:
                hasBit(calendar.Flags, CALENDAR_FLAGS.RESET_NEEDED) ||
                hasBit(calendar.Flags, CALENDAR_FLAGS.UPDATE_PASSPHRASE),
        };
    }
    if (!getIsValidMethod(invitation.method, isOrganizerMode)) {
        result.error = new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVALID_METHOD, {
            method: invitation.method,
        });
    }
    const sharedEventID = getPmSharedEventID(invitation.vevent);
    const sharedSessionKey = getPmSharedSessionKey(invitation.vevent);
    if (sharedEventID && sharedSessionKey) {
        result.pmData = { sharedEventID, sharedSessionKey };
    }
    return result;
};

interface GetSupportedDateOrDateTimePropertyArgs {
    property: VcalDateOrDateTimeProperty | VcalFloatingDateTimeProperty;
    hasXWrTimezone: boolean;
    calendarTzid?: string;
    isRecurring?: boolean;
    method?: ICAL_METHOD;
}
export const getSupportedDateOrDateTimeProperty = ({
    property,
    hasXWrTimezone,
    calendarTzid,
    isRecurring = false,
    method,
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
            throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, { method });
        }
        if (hasXWrTimezone && !calendarTzid) {
            throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, { method });
        }
        return getDateTimeProperty(partDayProperty.value, calendarTzid);
    }

    const supportedTzid = getSupportedTimezone(partDayPropertyTzid);
    if (!supportedTzid) {
        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, { method });
    }
    return getDateTimeProperty(partDayProperty.value, supportedTzid);
};

interface GetLinkedDateTimePropertyArgs {
    property: VcalDateOrDateTimeProperty;
    isAllDay: boolean;
    tzid?: string;
    method?: ICAL_METHOD;
}
const getLinkedDateTimeProperty = ({
    property,
    isAllDay,
    tzid,
    method,
}: GetLinkedDateTimePropertyArgs): VcalDateOrDateTimeProperty => {
    if (isAllDay) {
        return getDateProperty(property.value);
    }
    if (getIsPropertyAllDay(property)) {
        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID, { method });
    }
    const supportedTzid = getPropertyTzid(property);
    if (!supportedTzid || !tzid) {
        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, { method });
    }
    if (tzid !== supportedTzid) {
        // the linked date-time property should have the same tzid as dtstart
        return getDateTimePropertyInDifferentTimezone(property, tzid, isAllDay);
    }
    return getDateTimeProperty(property.value, tzid);
};

export const getSupportedEventInvitation = (
    vcalInvitation: VcalVcalendar,
    message: Message
): RequireSome<EventInvitation, 'method'> | undefined => {
    const { version, calscale, 'x-wr-timezone': xWrTimezone, method } = vcalInvitation;
    if (!method?.value || method.value.toLowerCase() === 'publish') {
        // Ignore the ics. We don't know if it is an invitation
        return;
    }
    const supportedMethod = getIcalMethod(method);
    if (!supportedMethod) {
        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVALID_METHOD, { method: supportedMethod });
    }
    if ((calscale && calscale.value.toLowerCase() !== 'gregorian') || version?.value !== '2.0') {
        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, { method: supportedMethod });
    }
    const vevent = extractVevent(vcalInvitation);
    const vtimezone = extractVTimezone(vcalInvitation);
    if (!getIsEventInvitationValid(vevent)) {
        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID, { method: supportedMethod });
    }
    try {
        const event = withMessageDtstamp(vevent, message);
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
            duration,
            'x-pm-session-key': sharedSessionKey,
            'x-pm-shared-event-id': sharedEventID,
        } = event;
        const trimmedSummaryValue = summary?.value.trim();
        const trimmedDescriptionValue = description?.value.trim();
        const trimmedLocationValue = location?.value.trim();
        const isRecurring = !!rrule || !!recurrenceId;

        const validated: VcalVeventComponent & Required<Pick<VcalVeventComponent, 'uid' | 'dtstamp' | 'dtstart'>> = {
            component,
            uid: getSupportedUID(uid),
            dtstamp: { ...dtstamp },
            dtstart: { ...dtstart },
        };
        let ignoreRrule = false;

        if (sharedSessionKey) {
            validated['x-pm-session-key'] = { ...sharedSessionKey };
        }
        if (sharedEventID) {
            validated['x-pm-shared-event-id'] = { ...sharedEventID };
        }
        if (organizer) {
            validated.organizer = { ...organizer };
        } else {
            // The ORGANIZER field is mandatory in an invitation
            const guessOrganizerEmail = ICAL_METHODS_ATTENDEE.includes(supportedMethod)
                ? getOriginalTo(message)
                : message.SenderAddress;
            validated.organizer = buildVcalOrganizer(guessOrganizerEmail);
        }

        if (attendee) {
            if (attendee.length > 100) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, {
                    method: supportedMethod,
                });
            }
            const attendeeEmails = attendee.map((att) => getAttendeeEmail(att));
            if (unique(attendeeEmails).length !== attendeeEmails.length) {
                // Do not accept invitations with repeated emails as they will cause problems.
                // Usually external providers don't allow this to happen
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, {
                    method: supportedMethod,
                });
            }
            validated.attendee = attendee.map((vcalAttendee) => getSupportedAttendee(vcalAttendee));
        }

        if (trimmedSummaryValue) {
            validated.summary = {
                ...summary,
                value: truncate(trimmedSummaryValue, MAX_LENGTHS.TITLE),
            };
        }
        if (trimmedDescriptionValue) {
            validated.description = {
                ...description,
                value: truncate(trimmedDescriptionValue, MAX_LENGTHS.EVENT_DESCRIPTION),
            };
        }
        if (trimmedLocationValue) {
            validated.location = {
                ...location,
                value: truncate(trimmedLocationValue, MAX_LENGTHS.LOCATION),
            };
        }
        const sequenceValue = sequence?.value || 0;
        const sequenceSafeValue = Number.isSafeInteger(sequenceValue) ? sequenceValue : 0;
        validated.sequence = { value: Math.max(0, sequenceSafeValue) };

        const hasXWrTimezone = !!xWrTimezone?.value;
        const calendarTzid = xWrTimezone ? getSupportedTimezone(xWrTimezone.value) : undefined;

        validated.dtstart = getSupportedDateOrDateTimeProperty({
            property: dtstart,
            hasXWrTimezone,
            calendarTzid,
            isRecurring,
            method: supportedMethod,
        });
        const isAllDayStart = getIsPropertyAllDay(validated.dtstart);
        const startTzid = getPropertyTzid(validated.dtstart);
        if (!getIsWellFormedDateOrDateTime(validated.dtstart)) {
            throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID, { method: supportedMethod });
        }
        if (getIsDateOutOfBounds(validated.dtstart)) {
            throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, {
                method: supportedMethod,
            });
        }
        if (dtend) {
            const supportedDtend = getSupportedDateOrDateTimeProperty({
                property: dtend,
                hasXWrTimezone,
                calendarTzid,
                isRecurring,
                method: supportedMethod,
            });
            if (!getIsWellFormedDateOrDateTime(supportedDtend)) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID, {
                    method: supportedMethod,
                });
            }
            if (getIsDateOutOfBounds(supportedDtend)) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, {
                    method: supportedMethod,
                });
            }
            const startDateUTC = propertyToUTCDate(validated.dtstart);
            const endDateUTC = propertyToUTCDate(supportedDtend);
            // allow a non-RFC-compliant all-day event with DTSTART = DTEND
            const modifiedEndDateUTC =
                !getIsPropertyAllDay(dtend) || +startDateUTC === +endDateUTC ? endDateUTC : addDays(endDateUTC, -1);
            const duration = +modifiedEndDateUTC - +startDateUTC;

            if (duration > 0) {
                validated.dtend = supportedDtend;
            }
        } else if (duration) {
            throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, {
                method: supportedMethod,
            });
        }
        const isAllDayEnd = validated.dtend ? getIsPropertyAllDay(validated.dtend) : undefined;
        if (isAllDayEnd !== undefined && +isAllDayStart ^ +isAllDayEnd) {
            throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID, { method: supportedMethod });
        }
        if (exdate) {
            if (!rrule) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID, {
                    method: supportedMethod,
                });
            }
            const supportedExdate = exdate.map((property) =>
                getSupportedDateOrDateTimeProperty({
                    property,
                    hasXWrTimezone,
                    calendarTzid,
                    isRecurring,
                    method: supportedMethod,
                })
            );
            validated.exdate = supportedExdate.map((property) =>
                getLinkedDateTimeProperty({
                    property,
                    isAllDay: isAllDayStart,
                    tzid: startTzid,
                    method: supportedMethod,
                })
            );
        }
        if (recurrenceId) {
            if (rrule) {
                if (method.value === ICAL_METHOD.REPLY) {
                    // the external provider forgot to remove the RRULE
                    ignoreRrule = true;
                } else {
                    throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, {
                        method: supportedMethod,
                    });
                }
            }
            // RECURRENCE-ID cannot be linked with DTSTART of the parent event at this point since we do not have access to it
            validated['recurrence-id'] = getSupportedDateOrDateTimeProperty({
                property: recurrenceId,
                hasXWrTimezone,
                calendarTzid,
                isRecurring,
                method: supportedMethod,
            });
        }

        if (rrule && !ignoreRrule) {
            const invitationTzid = vtimezone?.tzid.value;
            const guessTzid = invitationTzid ? getSupportedTimezone(invitationTzid) : undefined;
            const supportedRrule = getSupportedRrule({ ...validated, rrule }, true, guessTzid);
            if (!supportedRrule) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, {
                    method: supportedMethod,
                });
            }
            validated.rrule = supportedRrule;
            if (!getHasConsistentRrule(validated)) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID, {
                    method: supportedMethod,
                });
            }
        }

        return {
            method: supportedMethod,
            vevent: validated,
            vtimezone,
            originalVcalInvitation: vcalInvitation,
        };
    } catch (error) {
        if (error instanceof EventInvitationError) {
            throw error;
        }
        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, { externalError: error });
    }
};

export const getCalendarEventLink = (model: RequireSome<InvitationModel, 'invitationIcs'>) => {
    const {
        isOrganizerMode,
        hideLink,
        isPartyCrasher,
        isOutdated,
        calendarData,
        invitationIcs: { method, attendee: attendeeIcs },
        invitationApi,
        isFreeUser,
        canCreateCalendar,
        hasNoCalendars,
        hasDecryptionError,
    } = model;

    if (hideLink) {
        return {};
    }

    const hasAlsoReplied =
        attendeeIcs?.partstat &&
        [ICAL_ATTENDEE_STATUS.ACCEPTED, ICAL_ATTENDEE_STATUS.TENTATIVE, ICAL_ATTENDEE_STATUS.DECLINED].includes(
            attendeeIcs?.partstat
        );
    const canBeAnswered = !isOrganizerMode && method === ICAL_METHOD.REQUEST && !isOutdated;
    const canBeManaged =
        isOrganizerMode && (method === ICAL_METHOD.REPLY || (method === ICAL_METHOD.COUNTER && hasAlsoReplied));
    const canBeSeenUpdated =
        [ICAL_METHOD.CANCEL, ICAL_METHOD.COUNTER, ICAL_METHOD.REFRESH].includes(method) ||
        (!isOrganizerMode && method === ICAL_METHOD.REQUEST && isOutdated);

    if (isFreeUser && !isPartyCrasher) {
        if (canBeAnswered) {
            // must return a non-empty to given how AppLink works
            return {
                to: '',
                text: c('Link').t`Create a new calendar to answer this invitation`,
            };
        }
        if (canBeManaged) {
            return {
                to: '',
                text: c('Link').t`Create a new calendar to manage your invitations`,
            };
        }
    }

    const safeCalendarNeedsUserAction = calendarData?.calendarNeedsUserAction && !isPartyCrasher;
    const noCalendarIsActiveYet = !hasNoCalendars && !calendarData;
    // the calendar needs a user action to be active
    if (safeCalendarNeedsUserAction || noCalendarIsActiveYet) {
        if (canBeManaged) {
            return {
                to: '',
                text: c('Link').t`You need to activate your calendar keys to manage this invitation`,
            };
        }
        if (canBeAnswered) {
            return {
                to: '',
                text: c('Link').t`You need to activate your calendar keys to answer this invitation`,
            };
        }
        if (canBeSeenUpdated && invitationApi) {
            const text = isOrganizerMode
                ? c('Link').t`You need to activate your calendar keys to see the updated event`
                : c('Link').t`You need to activate your calendar keys to see the updated invitation`;
            return { to: '', text };
        }
        return {};
    }

    // the invitation is unanswered
    if (!invitationApi) {
        if (hasDecryptionError) {
            // the event exists in the db but couldn't be decrypted
            const to = `/settings/security#addresses`;
            const toApp = APPS.PROTONMAIL;
            if (canBeManaged) {
                return {
                    to,
                    toApp,
                    text: c('Link').t`You need to reactivate your keys to manage this invitation`,
                };
            }
            if (canBeSeenUpdated) {
                const text = isOrganizerMode
                    ? c('Link').t`You need to reactivate your keys to see the updated event`
                    : c('Link').t`You need to reactivate your keys to see the updated invitation`;
                return { to, toApp, text };
            }
        }
        if (!calendarData && canCreateCalendar && canBeAnswered && !isPartyCrasher) {
            return {
                to: '',
                text: c('Link').t`Create a new calendar to answer this invitation`,
            };
        }
        return {};
    }

    // the invitation has been answered
    const calendarID = calendarData?.calendar.ID || '';
    const eventID = invitationApi?.calendarEvent.ID;
    const recurrenceIDProperty = invitationApi?.vevent['recurrence-id'];
    const recurrenceID = recurrenceIDProperty ? getUnixTime(propertyToUTCDate(recurrenceIDProperty)) : undefined;
    const params = new URLSearchParams();
    params.set('Action', 'VIEW');
    params.set('EventID', eventID);
    params.set('CalendarID', calendarID);
    if (recurrenceID) {
        params.set('RecurrenceID', `${recurrenceID}`);
    }
    const linkTo = calendarID && eventID ? `/event?${params.toString()}` : undefined;
    if (!linkTo) {
        return {};
    }
    return {
        to: linkTo,
        text: isOutdated
            ? c('Link').t`Open updated event in ${calendarAppName}`
            : c('Link').t`Open in ${calendarAppName}`,
    };
};

export const getDoNotDisplayButtons = (model: RequireSome<InvitationModel, 'invitationIcs'>) => {
    const {
        isOrganizerMode,
        isPartyCrasher,
        invitationIcs: { method },
        calendarData,
        isOutdated,
        isFreeUser,
        isAddressDisabled,
    } = model;

    if (isOrganizerMode) {
        return true;
    }
    return (
        method === ICAL_METHOD.CANCEL ||
        !!isOutdated ||
        isAddressDisabled ||
        !!calendarData?.isCalendarDisabled ||
        isFreeUser ||
        isPartyCrasher
    );
};

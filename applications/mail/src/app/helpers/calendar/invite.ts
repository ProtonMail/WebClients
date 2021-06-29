import { format, getUnixTime } from 'date-fns';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { getAttendeeEmail } from '@proton/shared/lib/calendar/attendees';
import { getIsCalendarDisabled } from '@proton/shared/lib/calendar/calendar';
import {
    CALENDAR_FLAGS,
    ICAL_ATTENDEE_STATUS,
    ICAL_EXTENSIONS,
    ICAL_METHOD,
    ICAL_METHODS_ATTENDEE,
} from '@proton/shared/lib/calendar/constants';
import { generateVeventHashUID } from '@proton/shared/lib/calendar/helper';
import { getSupportedEvent } from '@proton/shared/lib/calendar/icsSurgery/vevent';
import { findAttendee, getParticipant, getSelfAddressData } from '@proton/shared/lib/calendar/integration/invite';
import { getOccurrencesBetween } from '@proton/shared/lib/calendar/recurring';

import { parseWithErrors } from '@proton/shared/lib/calendar/vcal';
import {
    buildVcalOrganizer,
    dateTimeToProperty,
    getDtendProperty,
    propertyToUTCDate,
} from '@proton/shared/lib/calendar/vcalConverter';
import {
    getHasDtStart,
    getHasRecurrenceId,
    getIcalMethod,
    getIsCalendar,
    getIsEventComponent,
    getIsRecurring,
    getIsTimezoneComponent,
    getIsValidMethod,
    getIsXOrIanaComponent,
    getPmSharedEventID,
    getPmSharedSessionKey,
    getSequence,
} from '@proton/shared/lib/calendar/vcalHelper';
import { getIsEventCancelled } from '@proton/shared/lib/calendar/veventHelper';
import { APPS, SECOND } from '@proton/shared/lib/constants';
import { addDays, format as formatUTC } from '@proton/shared/lib/date-fns-utc';
import { fromUTCDate, getSupportedTimezone } from '@proton/shared/lib/date/timezone';
import { getIsAddressActive, getIsAddressDisabled } from '@proton/shared/lib/helpers/address';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { canonizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { splitExtension } from '@proton/shared/lib/helpers/file';
import { unary } from '@proton/shared/lib/helpers/function';
import { Address } from '@proton/shared/lib/interfaces';
import {
    Calendar,
    CalendarEvent,
    CalendarEventWithMetadata,
    CalendarWidgetData,
    Participant,
    PmInviteData,
    VcalNumberProperty,
    VcalStringProperty,
} from '@proton/shared/lib/interfaces/calendar';
import {
    VcalDateOrDateTimeProperty,
    VcalDateTimeProperty,
    VcalVcalendar,
    VcalVeventComponent,
    VcalVtimezoneComponent,
    VcalXOrIanaComponent,
} from '@proton/shared/lib/interfaces/calendar/VcalModel';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { RequireSome, Unwrap } from '@proton/shared/lib/interfaces/utils';
import { getOriginalTo } from '@proton/shared/lib/mail/messages';
import {
    EVENT_INVITATION_ERROR_TYPE,
    EventInvitationError,
} from '@proton/shared/lib/calendar/icsSurgery/EventInvitationError';
import { c } from 'ttag';
import { MessageExtendedWithData } from '../../models/message';
import { FetchAllEventsByUID } from './inviteApi';

const calendarAppName = getAppName(APPS.PROTONCALENDAR);

export enum EVENT_TIME_STATUS {
    PAST,
    HAPPENING,
    FUTURE,
}

export interface EventInvitation {
    originalVcalInvitation?: VcalVcalendar;
    originalUid?: string;
    fileName?: string;
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
    isImport: boolean;
    isOrganizerMode: boolean;
    hasMultipleVevents: boolean;
    timeStatus: EVENT_TIME_STATUS;
    isPartyCrasher?: boolean;
    isAddressActive: boolean;
    isAddressDisabled: boolean;
    canCreateCalendar: boolean;
    maxUserCalendarsDisabled: boolean;
    mustReactivateCalendars: boolean;
    hasNoCalendars: boolean;
    isOutdated?: boolean;
    isFromFuture?: boolean;
    reinviteEventID?: string;
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

interface NonRFCCompliantVcalendar extends VcalVcalendar {
    uid?: VcalStringProperty;
    sequence?: VcalNumberProperty;
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
    attachments.filter(({ Name = '' }) => ICAL_EXTENSIONS.includes(splitExtension(Name)[1]));

// Some external providers include UID and SEQUENCE outside the VEVENT component
export const withOutsideUIDAndSequence = (vevent: VcalVeventComponent, vcal: NonRFCCompliantVcalendar) => {
    const { uid: veventUid, sequence: veventSequence } = vevent;
    const { uid: vcalUid, sequence: vcalSequence } = vcal;
    const result = { ...vevent };
    if (!veventUid && vcalUid) {
        result.uid = { ...vcalUid };
    }
    if (!veventSequence && vcalSequence) {
        result.sequence = { ...vcalSequence };
    }
    return result;
};

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

export const getHasMultipleVevents = (vcal?: VcalVcalendar) => {
    const numberOfVevents = vcal?.components?.filter(unary(getIsEventComponent)).length || 0;
    return numberOfVevents > 1;
};

export const extractVevent = (vcal?: VcalVcalendar): VcalVeventComponent | undefined => {
    const result = vcal?.components?.find(getIsEventComponent);
    // return a copy
    return result ? { ...result } : undefined;
};

export const extractVTimezone = (vcal?: VcalVcalendar): VcalVtimezoneComponent | undefined => {
    const result = vcal?.components?.find(getIsTimezoneComponent);
    // return a copy
    return result ? { ...result } : undefined;
};

export const extractXOrIanaComponents = (vcal?: VcalVcalendar): VcalXOrIanaComponent[] | undefined => {
    const result = vcal?.components?.filter(getIsXOrIanaComponent);
    // return a copy
    return result ? { ...result } : undefined;
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
 * A PM invite is either a new invitation or one for which the calendar event
 * is linked to the one sent in the ics
 */
export const getIsPmInvite = ({
    invitationIcs,
    invitationApi,
    pmData,
}: {
    invitationIcs: EventInvitation;
    invitationApi?: RequireSome<EventInvitation, 'calendarEvent'>;
    pmData?: PmInviteData;
}) => {
    if (!invitationApi) {
        return !!pmData;
    }
    const sharedEventIDIcs = getPmSharedEventID(invitationIcs.vevent);
    return sharedEventIDIcs === invitationApi.calendarEvent.SharedEventID;
};

/**
 * Detect case of being re-invited
 */
export const getIsReinvite = ({
    invitationIcs,
    invitationApi,
    isOrganizerMode,
}: {
    invitationIcs: EventInvitation;
    invitationApi?: RequireSome<EventInvitation, 'calendarEvent'>;
    isOrganizerMode: boolean;
}) => {
    const { method } = invitationIcs;
    const isOutdated = getIsInvitationOutdated({ invitationIcs, invitationApi, isOrganizerMode });
    if (isOrganizerMode || method !== ICAL_METHOD.REQUEST || !invitationApi || isOutdated) {
        return false;
    }
    const { calendarEvent } = invitationApi;
    return getIsEventCancelled(calendarEvent);
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
        const formattedDate = formatUTC(utcDate, 'cccc PPP', { locale });
        if (isSingleAllDay) {
            return c('Invitation details (all-day event)').t`${formattedDate} (all day)`;
        }
        return formattedDate;
    }
    const dateTimeProperty = property as VcalDateTimeProperty;
    return format(propertyToUTCDate(dateTimeProperty), 'cccc PPPp', { locale });
};

export const formatEndDateTime = (property: VcalDateOrDateTimeProperty, locale: Locale, isAllDay: boolean) => {
    if (isAllDay) {
        const utcDate = propertyToUTCDate(property);
        const formattedDate = formatUTC(addDays(utcDate, -1), 'cccc PPP', { locale });
        return formattedDate;
    }
    const dateTimeProperty = property as VcalDateTimeProperty;
    return format(propertyToUTCDate(dateTimeProperty), 'cccc PPPp', { locale });
};

const getIsEventInvitationValid = (event: VcalVeventComponent | undefined): event is VcalVeventComponent => {
    if (!event || !getHasDtStart(event)) {
        return false;
    }
    return true;
};

export const parseVcalendar = (data: string): VcalVcalendar | undefined => {
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
    isImport: boolean;
    isOrganizerMode: boolean;
    hasMultipleVevents: boolean;
    timeStatus: EVENT_TIME_STATUS;
    isAddressActive: boolean;
    isAddressDisabled: boolean;
    invitation: EventInvitation & T;
}
export const processEventInvitation = <T>(
    invitation: EventInvitation & T,
    message: MessageExtendedWithData,
    contactEmails: ContactEmail[],
    ownAddresses: Address[]
): ProcessedInvitation<T> => {
    const { originalVcalInvitation, vevent, calendarEvent, method } = invitation;
    const isImport = method === ICAL_METHOD.PUBLISH;
    const hasMultipleVevents = getHasMultipleVevents(originalVcalInvitation);
    const timeStatus = getEventTimeStatus(vevent, Date.now());
    const attendees = vevent.attendee || [];
    const { organizer } = vevent;
    const originalTo = getOriginalTo(message.data);
    const originalFrom = message.data.SenderAddress;
    const isOrganizerMode = isImport ? false : getIsOrganizerMode(vevent, originalTo);
    const { selfAddress, selfAttendee } = getSelfAddressData({
        isOrganizer: isOrganizerMode,
        organizer,
        attendees,
        addresses: ownAddresses,
    });
    const isAddressActive = selfAddress ? getIsAddressActive(selfAddress) : true;
    const isAddressDisabled = selfAddress ? getIsAddressDisabled(selfAddress) : false;

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
            calendarAttendees: calendarEvent?.Attendees,
        });
    }

    return {
        isImport,
        isOrganizerMode,
        hasMultipleVevents,
        timeStatus,
        isAddressActive,
        isAddressDisabled,
        invitation: processed,
    };
};

interface GetInitialInvitationModelArgs {
    invitationOrError: EventInvitation | EventInvitationError;
    message: MessageExtendedWithData;
    contactEmails: ContactEmail[];
    ownAddresses: Address[];
    calendar?: Calendar;
    hasNoCalendars: boolean;
    canCreateCalendar: boolean;
    maxUserCalendarsDisabled: boolean;
    mustReactivateCalendars: boolean;
}
export const getInitialInvitationModel = ({
    invitationOrError,
    message,
    contactEmails,
    ownAddresses,
    calendar,
    hasNoCalendars,
    canCreateCalendar,
    maxUserCalendarsDisabled,
    mustReactivateCalendars,
}: GetInitialInvitationModelArgs) => {
    if (invitationOrError instanceof EventInvitationError) {
        return {
            isImport: false,
            hasMultipleVevents: false,
            isOrganizerMode: false,
            isAddressDisabled: false,
            isAddressActive: true,
            canCreateCalendar,
            maxUserCalendarsDisabled,
            mustReactivateCalendars,
            hasNoCalendars,
            timeStatus: EVENT_TIME_STATUS.FUTURE,
            error: invitationOrError,
        };
    }
    const {
        isOrganizerMode,
        isImport,
        hasMultipleVevents,
        timeStatus,
        isAddressActive,
        isAddressDisabled,
        invitation,
    } = processEventInvitation(invitationOrError, message, contactEmails, ownAddresses);
    const result: InvitationModel = {
        isOrganizerMode,
        isImport,
        hasMultipleVevents,
        timeStatus,
        isAddressActive,
        isAddressDisabled,
        canCreateCalendar,
        maxUserCalendarsDisabled,
        mustReactivateCalendars,
        hasNoCalendars,
        invitationIcs: invitation,
        isPartyCrasher: isOrganizerMode || isImport ? false : !invitation.attendee,
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
    if (!isImport && !getIsValidMethod(invitation.method, isOrganizerMode)) {
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

export const getSupportedVcalendarData = async ({
    vcalComponent,
    message,
    icsBinaryString,
    icsFileName,
}: {
    vcalComponent: VcalVcalendar;
    message: Message;
    icsBinaryString: string;
    icsFileName: string;
}): Promise<EventInvitation | undefined> => {
    const { version, calscale, 'x-wr-timezone': xWrTimezone, method } = vcalComponent;
    const supportedMethod = getIcalMethod(method);
    if (!supportedMethod) {
        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVALID_METHOD);
    }
    if ((calscale && calscale.value.toLowerCase() !== 'gregorian') || version?.value !== '2.0') {
        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, { method: supportedMethod });
    }
    const vevent = extractVevent(vcalComponent);
    const vtimezone = extractVTimezone(vcalComponent);
    if (!getIsEventInvitationValid(vevent)) {
        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID, { method: supportedMethod });
    }
    const completeVevent = withOutsideUIDAndSequence(vevent, vcalComponent);
    const originalUid = completeVevent.uid?.value;
    if (supportedMethod === ICAL_METHOD.PUBLISH) {
        const sha1Uid = await generateVeventHashUID(icsBinaryString, originalUid);
        completeVevent.uid = { value: sha1Uid };
    } else if (!completeVevent.organizer) {
        // The ORGANIZER field is mandatory in an invitation
        const guessOrganizerEmail = ICAL_METHODS_ATTENDEE.includes(supportedMethod)
            ? getOriginalTo(message)
            : message.SenderAddress;
        completeVevent.organizer = buildVcalOrganizer(guessOrganizerEmail);
    }
    const hasXWrTimezone = !!xWrTimezone?.value;
    const calendarTzid = xWrTimezone ? getSupportedTimezone(xWrTimezone.value) : undefined;
    const invitationTzid = vtimezone?.tzid.value;
    const guessTzid = invitationTzid ? getSupportedTimezone(invitationTzid) : undefined;
    try {
        const supportedEvent = await getSupportedEvent({
            method: supportedMethod,
            vcalVeventComponent: withMessageDtstamp(completeVevent, message),
            hasXWrTimezone,
            calendarTzid,
            guessTzid,
            dropAlarms: true,
            isEventInvitation: true,
        });
        return {
            method: supportedMethod,
            vevent: supportedEvent,
            vtimezone,
            originalVcalInvitation: vcalComponent,
            originalUid,
            fileName: icsFileName,
        };
    } catch (error) {
        if (error instanceof EventInvitationError) {
            throw error;
        }
        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, {
            externalError: error,
            method: supportedMethod,
        });
    }
};

export const getCalendarEventLink = (model: RequireSome<InvitationModel, 'invitationIcs'>) => {
    const {
        isOrganizerMode,
        isImport,
        hasMultipleVevents,
        hideLink,
        isPartyCrasher,
        isOutdated,
        isAddressActive,
        calendarData,
        invitationIcs: { method, attendee: attendeeIcs },
        invitationApi,
        hasNoCalendars,
        canCreateCalendar,
        mustReactivateCalendars,
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
    const canBeAdded = isImport;
    const canBeAnswered =
        !isOrganizerMode && method === ICAL_METHOD.REQUEST && !isOutdated && isAddressActive && !isImport;
    const canBeManaged =
        isOrganizerMode &&
        (method === ICAL_METHOD.REPLY || (method === ICAL_METHOD.COUNTER && hasAlsoReplied)) &&
        !isImport;
    const canBeSeenUpdated =
        [ICAL_METHOD.CANCEL, ICAL_METHOD.COUNTER, ICAL_METHOD.REFRESH].includes(method) ||
        (!isOrganizerMode && method === ICAL_METHOD.REQUEST && isOutdated);

    const safeCalendarNeedsUserAction = calendarData?.calendarNeedsUserAction && !isPartyCrasher;
    // the calendar needs a user action to be active
    if (safeCalendarNeedsUserAction || mustReactivateCalendars) {
        if (isImport) {
            return {
                to: '',
                text: c('Link').t`You need to activate your calendar keys to add this event`,
            };
        }
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

    if (isImport && hasMultipleVevents) {
        return {
            to: 'calendar/calendars#import',
            toApp: APPS.PROTONACCOUNT,
            text: c('Link')
                .t`This ICS file contains more than one event. Please download it and import the events in ${calendarAppName}`,
        };
    }

    // the invitation is unanswered
    if (!invitationApi) {
        if (hasDecryptionError) {
            // the event exists in the db but couldn't be decrypted
            const to = `/mail/encryption-keys#addresses`;
            const toApp = APPS.PROTONACCOUNT;

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
        if (hasNoCalendars && canCreateCalendar && !isPartyCrasher) {
            if (canBeAdded) {
                return {
                    to: '',
                    text: c('Link').t`Create a new calendar to add this event`,
                };
            }
            if (canBeAnswered) {
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
        isImport,
        hasMultipleVevents,
        isOrganizerMode,
        isPartyCrasher,
        invitationIcs: { method },
        invitationApi,
        calendarData,
        isOutdated,
        isAddressActive,
    } = model;

    if (isOrganizerMode || (isImport && (invitationApi || hasMultipleVevents))) {
        return true;
    }
    return (
        method === ICAL_METHOD.CANCEL ||
        !!isOutdated ||
        !isAddressActive ||
        !!calendarData?.isCalendarDisabled ||
        isPartyCrasher
    );
};

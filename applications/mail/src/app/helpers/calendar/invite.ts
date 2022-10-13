import { getUnixTime } from 'date-fns';

import { serverTime } from '@proton/crypto';
import { getAttendeeEmail } from '@proton/shared/lib/calendar/attendees';
import { getDoesCalendarNeedUserAction, getIsCalendarDisabled } from '@proton/shared/lib/calendar/calendar';
import { ICAL_EXTENSIONS, ICAL_METHOD, ICAL_METHODS_ATTENDEE } from '@proton/shared/lib/calendar/constants';
import { getSelfAddressData } from '@proton/shared/lib/calendar/deserialize';
import { generateVeventHashUID } from '@proton/shared/lib/calendar/helper';
import {
    EVENT_INVITATION_ERROR_TYPE,
    EventInvitationError,
    cloneEventInvitationErrorWithConfig,
} from '@proton/shared/lib/calendar/icsSurgery/EventInvitationError';
import { getSupportedCalscale } from '@proton/shared/lib/calendar/icsSurgery/vcal';
import { getSupportedEvent, withSupportedDtstamp } from '@proton/shared/lib/calendar/icsSurgery/vevent';
import { findAttendee, getParticipant } from '@proton/shared/lib/calendar/integration/invite';
import { getOccurrencesBetween } from '@proton/shared/lib/calendar/recurring';
import { parseWithErrors, serialize } from '@proton/shared/lib/calendar/vcal';
import {
    buildVcalOrganizer,
    getDtendProperty,
    propertyToLocalDate,
    propertyToUTCDate,
} from '@proton/shared/lib/calendar/vcalConverter';
import {
    getHasDtStart,
    getHasRecurrenceId,
    getIcalMethod,
    getIsCalendar,
    getIsEventComponent,
    getIsProtonReply,
    getIsRecurring,
    getIsTimezoneComponent,
    getIsValidMethod,
    getIsXOrIanaComponent,
    getIsYahooEvent,
    getPmSharedEventID,
    getPmSharedSessionKey,
    getSequence,
    getUidValue,
} from '@proton/shared/lib/calendar/vcalHelper';
import { getIsEventCancelled, withDtstamp } from '@proton/shared/lib/calendar/veventHelper';
import { SECOND } from '@proton/shared/lib/constants';
import { getSupportedTimezone } from '@proton/shared/lib/date/timezone';
import { getIsAddressActive, getIsAddressDisabled } from '@proton/shared/lib/helpers/address';
import { canonicalizeEmailByGuess, canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { splitExtension } from '@proton/shared/lib/helpers/file';
import { omit } from '@proton/shared/lib/helpers/object';
import { Address } from '@proton/shared/lib/interfaces';
import {
    CalendarEventEncryptionData,
    CalendarEventWithMetadata,
    CalendarWidgetData,
    Participant,
    PmInviteData,
    VcalDateOrDateTimeProperty,
    VcalNumberProperty,
    VcalStringProperty,
    VcalVcalendar,
    VcalVeventComponent,
    VcalVtimezoneComponent,
    VcalXOrIanaComponent,
    VisualCalendar,
} from '@proton/shared/lib/interfaces/calendar';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { RequireSome, Unwrap } from '@proton/shared/lib/interfaces/utils';
import { getOriginalTo } from '@proton/shared/lib/mail/messages';
import unary from '@proton/utils/unary';

import { MessageStateWithData, MessageWithOptionalBody } from '../../logic/messages/messagesTypes';
import { FetchAllEventsByUID } from './inviteApi';

export enum EVENT_TIME_STATUS {
    PAST,
    HAPPENING,
    FUTURE,
}

export interface EventInvitation {
    originalVcalInvitation?: VcalVcalendar;
    originalUniqueIdentifier?: string;
    fileName?: string;
    vevent: VcalVeventComponent;
    hasMultipleVevents?: boolean;
    calendarEvent?: CalendarEventWithMetadata;
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
    hasNoCalendars: boolean;
    isOutdated?: boolean;
    isFromFuture?: boolean;
    isProtonInvite?: boolean;
    isReinvite?: boolean;
    reinviteEventID?: string;
    updateAction?: UPDATE_ACTION;
    hideSummary?: boolean;
    hideLink?: boolean;
    calendarData?: CalendarWidgetData;
    singleEditData?: CalendarEventWithMetadata[];
    reencryptionData?: Required<Pick<CalendarEventEncryptionData, 'encryptingAddressID' | 'sharedSessionKey'>>;
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

export const getHasInvitationIcs = (model: InvitationModel): model is RequireSome<InvitationModel, 'invitationIcs'> => {
    return !!model.invitationIcs;
};
export const getHasInvitationApi = (model: InvitationModel): model is RequireSome<InvitationModel, 'invitationApi'> => {
    return !!model.invitationApi;
};

export const getInvitationHasMethod = (
    invitation: EventInvitation
): invitation is RequireSome<EventInvitation, 'method'> => {
    return invitation.method !== undefined;
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

export const getInvitationUID = (invitationOrError: EventInvitation | EventInvitationError) => {
    if (invitationOrError instanceof EventInvitationError) {
        return;
    }
    return getUidValue(invitationOrError.vevent);
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

export const getHasMultipleVevents = (vcal?: VcalVcalendar) => {
    const numberOfVevents = vcal?.components?.filter(unary(getIsEventComponent)).length || 0;
    return numberOfVevents > 1;
};

export const extractVevent = (vcal?: VcalVcalendar): VcalVeventComponent | undefined => {
    const result = vcal?.components?.find(getIsEventComponent);
    // return a copy
    return result ? { ...result } : undefined;
};

export const extractUniqueVTimezone = (vcal?: VcalVcalendar): VcalVtimezoneComponent | undefined => {
    const vtimezones = vcal?.components?.filter(getIsTimezoneComponent);
    if (vtimezones?.length === 1) {
        return vtimezones[0];
    }
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
    return canonicalizeInternalEmail(organizerEmail) === canonicalizeInternalEmail(emailTo);
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
    const updateTimeDiff =
        timestampIcs !== undefined && updateTime !== undefined ? timestampIcs - (updateTime || 0) : timestampDiff;
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
export const getIsProtonInvite = ({
    invitationIcs,
    calendarEvent,
    pmData,
}: {
    invitationIcs: RequireSome<EventInvitation, 'method'>;
    calendarEvent?: CalendarEventWithMetadata;
    pmData?: PmInviteData;
}) => {
    const { method } = invitationIcs;
    const { sharedEventID, isProtonReply } = pmData || {};

    if ([ICAL_METHOD.REQUEST, ICAL_METHOD.CANCEL].includes(method)) {
        if (!calendarEvent) {
            return !!sharedEventID;
        }
        return sharedEventID === calendarEvent.SharedEventID;
    }
    if (method === ICAL_METHOD.REPLY) {
        return !!isProtonReply;
    }
    return false;
};

/**
 * Detect case of being re-invited
 */
export const getIsReinvite = ({
    invitationIcs,
    calendarEvent,
    isOrganizerMode,
    isOutdated,
}: {
    invitationIcs: EventInvitation;
    calendarEvent?: CalendarEventWithMetadata;
    isOrganizerMode: boolean;
    isOutdated: boolean;
}) => {
    const { method } = invitationIcs;
    if (isOrganizerMode || method !== ICAL_METHOD.REQUEST || !calendarEvent || isOutdated) {
        return false;
    }
    return getIsEventCancelled(calendarEvent);
};

export const getIsNonSoughtEvent = (
    event: CalendarEventWithMetadata,
    vevent: VcalVeventComponent,
    supportedRecurrenceId?: VcalDateOrDateTimeProperty
) => {
    if (!event.RecurrenceID) {
        return false;
    }
    if (!getHasRecurrenceId(vevent)) {
        return true;
    }
    return getUnixTime(propertyToUTCDate(supportedRecurrenceId || vevent['recurrence-id'])) !== event.RecurrenceID;
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
    const startTimestamp = getUnixTime(propertyToLocalDate(vevent.dtstart));
    const endTimestamp = getUnixTime(propertyToLocalDate(getDtendProperty(vevent)));
    if (nowTimestamp >= endTimestamp) {
        return EVENT_TIME_STATUS.PAST;
    }
    if (nowTimestamp >= startTimestamp) {
        return EVENT_TIME_STATUS.HAPPENING;
    }
    return EVENT_TIME_STATUS.FUTURE;
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
    } catch (e: any) {
        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.PARSING_ERROR);
    }
};

interface ProcessedInvitation<T> {
    isImport: boolean;
    isOrganizerMode: boolean;
    timeStatus: EVENT_TIME_STATUS;
    isAddressActive: boolean;
    isAddressDisabled: boolean;
    invitation: EventInvitation & T;
}
export const processEventInvitation = <T>(
    invitation: EventInvitation & T,
    message: MessageStateWithData,
    contactEmails: ContactEmail[],
    ownAddresses: Address[]
): ProcessedInvitation<T> => {
    const { vevent, calendarEvent, method } = invitation;
    const isImport = method === ICAL_METHOD.PUBLISH;
    const timeStatus = getEventTimeStatus(vevent, +serverTime());
    const attendees = vevent.attendee || [];
    const { organizer } = vevent;
    const originalTo = getOriginalTo(message.data);
    const originalFrom = message.data.Sender.Address;
    const isOrganizerMode = isImport ? false : getIsOrganizerMode(vevent, originalTo);
    const { selfAddress, selfAttendee } = getSelfAddressData({
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
                selfAddress,
                selfAttendee,
                emailTo: originalTo,
            })
        );
    }
    if (organizer) {
        processed.organizer = getParticipant({
            participant: organizer,
            selfAddress,
            contactEmails,
            emailTo: originalTo,
        });
    }
    if (isOrganizerMode) {
        const { attendee, index } = findAttendee(originalFrom, attendees);
        if (attendee) {
            processed.attendee = getParticipant({
                participant: attendee,
                selfAddress,
                contactEmails,
                emailTo: originalTo,
                index,
                calendarAttendees: calendarEvent?.Attendees,
                xYahooUserStatus: vevent['x-yahoo-user-status']?.value,
            });
        }
    } else if (selfAttendee) {
        processed.attendee = getParticipant({
            participant: selfAttendee,
            selfAddress,
            selfAttendee,
            contactEmails,
            emailTo: originalTo,
            calendarAttendees: calendarEvent?.Attendees,
        });
    }

    return {
        isImport,
        isOrganizerMode,
        timeStatus,
        isAddressActive,
        isAddressDisabled,
        invitation: processed,
    };
};

interface GetInitialInvitationModelArgs {
    invitationOrError: EventInvitation | EventInvitationError;
    message: MessageStateWithData;
    contactEmails: ContactEmail[];
    ownAddresses: Address[];
    calendar?: VisualCalendar;
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
    hasNoCalendars,
    canCreateCalendar,
    maxUserCalendarsDisabled,
}: GetInitialInvitationModelArgs) => {
    const errorModel = {
        isImport: false,
        hasMultipleVevents: false,
        isOrganizerMode: false,
        isAddressDisabled: false,
        isAddressActive: true,
        canCreateCalendar,
        maxUserCalendarsDisabled,
        hasNoCalendars,
        timeStatus: EVENT_TIME_STATUS.FUTURE,
    };
    if (invitationOrError instanceof EventInvitationError) {
        return { ...errorModel, error: invitationOrError };
    }
    if (!getInvitationHasMethod(invitationOrError)) {
        throw new Error('Initial invitation lacks ICAL method');
    }
    const { isOrganizerMode, isImport, timeStatus, isAddressActive, isAddressDisabled, invitation } =
        processEventInvitation<RequireSome<EventInvitation, 'method'>>(
            invitationOrError,
            message,
            contactEmails,
            ownAddresses
        );
    if (invitation.method === ICAL_METHOD.REPLY && !invitation.attendee) {
        // If we couldn't find the attendee in the REPLY ics, something is wrong in the ics
        return {
            ...errorModel,
            error: new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID, {
                method: invitation.method,
            }),
        };
    }
    const result: InvitationModel = {
        isOrganizerMode,
        isImport,
        hasMultipleVevents: !!invitation.hasMultipleVevents,
        timeStatus,
        isAddressActive,
        isAddressDisabled,
        canCreateCalendar,
        maxUserCalendarsDisabled,
        hasNoCalendars,
        invitationIcs: invitation,
        isPartyCrasher: isOrganizerMode || isImport ? false : !invitation.attendee,
    };
    if (calendar) {
        result.calendarData = {
            calendar,
            isCalendarDisabled: getIsCalendarDisabled(calendar),
            calendarNeedsUserAction: getDoesCalendarNeedUserAction(calendar),
        };
    }
    if (!isImport && !getIsValidMethod(invitation.method, isOrganizerMode)) {
        result.error = new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVALID_METHOD, {
            method: invitation.method,
        });
    }
    const isProtonReply = getIsProtonReply(invitation.vevent);
    const sharedEventID = getPmSharedEventID(invitation.vevent);
    const sharedSessionKey = getPmSharedSessionKey(invitation.vevent);
    if (isProtonReply !== undefined || sharedEventID || sharedSessionKey) {
        const pmData: PmInviteData = {};
        if (isProtonReply !== undefined) {
            pmData.isProtonReply = isProtonReply;
        }
        if (sharedEventID) {
            pmData.sharedEventID = sharedEventID;
        }
        if (sharedSessionKey) {
            pmData.sharedSessionKey = sharedSessionKey;
        }
        result.pmData = pmData;
    }
    const isYahooEvent = getIsYahooEvent(invitation.vevent);
    if (isYahooEvent) {
        // Yahoo does not send an updated DTSTAMP in their invite ICS's. This breaks all of our flow.
        // To avoid that, we substitute the event DTSTAMP by the message DTSTAMP
        invitation.vevent = withDtstamp(omit(invitation.vevent, ['dtstamp']), message.data.Time * SECOND);
    }

    return result;
};

export const getSupportedEventInvitation = async ({
    vcalComponent,
    message,
    icsBinaryString,
    icsFileName,
    primaryTimezone,
}: {
    vcalComponent: VcalVcalendar;
    message: MessageWithOptionalBody;
    icsBinaryString: string;
    icsFileName: string;
    primaryTimezone: string;
}): Promise<EventInvitation | undefined> => {
    const { calscale, 'x-wr-timezone': xWrTimezone, method } = vcalComponent;
    const supportedMethod = getIcalMethod(method);
    const supportedCalscale = getSupportedCalscale(calscale);
    if (!supportedMethod) {
        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVALID_METHOD);
    }
    if (!supportedCalscale) {
        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, { method: supportedMethod });
    }
    if (!vcalComponent.components?.length) {
        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.NO_COMPONENT, { method: supportedMethod });
    }
    const vevent = extractVevent(vcalComponent);
    const vtimezone = extractUniqueVTimezone(vcalComponent);
    if (!vevent) {
        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.NO_VEVENT, { method: supportedMethod });
    }
    if (!getHasDtStart(vevent)) {
        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID, { method: supportedMethod });
    }
    const completeVevent = withOutsideUIDAndSequence(
        withSupportedDtstamp(vevent, message.Time * SECOND),
        vcalComponent
    );
    const hasMultipleVevents = getHasMultipleVevents(vcalComponent);
    const isImport = supportedMethod === ICAL_METHOD.PUBLISH;
    // To filter potentially equivalent invitation ics's, we have to generate a reliable
    // unique identifier (resistant to format differences, like \n --> \r\n) for the ics if it has no UID
    const originalUID = completeVevent.uid?.value;
    const originalUniqueIdentifier =
        hasMultipleVevents || !originalUID ? await generateVeventHashUID(serialize(vcalComponent)) : originalUID;
    if (isImport) {
        const sha1Uid = await generateVeventHashUID(icsBinaryString, completeVevent.uid?.value);
        completeVevent.uid = { value: sha1Uid };
    } else if (!completeVevent.organizer) {
        // The ORGANIZER field is mandatory in an invitation
        const guessOrganizerEmail = ICAL_METHODS_ATTENDEE.includes(supportedMethod)
            ? getOriginalTo(message)
            : message.Sender.Address;
        completeVevent.organizer = buildVcalOrganizer(guessOrganizerEmail);
    }
    const hasXWrTimezone = !!xWrTimezone?.value;
    const calendarTzid = xWrTimezone ? getSupportedTimezone(xWrTimezone.value) : undefined;
    // At this stage, vtimezone did not undergo any surgery and might lack the RFC-mandatory TZID
    const invitationTzid = vtimezone?.tzid?.value;
    const guessTzid = (() => {
        if (!invitationTzid) {
            return isImport ? primaryTimezone : undefined;
        }
        return getSupportedTimezone(invitationTzid);
    })();
    try {
        const supportedEvent = getSupportedEvent({
            method: supportedMethod,
            vcalVeventComponent: completeVevent,
            hasXWrTimezone,
            calendarTzid,
            guessTzid,
            isEventInvitation: true,
            generatedHashUid: isImport,
        });
        return {
            method: supportedMethod,
            vevent: supportedEvent,
            vtimezone,
            originalVcalInvitation: vcalComponent,
            originalUniqueIdentifier,
            hasMultipleVevents,
            fileName: icsFileName,
        };
    } catch (error: any) {
        if (error instanceof EventInvitationError) {
            throw cloneEventInvitationErrorWithConfig(error, {
                method: supportedMethod,
                originalUniqueIdentifier,
            });
        }
        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, {
            externalError: error,
            method: supportedMethod,
            originalUniqueIdentifier: originalUniqueIdentifier,
        });
    }
};

export const getDoNotDisplayButtons = (model: RequireSome<InvitationModel, 'invitationIcs'>) => {
    const {
        isImport,
        hasMultipleVevents,
        isOrganizerMode,
        isPartyCrasher,
        invitationIcs: { method, vevent: veventIcs },
        invitationApi,
        calendarData,
        isOutdated,
        isAddressActive,
    } = model;

    if (isOrganizerMode) {
        return !isPartyCrasher || !!veventIcs['recurrence-id'];
    }
    if (isImport && (invitationApi || hasMultipleVevents)) {
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

export const getDisableButtons = (model: RequireSome<InvitationModel, 'invitationIcs'>) => {
    const { calendarData, isAddressActive, isImport } = model;
    const alwaysDisable =
        !calendarData?.calendar || calendarData.isCalendarDisabled || calendarData.calendarNeedsUserAction;
    return isImport ? alwaysDisable : alwaysDisable || !isAddressActive;
};

export const getParticipantsList = (attendees?: Participant[], organizer?: Participant) => {
    const list = attendees ? [...attendees] : [];
    if (organizer) {
        // we remove the organizer from the list of participants in case it's duplicated there
        const canonicalOrganizerEmail = canonicalizeEmailByGuess(organizer.emailAddress);
        const organizerIndex = list.findIndex(
            ({ emailAddress }) => canonicalizeEmailByGuess(emailAddress) === canonicalOrganizerEmail
        );
        if (organizerIndex !== -1) {
            list.splice(organizerIndex, 1);
        }
        list.unshift(organizer);
    }
    return list;
};

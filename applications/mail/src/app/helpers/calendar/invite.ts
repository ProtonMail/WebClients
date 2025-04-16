import { getUnixTime } from 'date-fns';

import { serverTime } from '@proton/crypto';
import { TelemetryIcsSurgeryEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { generateAttendeeToken, getAttendeeEmail } from '@proton/shared/lib/calendar/attendees';
import { getDoesCalendarNeedUserAction, getIsCalendarDisabled } from '@proton/shared/lib/calendar/calendar';
import { ICAL_METHOD, ICAL_METHODS_ATTENDEE } from '@proton/shared/lib/calendar/constants';
import { getSelfAddressData } from '@proton/shared/lib/calendar/deserialize';
import { generateVeventHashUID, getIsProtonUID, getNaiveDomainFromUID } from '@proton/shared/lib/calendar/helper';
import {
    EventInvitationError,
    cloneEventInvitationErrorWithConfig,
} from '@proton/shared/lib/calendar/icsSurgery/EventInvitationError';
import {
    EVENT_INVITATION_ERROR_TYPE,
    INVITATION_ERROR_TYPE,
} from '@proton/shared/lib/calendar/icsSurgery/errors/icsSurgeryErrorTypes';
import { getSupportedCalscale } from '@proton/shared/lib/calendar/icsSurgery/vcal';
import { getSupportedEvent, withSupportedDtstamp } from '@proton/shared/lib/calendar/icsSurgery/vevent';
import {
    buildPartyCrasherParticipantData,
    findAttendee,
    getParticipant,
} from '@proton/shared/lib/calendar/mailIntegration/invite';
import { getOccurrencesBetween } from '@proton/shared/lib/calendar/recurrence/recurring';
import { parseVcalendarWithRecoveryAndMaybeErrors, serialize } from '@proton/shared/lib/calendar/vcal';
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
    getIsEventComponent,
    getIsProtonReply,
    getIsTimezoneComponent,
    getIsValidMethod,
    getIsXOrIanaComponent,
    getIsYahooEvent,
    getPmSharedEventID,
    getPmSharedSessionKey,
} from '@proton/shared/lib/calendar/vcalHelper';
import {
    getIsEventCancelled,
    getIsRecurring,
    getSequence,
    getUidValue,
    withDtstamp,
} from '@proton/shared/lib/calendar/veventHelper';
import { SECOND } from '@proton/shared/lib/constants';
import { getSupportedTimezone } from '@proton/shared/lib/date/timezone';
import { getIsAddressActive, getIsAddressDisabled } from '@proton/shared/lib/helpers/address';
import { canonicalizeEmailByGuess, canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { omit } from '@proton/shared/lib/helpers/object';
import type { Address, Api, SimpleMap } from '@proton/shared/lib/interfaces';
import type {
    CalendarEvent,
    CalendarEventEncryptionData,
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
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import type { RequireSome, Unwrap } from '@proton/shared/lib/interfaces/utils';
import { getOriginalTo, hasSimpleLoginSender } from '@proton/shared/lib/mail/messages';
import unary from '@proton/utils/unary';

import { hasIcalExtension } from 'proton-mail/helpers/attachment/attachment';

import type { MessageStateWithData, MessageWithOptionalBody } from '../../store/messages/messagesTypes';
import type { FetchAllEventsByUID } from './inviteApi';

export enum EVENT_TIME_STATUS {
    PAST,
    HAPPENING,
    FUTURE,
}

export interface EventInvitation {
    originalVcalInvitation?: VcalVcalendar;
    originalUniqueIdentifier?: string;
    originalIcsHasNoOrganizer?: boolean;
    legacyUid?: string;
    fileName?: string;
    hashedIcs?: string;
    vevent: VcalVeventComponent;
    hasMultipleVevents?: boolean;
    calendarEvent?: CalendarEvent;
    method?: ICAL_METHOD;
    prodId?: string;
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
    hasProtonUID: boolean;
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
    singleEditData?: CalendarEvent[];
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
    attachments.filter(({ Name = '' }) => hasIcalExtension(Name));

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
    const singleAnswersNotSupported = getHasRecurrenceId(veventIcs) && !getHasRecurrenceId(invitationApi?.vevent);
    if (!veventApi || singleAnswersNotSupported) {
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
    const singleAnswersNotSupported = getHasRecurrenceId(veventIcs) && !getHasRecurrenceId(invitationApi?.vevent);
    if (!veventApi || singleAnswersNotSupported) {
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
    calendarEvent?: CalendarEvent;
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
    calendarEvent?: CalendarEvent;
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
    event: CalendarEvent,
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

const icsHashesForInviteTelemetry = new Set<string>();

/**
 * Send telemetry event if we got some fails during import process, so that we know how common errors are, and which error users are facing
 */
export const sendInviteErrorTelemetryReport = async ({
    error,
    api,
    hash,
}: {
    error: EventInvitationError;
    api: Api;
    hash: string;
}) => {
    if (icsHashesForInviteTelemetry.has(hash)) {
        return;
    }

    const { method, extendedType, componentIdentifiers } = error;

    if (extendedType === undefined || !componentIdentifiers) {
        // not intended for report
        return;
    }

    const isImportPublish = !method || method === ICAL_METHOD.PUBLISH;

    const dimensions: SimpleMap<string> = {
        reason: EVENT_INVITATION_ERROR_TYPE[extendedType],
        component: componentIdentifiers.component,
        prodid: componentIdentifiers.prodId,
        domain: componentIdentifiers.domain,
    };

    // Assume the telemetry will be sent successfully. It's not worth it to handle the error case here, it's ok to lose the report
    icsHashesForInviteTelemetry.add(hash);
    await sendTelemetryReport({
        api: api,
        measurementGroup: TelemetryMeasurementGroups.calendarIcsSurgery,
        event: isImportPublish ? TelemetryIcsSurgeryEvents.import_publish : TelemetryIcsSurgeryEvents.invitation,
        dimensions,
        delay: false,
    });
};

export const parseVcalendar = (data: string) => {
    try {
        if (!data) {
            return;
        }
        return parseVcalendarWithRecoveryAndMaybeErrors(data);
    } catch (e: any) {
        throw new EventInvitationError(INVITATION_ERROR_TYPE.PARSING_ERROR);
    }
};

interface ProcessedInvitation<T> {
    isImport: boolean;
    isOrganizerMode: boolean;
    timeStatus: EVENT_TIME_STATUS;
    isAddressActive: boolean;
    isAddressDisabled: boolean;
    invitation: EventInvitation & T;
    isPartyCrasher: boolean;
    originalIcsHasNoOrganizer?: boolean;
}
export const processEventInvitation = <T>(
    invitation: EventInvitation & T,
    message: MessageStateWithData,
    contactEmails: ContactEmail[],
    ownAddresses: Address[]
): ProcessedInvitation<T> => {
    const { vevent, calendarEvent, method, originalIcsHasNoOrganizer } = invitation;
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
    let isAddressActive = selfAddress ? getIsAddressActive(selfAddress) : true;
    let isAddressDisabled = selfAddress ? getIsAddressDisabled(selfAddress) : false;
    const hasProtonUID = getIsProtonUID(vevent.uid.value);

    const processed: EventInvitation & T = { ...invitation };

    let isPartyCrasher = false;

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
                calendarAttendees: calendarEvent?.AttendeesInfo?.Attendees,
                xYahooUserStatus: vevent['x-yahoo-user-status']?.value,
            });
        } else {
            isPartyCrasher = true;
        }
    } else {
        // Attendee mode
        if (selfAttendee) {
            processed.attendee = getParticipant({
                participant: selfAttendee,
                selfAddress,
                selfAttendee,
                contactEmails,
                emailTo: originalTo,
                calendarAttendees: calendarEvent?.AttendeesInfo?.Attendees,
            });
        } else if (!isImport) {
            // The user is a party crasher
            isPartyCrasher = true;
            if (!hasProtonUID && !hasSimpleLoginSender(message.data)) {
                // To let the user reply, we fake it being in the attendee list
                const { participant, selfAttendee, selfAddress } =
                    buildPartyCrasherParticipantData(originalTo, ownAddresses, contactEmails, attendees) || {};

                if (participant && selfAttendee && selfAddress) {
                    processed.attendee = participant;
                    processed.vevent.attendee = [...(processed.vevent.attendee || []), selfAttendee];

                    // Now that the participant has been added to the event invitation, we need to check once again if the address is disabled or not
                    isAddressActive = getIsAddressActive(selfAddress);
                    isAddressDisabled = getIsAddressDisabled(selfAddress);
                }
            }
        }
    }

    return {
        isImport,
        isOrganizerMode,
        timeStatus,
        isAddressActive,
        isAddressDisabled,
        invitation: processed,
        isPartyCrasher,
        originalIcsHasNoOrganizer,
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
        hasProtonUID: false,
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
    const {
        isOrganizerMode,
        isImport,
        timeStatus,
        isAddressActive,
        isAddressDisabled,
        invitation,
        isPartyCrasher,
        originalIcsHasNoOrganizer,
    } = processEventInvitation<RequireSome<EventInvitation, 'method'>>(
        invitationOrError,
        message,
        contactEmails,
        ownAddresses
    );
    const { hashedIcs } = invitation;
    const uid = getUidValue(invitation.vevent);
    const componentIdentifiers = {
        component: 'vevent',
        componentId: uid,
        prodId: invitation.prodId || '',
        domain: getNaiveDomainFromUID(uid),
    };
    if (invitation.method === ICAL_METHOD.REPLY && !invitation.attendee) {
        // If we couldn't find the attendee in the REPLY ics, something is wrong in the ics
        return {
            ...errorModel,
            error: new EventInvitationError(INVITATION_ERROR_TYPE.INVITATION_INVALID, {
                hashedIcs,
                method: invitation.method,
                extendedType: EVENT_INVITATION_ERROR_TYPE.MISSING_ATTENDEE,
                componentIdentifiers,
            }),
        };
    }
    if (isPartyCrasher && originalIcsHasNoOrganizer) {
        /*
         If the user is a party crasher, most likely the invitation has been forwarded.
         Therefore, we cannot assume the sender is the organizer, so in case the original ICS contained no organizer,
         we have no other option than showing an error.
         */
        return {
            ...errorModel,
            error: new EventInvitationError(INVITATION_ERROR_TYPE.INVITATION_INVALID, {
                hashedIcs,
                method: invitation.method,
                extendedType: EVENT_INVITATION_ERROR_TYPE.MISSING_ORIGINAL_ORGANIZER,
                componentIdentifiers,
            }),
        };
    }
    const result: InvitationModel = {
        isOrganizerMode,
        isImport,
        hasMultipleVevents: !!invitation.hasMultipleVevents,
        hasProtonUID: getIsProtonUID(invitation.vevent.uid.value),
        timeStatus,
        isAddressActive,
        isAddressDisabled,
        canCreateCalendar,
        maxUserCalendarsDisabled,
        hasNoCalendars,
        invitationIcs: invitation,
        isPartyCrasher,
    };
    if (calendar) {
        result.calendarData = {
            calendar,
            isCalendarDisabled: getIsCalendarDisabled(calendar),
            calendarNeedsUserAction: getDoesCalendarNeedUserAction(calendar),
        };
    }
    if (!isImport && !getIsValidMethod(invitation.method, isOrganizerMode)) {
        result.error = new EventInvitationError(INVITATION_ERROR_TYPE.INVALID_METHOD, {
            method: invitation.method,
            extendedType: EVENT_INVITATION_ERROR_TYPE.INVALID_METHOD,
            hashedIcs,
            componentIdentifiers,
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
    canImportEventColor,
}: {
    vcalComponent: VcalVcalendar;
    message: MessageWithOptionalBody;
    icsBinaryString: string;
    icsFileName: string;
    primaryTimezone: string;
    canImportEventColor: boolean;
}): Promise<EventInvitation | undefined> => {
    const { calscale, 'x-wr-timezone': xWrTimezone, method, prodid: prodIdProperty } = vcalComponent;
    const prodId = prodIdProperty.value;
    const supportedMethod = getIcalMethod(method);
    const supportedCalscale = getSupportedCalscale(calscale);
    let originalUniqueIdentifier = await generateVeventHashUID(serialize(vcalComponent));
    const vevent = extractVevent(vcalComponent);
    const vtimezone = extractUniqueVTimezone(vcalComponent);
    const uid = vevent?.uid?.value || '';
    const componentIdentifiers = {
        component: vevent ? 'vevent' : 'unknown',
        componentId: uid,
        prodId,
        domain: getNaiveDomainFromUID(uid),
    };
    if (!supportedMethod) {
        throw new EventInvitationError(INVITATION_ERROR_TYPE.INVALID_METHOD, {
            extendedType: EVENT_INVITATION_ERROR_TYPE.INVALID_METHOD,
            componentIdentifiers,
            originalUniqueIdentifier,
        });
    }
    if (!supportedCalscale) {
        throw new EventInvitationError(INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, {
            method: supportedMethod,
            extendedType: EVENT_INVITATION_ERROR_TYPE.NON_GREGORIAN,
            componentIdentifiers,
            originalUniqueIdentifier,
        });
    }
    if (!vcalComponent.components?.length) {
        throw new EventInvitationError(INVITATION_ERROR_TYPE.NO_COMPONENT, {
            method: supportedMethod,
            extendedType: EVENT_INVITATION_ERROR_TYPE.NO_VEVENT,
            componentIdentifiers,
            originalUniqueIdentifier,
        });
    }
    if (!vevent) {
        throw new EventInvitationError(INVITATION_ERROR_TYPE.NO_VEVENT, {
            method: supportedMethod,
            extendedType: EVENT_INVITATION_ERROR_TYPE.NO_VEVENT,
            componentIdentifiers,
            originalUniqueIdentifier,
        });
    }
    if (!getHasDtStart(vevent)) {
        throw new EventInvitationError(INVITATION_ERROR_TYPE.INVITATION_INVALID, {
            method: supportedMethod,
            componentIdentifiers,
            extendedType: EVENT_INVITATION_ERROR_TYPE.DTSTART_MISSING,
            originalUniqueIdentifier,
        });
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
    if (originalUID && !hasMultipleVevents) {
        originalUniqueIdentifier = originalUID;
    }
    let legacyUid;
    let originalIcsHasNoOrganizer = false;
    if (isImport) {
        const sha1Uid = await generateVeventHashUID(icsBinaryString, originalUID);
        if (originalUID) {
            // generate a hash UID with legacy format. The ICS widget will need it to find the event in the DB
            // in case it was added before the UID migration
            legacyUid = await generateVeventHashUID(icsBinaryString, originalUID, true);
        }
        completeVevent.uid = { value: sha1Uid };
    } else if (!originalUID) {
        // Invitations without UID should be considered invalid
        throw new EventInvitationError(INVITATION_ERROR_TYPE.INVITATION_INVALID, {
            method: supportedMethod,
            componentIdentifiers,
            extendedType: EVENT_INVITATION_ERROR_TYPE.MISSING_ORIGINAL_UID,
            originalUniqueIdentifier,
        });
    } else if (!completeVevent.organizer) {
        originalIcsHasNoOrganizer = true;
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
            componentIdentifiers,
            canImportEventColor,
        });
        return {
            method: supportedMethod,
            prodId,
            vevent: supportedEvent,
            vtimezone,
            originalVcalInvitation: vcalComponent,
            originalIcsHasNoOrganizer,
            originalUniqueIdentifier,
            legacyUid,
            hasMultipleVevents,
            fileName: icsFileName,
        };
    } catch (error: any) {
        if (error instanceof EventInvitationError) {
            throw cloneEventInvitationErrorWithConfig(error, {
                ...error.getConfig(),
                method: supportedMethod,
                originalUniqueIdentifier,
            });
        }
        throw new EventInvitationError(INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, {
            externalError: error,
            method: supportedMethod,
            extendedType: EVENT_INVITATION_ERROR_TYPE.EXTERNAL_ERROR,
            originalUniqueIdentifier,
        });
    }
};

export const getDoNotDisplayButtons = (model: RequireSome<InvitationModel, 'invitationIcs'>) => {
    const {
        isImport,
        hasMultipleVevents,
        isOrganizerMode,
        isPartyCrasher,
        invitationIcs: { method, vevent: veventIcs, attendee: attendeeIcs },
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
        (isPartyCrasher && !attendeeIcs)
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

export const getIsPartyCrasher = async ({
    isOrganizerMode,
    invitationApi,
    calendarEvent,
    message,
    isPartyCrasherIcs,
}: {
    isOrganizerMode: boolean;
    invitationApi?: RequireSome<EventInvitation, 'calendarEvent'>;
    calendarEvent?: CalendarEvent;
    message: MessageStateWithData;
    isPartyCrasherIcs?: boolean;
}) => {
    if (isOrganizerMode) {
        // on organizer mode we can only check party crasher status as long as the event exists in the DB
        if (invitationApi) {
            return !invitationApi.attendee;
        } else if (calendarEvent) {
            // If we do not have invitationApi, but we have a calendarEvent, it means we could not decrypt calendarEvent.
            // Assuming the sender is a potential attendee, we can resort to checking attendee tokens in this case, since those are clear text
            const senderToken = await generateAttendeeToken(
                canonicalizeEmailByGuess(message.data.Sender.Address),
                calendarEvent.UID
            );
            return !calendarEvent.AttendeesInfo.Attendees.some(({ Token }) => Token === senderToken);
        }
        return false;
    } else {
        // on attendee mode we fully rely on whether the attendee appears in the ics or not
        return isPartyCrasherIcs;
    }
};

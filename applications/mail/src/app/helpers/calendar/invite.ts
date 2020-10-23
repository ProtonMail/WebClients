import { getUnixTime, format } from 'date-fns';
import { getAttendeeEmail, getSupportedAttendee } from 'proton-shared/lib/calendar/attendees';
import { getIsCalendarDisabled } from 'proton-shared/lib/calendar/calendar';
import {
    CALENDAR_FLAGS,
    ICAL_EXTENSIONS,
    ICAL_METHOD,
    ICAL_MIME_TYPE,
    MAX_LENGTHS,
} from 'proton-shared/lib/calendar/constants';
import { findAttendee, getParticipant } from 'proton-shared/lib/calendar/integration/invite';
import { getHasConsistentRrule, getSupportedRrule } from 'proton-shared/lib/calendar/integration/rrule';
import {
    getIsDateOutOfBounds,
    getIsWellFormedDateOrDateTime,
    getSupportedUID,
} from 'proton-shared/lib/calendar/support';
import { parseWithErrors } from 'proton-shared/lib/calendar/vcal';
import {
    dateTimeToProperty,
    getDateProperty,
    getDateTimeProperty,
    getDateTimePropertyInDifferentTimezone,
    getDtendProperty,
    propertyToUTCDate,
} from 'proton-shared/lib/calendar/vcalConverter';
import {
    getHasDtStart,
    getHasUid,
    getIsCalendar,
    getIsEventComponent,
    getIsPropertyAllDay,
    getIsTimezoneComponent,
    getIsXOrIanaComponent,
    getPropertyTzid,
} from 'proton-shared/lib/calendar/vcalHelper';
import { SECOND } from 'proton-shared/lib/constants';
import { addDays, format as formatUTC, isNextDay } from 'proton-shared/lib/date-fns-utc';
import { convertUTCDateTimeToZone, fromUTCDate, getSupportedTimezone } from 'proton-shared/lib/date/timezone';
import { unique } from 'proton-shared/lib/helpers/array';
import { hasBit } from 'proton-shared/lib/helpers/bitset';
import { cleanEmail, normalizeInternalEmail } from 'proton-shared/lib/helpers/email';
import { splitExtension } from 'proton-shared/lib/helpers/file';
import { truncate } from 'proton-shared/lib/helpers/string';
import { Address } from 'proton-shared/lib/interfaces';
import { Calendar, CalendarEvent, CalendarWidgetData, Participant } from 'proton-shared/lib/interfaces/calendar';
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
import { RequireSome } from 'proton-shared/lib/interfaces/utils';
import { getOriginalTo } from 'proton-shared/lib/mail/messages';
import { c } from 'ttag';
import { MessageExtended } from '../../models/message';
import { EVENT_INVITATION_ERROR_TYPE, EventInvitationError } from './EventInvitationError';

export enum EVENT_TIME_STATUS {
    PAST,
    HAPPENING,
    FUTURE,
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

export enum UPDATE_ACTION {
    NONE,
    KEEP_PARTSTAT,
    RESET_PARTSTAT,
    CANCEL,
}

export interface InvitationModel {
    isOrganizerMode: boolean;
    timeStatus: EVENT_TIME_STATUS;
    isAddressDisabled: boolean;
    canCreateCalendar: boolean;
    hasNoCalendars: boolean;
    isOutdated?: boolean;
    updateAction?: UPDATE_ACTION;
    hideSummary?: boolean;
    hideLink?: boolean;
    calendarData?: CalendarWidgetData;
    invitationIcs?: RequireSome<EventInvitation, 'method'>;
    invitationApi?: RequireSome<EventInvitation, 'calendarEvent' | 'attendee'>;
    parentInvitationApi?: RequireSome<EventInvitation, 'calendarEvent'>;
    error?: EventInvitationError;
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
            ICAL_EXTENSIONS.includes(splitExtension(Name)[1]) && MIMEType === ICAL_MIME_TYPE
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

export const getIsOrganizerMode = (event: VcalVeventComponent, emailTo: string) => {
    if (!event.organizer) {
        return false;
    }
    const organizerEmail = getAttendeeEmail(event.organizer);
    return cleanEmail(organizerEmail) === cleanEmail(emailTo);
};

export const getIsInvitationOutdated = (veventIcs: VcalVeventComponent, veventApi?: VcalVeventComponent) => {
    if (!veventApi) {
        return false;
    }
    const timestampDiff =
        getUnixTime(propertyToUTCDate(veventIcs.dtstamp)) - getUnixTime(propertyToUTCDate(veventApi.dtstamp));
    if (timestampDiff < 0) {
        return true;
    }
    if (timestampDiff > 0) {
        return false;
    }
    return getSequence(veventIcs) < getSequence(veventApi);
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
    // account for non-RFC-compliant all-day events with DTSTART = DTEND
    return { isAllDay: true, isSingleAllDay: isNextDay(fakeUTCStart, fakeUTCEnd) || +fakeUTCStart === +fakeUTCEnd };
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
        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID);
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
    message: MessageExtended,
    contactEmails: ContactEmail[],
    ownAddresses: Address[]
): ProcessedInvitation<T> => {
    const { vevent } = invitation;
    const timeStatus = getEventTimeStatus(vevent, Date.now());
    const attendees = vevent.attendee;
    const { organizer } = vevent;
    const originalTo = getOriginalTo(message.data);
    const isOrganizerMode = getIsOrganizerMode(vevent, originalTo);
    const selfEmailAddress = isOrganizerMode ? message.data?.SenderAddress || '' : originalTo;
    const { attendee } = findAttendee(selfEmailAddress, attendees);
    const selfAddress = ownAddresses.find(
        ({ Email }) => normalizeInternalEmail(Email) === normalizeInternalEmail(selfEmailAddress)
    );
    const isAddressDisabled = selfAddress ? selfAddress.Status === 0 : false;

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
        processed.attendee = getParticipant(attendee, contactEmails, ownAddresses, originalTo);
    }

    return { isOrganizerMode, timeStatus, isAddressDisabled, invitation: processed };
};

interface GetInitialInvitationModelArgs {
    invitationOrError: RequireSome<EventInvitation, 'method'> | EventInvitationError;
    message: MessageExtended;
    contactEmails: ContactEmail[];
    ownAddresses: Address[];
    calendar?: Calendar;
    hasNoCalendars: boolean;
    canCreateCalendar: boolean;
}
export const getInitialInvitationModel = ({
    invitationOrError,
    message,
    contactEmails,
    ownAddresses,
    calendar,
    hasNoCalendars,
    canCreateCalendar,
}: GetInitialInvitationModelArgs) => {
    if (invitationOrError instanceof EventInvitationError) {
        return {
            isOrganizerMode: false,
            isAddressDisabled: false,
            canCreateCalendar,
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
        isAddressDisabled,
        canCreateCalendar,
        hasNoCalendars,
        invitationIcs: invitation,
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
    isRecurring = false,
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
    tzid,
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

export const getSupportedEventInvitation = (
    vcalInvitation: VcalVcalendar,
    message: Message
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

        if (organizer) {
            validated.organizer = { ...organizer };
        }

        if (attendee) {
            if (attendee.length > 100) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED);
            }
            const attendeeEmails = attendee.map((att) => getAttendeeEmail(att));
            if (unique(attendeeEmails).length !== attendeeEmails.length) {
                // Do not accept invitations with repeated emails as they will cause problems.
                // Usually external providers don't allow this to happen
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED);
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
        const isAllDayStart = getIsPropertyAllDay(validated.dtstart);
        const isAllDayEnd = dtend ? getIsPropertyAllDay(dtend) : undefined;
        if (isAllDayEnd !== undefined && +isAllDayStart ^ +isAllDayEnd) {
            throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID);
        }
        validated.dtstart = getSupportedDateOrDateTimeProperty({
            property: dtstart,
            hasXWrTimezone,
            calendarTzid,
            isRecurring,
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
                    isRecurring,
                })
            );
            validated.exdate = supportedExdate.map((property) =>
                getLinkedDateTimeProperty({
                    property,
                    isAllDay: getIsPropertyAllDay(validated.dtstart),
                    tzid: getPropertyTzid(validated.dtstart),
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
                isRecurring,
            });
        }
        if (dtend) {
            const supportedDtend = getSupportedDateOrDateTimeProperty({
                property: dtend,
                hasXWrTimezone,
                calendarTzid,
                isRecurring,
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
        hideLink,
        isOutdated,
        timeStatus,
        calendarData,
        invitationIcs: { method },
        invitationApi,
        canCreateCalendar,
    } = model;

    if (hideLink) {
        return {};
    }

    const canBeAnswered = method === ICAL_METHOD.REQUEST && timeStatus !== EVENT_TIME_STATUS.PAST && !isOutdated;

    // the calendar needs a user action to be active
    if (calendarData?.calendarNeedsUserAction) {
        if (method === ICAL_METHOD.CANCEL) {
            return {
                to: '',
                text: c('Link').t`You need to activate your calendar keys to see the updated invitation`,
            };
        }
        return {
            to: '',
            text: c('Link').t`You need to activate your calendar keys to answer this invitation`,
        };
    }

    // the invitation is unanswered
    if (!invitationApi) {
        if (canCreateCalendar && canBeAnswered && !calendarData) {
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
    const link = calendarID && eventID ? `/event?${params.toString()}` : undefined;
    if (!link) {
        return {};
    }
    return {
        to: link,
        text: c('Link').t`Open in ProtonCalendar`,
    };
};

export const getDoNotDisplayButtons = (model: RequireSome<InvitationModel, 'invitationIcs'>) => {
    const {
        isOrganizerMode,
        invitationIcs: { method },
        calendarData,
        isOutdated,
        isAddressDisabled,
    } = model;

    if (isOrganizerMode) {
        return false;
    }
    return method === ICAL_METHOD.CANCEL || !!isOutdated || isAddressDisabled || !!calendarData?.isCalendarDisabled;
};

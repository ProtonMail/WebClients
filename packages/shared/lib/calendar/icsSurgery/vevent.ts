import { addDays, fromUnixTime } from 'date-fns';

import truncate from '@proton/utils/truncate';
import unique from '@proton/utils/unique';

import { RequireOnly } from '../../../lib/interfaces';
import { DAY } from '../../constants';
import { convertUTCDateTimeToZone, fromUTCDate, getSupportedTimezone } from '../../date/timezone';
import {
    IcalJSDateOrDateTimeProperty,
    VcalDateOrDateTimeProperty,
    VcalDateTimeValue,
    VcalDurationValue,
    VcalFloatingDateTimeProperty,
    VcalVeventComponent,
} from '../../interfaces/calendar';
import { dedupeAlarmsWithNormalizedTriggers } from '../alarms';
import { getAttendeeEmail, getSupportedAttendee, getSupportedOrganizer } from '../attendees';
import { ICAL_METHOD, MAX_LENGTHS_API } from '../constants';
import { getIsDateOutOfBounds, getIsWellFormedDateOrDateTime, getSupportedUID } from '../helper';
import { getHasConsistentRrule, getHasOccurrences, getSupportedRrule } from '../rrule';
import { durationToMilliseconds } from '../vcal';
import {
    dateTimeToProperty,
    dateToProperty,
    getDateTimeProperty,
    getDateTimePropertyInDifferentTimezone,
    propertyToUTCDate,
} from '../vcalConverter';
import { getIsPropertyAllDay, getPropertyTzid } from '../vcalHelper';
import { EVENT_INVITATION_ERROR_TYPE, EventInvitationError } from './EventInvitationError';
import { IMPORT_EVENT_ERROR_TYPE, ImportEventError } from './ImportEventError';
import { getSupportedAlarms } from './valarm';
import { getSupportedStringValue } from './vcal';

export const getDtendPropertyFromDuration = (
    dtstart: VcalDateOrDateTimeProperty,
    duration: VcalDurationValue | number
) => {
    const startDateUTC = propertyToUTCDate(dtstart);
    const durationInMs = typeof duration === 'number' ? duration : durationToMilliseconds(duration);
    const timestamp = +startDateUTC + durationInMs;
    const end = fromUTCDate(fromUnixTime(timestamp / 1000));

    if (getIsPropertyAllDay(dtstart)) {
        // The all-day event lasts one day, we don't need DTEND in this case
        if (durationInMs <= DAY) {
            return;
        }

        const shouldAddDay = !!(durationInMs <= 0 || end.hours || end.minutes || end.seconds);
        const finalEnd = shouldAddDay
            ? fromUTCDate(addDays(propertyToUTCDate({ value: { ...end, isUTC: true } }), 1))
            : { ...end };

        return dateToProperty(finalEnd);
    }

    if (durationInMs <= 0) {
        // The part-day event has zero duration, we don't need DTEND in this case
        return;
    }

    const tzid = getPropertyTzid(dtstart);

    return getDateTimeProperty(convertUTCDateTimeToZone(end, tzid!), tzid!);
};

export const getSupportedDtstamp = (dtstamp: IcalJSDateOrDateTimeProperty | undefined, timestamp: number) => {
    // as per RFC, the DTSTAMP value MUST be specified in the UTC time format. But that's not what we always receive from external providers
    const value = dtstamp?.value;
    const tzid = dtstamp?.parameters?.tzid;

    if (!value) {
        return dateTimeToProperty(fromUTCDate(new Date(timestamp)), true);
    }

    if (tzid) {
        const supportedTzid = getSupportedTimezone(tzid);
        if (!supportedTzid) {
            // generate a new DTSTAMP
            return dateTimeToProperty(fromUTCDate(new Date(timestamp)), true);
        }
        // we try to guess what the external provider meant
        const guessedProperty = {
            value: {
                year: value.year,
                month: value.month,
                day: value.day,
                hours: (value as VcalDateTimeValue)?.hours || 0,
                minutes: (value as VcalDateTimeValue)?.minutes || 0,
                seconds: (value as VcalDateTimeValue)?.seconds || 0,
                isUTC: (value as VcalDateTimeValue)?.isUTC === true,
            },
            parameters: {
                tzid: supportedTzid,
            },
        };

        return dateTimeToProperty(fromUTCDate(propertyToUTCDate(guessedProperty)), true);
    }

    return dateTimeToProperty(fromUTCDate(propertyToUTCDate(dtstamp as VcalDateOrDateTimeProperty)), true);
};

export const withSupportedDtstamp = <T>(
    properties: RequireOnly<VcalVeventComponent, 'uid' | 'component' | 'dtstart'> & T,
    timestamp: number
): VcalVeventComponent & T => {
    return {
        ...properties,
        dtstamp: getSupportedDtstamp(properties.dtstamp, timestamp),
    };
};

export const getSupportedDateOrDateTimeProperty = ({
    property,
    component,
    componentId = '',
    hasXWrTimezone,
    calendarTzid,
    isRecurring = false,
    isInvite,
    guessTzid,
}: {
    property: VcalDateOrDateTimeProperty | VcalFloatingDateTimeProperty;
    component: string;
    componentId?: string;
    hasXWrTimezone: boolean;
    calendarTzid?: string;
    isRecurring?: boolean;
    method?: ICAL_METHOD;
    isInvite?: boolean;
    guessTzid?: string;
}) => {
    if (getIsPropertyAllDay(property)) {
        return dateToProperty(property.value);
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
            if (guessTzid) {
                return getDateTimeProperty(partDayProperty.value, guessTzid);
            }
            if (isInvite) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED);
            }
            // we should never reach here as guessTzid should be always defined for import
            throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.UNEXPECTED_FLOATING_TIME, 'vevent', componentId);
        }
        if (hasXWrTimezone && !calendarTzid) {
            if (isInvite) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED);
            }
            throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.X_WR_TIMEZONE_UNSUPPORTED, 'vevent', componentId);
        }
        return getDateTimeProperty(partDayProperty.value, calendarTzid);
    }

    const supportedTzid = getSupportedTimezone(partDayPropertyTzid);

    if (!supportedTzid) {
        if (isInvite) {
            throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED);
        }
        throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.TZID_UNSUPPORTED, component, componentId);
    }

    return getDateTimeProperty(partDayProperty.value, supportedTzid);
};

export const getLinkedDateTimeProperty = ({
    property,
    component,
    linkedIsAllDay,
    linkedTzid,
    componentId = '',
    isInvite,
}: {
    property: VcalDateOrDateTimeProperty;
    component: string;
    componentId?: string;
    linkedIsAllDay: boolean;
    linkedTzid?: string;
    isInvite?: boolean;
}): VcalDateOrDateTimeProperty => {
    if (linkedIsAllDay) {
        return dateToProperty(property.value);
    }
    if (getIsPropertyAllDay(property)) {
        if (isInvite) {
            throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID);
        }
        throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.ALLDAY_INCONSISTENCY, component, componentId);
    }
    const supportedTzid = getPropertyTzid(property);
    if (!supportedTzid || !linkedTzid) {
        if (isInvite) {
            throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED);
        }
        // should never be reached
        throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.UNEXPECTED_FLOATING_TIME, component, componentId);
    }
    if (linkedTzid !== supportedTzid) {
        // the linked date-time property should have the same tzid as dtstart
        return getDateTimePropertyInDifferentTimezone(property, linkedTzid, linkedIsAllDay);
    }
    return getDateTimeProperty(property.value, linkedTzid);
};

/**
 * Perform ICS surgery on a VEVENT component
 */
export const getSupportedEvent = ({
    method = ICAL_METHOD.PUBLISH,
    vcalVeventComponent,
    hasXWrTimezone,
    calendarTzid,
    guessTzid,
    componentId = '',
    isEventInvitation,
    generatedHashUid = false,
}: {
    method?: ICAL_METHOD;
    vcalVeventComponent: VcalVeventComponent;
    hasXWrTimezone: boolean;
    calendarTzid?: string;
    guessTzid?: string;
    componentId?: string;
    isEventInvitation?: boolean;
    generatedHashUid?: boolean;
}): VcalVeventComponent => {
    const isPublish = method === ICAL_METHOD.PUBLISH;
    const isInvitation = isEventInvitation && !isPublish;
    try {
        // common surgery
        const {
            component,
            components,
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
            'x-pm-proton-reply': protonReply,
            'x-yahoo-yid': xYahooID,
            'x-yahoo-user-status': xYahooUserStatus,
        } = vcalVeventComponent;
        const [trimmedSummaryValue, trimmedDescriptionValue, trimmedLocationValue] = [
            summary,
            description,
            location,
        ].map(getSupportedStringValue);
        const isRecurring = !!rrule || !!recurrenceId;

        const validated: VcalVeventComponent = {
            component,
            uid: { value: getSupportedUID(uid.value) },
            dtstamp: { ...dtstamp },
            dtstart: { ...dtstart },
        };
        let ignoreRrule = false;

        if (trimmedSummaryValue) {
            validated.summary = {
                ...summary,
                value: truncate(trimmedSummaryValue, MAX_LENGTHS_API.TITLE),
            };
        }
        if (trimmedDescriptionValue) {
            validated.description = {
                ...description,
                value: truncate(trimmedDescriptionValue, MAX_LENGTHS_API.EVENT_DESCRIPTION),
            };
        }
        if (trimmedLocationValue) {
            validated.location = {
                ...location,
                value: truncate(trimmedLocationValue, MAX_LENGTHS_API.LOCATION),
            };
        }
        const sequenceValue = sequence?.value || 0;
        const sequenceSafeValue = Number.isSafeInteger(sequenceValue) ? sequenceValue : 0;
        validated.sequence = { value: Math.max(0, sequenceSafeValue) };

        validated.dtstart = getSupportedDateOrDateTimeProperty({
            property: dtstart,
            component: 'vevent',
            componentId,
            hasXWrTimezone,
            calendarTzid,
            isRecurring,
            isInvite: isEventInvitation,
            guessTzid,
        });

        const isAllDayStart = getIsPropertyAllDay(validated.dtstart);
        const startTzid = getPropertyTzid(validated.dtstart);
        if (!getIsWellFormedDateOrDateTime(validated.dtstart)) {
            if (isEventInvitation) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID);
            }
            throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.DTSTART_MALFORMED, 'vevent', componentId);
        }
        if (getIsDateOutOfBounds(validated.dtstart)) {
            if (isEventInvitation) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED);
            }
            throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.DTSTART_OUT_OF_BOUNDS, 'vevent', componentId);
        }
        if (dtend) {
            const supportedDtend = getSupportedDateOrDateTimeProperty({
                property: dtend,
                component: 'vevent',
                componentId,
                hasXWrTimezone,
                calendarTzid,
                isRecurring,
                isInvite: isEventInvitation,
                guessTzid,
            });
            if (!getIsWellFormedDateOrDateTime(supportedDtend)) {
                if (isEventInvitation) {
                    throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID);
                }
                throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.DTEND_MALFORMED, 'vevent', componentId);
            }
            const startDateUTC = propertyToUTCDate(validated.dtstart);
            const endDateUTC = propertyToUTCDate(supportedDtend);
            // allow a non-RFC-compliant all-day event with DTSTART = DTEND
            const modifiedEndDateUTC =
                !getIsPropertyAllDay(dtend) || +startDateUTC === +endDateUTC ? endDateUTC : addDays(endDateUTC, -1);
            const eventDuration = +modifiedEndDateUTC - +startDateUTC;

            if (eventDuration > 0) {
                validated.dtend = supportedDtend;
            }
        } else if (duration) {
            const dtendFromDuration = getDtendPropertyFromDuration(validated.dtstart, duration.value);

            if (dtendFromDuration) {
                validated.dtend = dtendFromDuration;
            }
        }

        if (validated.dtend && getIsDateOutOfBounds(validated.dtend)) {
            if (isEventInvitation) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED);
            }
            throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.DTEND_OUT_OF_BOUNDS, 'vevent', componentId);
        }

        const isAllDayEnd = validated.dtend ? getIsPropertyAllDay(validated.dtend) : undefined;

        if (isAllDayEnd !== undefined && +isAllDayStart ^ +isAllDayEnd) {
            if (isEventInvitation) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID);
            }
            throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.ALLDAY_INCONSISTENCY, 'vevent', componentId);
        }

        if (exdate) {
            if (!rrule) {
                if (isEventInvitation) {
                    throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID);
                }
                throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.RRULE_MALFORMED, 'vevent', componentId);
            }
            const supportedExdate = exdate.map((property) =>
                getSupportedDateOrDateTimeProperty({
                    property,
                    component: 'vevent',
                    componentId,
                    hasXWrTimezone,
                    calendarTzid,
                    isRecurring,
                    isInvite: isEventInvitation,
                    guessTzid,
                })
            );
            validated.exdate = supportedExdate.map((property) =>
                getLinkedDateTimeProperty({
                    property,
                    component: 'vevent',
                    componentId,
                    linkedIsAllDay: isAllDayStart,
                    linkedTzid: startTzid,
                    isInvite: isEventInvitation,
                })
            );
        }
        // Do not keep recurrence ids when we generated a hash UID, as the RECURRENCE-ID is meaningless then
        if (recurrenceId && !generatedHashUid) {
            if (rrule) {
                if (method === ICAL_METHOD.REPLY) {
                    // the external provider forgot to remove the RRULE
                    ignoreRrule = true;
                } else {
                    if (isEventInvitation) {
                        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED);
                    }
                    throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.SINGLE_EDIT_UNSUPPORTED, 'vevent', componentId);
                }
            }
            // RECURRENCE-ID cannot be linked with DTSTART of the parent event at this point since we do not have access to it
            validated['recurrence-id'] = getSupportedDateOrDateTimeProperty({
                property: recurrenceId,
                component: 'vevent',
                componentId,
                hasXWrTimezone,
                calendarTzid,
                isRecurring,
                isInvite: isEventInvitation,
                guessTzid,
            });
        }

        if (rrule && !ignoreRrule) {
            const supportedRrule = getSupportedRrule({ ...validated, rrule }, isInvitation, guessTzid);
            if (!supportedRrule) {
                if (isEventInvitation) {
                    throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED);
                }
                throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.RRULE_UNSUPPORTED, 'vevent', componentId);
            }
            validated.rrule = supportedRrule;
            if (!getHasConsistentRrule(validated)) {
                if (isEventInvitation) {
                    throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID);
                }
                throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.RRULE_MALFORMED, 'vevent', componentId);
            }
            if (!getHasOccurrences(validated)) {
                if (isEventInvitation) {
                    throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID);
                }
                throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.NO_OCCURRENCES, 'vevent', componentId);
            }
        }

        // import-specific surgery
        if (!isInvitation) {
            if (!isEventInvitation && isPublish) {
                const alarms = components?.filter(({ component }) => component === 'valarm') || [];
                const supportedAlarms = getSupportedAlarms(alarms, dtstart);
                const dedupedAlarms = dedupeAlarmsWithNormalizedTriggers(supportedAlarms);

                if (dedupedAlarms.length) {
                    validated.components = dedupedAlarms;
                }
            }
        }

        // invite-specific surgery
        if (isInvitation) {
            if (sharedSessionKey) {
                validated['x-pm-session-key'] = { ...sharedSessionKey };
            }
            if (sharedEventID) {
                validated['x-pm-shared-event-id'] = { ...sharedEventID };
            }
            if (protonReply) {
                validated['x-pm-proton-reply'] = { ...protonReply };
            }
            if (xYahooID) {
                // Needed to interpret non RFC-compliant Yahoo REPLY ics's
                validated['x-yahoo-yid'] = { ...xYahooID };
            }
            if (xYahooUserStatus) {
                // Needed to interpret non RFC-compliant Yahoo REPLY ics's
                validated['x-yahoo-user-status'] = { ...xYahooUserStatus };
            }
            if (organizer) {
                validated.organizer = getSupportedOrganizer(organizer);
            } else {
                // The ORGANIZER field is mandatory in an invitation
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID);
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
        }

        return validated;
    } catch (e: any) {
        if (e instanceof ImportEventError || e instanceof EventInvitationError) {
            throw e;
        }
        if (isEventInvitation) {
            throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, { externalError: e });
        }
        throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.VALIDATION_ERROR, 'vevent', componentId || '');
    }
};

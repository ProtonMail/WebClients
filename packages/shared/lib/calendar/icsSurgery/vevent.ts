import { addDays } from 'date-fns';
import { getIsDateOutOfBounds, getIsWellFormedDateOrDateTime, getSupportedUID } from '../helper';
import { EVENT_INVITATION_ERROR_TYPE, EventInvitationError } from './EventInvitationError';
import { convertUTCDateTimeToZone, getSupportedTimezone } from '../../date/timezone';
import { unique } from '../../helpers/array';
import { truncate } from '../../helpers/string';
import {
    VcalDateOrDateTimeProperty,
    VcalFloatingDateTimeProperty,
    VcalVeventComponent,
} from '../../interfaces/calendar';
import { dedupeAlarmsWithNormalizedTriggers } from '../alarms';
import { getAttendeeEmail, getSupportedAttendee } from '../attendees';
import { ICAL_METHOD, MAX_LENGTHS } from '../constants';
import { getHasConsistentRrule, getSupportedRrule } from '../rrule';
import {
    getDateProperty,
    getDateTimeProperty,
    getDateTimePropertyInDifferentTimezone,
    propertyToUTCDate,
} from '../vcalConverter';
import { getIsPropertyAllDay, getPropertyTzid } from '../vcalHelper';
import { IMPORT_EVENT_ERROR_TYPE, ImportEventError } from './ImportEventError';
import { getSupportedAlarms } from './valarm';

export const getSupportedDateOrDateTimeProperty = ({
    property,
    component,
    componentId = '',
    hasXWrTimezone,
    calendarTzid,
    isRecurring = false,
    method,
    isInvite,
}: {
    property: VcalDateOrDateTimeProperty | VcalFloatingDateTimeProperty;
    component: string;
    componentId?: string;
    hasXWrTimezone: boolean;
    calendarTzid?: string;
    isRecurring?: boolean;
    method?: ICAL_METHOD;
    isInvite?: boolean;
}) => {
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
            if (isInvite) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, { method });
            }
            throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.FLOATING_TIME, 'vevent', componentId);
        }
        if (hasXWrTimezone && !calendarTzid) {
            if (isInvite) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, { method });
            }
            throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.X_WR_TIMEZONE_UNSUPPORTED, 'vevent', componentId);
        }
        return getDateTimeProperty(partDayProperty.value, calendarTzid);
    }

    const supportedTzid = getSupportedTimezone(partDayPropertyTzid);
    if (!supportedTzid) {
        if (isInvite) {
            throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, { method });
        }
        throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.TZID_UNSUPPORTED, component, componentId);
    }
    return getDateTimeProperty(partDayProperty.value, supportedTzid);
};

export const getLinkedDateTimeProperty = ({
    property,
    component,
    isAllDay,
    tzid,
    componentId = '',
    method,
    isInvite,
}: {
    property: VcalDateOrDateTimeProperty;
    component: string;
    componentId?: string;
    isAllDay: boolean;
    tzid?: string;
    method?: ICAL_METHOD;
    isInvite?: boolean;
}): VcalDateOrDateTimeProperty => {
    if (isAllDay) {
        return getDateProperty(property.value);
    }
    if (getIsPropertyAllDay(property)) {
        if (isInvite) {
            throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID, { method });
        }
        throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.ALLDAY_INCONSISTENCY, component, componentId);
    }
    const supportedTzid = getPropertyTzid(property);
    if (!supportedTzid || !tzid) {
        if (isInvite) {
            throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, { method });
        }
        throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.FLOATING_TIME, component, componentId);
    }
    if (tzid !== supportedTzid) {
        // the linked date-time property should have the same tzid as dtstart
        return getDateTimePropertyInDifferentTimezone(property, tzid, isAllDay);
    }
    return getDateTimeProperty(property.value, tzid);
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
    dropAlarms,
}: {
    method?: ICAL_METHOD;
    vcalVeventComponent: VcalVeventComponent;
    hasXWrTimezone: boolean;
    calendarTzid?: string;
    guessTzid?: string;
    componentId?: string;
    isEventInvitation?: boolean;
    dropAlarms?: boolean;
}): VcalVeventComponent => {
    const isImport = method === ICAL_METHOD.PUBLISH;
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
        } = vcalVeventComponent;
        const trimmedSummaryValue = summary?.value.trim();
        const trimmedDescriptionValue = description?.value.trim();
        const trimmedLocationValue = location?.value.trim();
        const isRecurring = !!rrule || !!recurrenceId;

        const validated: VcalVeventComponent = {
            component,
            uid: getSupportedUID(uid),
            dtstamp: { ...dtstamp },
            dtstart: { ...dtstart },
        };
        let ignoreRrule = false;

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

        validated.dtstart = getSupportedDateOrDateTimeProperty({
            property: dtstart,
            component: 'vevent',
            componentId,
            hasXWrTimezone,
            calendarTzid,
            isRecurring,
        });
        const isAllDayStart = getIsPropertyAllDay(validated.dtstart);
        const startTzid = getPropertyTzid(validated.dtstart);
        if (!getIsWellFormedDateOrDateTime(validated.dtstart)) {
            if (isEventInvitation) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID, { method });
            }
            throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.DTSTART_MALFORMED, 'vevent', componentId);
        }
        if (getIsDateOutOfBounds(validated.dtstart)) {
            if (isEventInvitation) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, { method });
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
            });
            if (!getIsWellFormedDateOrDateTime(supportedDtend)) {
                if (isEventInvitation) {
                    throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID, { method });
                }
                throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.DTEND_MALFORMED, 'vevent', componentId);
            }
            if (getIsDateOutOfBounds(supportedDtend)) {
                if (isEventInvitation) {
                    throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID, { method });
                }
                throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.DTEND_OUT_OF_BOUNDS, 'vevent', componentId);
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
            if (isEventInvitation) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID, { method });
            }
            throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.VEVENT_DURATION, 'vevent', componentId);
        }
        const isAllDayEnd = validated.dtend ? getIsPropertyAllDay(validated.dtend) : undefined;
        if (isAllDayEnd !== undefined && +isAllDayStart ^ +isAllDayEnd) {
            if (isEventInvitation) {
                throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID, { method });
            }
            throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.ALLDAY_INCONSISTENCY, 'vevent', componentId);
        }
        if (exdate) {
            if (!rrule) {
                if (isEventInvitation) {
                    throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID, { method });
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
                })
            );
            validated.exdate = supportedExdate.map((property) =>
                getLinkedDateTimeProperty({
                    property,
                    component: 'vevent',
                    componentId,
                    isAllDay: isAllDayStart,
                    tzid: startTzid,
                })
            );
        }
        if (recurrenceId) {
            if (rrule) {
                if (method === ICAL_METHOD.REPLY) {
                    // the external provider forgot to remove the RRULE
                    ignoreRrule = true;
                } else {
                    if (isEventInvitation) {
                        throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, { method });
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
            });
        }

        if (rrule && !ignoreRrule) {
            const supportedRrule = getSupportedRrule({ ...validated, rrule }, isEventInvitation, guessTzid);
            if (!supportedRrule) {
                if (isEventInvitation) {
                    throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, { method });
                }
                throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.RRULE_UNSUPPORTED, 'vevent', componentId);
            }
            validated.rrule = supportedRrule;
            if (!getHasConsistentRrule(validated)) {
                if (isEventInvitation) {
                    throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID, { method });
                }
                throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.RRULE_MALFORMED, 'vevent', componentId);
            }
        }

        // import-specific surgery
        if (isImport) {
            if (!dropAlarms) {
                const alarms = components?.filter(({ component }) => component === 'valarm') || [];
                const supportedAlarms = getSupportedAlarms(alarms, dtstart);
                const dedupedAlarms = dedupeAlarmsWithNormalizedTriggers(supportedAlarms);

                if (dedupedAlarms.length) {
                    validated.components = dedupedAlarms;
                }
            }
        }

        // invite-specific surgery
        if (!isImport) {
            if (sharedSessionKey) {
                validated['x-pm-session-key'] = { ...sharedSessionKey };
            }
            if (sharedEventID) {
                validated['x-pm-shared-event-id'] = { ...sharedEventID };
            }
            if (organizer) {
                validated.organizer = { ...organizer };
            } else {
                // TODO: take care outside
                // The ORGANIZER field is mandatory in an invitation
                // const guessOrganizerEmail = ICAL_METHODS_ATTENDEE.includes(method)
                //     ? getOriginalTo(message)
                //     : message.SenderAddress;
                // validated.organizer = buildVcalOrganizer(guessOrganizerEmail);
            }

            if (attendee) {
                if (attendee.length > 100) {
                    throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, {
                        method,
                    });
                }
                const attendeeEmails = attendee.map((att) => getAttendeeEmail(att));
                if (unique(attendeeEmails).length !== attendeeEmails.length) {
                    // Do not accept invitations with repeated emails as they will cause problems.
                    // Usually external providers don't allow this to happen
                    throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, {
                        method,
                    });
                }
                validated.attendee = attendee.map((vcalAttendee) => getSupportedAttendee(vcalAttendee));
            }
        }

        return validated;
    } catch (e) {
        if (e instanceof ImportEventError || e instanceof EventInvitationError) {
            throw e;
        }
        if (isEventInvitation) {
            throw new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED, { externalError: e });
        }
        throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.VALIDATION_ERROR, 'vevent', componentId || '');
    }
};

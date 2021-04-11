import { c } from 'ttag';
import { addDays } from 'date-fns';

import { readFileAsString } from '../helpers/file';
import { truncate } from '../helpers/string';
import isTruthy from '../helpers/isTruthy';
import { unique } from '../helpers/array';

import { dedupeAlarmsWithNormalizedTriggers, getSupportedAlarm } from './alarms';
import {
    getHasDtStart,
    getHasRecurrenceId,
    getHasUid,
    getIsCalendar,
    getIsEventComponent,
    getIsFreebusyComponent,
    getIsJournalComponent,
    getIsPropertyAllDay,
    getIsTimezoneComponent,
    getIsTodoComponent,
    getPropertyTzid,
} from './vcalHelper';
import { parseWithErrors } from './vcal';
import {
    IMPORT_ERROR_TYPE,
    MAX_CALENDARS_PER_USER,
    MAX_IMPORT_EVENTS,
    MAX_LENGTHS,
    MAX_NOTIFICATIONS,
} from './constants';
import { ImportFileError } from './ImportFileError';
import formatUTC from '../date-fns-utc/format';
import { convertUTCDateTimeToZone, getSupportedTimezone, toUTCDate } from '../date/timezone';
import {
    CalendarEvent,
    EncryptedEvent,
    VcalCalendarComponentOrError,
    VcalDateOrDateTimeProperty,
    VcalFloatingDateTimeProperty,
    VcalValarmComponent,
    VcalVeventComponent,
    VcalVtimezoneComponent,
} from '../interfaces/calendar';
import {
    getDateProperty,
    getDateTimeProperty,
    getDateTimePropertyInDifferentTimezone,
    propertyToUTCDate,
} from './vcalConverter';
import { IMPORT_EVENT_ERROR_TYPE, ImportEventError } from './ImportEventError';
import { dateLocale } from '../i18n';
import { withDtstamp } from './veventHelper';
import { getIsDateOutOfBounds, getIsWellFormedDateOrDateTime, getSupportedUID } from './support';
import { getHasConsistentRrule, getSupportedRrule } from './rrule';
import { getEventByUID } from '../api/calendars';
import getComponentFromCalendarEvent from './getComponentFromCalendarEvent';
import { Api } from '../interfaces';

const getParsedComponentHasError = (component: VcalCalendarComponentOrError): component is { error: Error } => {
    return !!(component as { error: Error }).error;
};

export const parseIcs = async (ics: File) => {
    const filename = ics.name;
    try {
        const icsAsString = await readFileAsString(ics);
        if (!icsAsString) {
            throw new ImportFileError(IMPORT_ERROR_TYPE.FILE_EMPTY, filename);
        }
        const parsedVcalendar = parseWithErrors(icsAsString);
        if (!getIsCalendar(parsedVcalendar)) {
            throw new ImportFileError(IMPORT_ERROR_TYPE.INVALID_CALENDAR, filename);
        }
        const { method, version, components, calscale, 'x-wr-timezone': xWrTimezone } = parsedVcalendar;
        if (version?.value !== '2.0') {
            throw new ImportFileError(IMPORT_ERROR_TYPE.INVALID_VERSION, filename);
        }
        if (method && method.value.toLowerCase() !== 'publish') {
            throw new ImportFileError(IMPORT_ERROR_TYPE.INVALID_METHOD, filename);
        }
        if (!components?.length) {
            throw new ImportFileError(IMPORT_ERROR_TYPE.NO_EVENTS, filename);
        }
        if (components.length > MAX_IMPORT_EVENTS) {
            throw new ImportFileError(IMPORT_ERROR_TYPE.TOO_MANY_EVENTS, filename);
        }
        return { components, calscale: calscale?.value, xWrTimezone: xWrTimezone?.value };
    } catch (e) {
        if (e instanceof ImportFileError) {
            throw e;
        }
        throw new ImportFileError(IMPORT_ERROR_TYPE.FILE_CORRUPTED, filename);
    }
};

/**
 * Get a string that can identify an imported component
 */
const getComponentIdentifier = (vcalComponent: VcalCalendarComponentOrError) => {
    if (getParsedComponentHasError(vcalComponent)) {
        return '';
    }
    if (getIsTimezoneComponent(vcalComponent)) {
        return vcalComponent.tzid.value || '';
    }
    const uid = 'uid' in vcalComponent ? vcalComponent.uid?.value : undefined;
    if (uid) {
        return uid;
    }
    if (getIsEventComponent(vcalComponent)) {
        const { summary, dtstart } = vcalComponent;
        const shortTitle = truncate(summary?.value);
        if (shortTitle) {
            return shortTitle;
        }
        if (dtstart?.value) {
            return formatUTC(toUTCDate(dtstart.value), 'PPpp', { locale: dateLocale });
        }
        return c('Error importing event').t`no UID, title or start time`;
    }
    return '';
};

const extractGuessTzid = (components: VcalCalendarComponentOrError[]) => {
    const vtimezone = components.find((componentOrError): componentOrError is VcalVtimezoneComponent => {
        if (getParsedComponentHasError(componentOrError)) {
            return false;
        }
        return getIsTimezoneComponent(componentOrError);
    });
    const guessTzid = vtimezone?.tzid.value;
    return guessTzid ? getSupportedTimezone(guessTzid) : undefined;
};

interface GetSupportedDateOrDateTimePropertyArgs {
    property: VcalDateOrDateTimeProperty | VcalFloatingDateTimeProperty;
    component: string;
    componentId: string;
    hasXWrTimezone: boolean;
    calendarTzid?: string;
    isRecurring?: boolean;
}
export const getSupportedDateOrDateTimeProperty = ({
    property,
    component,
    componentId,
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
            throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.FLOATING_TIME, 'vevent', componentId);
        }
        if (hasXWrTimezone && !calendarTzid) {
            throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.X_WR_TIMEZONE_UNSUPPORTED, 'vevent', componentId);
        }
        return getDateTimeProperty(partDayProperty.value, calendarTzid);
    }

    const supportedTzid = getSupportedTimezone(partDayPropertyTzid);
    if (!supportedTzid) {
        throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.TZID_UNSUPPORTED, component, componentId);
    }
    return getDateTimeProperty(partDayProperty.value, supportedTzid);
};

interface GetLinkedDateTimePropertyArgs {
    property: VcalDateOrDateTimeProperty;
    component: string;
    componentId: string;
    isAllDay: boolean;
    tzid?: string;
}
const getLinkedDateTimeProperty = ({
    property,
    component,
    isAllDay,
    tzid,
    componentId,
}: GetLinkedDateTimePropertyArgs): VcalDateOrDateTimeProperty => {
    if (isAllDay) {
        return getDateProperty(property.value);
    }
    if (getIsPropertyAllDay(property)) {
        throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.ALLDAY_INCONSISTENCY, component, componentId);
    }
    const supportedTzid = getPropertyTzid(property);
    if (!supportedTzid || !tzid) {
        throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.FLOATING_TIME, component, componentId);
    }
    if (tzid !== supportedTzid) {
        // the linked date-time property should have the same tzid as dtstart
        return getDateTimePropertyInDifferentTimezone(property, tzid, isAllDay);
    }
    return getDateTimeProperty(property.value, tzid);
};

const getSupportedAlarms = (valarms: VcalValarmComponent[], dtstart: VcalDateOrDateTimeProperty) => {
    return valarms
        .map((alarm) => getSupportedAlarm(alarm, dtstart))
        .filter(isTruthy)
        .slice(0, MAX_NOTIFICATIONS);
};

interface GetSupportedEventArgs {
    vcalComponent: VcalCalendarComponentOrError;
    hasXWrTimezone: boolean;
    calendarTzid?: string;
    guessTzid?: string;
}
export const getSupportedEvent = ({
    vcalComponent,
    hasXWrTimezone,
    calendarTzid,
    guessTzid,
}: GetSupportedEventArgs) => {
    const componentId = getComponentIdentifier(vcalComponent);
    if (getParsedComponentHasError(vcalComponent)) {
        throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.EXTERNAL_ERROR, '', componentId, vcalComponent.error);
    }
    if (getIsTodoComponent(vcalComponent)) {
        throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.TODO_FORMAT, 'vtodo', componentId);
    }
    if (getIsJournalComponent(vcalComponent)) {
        throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.JOURNAL_FORMAT, 'vjournal', componentId);
    }
    if (getIsFreebusyComponent(vcalComponent)) {
        throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.FREEBUSY_FORMAT, 'vfreebusy', componentId);
    }
    if (getIsTimezoneComponent(vcalComponent)) {
        if (!getSupportedTimezone(vcalComponent.tzid.value)) {
            throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.TIMEZONE_FORMAT, 'vtimezone', componentId);
        }
        throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.TIMEZONE_IGNORE, 'vtimezone', componentId);
    }
    if (!getIsEventComponent(vcalComponent)) {
        throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.WRONG_FORMAT, 'vunknown', componentId);
    }
    if (!getHasUid(vcalComponent)) {
        throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.UID_MISSING, 'vevent', componentId);
    }
    if (!getHasDtStart(vcalComponent)) {
        throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.DTSTART_MISSING, 'vevent', componentId);
    }
    try {
        const vevent = withDtstamp(vcalComponent);
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
            duration,
        } = vevent;
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
            throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.DTSTART_MALFORMED, 'vevent', componentId);
        }
        if (getIsDateOutOfBounds(validated.dtstart)) {
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
                throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.DTEND_MALFORMED, 'vevent', componentId);
            }
            if (getIsDateOutOfBounds(supportedDtend)) {
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
            throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.VEVENT_DURATION, 'vevent', componentId);
        }
        const isAllDayEnd = validated.dtend ? getIsPropertyAllDay(validated.dtend) : undefined;
        if (isAllDayEnd !== undefined && +isAllDayStart ^ +isAllDayEnd) {
            throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.ALLDAY_INCONSISTENCY, 'vevent', componentId);
        }
        if (exdate) {
            if (!rrule) {
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
                throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.SINGLE_EDIT_UNSUPPORTED, 'vevent', componentId);
            }
            // we will link RECURRENCE-ID with DTSTART later in the import flow, when we know who the parent event is
            validated['recurrence-id'] = getSupportedDateOrDateTimeProperty({
                property: recurrenceId,
                component: 'vevent',
                componentId,
                hasXWrTimezone,
                calendarTzid,
                isRecurring,
            });
        }

        if (rrule) {
            const supportedRrule = getSupportedRrule({ ...validated, rrule }, false, guessTzid);
            if (!supportedRrule) {
                throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.RRULE_UNSUPPORTED, 'vevent', componentId);
            }
            validated.rrule = supportedRrule;
            if (!getHasConsistentRrule(validated)) {
                throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.RRULE_MALFORMED, 'vevent', componentId);
            }
        }

        const alarms = components?.filter(({ component }) => component === 'valarm') || [];
        const supportedAlarms = getSupportedAlarms(alarms, dtstart);
        const dedupedAlarms = dedupeAlarmsWithNormalizedTriggers(supportedAlarms);

        if (dedupedAlarms.length) {
            validated.components = dedupedAlarms;
        }

        return validated;
    } catch (e) {
        if (e instanceof ImportEventError) {
            throw e;
        }
        throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.VALIDATION_ERROR, 'vevent', componentId);
    }
};

interface GetSupportedEventsArgs {
    components: VcalCalendarComponentOrError[];
    calscale?: string;
    xWrTimezone?: string;
}
export const getSupportedEvents = ({ components, calscale, xWrTimezone }: GetSupportedEventsArgs) => {
    if (calscale && calscale.toLowerCase() !== 'gregorian') {
        return [new ImportEventError(IMPORT_EVENT_ERROR_TYPE.NON_GREGORIAN, 'vcalendar', '')];
    }
    const hasXWrTimezone = !!xWrTimezone;
    const calendarTzid = xWrTimezone ? getSupportedTimezone(xWrTimezone) : undefined;
    const guessTzid = extractGuessTzid(components);
    return components
        .map((vcalComponent) => {
            try {
                return getSupportedEvent({ vcalComponent, calendarTzid, hasXWrTimezone, guessTzid });
            } catch (e) {
                if (e instanceof ImportEventError && e.type === IMPORT_EVENT_ERROR_TYPE.TIMEZONE_IGNORE) {
                    return;
                }
                return e;
            }
        })
        .filter(isTruthy);
};

/**
 * Split an array of events into those which have a recurrence id and those which don't
 */
export const splitByRecurrenceId = (events: VcalVeventComponent[]) => {
    return events.reduce<{
        withoutRecurrenceId: VcalVeventComponent[];
        withRecurrenceId: (VcalVeventComponent & Required<Pick<VcalVeventComponent, 'recurrence-id'>>)[];
    }>(
        (acc, event) => {
            if (!getHasRecurrenceId(event)) {
                acc.withoutRecurrenceId.push(event);
            } else {
                acc.withRecurrenceId.push(event);
            }
            return acc;
        },
        { withoutRecurrenceId: [], withRecurrenceId: [] }
    );
};

export const splitErrors = <T>(events: (T | ImportEventError)[]) => {
    return events.reduce<{ errors: ImportEventError[]; rest: T[] }>(
        (acc, event) => {
            if (event instanceof ImportEventError) {
                acc.errors.push(event);
            } else {
                acc.rest.push(event);
            }
            return acc;
        },
        { errors: [], rest: [] }
    );
};

const getParentEventFromApi = async (uid: string, api: Api, calendarId: string) => {
    try {
        const { Events } = await api<{ Events: CalendarEvent[] }>({
            ...getEventByUID({
                UID: uid,
                Page: 0,
                PageSize: MAX_CALENDARS_PER_USER,
            }),
            silence: true,
        });
        const [parentEvent] = Events.filter(({ CalendarID }) => CalendarID === calendarId);
        if (!parentEvent) {
            return;
        }
        const parentComponent = getComponentFromCalendarEvent(parentEvent);
        if (getHasRecurrenceId(parentComponent)) {
            // it wouldn't be a parent then
            return;
        }
        return parentComponent;
    } catch {
        return undefined;
    }
};

interface GetSupportedEventsWithRecurrenceIdArgs {
    eventsWithRecurrenceId: (VcalVeventComponent & Required<Pick<VcalVeventComponent, 'recurrence-id'>>)[];
    parentEvents: EncryptedEvent[];
    calendarId: string;
    api: Api;
}
export const getSupportedEventsWithRecurrenceId = async ({
    eventsWithRecurrenceId,
    parentEvents,
    api,
    calendarId,
}: GetSupportedEventsWithRecurrenceIdArgs) => {
    // map uid -> parent event
    const mapParentEvents = parentEvents.reduce<{
        [key: string]: VcalVeventComponent | undefined;
    }>((acc, event) => {
        const { component } = event;
        acc[component.uid.value] = component;
        return acc;
    }, {});
    // complete the map with parent events in the DB
    const uidsToFetch = unique(
        eventsWithRecurrenceId.filter(({ uid }) => !mapParentEvents[uid.value]).map(({ uid }) => uid.value)
    );
    const result = await Promise.all(uidsToFetch.map((uid) => getParentEventFromApi(uid, api, calendarId)));
    result.forEach((parentEvent, i) => {
        mapParentEvents[uidsToFetch[i]] = parentEvent;
    });

    return eventsWithRecurrenceId.map((event) => {
        const uid = event.uid.value;
        if (!mapParentEvents[uid]) {
            return new ImportEventError(IMPORT_EVENT_ERROR_TYPE.PARENT_EVENT_MISSING, 'vevent', uid);
        }
        const parentEvent = mapParentEvents[uid] as VcalVeventComponent;
        if (!parentEvent.rrule) {
            return new ImportEventError(IMPORT_EVENT_ERROR_TYPE.SINGLE_EDIT_UNSUPPORTED, 'vevent', uid);
        }
        const recurrenceId = event['recurrence-id'];
        try {
            const parentDtstart = parentEvent.dtstart;
            const supportedRecurrenceId = getLinkedDateTimeProperty({
                property: recurrenceId,
                component: 'vevent',
                isAllDay: getIsPropertyAllDay(parentDtstart),
                tzid: getPropertyTzid(parentDtstart),
                componentId: uid,
            });
            return { ...event, 'recurrence-id': supportedRecurrenceId };
        } catch (e) {
            if (e instanceof ImportEventError) {
                return e;
            }
            return new ImportEventError(IMPORT_EVENT_ERROR_TYPE.VALIDATION_ERROR, 'vevent', uid);
        }
    });
};

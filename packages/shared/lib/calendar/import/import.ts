import { c } from 'ttag';
import { getEventByUID } from '../../api/calendars';
import formatUTC from '../../date-fns-utc/format';
import { getSupportedTimezone, toUTCDate } from '../../date/timezone';
import { unique } from '../../helpers/array';

import { readFileAsString } from '../../helpers/file';
import isTruthy from '../../helpers/isTruthy';
import { truncate } from '../../helpers/string';
import { dateLocale } from '../../i18n';
import { Api } from '../../interfaces';
import {
    CalendarEvent,
    EncryptedEvent,
    VcalCalendarComponentOrError,
    VcalVeventComponent,
    VcalVtimezoneComponent,
} from '../../interfaces/calendar';

import { ICAL_METHOD, IMPORT_ERROR_TYPE, MAX_CALENDARS_PER_USER, MAX_IMPORT_EVENTS } from '../constants';
import getComponentFromCalendarEvent from '../getComponentFromCalendarEvent';
import { generateVeventHashUID } from '../helper';
import { getLinkedDateTimeProperty, getSupportedEvent } from '../icsSurgery/vevent';
import { parseWithErrors, serialize } from '../vcal';
import {
    getHasDtStart,
    getHasRecurrenceId,
    getIcalMethod,
    getIsCalendar,
    getIsEventComponent,
    getIsFreebusyComponent,
    getIsJournalComponent,
    getIsPropertyAllDay,
    getIsTimezoneComponent,
    getIsTodoComponent,
    getPropertyTzid,
} from '../vcalHelper';
import { withDtstamp } from '../veventHelper';
import { IMPORT_EVENT_ERROR_TYPE, ImportEventError } from '../icsSurgery/ImportEventError';
import { ImportFileError } from './ImportFileError';

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
        const supportedMethod = method ? getIcalMethod(method) : undefined;
        if (version?.value !== '2.0') {
            throw new ImportFileError(IMPORT_ERROR_TYPE.INVALID_VERSION, filename);
        }
        if (supportedMethod && supportedMethod !== ICAL_METHOD.PUBLISH) {
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
        const shortTitle = truncate(summary?.value || '');
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

interface GetSupportedEventArgs {
    vcalComponent: VcalCalendarComponentOrError;
    hasXWrTimezone: boolean;
    calendarTzid?: string;
    guessTzid?: string;
}
export const extractSupportedEvent = async ({
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
    if (!getHasDtStart(vcalComponent)) {
        throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.DTSTART_MISSING, 'vevent', componentId);
    }
    const validVevent = withDtstamp(vcalComponent);
    if (!validVevent.uid?.value) {
        validVevent.uid = { value: await generateVeventHashUID(serialize(validVevent)) };
    }
    return getSupportedEvent({
        vcalVeventComponent: validVevent,
        hasXWrTimezone,
        calendarTzid,
        guessTzid,
        method: ICAL_METHOD.PUBLISH,
        componentId,
    });
};

export const getSupportedEvents = async ({
    components,
    calscale,
    xWrTimezone,
}: {
    components: VcalCalendarComponentOrError[];
    calscale?: string;
    xWrTimezone?: string;
}) => {
    if (calscale && calscale.toLowerCase() !== 'gregorian') {
        return [new ImportEventError(IMPORT_EVENT_ERROR_TYPE.NON_GREGORIAN, 'vcalendar', '')];
    }
    const hasXWrTimezone = !!xWrTimezone;
    const calendarTzid = xWrTimezone ? getSupportedTimezone(xWrTimezone) : undefined;
    const guessTzid = extractGuessTzid(components);
    return Promise.all(
        components
            .map(async (vcalComponent) => {
                try {
                    const supportedEvent = await extractSupportedEvent({
                        vcalComponent,
                        calendarTzid,
                        hasXWrTimezone,
                        guessTzid,
                    });
                    return supportedEvent;
                } catch (e) {
                    if (e instanceof ImportEventError && e.type === IMPORT_EVENT_ERROR_TYPE.TIMEZONE_IGNORE) {
                        return;
                    }
                    return e;
                }
            })
            .filter(isTruthy)
    );
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

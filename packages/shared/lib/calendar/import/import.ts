import { c } from 'ttag';
import { getEventByUID } from '../../api/calendars';
import formatUTC, { Options as FormatOptions } from '../../date-fns-utc/format';
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
    ImportCalendarModel,
    VcalCalendarComponentOrError,
    VcalVeventComponent,
    VcalVtimezoneComponent,
} from '../../interfaces/calendar';

import { ICAL_METHOD, IMPORT_ERROR_TYPE, MAX_CALENDARS_PER_USER, MAX_IMPORT_EVENTS } from '../constants';
import getComponentFromCalendarEvent from '../getComponentFromCalendarEvent';
import { generateVeventHashUID, getOriginalUID } from '../helper';
import { IMPORT_EVENT_ERROR_TYPE, ImportEventError } from '../icsSurgery/ImportEventError';
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
        const { method, components, calscale, 'x-wr-timezone': xWrTimezone } = parsedVcalendar;
        const supportedMethod = getIcalMethod(method);

        if (!supportedMethod) {
            throw new ImportFileError(IMPORT_ERROR_TYPE.INVALID_METHOD, filename);
        }
        if (!components?.length) {
            throw new ImportFileError(IMPORT_ERROR_TYPE.NO_EVENTS, filename);
        }
        if (components.length > MAX_IMPORT_EVENTS) {
            throw new ImportFileError(IMPORT_ERROR_TYPE.TOO_MANY_EVENTS, filename);
        }
        return { components, calscale: calscale?.value, xWrTimezone: xWrTimezone?.value, method: supportedMethod };
    } catch (e: any) {
        if (e instanceof ImportFileError) {
            throw e;
        }
        throw new ImportFileError(IMPORT_ERROR_TYPE.FILE_CORRUPTED, filename);
    }
};

/**
 * Get a string that can identify an imported component
 */
export const getComponentIdentifier = (
    vcalComponent: VcalCalendarComponentOrError,
    options: FormatOptions = { locale: dateLocale }
) => {
    if (getParsedComponentHasError(vcalComponent)) {
        return '';
    }
    if (getIsTimezoneComponent(vcalComponent)) {
        return vcalComponent.tzid.value || '';
    }
    const uid = 'uid' in vcalComponent ? vcalComponent.uid?.value : undefined;
    const originalUid = getOriginalUID(uid);
    if (originalUid) {
        return originalUid;
    }
    if (getIsEventComponent(vcalComponent)) {
        const { summary, dtstart } = vcalComponent;
        const shortTitle = truncate(summary?.value || '');
        if (shortTitle) {
            return shortTitle;
        }
        if (dtstart?.value) {
            const format = getIsPropertyAllDay(dtstart) ? 'PP' : 'PPpp';
            return formatUTC(toUTCDate(dtstart.value), format, options);
        }
        return c('Error importing event').t`No UID, title or start time`;
    }
    return '';
};

const extractGuessTzid = (components: VcalCalendarComponentOrError[]) => {
    const vtimezones = components.filter((componentOrError): componentOrError is VcalVtimezoneComponent => {
        if (getParsedComponentHasError(componentOrError)) {
            return false;
        }
        return getIsTimezoneComponent(componentOrError);
    });
    if (vtimezones.length === 1) {
        // we do not have guarantee that the VcalVtimezoneComponent's in vtimezones are propper, so better use optional chaining
        const guessTzid = vtimezones[0]?.tzid?.value;
        return guessTzid ? getSupportedTimezone(guessTzid) : undefined;
    }
};

interface GetSupportedEventArgs {
    method: ICAL_METHOD;
    vcalComponent: VcalCalendarComponentOrError;
    hasXWrTimezone: boolean;
    formatOptions?: FormatOptions;
    calendarTzid?: string;
    guessTzid?: string;
}
export const extractSupportedEvent = async ({
    method,
    vcalComponent,
    hasXWrTimezone,
    formatOptions,
    calendarTzid,
    guessTzid,
}: GetSupportedEventArgs) => {
    const componentId = getComponentIdentifier(vcalComponent, formatOptions);
    const isInvitation = method !== ICAL_METHOD.PUBLISH;
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
    const generateHashUid = !validVevent.uid?.value || isInvitation;
    if (generateHashUid) {
        validVevent.uid = { value: await generateVeventHashUID(serialize(vcalComponent), vcalComponent?.uid?.value) };
    }
    return getSupportedEvent({
        vcalVeventComponent: validVevent,
        hasXWrTimezone,
        calendarTzid,
        guessTzid,
        method,
        isEventInvitation: false,
        generatedHashUid: generateHashUid,
        componentId,
    });
};

export const getSupportedEvents = async ({
    components,
    method,
    formatOptions,
    calscale,
    xWrTimezone,
}: {
    components: VcalCalendarComponentOrError[];
    method: ICAL_METHOD;
    formatOptions?: FormatOptions;
    calscale?: string;
    xWrTimezone?: string;
}) => {
    if (calscale && calscale.toLowerCase() !== 'gregorian') {
        return [new ImportEventError(IMPORT_EVENT_ERROR_TYPE.NON_GREGORIAN, 'vcalendar', '')];
    }
    const hasXWrTimezone = !!xWrTimezone;
    const calendarTzid = xWrTimezone ? getSupportedTimezone(xWrTimezone) : undefined;
    const guessTzid = extractGuessTzid(components);
    const supportedEvents = await Promise.all(
        components.map(async (vcalComponent) => {
            try {
                const supportedEvent = await extractSupportedEvent({
                    method,
                    vcalComponent,
                    calendarTzid,
                    hasXWrTimezone,
                    formatOptions,
                    guessTzid,
                });
                return supportedEvent;
            } catch (e: any) {
                if (e instanceof ImportEventError && e.type === IMPORT_EVENT_ERROR_TYPE.TIMEZONE_IGNORE) {
                    return;
                }

                return e;
            }
        })
    );
    return supportedEvents.filter(isTruthy);
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

// Separate errors that we want to hide
export const splitHiddenErrors = (errors: ImportEventError[]) => {
    return errors.reduce<{ hidden: ImportEventError[]; visible: ImportEventError[] }>(
        (acc, error) => {
            if (error.type === IMPORT_EVENT_ERROR_TYPE.NO_OCCURRENCES) {
                // Importing an event without occurrences is the same as not importing it
                acc.hidden.push(error);
            } else {
                acc.visible.push(error);
            }
            return acc;
        },
        { hidden: [], visible: [] }
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
    calendarId,
    api,
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
        const componentId = getComponentIdentifier(event);
        if (!mapParentEvents[uid]) {
            return new ImportEventError(IMPORT_EVENT_ERROR_TYPE.PARENT_EVENT_MISSING, 'vevent', componentId);
        }
        const parentEvent = mapParentEvents[uid] as VcalVeventComponent;
        if (!parentEvent.rrule) {
            return new ImportEventError(IMPORT_EVENT_ERROR_TYPE.SINGLE_EDIT_UNSUPPORTED, 'vevent', componentId);
        }
        const recurrenceId = event['recurrence-id'];
        try {
            const parentDtstart = parentEvent.dtstart;
            const supportedRecurrenceId = getLinkedDateTimeProperty({
                property: recurrenceId,
                component: 'vevent',
                isAllDay: getIsPropertyAllDay(parentDtstart),
                tzid: getPropertyTzid(parentDtstart),
                componentId,
            });
            return { ...event, 'recurrence-id': supportedRecurrenceId };
        } catch (e: any) {
            if (e instanceof ImportEventError) {
                return e;
            }
            return new ImportEventError(IMPORT_EVENT_ERROR_TYPE.VALIDATION_ERROR, 'vevent', componentId);
        }
    });
};

export const extractTotals = (model: ImportCalendarModel) => {
    const { eventsParsed, totalEncrypted, totalImported, visibleErrors, hiddenErrors } = model;
    const totalToImport = eventsParsed.length + hiddenErrors.length;
    const totalToProcess = 2 * totalToImport; // count encryption and submission equivalently for the progress
    const totalEncryptedFake = totalEncrypted + hiddenErrors.length;
    const totalImportedFake = totalImported + hiddenErrors.length;
    const totalVisibleErrors = visibleErrors.length;
    const totalProcessed = totalEncryptedFake + totalImportedFake + totalVisibleErrors;
    return {
        totalToImport,
        totalToProcess,
        totalImported: totalImportedFake,
        totalProcessed,
    };
};

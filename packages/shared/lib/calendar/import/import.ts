import { c } from 'ttag';

import { serverTime } from '@proton/crypto';
import isTruthy from '@proton/utils/isTruthy';
import truncate from '@proton/utils/truncate';
import unique from '@proton/utils/unique';

import { getEventByUID } from '../../api/calendars';
import formatUTC, { Options as FormatOptions } from '../../date-fns-utc/format';
import { getSupportedTimezone, toUTCDate } from '../../date/timezone';
import { readFileAsString } from '../../helpers/file';
import { dateLocale } from '../../i18n';
import { Api, SimpleMap } from '../../interfaces';
import {
    CalendarEvent,
    ImportCalendarModel,
    ImportedEvent,
    VcalCalendarComponentWithMaybeErrors,
    VcalErrorComponent,
    VcalVcalendarWithMaybeErrors,
    VcalVeventComponent,
    VcalVtimezoneComponent,
} from '../../interfaces/calendar';
import { ICAL_METHOD, IMPORT_ERROR_TYPE, MAX_CALENDARS_PAID, MAX_IMPORT_EVENTS } from '../constants';
import getComponentFromCalendarEvent from '../getComponentFromCalendarEvent';
import { generateVeventHashUID, getOriginalUID } from '../helper';
import { IMPORT_EVENT_ERROR_TYPE, ImportEventError } from '../icsSurgery/ImportEventError';
import { getSupportedCalscale } from '../icsSurgery/vcal';
import { getLinkedDateTimeProperty, getSupportedEvent, withSupportedDtstamp } from '../icsSurgery/vevent';
import { getVeventWithoutErrors, parseWithRecoveryAndMaybeErrors, serialize } from '../vcal';
import {
    getHasDtStart,
    getHasRecurrenceId,
    getIcalMethod,
    getIsEventComponent,
    getIsFreebusyComponent,
    getIsJournalComponent,
    getIsPropertyAllDay,
    getIsTimezoneComponent,
    getIsTodoComponent,
    getIsVcalErrorComponent,
    getPropertyTzid,
} from '../vcalHelper';
import { ImportFileError } from './ImportFileError';

export const parseIcs = async (ics: File) => {
    const filename = ics.name;
    try {
        const icsAsString = await readFileAsString(ics);
        if (!icsAsString) {
            throw new ImportFileError(IMPORT_ERROR_TYPE.FILE_EMPTY, filename);
        }
        const parsedVcalendar = parseWithRecoveryAndMaybeErrors(icsAsString) as VcalVcalendarWithMaybeErrors;
        if (parsedVcalendar.component?.toLowerCase() !== 'vcalendar') {
            throw new ImportFileError(IMPORT_ERROR_TYPE.INVALID_CALENDAR, filename);
        }
        const { method, components, calscale, 'x-wr-timezone': xWrTimezone } = parsedVcalendar;
        const supportedCalscale = getSupportedCalscale(calscale);
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
        return { components, calscale: supportedCalscale, xWrTimezone: xWrTimezone?.value, method: supportedMethod };
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
    vcalComponent: VcalCalendarComponentWithMaybeErrors | VcalErrorComponent,
    options: FormatOptions = { locale: dateLocale }
) => {
    if (getIsVcalErrorComponent(vcalComponent)) {
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

const extractGuessTzid = (components: (VcalCalendarComponentWithMaybeErrors | VcalErrorComponent)[]) => {
    const vtimezones = components.filter((componentOrError): componentOrError is VcalVtimezoneComponent => {
        if (getIsVcalErrorComponent(componentOrError)) {
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

interface ExtractSupportedEventArgs {
    method: ICAL_METHOD;
    vcalComponent: VcalCalendarComponentWithMaybeErrors | VcalErrorComponent;
    hasXWrTimezone: boolean;
    formatOptions?: FormatOptions;
    calendarTzid?: string;
    guessTzid: string;
}
export const extractSupportedEvent = async ({
    method,
    vcalComponent: vcalComponentWithMaybeErrors,
    hasXWrTimezone,
    formatOptions,
    calendarTzid,
    guessTzid,
}: ExtractSupportedEventArgs) => {
    const componentId = getComponentIdentifier(vcalComponentWithMaybeErrors, formatOptions);
    const isInvitation = method !== ICAL_METHOD.PUBLISH;
    if (getIsVcalErrorComponent(vcalComponentWithMaybeErrors)) {
        throw new ImportEventError(
            IMPORT_EVENT_ERROR_TYPE.EXTERNAL_ERROR,
            '',
            componentId,
            vcalComponentWithMaybeErrors.error
        );
    }
    if (getIsTodoComponent(vcalComponentWithMaybeErrors)) {
        throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.TODO_FORMAT, 'vtodo', componentId);
    }
    if (getIsJournalComponent(vcalComponentWithMaybeErrors)) {
        throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.JOURNAL_FORMAT, 'vjournal', componentId);
    }
    if (getIsFreebusyComponent(vcalComponentWithMaybeErrors)) {
        throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.FREEBUSY_FORMAT, 'vfreebusy', componentId);
    }
    if (getIsTimezoneComponent(vcalComponentWithMaybeErrors)) {
        if (!getSupportedTimezone(vcalComponentWithMaybeErrors.tzid.value)) {
            throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.TIMEZONE_FORMAT, 'vtimezone', componentId);
        }
        throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.TIMEZONE_IGNORE, 'vtimezone', componentId);
    }
    if (!getIsEventComponent(vcalComponentWithMaybeErrors)) {
        throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.WRONG_FORMAT, 'vunknown', componentId);
    }
    const vcalComponent = getVeventWithoutErrors(vcalComponentWithMaybeErrors);
    if (!getHasDtStart(vcalComponent)) {
        throw new ImportEventError(IMPORT_EVENT_ERROR_TYPE.DTSTART_MISSING, 'vevent', componentId);
    }
    const validVevent = withSupportedDtstamp(vcalComponent, +serverTime());
    const generateHashUid = !validVevent.uid?.value || isInvitation;

    if (generateHashUid) {
        validVevent.uid = {
            value: await generateVeventHashUID(serialize(vcalComponent), vcalComponent?.uid?.value),
        };
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
    primaryTimezone,
}: {
    components: (VcalCalendarComponentWithMaybeErrors | VcalErrorComponent)[];
    method: ICAL_METHOD;
    formatOptions?: FormatOptions;
    calscale?: string;
    xWrTimezone?: string;
    primaryTimezone: string;
}) => {
    if (calscale?.toLowerCase() !== 'gregorian') {
        return [new ImportEventError(IMPORT_EVENT_ERROR_TYPE.NON_GREGORIAN, 'vcalendar', '')];
    }
    const hasXWrTimezone = !!xWrTimezone;
    const calendarTzid = xWrTimezone ? getSupportedTimezone(xWrTimezone) : undefined;
    const guessTzid = extractGuessTzid(components) || primaryTimezone;
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
                PageSize: MAX_CALENDARS_PAID,
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
        return {
            vcalComponent: parentComponent,
            calendarEvent: parentEvent,
        };
    } catch {
        return undefined;
    }
};

interface GetSupportedEventsWithRecurrenceIdArgs {
    eventsWithRecurrenceId: (VcalVeventComponent & Required<Pick<VcalVeventComponent, 'recurrence-id'>>)[];
    parentEvents: ImportedEvent[];
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
    const mapParentEvents = parentEvents.reduce<
        SimpleMap<{
            vcalComponent: VcalVeventComponent;
            calendarEvent: CalendarEvent;
        }>
    >((acc, event) => {
        acc[event.component.uid.value] = {
            vcalComponent: event.component,
            calendarEvent: event.response.Response.Event,
        };

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
        const parentEvent = mapParentEvents[uid];
        if (!parentEvent) {
            return new ImportEventError(IMPORT_EVENT_ERROR_TYPE.PARENT_EVENT_MISSING, 'vevent', componentId);
        }
        const parentComponent = parentEvent.vcalComponent;
        if (!parentComponent.rrule) {
            return new ImportEventError(IMPORT_EVENT_ERROR_TYPE.SINGLE_EDIT_UNSUPPORTED, 'vevent', componentId);
        }
        const recurrenceId = event['recurrence-id'];
        try {
            const parentDtstart = parentComponent.dtstart;
            const supportedRecurrenceId = getLinkedDateTimeProperty({
                property: recurrenceId,
                component: 'vevent',
                linkedIsAllDay: getIsPropertyAllDay(parentDtstart),
                linkedTzid: getPropertyTzid(parentDtstart),
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

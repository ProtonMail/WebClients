import { parseWithErrors } from 'proton-shared/lib/calendar/vcal';
import {
    getDateProperty,
    getDateTimeProperty,
    getPropertyTzid,
    isIcalPropertyAllDay,
    propertyToUTCDate,
} from 'proton-shared/lib/calendar/vcalConverter';
import { addDays } from 'proton-shared/lib/date-fns-utc';
import { fromUTCDate, getSupportedTimezone, toLocalDate } from 'proton-shared/lib/date/timezone';
import { readFileAsString } from 'proton-shared/lib/helpers/file';
import { truncate } from 'proton-shared/lib/helpers/string';
import {
    VcalCalendarComponent,
    VcalDateOrDateTimeProperty,
    VcalDateTimeProperty,
    VcalFloatingDateTimeProperty,
    VcalUidProperty,
    VcalValarmComponent,
    VcalVcalendar,
    VcalVeventComponent,
} from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { c } from 'ttag';
import { IMPORT_EVENT_TYPE, ImportEventError } from '../components/import/ImportEventError';
import { ImportEventGeneralError } from '../components/import/ImportEventGeneralError';
import { IMPORT_ERROR_TYPE, ImportFileError } from '../components/import/ImportFileError';

import {
    MAX_IMPORT_EVENTS,
    MAX_LENGTHS,
    MAX_NOTIFICATIONS,
    MAX_UID_CHARS_DISPLAY,
    MAXIMUM_DATE_UTC,
    MINIMUM_DATE_UTC,
    NOTIFICATION_UNITS,
    NOTIFICATION_UNITS_MAX,
} from '../constants';
import { VcalCalendarComponentOrError } from '../interfaces/Import';

import {
    getIsEventComponent,
    getIsFreebusyComponent,
    getIsJournalComponent,
    getIsTimezoneComponent,
    getIsTodoComponent,
} from './event';
import { getIsRruleConsistent, getIsRruleSupported } from './rrule';

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
        const parsedVcalendar = parseWithErrors(icsAsString) as VcalVcalendar;
        if (parsedVcalendar.component !== 'vcalendar') {
            throw new ImportFileError(IMPORT_ERROR_TYPE.INVALID_CALENDAR, filename);
        }
        const { components, calscale, 'x-wr-timezone': xWrTimezone } = parsedVcalendar;
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
const getIdMessage = (vcalComponent: VcalCalendarComponent) => {
    if (getIsTimezoneComponent(vcalComponent)) {
        const tzid = vcalComponent.tzid ? vcalComponent.tzid[0].value : '';
        return c('Error importing event').t`Timezone ${tzid}`;
    }
    const shortUID = truncate(vcalComponent.uid?.value, MAX_UID_CHARS_DISPLAY);
    if (getIsEventComponent(vcalComponent)) {
        if (shortUID) {
            return c('Error importing event').t`Event ${shortUID}`;
        }
        const { summary, dtstart } = vcalComponent;
        const shortTitle = truncate(summary?.value);
        if (shortTitle) {
            return c('Error importing event').t`Event ${shortTitle}`;
        }
        if (dtstart?.value) {
            const startDate = toLocalDate(dtstart.value);
            return c('Error importing event').t`Event starting on ${startDate}`;
        }
        return c('Error importing event').t`Event with no UID, title or start time`;
    }
    if (getIsTodoComponent(vcalComponent) && shortUID) {
        return c('Error importing event').t`Todo ${shortUID}`;
    }
    if (getIsJournalComponent(vcalComponent) && shortUID) {
        return c('Error importing event').t`Journal ${shortUID}`;
    }
    if (getIsFreebusyComponent(vcalComponent) && shortUID) {
        return c('Error importing event').t`Free-busy ${shortUID}`;
    }
    // give up
    return '';
};

const getSupportedUID = (uid: VcalUidProperty) => {
    // The API does not accept UIDs longer than 191 characters
    const uidLength = uid.value.length;
    const croppedUID = uid.value.substring(uidLength - MAX_LENGTHS.UID, uidLength);
    return { value: croppedUID };
};

interface GetSupportedDateOrDateTimePropertyArgs {
    property: VcalDateOrDateTimeProperty | VcalFloatingDateTimeProperty;
    component: string;
    idMessage: string;
    hasXWrTimezone: boolean;
    calendarTzid?: string;
}
const getSupportedDateOrDateTimeProperty = ({
    property,
    component,
    idMessage,
    hasXWrTimezone,
    calendarTzid,
}: GetSupportedDateOrDateTimePropertyArgs) => {
    if (isIcalPropertyAllDay(property)) {
        return getDateProperty(property.value);
    }

    const partDayProperty = property;
    const partDayPropertyTzid = getPropertyTzid(property);

    // A floating date-time property
    if (!partDayPropertyTzid) {
        if (!hasXWrTimezone) {
            throw new ImportEventError(IMPORT_EVENT_TYPE.FLOATING_TIME, 'vevent', idMessage);
        }
        if (hasXWrTimezone && !calendarTzid) {
            throw new ImportEventError(IMPORT_EVENT_TYPE.X_WR_TIMEZONE_UNSUPPORTED, 'vevent', idMessage);
        }
        return getDateTimeProperty(partDayProperty.value, calendarTzid);
    }

    const supportedTzid = getSupportedTimezone(partDayPropertyTzid);
    if (!supportedTzid) {
        throw new ImportEventError(IMPORT_EVENT_TYPE.TZID_UNSUPPORTED, component, idMessage);
    }
    return getDateTimeProperty(partDayProperty.value, supportedTzid);
};

const getIsWellFormedDateTime = (property: VcalDateTimeProperty) => {
    return property.value.isUTC || !!property.parameters!.tzid;
};

const getIsWellFormedDateOrDateTime = (property: VcalDateOrDateTimeProperty) => {
    return isIcalPropertyAllDay(property) || getIsWellFormedDateTime(property);
};

const getIsValidAlarm = (alarm: VcalValarmComponent) => {
    if (!alarm.trigger?.value) {
        return true;
    }
    const {
        trigger: {
            value: { minutes, hours, days, weeks },
        },
    } = alarm;
    if (minutes > NOTIFICATION_UNITS_MAX[NOTIFICATION_UNITS.MINUTES]) {
        return false;
    }
    if (hours > NOTIFICATION_UNITS_MAX[NOTIFICATION_UNITS.HOURS]) {
        return false;
    }
    if (days > NOTIFICATION_UNITS_MAX[NOTIFICATION_UNITS.DAY]) {
        return false;
    }
    if (weeks > NOTIFICATION_UNITS_MAX[NOTIFICATION_UNITS.WEEK]) {
        return false;
    }
    return true;
};

const getIsDateOutOfBounds = (property: VcalDateOrDateTimeProperty) => {
    const dateUTC: Date = propertyToUTCDate(property);
    return +dateUTC < +MINIMUM_DATE_UTC || +dateUTC > +MAXIMUM_DATE_UTC;
};

const getHasUid = (
    vevent: VcalVeventComponent
): vevent is VcalVeventComponent & Required<Pick<VcalVeventComponent, 'uid'>> => {
    return !!vevent.uid?.value;
};

const getHasDtStart = (
    vevent: VcalVeventComponent
): vevent is VcalVeventComponent & Required<Pick<VcalVeventComponent, 'dtstart'>> => {
    return !!vevent.dtstart?.value;
};

const getHasDtEnd = (
    vevent: VcalVeventComponent
): vevent is VcalVeventComponent & Required<Pick<VcalVeventComponent, 'dtend'>> => {
    return !!vevent.dtend?.value;
};

const getEventWithRequiredProperties = (veventComponent: VcalVeventComponent, idMessage: string) => {
    if (!getHasUid(veventComponent)) {
        throw new ImportEventError(IMPORT_EVENT_TYPE.UID_MISSING, 'vevent', idMessage);
    }
    if (!getHasDtStart(veventComponent)) {
        throw new ImportEventError(IMPORT_EVENT_TYPE.DTSTART_MISSING, 'vevent', idMessage);
    }
    if (!getHasDtEnd(veventComponent)) {
        throw new ImportEventError(IMPORT_EVENT_TYPE.DTEND_MISSING, 'vevent', idMessage);
    }
    const { dtstamp } = veventComponent;
    return {
        ...veventComponent,
        dtstamp: dtstamp?.value ? { ...dtstamp } : { value: { ...fromUTCDate(new Date(Date.now())), isUTC: true } },
    };
};

interface GetSupportedEventArgs {
    vcalComponent: VcalCalendarComponent;
    hasXWrTimezone: boolean;
    calendarTzid?: string;
}
export const getSupportedEvent = ({ vcalComponent, hasXWrTimezone, calendarTzid }: GetSupportedEventArgs) => {
    const idMessage = getIdMessage(vcalComponent);
    if (getIsTodoComponent(vcalComponent)) {
        throw new ImportEventError(IMPORT_EVENT_TYPE.TODO_FORMAT, 'vtodo', idMessage);
    }
    if (getIsJournalComponent(vcalComponent)) {
        throw new ImportEventError(IMPORT_EVENT_TYPE.JOURNAL_FORMAT, 'vjournal', idMessage);
    }
    if (getIsFreebusyComponent(vcalComponent)) {
        throw new ImportEventError(IMPORT_EVENT_TYPE.FREEBUSY_FORMAT, 'vfreebusy', idMessage);
    }
    if (getIsTimezoneComponent(vcalComponent)) {
        throw new ImportEventError(IMPORT_EVENT_TYPE.TIMEZONE_FORMAT, 'vtimezone', idMessage);
    }
    const vevent = getEventWithRequiredProperties(vcalComponent, idMessage);
    try {
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
            'recurrence-id': recurrenceId,
        } = vevent;
        const trimmedSummaryValue = summary?.value.trim();
        const trimmedDescriptionValue = description?.value.trim();
        const trimmedLocationValue = location?.value.trim();

        const validated: VcalVeventComponent &
            Required<Pick<VcalVeventComponent, 'uid' | 'dtstamp' | 'dtstart' | 'dtend'>> = {
            component,
            uid: getSupportedUID(uid),
            dtstamp: { ...dtstamp },
            dtstart: { ...dtstart },
            dtend: { ...dtend },
        };

        if (exdate) {
            validated.exdate = [...exdate];
        }
        if (recurrenceId) {
            validated['recurrence-id'] = recurrenceId;
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

        const isAllDayStart = isIcalPropertyAllDay(validated.dtstart);
        const isAllDayEnd = isIcalPropertyAllDay(validated.dtend);
        if (+isAllDayStart ^ +isAllDayEnd) {
            throw new ImportEventError(IMPORT_EVENT_TYPE.ALLDAY_INCONSISTENCY, 'vevent', idMessage);
        }
        validated.dtstart = getSupportedDateOrDateTimeProperty({
            property: validated.dtstart,
            component: 'vevent',
            idMessage,
            hasXWrTimezone,
            calendarTzid,
        });
        if (!getIsWellFormedDateOrDateTime(validated.dtstart)) {
            throw new ImportEventError(IMPORT_EVENT_TYPE.DTSTART_MALFORMED, 'vevent', idMessage);
        }
        if (getIsDateOutOfBounds(validated.dtstart)) {
            throw new ImportEventError(IMPORT_EVENT_TYPE.DTSTART_OUT_OF_BOUNDS, 'vevent', idMessage);
        }
        validated.dtend = getSupportedDateOrDateTimeProperty({
            property: validated.dtend,
            component: 'vevent',
            idMessage,
            hasXWrTimezone,
            calendarTzid,
        });
        if (!getIsWellFormedDateOrDateTime(validated.dtend)) {
            throw new ImportEventError(IMPORT_EVENT_TYPE.DTEND_MALFORMED, 'vevent', idMessage);
        }
        if (getIsDateOutOfBounds(validated.dtend)) {
            throw new ImportEventError(IMPORT_EVENT_TYPE.DTEND_OUT_OF_BOUNDS, 'vevent', idMessage);
        }
        const startDateUTC = propertyToUTCDate(validated.dtstart);
        const endDateUTC = propertyToUTCDate(validated.dtend);
        const modifiedEndDateUTC = isAllDayEnd ? addDays(endDateUTC, -1) : endDateUTC;
        if (+startDateUTC > +modifiedEndDateUTC) {
            throw new ImportEventError(IMPORT_EVENT_TYPE.NEGATIVE_DURATION, 'vevent', idMessage);
        }

        if (rrule) {
            if (dtend && !getIsRruleConsistent(vevent)) {
                throw new ImportEventError(IMPORT_EVENT_TYPE.RRULE_INCONSISTENT, 'vevent', idMessage);
            }
            if (!getIsRruleSupported(rrule.value)) {
                throw new ImportEventError(IMPORT_EVENT_TYPE.RRULE_UNSUPPORTED, 'vevent', idMessage);
            }
            validated.rrule = rrule;
        }

        const alarms = components?.filter(({ component }) => component === 'valarm').slice(0, MAX_NOTIFICATIONS);
        if (alarms?.length) {
            if (alarms?.some((alarm) => !getIsValidAlarm(alarm))) {
                throw new ImportEventError(IMPORT_EVENT_TYPE.NOTIFICATION_OUT_OF_BOUNDS, 'vevent', idMessage);
            }
            validated.components = alarms;
        }

        return validated;
    } catch (e) {
        if (e instanceof ImportEventError) {
            throw e;
        }
        throw new ImportEventError(IMPORT_EVENT_TYPE.VALIDATION_ERROR, 'vevent', idMessage);
    }
};

interface FilterArgs {
    components: VcalCalendarComponentOrError[];
    calscale?: string;
    xWrTimezone?: string;
}
export const filterNonSupported = ({ components, calscale, xWrTimezone }: FilterArgs) => {
    if (calscale && calscale.toLowerCase() !== 'gregorian') {
        return {
            events: [],
            discarded: [new ImportEventError(IMPORT_EVENT_TYPE.NON_GREGORIAN, '', '')],
        };
    }
    const hasXWrTimezone = !!xWrTimezone;
    const calendarTzid = xWrTimezone ? getSupportedTimezone(xWrTimezone) : undefined;
    return components.reduce<{ events: VcalVeventComponent[]; discarded: ImportEventError[] }>(
        (acc, vcalComponent) => {
            if (getParsedComponentHasError(vcalComponent)) {
                const idMessage = c('Error importing event').t`Bad format. Component cannot be read`;
                acc.discarded.push(new ImportEventGeneralError(vcalComponent.error, '', idMessage));
                return acc;
            }
            try {
                acc.events.push(getSupportedEvent({ vcalComponent, calendarTzid, hasXWrTimezone }));
            } catch (e) {
                acc.discarded.push(e);
            }
            return acc;
        },
        { events: [], discarded: [] }
    );
};

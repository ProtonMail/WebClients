import { getOccurrences } from 'proton-shared/lib/calendar/recurring';
import { parse } from 'proton-shared/lib/calendar/vcal';
import { isIcalPropertyAllDay, propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import { getSupportedTimezone, toLocalDate, toUTCDate } from 'proton-shared/lib/date/timezone';
import { readFileAsString } from 'proton-shared/lib/helpers/file';
import { truncate } from 'proton-shared/lib/helpers/string';
import { c } from 'ttag';

import {
    FREQUENCY_COUNT_MAX,
    FREQUENCY_INTERVALS_MAX,
    MAX_IMPORT_EVENTS,
    MAX_LENGTHS,
    MAX_NOTIFICATIONS,
    MAX_UID_CHARS_DISPLAY,
    MAXIMUM_DATE,
    MAXIMUM_DATE_UTC,
    MINIMUM_DATE_UTC,
    NOTIFICATION_UNITS,
    NOTIFICATION_UNITS_MAX
} from '../constants';
import { withRruleWkst } from '../containers/calendar/eventActions/rruleWkst';
import { WeekStartsOn } from '../containers/calendar/interface';
import { EventFailure, IMPORT_ERROR_TYPE, ImportFailure } from '../interfaces/Import';
import {
    VcalCalendarComponent,
    VcalDateOrDateTimeProperty,
    VcalDateTimeProperty,
    VcalRrulePropertyValue,
    VcalValarmComponent,
    VcalVcalendar,
    VcalVeventComponent
} from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { getIsFreebusyComponent, getIsJournalComponent, getIsTodoComponent, getIsVeventComponent } from './event';

const SUPPORTED_RRULE_PROPERTIES: (keyof VcalRrulePropertyValue)[] = [
    'freq',
    'count',
    'interval',
    'until',
    'wkst',
    'bysetpos',
    'byday',
    'bymonthday',
    'bymonth'
];
const SUPPORTED_RRULE_PROPERTIES_DAILY: (keyof VcalRrulePropertyValue)[] = ['freq', 'count', 'interval', 'until'];
const SUPPORTED_RRULE_PROPERTIES_WEEKLY: (keyof VcalRrulePropertyValue)[] = [
    'freq',
    'count',
    'interval',
    'until',
    'wkst',
    'byday'
];
const SUPPORTED_RRULE_PROPERTIES_MONTHLY: (keyof VcalRrulePropertyValue)[] = [
    'freq',
    'count',
    'interval',
    'until',
    'wkst',
    'bymonthday',
    'byday',
    'bysetpos'
];
const ALLOWED_BYSETPOS = [-1, 1, 2, 3, 4];
const SUPPORTED_RRULE_PROPERTIES_YEARLY: (keyof VcalRrulePropertyValue)[] = [
    'freq',
    'count',
    'interval',
    'until',
    'wkst',
    'bymonthday',
    'bymonth'
];

export const parseIcs = async (
    ics: File
): Promise<{
    components: VcalCalendarComponent[];
    calscale?: string;
    failure?: ImportFailure;
}> => {
    try {
        const icsAsString = await readFileAsString(ics);
        if (!icsAsString) {
            return { failure: { type: IMPORT_ERROR_TYPE.FILE_EMPTY }, components: [] };
        }
        const parsedVcalendar = parse(icsAsString) as VcalVcalendar;
        if (parsedVcalendar.component !== 'vcalendar') {
            return { failure: { type: IMPORT_ERROR_TYPE.INVALID_CALENDAR }, components: [] };
        }
        const calscale = parsedVcalendar.calscale ? parsedVcalendar.calscale[0].value : undefined;
        const components = parsedVcalendar.components;
        if (!components?.length) {
            return { failure: { type: IMPORT_ERROR_TYPE.NO_EVENTS }, components: [] };
        }
        if (components.length > MAX_IMPORT_EVENTS) {
            return { failure: { type: IMPORT_ERROR_TYPE.TOO_MANY_EVENTS }, components: [] };
        }
        return { components, calscale };
    } catch (error) {
        console.error(error);
        return { failure: { type: IMPORT_ERROR_TYPE.FILE_CORRUPTED, error }, components: [] };
    }
};

const getIsWellFormedDateTime = (property: VcalDateTimeProperty) => {
    return property.value.isUTC || !!property.parameters!.tzid;
};

const getIsRruleConsistent = (
    rrule: VcalRrulePropertyValue,
    dtstart: VcalDateOrDateTimeProperty,
    dtend: VcalDateOrDateTimeProperty
) => {
    const component = ({
        dtstart,
        dtend,
        rrule: { value: rrule }
    } as unknown) as VcalVeventComponent;
    const [first] = getOccurrences({ component, maxCount: 1 });
    if (!first) {
        return false;
    }
    if (+first.localStart !== +toUTCDate(component.dtstart.value)) {
        return false;
    }
    return true;
};

const getIsRruleValid = (rruleProperty: VcalRrulePropertyValue) => {
    const rruleProperties = Object.keys(rruleProperty) as (keyof VcalRrulePropertyValue)[];
    if (rruleProperties.some((property) => !SUPPORTED_RRULE_PROPERTIES.includes(property))) {
        return false;
    }
    const { freq, interval = 1, count, until, bysetpos } = rruleProperty;
    if (count && count > FREQUENCY_COUNT_MAX) {
        return false;
    }
    if (until) {
        if ('isUTC' in until && until.isUTC) {
            if (+toUTCDate(until) > +MAXIMUM_DATE_UTC) {
                return false;
            }
        }
        if (+toLocalDate(until) > +MAXIMUM_DATE) {
            return false;
        }
    }
    if (freq === 'DAILY') {
        if (interval > FREQUENCY_INTERVALS_MAX[freq]) {
            return false;
        }
        if (rruleProperties.some((property) => !SUPPORTED_RRULE_PROPERTIES_DAILY.includes(property))) {
            return false;
        }
        return true;
    }
    if (freq === 'WEEKLY') {
        if (interval > FREQUENCY_INTERVALS_MAX[freq]) {
            return false;
        }
        if (rruleProperties.some((property) => !SUPPORTED_RRULE_PROPERTIES_WEEKLY.includes(property))) {
            return false;
        }
        return true;
    }
    if (freq === 'MONTHLY') {
        if (interval > FREQUENCY_INTERVALS_MAX[freq]) {
            return false;
        }
        if (rruleProperties.some((property) => !SUPPORTED_RRULE_PROPERTIES_MONTHLY.includes(property))) {
            return false;
        }
        if (bysetpos && !ALLOWED_BYSETPOS.includes(bysetpos)) {
            return false;
        }
        // byday and bysetpos must both be absent or both present. If they are present, bymonthday should not be present
        if (+rruleProperties.includes('byday') ^ +rruleProperties.includes('bysetpos')) {
            return false;
        }
        if (rruleProperties.includes('bymonthday')) {
            return !rruleProperties.includes('byday') && !rruleProperties.includes('bysetpos');
        }
        return true;
    }
    if (freq === 'YEARLY') {
        if (interval > FREQUENCY_INTERVALS_MAX[freq]) {
            return false;
        }
        if (rruleProperties.some((property) => !SUPPORTED_RRULE_PROPERTIES_YEARLY.includes(property))) {
            return false;
        }
        // byday and bymonthday must both be absent or both present
        if (+rruleProperties.includes('byday') ^ +rruleProperties.includes('bymonthday')) {
            return false;
        }
        return true;
    }
    return false;
};

const getIsValidAlarm = (alarm: VcalValarmComponent) => {
    if (!alarm.trigger?.value) {
        return true;
    }
    const {
        trigger: {
            value: { minutes, hours, days, weeks }
        }
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

export const validateEvent = (
    veventComponent: VcalVeventComponent,
    wkst?: WeekStartsOn
): {
    event?: VcalVeventComponent;
    error?: string;
} => {
    try {
        const validated = {} as any;
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
            location
        } = veventComponent;
        validated.component = component;
        validated.uid = { ...uid };
        validated.dtstamp = { ...dtstamp };

        if (exdate) {
            validated.exdate = { ...exdate };
        }
        if (summary) {
            validated.summary = {
                ...summary,
                value: truncate(summary.value, MAX_LENGTHS.TITLE)
            };
        }
        if (description) {
            validated.description = {
                ...description,
                value: truncate(description.value, MAX_LENGTHS.EVENT_DESCRIPTION)
            };
        }
        if (location) {
            validated.location = {
                ...location,
                value: truncate(location.value, MAX_LENGTHS.LOCATION)
            };
        }

        validated.dtstart = { ...dtstart };
        if (!isIcalPropertyAllDay(dtstart)) {
            if (!getIsWellFormedDateTime(dtstart)) {
                return { error: c('Error importing event').t`Malformed start time` };
            }
            if (dtstart.parameters?.tzid) {
                const timezone = getSupportedTimezone(dtstart.parameters.tzid);
                if (!timezone) {
                    return { error: c('Error importing event').t`Unsupported timezone` };
                }
                validated.dtstart.parameters.tzid = timezone;
            }
        }
        if (getIsDateOutOfBounds(dtstart)) {
            return { error: c('Error importing event').t`Start time out of bounds` };
        }

        // TODO create dtend
        if (!dtend) {
            return { error: c('Error importing event').t`Missing end time` };
        }
        validated.dtend = { ...dtend };
        if (!isIcalPropertyAllDay(dtend)) {
            if (!getIsWellFormedDateTime(dtend)) {
                return { error: c('Error importing event').t`Malformed end time` };
            }
            if (dtend.parameters?.tzid) {
                const timezone = getSupportedTimezone(dtend.parameters.tzid);
                if (!timezone) {
                    return { error: c('Error importing event').t`Unsupported timezone` };
                }
                validated.dtend.parameters.tzid = timezone;
            }
        }
        const startDateUTC = propertyToUTCDate(dtstart);
        const endDateUTC = propertyToUTCDate(dtend);
        if (+startDateUTC > +endDateUTC) {
            return { error: c('Error importing event').t`Negative duration` };
        }
        // TODO cf. create dtend
        if (dtend && getIsDateOutOfBounds(dtend)) {
            return { error: c('Error importing event').t`End time out of bounds` };
        }

        // TODO cf. create dtend
        if (rrule) {
            if (dtend && !getIsRruleConsistent(rrule.value, dtstart, dtend)) {
                return { error: c('Error importing event').t`Recurring rule inconsistent` };
            }
            if (!getIsRruleValid(rrule.value)) {
                return { error: c('Error importing event').t`Recurring rule not supported` };
            }
            validated.rrule = withRruleWkst(rrule, wkst);
        }

        const alarms = components?.filter(({ component }) => component === 'valarm').slice(0, MAX_NOTIFICATIONS);
        if (alarms?.length) {
            if (alarms?.some((alarm) => !getIsValidAlarm(alarm))) {
                return { error: c('Error importing event').t`Notification out of bounds` };
            }
            validated.components = alarms;
        }

        return { event: validated };
    } catch (e) {
        console.log(e);
        return { error: c('Error importing event').t`Event validation failed` };
    }
};

export const filterNonSupported = ({
    components,
    calscale,
    wkst
}: {
    components: VcalCalendarComponent[];
    calscale?: string;
    wkst: WeekStartsOn;
}) => {
    if (calscale && calscale.toLowerCase() !== 'gregorian') {
        return {
            events: [],
            discarded: [{ idMessage: '', errorMessage: c('Error importing event').t`Non-Gregorian calendar` }]
        };
    }
    return components.reduce<{ events: VcalVeventComponent[]; discarded: EventFailure[] }>(
        (acc, vcalComponent) => {
            const { uid } = vcalComponent;
            const shortUID = truncate(uid?.value, MAX_UID_CHARS_DISPLAY);
            if (getIsTodoComponent(vcalComponent)) {
                acc.discarded.push({
                    idMessage: c('Error importing event').t`Todo ${shortUID}`,
                    errorMessage: c('Error importing event').t`Todo format`
                });
                return acc;
            }
            if (getIsJournalComponent(vcalComponent)) {
                acc.discarded.push({
                    idMessage: c('Error importing event').t`Journal ${shortUID}`,
                    errorMessage: c('Error importing event').t`Journal format`
                });
                return acc;
            }
            if (getIsFreebusyComponent(vcalComponent)) {
                acc.discarded.push({
                    idMessage: c('Error importing event').t`Free-busy ${shortUID}`,
                    errorMessage: c('Error importing event').t`Free-busy format`
                });
                return acc;
            }
            // if (component.toLowerCase() === 'vtimezone') {
            //     acc.discarded.push({
            //         eventIdMessage: c('Error importing event').t`Timezone ${tzid?.value}`,
            //         errorMessage: c('Error importing event').t`Timezone format`
            //     })
            // }
            if (getIsVeventComponent(vcalComponent)) {
                const { event, error } = validateEvent(vcalComponent, wkst);
                if (!error && !!event) {
                    acc.events.push(event);
                } else {
                    acc.discarded.push({
                        idMessage: c('Error importing event').t`Event ${shortUID}`,
                        errorMessage: error || ''
                    });
                }
            }
            return acc;
        },
        { events: [], discarded: [] }
    );
};

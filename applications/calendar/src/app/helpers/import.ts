import { parse } from 'proton-shared/lib/calendar/vcal';
import { isIcalPropertyAllDay, propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import { getSupportedTimezone } from 'proton-shared/lib/date/timezone';
import { readFileAsString } from 'proton-shared/lib/helpers/file';
import { truncate } from 'proton-shared/lib/helpers/string';
import {
    VcalCalendarComponent,
    VcalDateOrDateTimeProperty,
    VcalDateTimeProperty,
    VcalValarmComponent,
    VcalVcalendar,
    VcalVeventComponent
} from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { c } from 'ttag';

import {
    MAX_IMPORT_EVENTS,
    MAX_LENGTHS,
    MAX_NOTIFICATIONS,
    MAX_UID_CHARS_DISPLAY,
    MAXIMUM_DATE_UTC,
    MINIMUM_DATE_UTC,
    NOTIFICATION_UNITS,
    NOTIFICATION_UNITS_MAX
} from '../constants';
import { EventFailure, IMPORT_ERROR_TYPE } from '../interfaces/Import';
import { getIsFreebusyComponent, getIsJournalComponent, getIsTodoComponent, getIsVeventComponent } from './event';
import { getIsRruleConsistent, getIsRruleSupported } from './rrule';
import { ImportFileError } from '../components/import/ImportFileError';

export const parseIcs = async (ics: File) => {
    const filename = ics.name;
    try {
        const icsAsString = await readFileAsString(ics);
        if (!icsAsString) {
            throw new ImportFileError(IMPORT_ERROR_TYPE.FILE_EMPTY, filename);
        }
        const parsedVcalendar = parse(icsAsString) as VcalVcalendar;
        if (parsedVcalendar.component !== 'vcalendar') {
            throw new ImportFileError(IMPORT_ERROR_TYPE.INVALID_CALENDAR, filename);
        }
        const calscale = parsedVcalendar.calscale ? parsedVcalendar.calscale[0].value : undefined;
        const components = parsedVcalendar.components;
        if (!components?.length) {
            throw new ImportFileError(IMPORT_ERROR_TYPE.NO_EVENTS, filename);
        }
        if (components.length > MAX_IMPORT_EVENTS) {
            throw new ImportFileError(IMPORT_ERROR_TYPE.TOO_MANY_EVENTS, filename);
        }
        return { components, calscale };
    } catch (e) {
        if (e instanceof ImportFileError) {
            throw e;
        }
        throw new ImportFileError(IMPORT_ERROR_TYPE.FILE_CORRUPTED, filename);
    }
};

const getIsWellFormedDateTime = (property: VcalDateTimeProperty) => {
    return property.value.isUTC || !!property.parameters!.tzid;
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
    veventComponent: VcalVeventComponent
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
            location,
            'recurrence-id': recurrenceId
        } = veventComponent;
        const trimmedSummaryValue = summary?.value.trim();
        const trimmedDescriptionValue = description?.value.trim();
        const trimmedLocationValue = location?.value.trim();

        validated.component = component;
        validated.uid = { ...uid };
        validated.dtstamp = { ...dtstamp };

        if (exdate) {
            validated.exdate = { ...exdate };
        }
        if (recurrenceId) {
            validated['recurrence-id'] = recurrenceId;
        }
        if (trimmedSummaryValue) {
            validated.summary = {
                ...summary,
                value: truncate(trimmedSummaryValue, MAX_LENGTHS.TITLE)
            };
        }
        if (trimmedDescriptionValue) {
            validated.description = {
                ...description,
                value: truncate(trimmedDescriptionValue, MAX_LENGTHS.EVENT_DESCRIPTION)
            };
        }
        if (trimmedLocationValue) {
            validated.location = {
                ...location,
                value: truncate(trimmedLocationValue, MAX_LENGTHS.LOCATION)
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
            if (dtend && !getIsRruleConsistent(veventComponent)) {
                return { error: c('Error importing event').t`Recurring rule inconsistent` };
            }
            if (!getIsRruleSupported(rrule.value)) {
                return { error: c('Error importing event').t`Recurring rule not supported` };
            }
            validated.rrule = rrule;
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
    calscale
}: {
    components: VcalCalendarComponent[];
    calscale?: string;
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
                const { event, error } = validateEvent(vcalComponent);
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

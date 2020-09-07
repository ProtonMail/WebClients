import { APPS_CONFIGURATION } from '../constants';
import { ProtonConfig } from '../interfaces';
import {
    VcalAttendeeProperty,
    VcalAttendeePropertyWithPartstat,
    VcalAttendeePropertyWithRole,
    VcalCalendarComponent,
    VcalDateOrDateTimeProperty,
    VcalDateOrDateTimeValue,
    VcalDateProperty,
    VcalDateTimeValue,
    VcalVcalendar,
    VcalVeventComponent,
    VcalVfreebusyComponent,
    VcalVjournalComponent,
    VcalVtimezoneComponent,
    VcalVtodoComponent,
    VcalXOrIanaComponent,
} from '../interfaces/calendar/VcalModel';

export const getIsPropertyAllDay = (property: VcalDateOrDateTimeProperty): property is VcalDateProperty => {
    return property.parameters?.type === 'date' ?? false;
};

export const getPropertyTzid = (property: VcalDateOrDateTimeProperty) => {
    if (getIsPropertyAllDay(property)) {
        return;
    }
    return property.value.isUTC ? 'UTC' : property.parameters?.tzid;
};

export const getIsAllDay = ({ dtstart }: Pick<VcalVeventComponent, 'dtstart'>) => {
    return getIsPropertyAllDay(dtstart);
};

export const getIsRecurring = ({ rrule }: Pick<VcalVeventComponent, 'rrule'>) => {
    return !!rrule;
};

export const getRecurrenceId = ({ 'recurrence-id': recurrenceId }: Pick<VcalVeventComponent, 'recurrence-id'>) => {
    return recurrenceId;
};

export const getIsDateTimeValue = (value: VcalDateOrDateTimeValue): value is VcalDateTimeValue => {
    return (value as VcalDateTimeValue).hours !== undefined;
};

export const getIsCalendar = (vcalComponent: VcalCalendarComponent): vcalComponent is VcalVcalendar => {
    return vcalComponent.component.toLowerCase() === 'vcalendar';
};

export const getIsEventComponent = (vcalComponent: VcalCalendarComponent): vcalComponent is VcalVeventComponent => {
    return vcalComponent.component.toLowerCase() === 'vevent';
};

export const getIsTodoComponent = (vcalComponent: VcalCalendarComponent): vcalComponent is VcalVtodoComponent => {
    return vcalComponent.component.toLowerCase() === 'vtodo';
};

export const getIsJournalComponent = (vcalComponent: VcalCalendarComponent): vcalComponent is VcalVjournalComponent => {
    return vcalComponent.component.toLowerCase() === 'vjournal';
};

export const getIsFreebusyComponent = (
    vcalComponent: VcalCalendarComponent
): vcalComponent is VcalVfreebusyComponent => {
    return vcalComponent.component.toLowerCase() === 'vfreebusy';
};

export const getIsTimezoneComponent = (
    vcalComponent: VcalCalendarComponent
): vcalComponent is VcalVtimezoneComponent => {
    return vcalComponent.component.toLowerCase() === 'vtimezone';
};

export const getIsAlarmComponent = (vcalComponent: VcalCalendarComponent): vcalComponent is VcalVtimezoneComponent => {
    return vcalComponent.component.toLowerCase() === 'valarm';
};

export const getIsXOrIanaComponent = (vcalComponent: VcalCalendarComponent): vcalComponent is VcalXOrIanaComponent => {
    const name = vcalComponent.component.toLowerCase();
    return !['vcalendar', 'vevent', 'vtodo', 'vjournal', 'vfreebusy', 'vtimezone'].includes(name);
};

export const getHasUid = (
    vevent: VcalVeventComponent
): vevent is VcalVeventComponent & Required<Pick<VcalVeventComponent, 'uid'>> => {
    return !!vevent.uid?.value;
};

export const getHasDtStart = (
    vevent: VcalVeventComponent
): vevent is VcalVeventComponent & Required<Pick<VcalVeventComponent, 'dtstart'>> => {
    return !!vevent.dtstart?.value;
};

export const getHasDtend = (
    vevent: VcalVeventComponent
): vevent is VcalVeventComponent & Required<Pick<VcalVeventComponent, 'dtend'>> => {
    return !!vevent.dtend;
};

export const getHasRecurrenceId = (
    vevent: VcalVeventComponent
): vevent is VcalVeventComponent & Required<Pick<VcalVeventComponent, 'recurrence-id'>> => {
    return !!vevent['recurrence-id'];
};

export const getHasAttendee = (
    vevent: VcalVeventComponent
): vevent is VcalVeventComponent & Required<Pick<VcalVeventComponent, 'attendee'>> => {
    return !!vevent.attendee;
};

export const getAttendeeHasPartStat = (
    attendee: VcalAttendeeProperty
): attendee is VcalAttendeePropertyWithPartstat => {
    return !!attendee.parameters?.partstat;
};

export const getAttendeeHasRole = (attendee: VcalAttendeeProperty): attendee is VcalAttendeePropertyWithRole => {
    return !!attendee.parameters?.role;
};

export const getProdId = (config: ProtonConfig) => {
    const { APP_NAME, APP_VERSION: appVersion } = config;
    const appName = APPS_CONFIGURATION[APP_NAME].name;

    return `-//Proton Technologies//${appName} ${appVersion}//EN`;
};

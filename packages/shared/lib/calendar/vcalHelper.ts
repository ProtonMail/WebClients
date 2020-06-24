import {
    VcalCalendarComponent,
    VcalDateOrDateTimeProperty,
    VcalDateOrDateTimeValue,
    VcalDateProperty,
    VcalDateTimeValue,
    VcalVeventComponent,
    VcalVfreebusyComponent,
    VcalVjournalComponent,
    VcalVtimezoneComponent,
    VcalVtodoComponent
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

export const getIsAllDay = ({ dtstart }: VcalVeventComponent) => {
    return getIsPropertyAllDay(dtstart);
};

export const getIsRecurring = ({ rrule }: VcalVeventComponent) => {
    return !!rrule;
};

export const getRecurrenceId = ({ 'recurrence-id': recurrenceId }: VcalVeventComponent) => {
    return recurrenceId;
};

export const getIsDateTimeValue = (value: VcalDateOrDateTimeValue): value is VcalDateTimeValue => {
    return (value as VcalDateTimeValue).hours !== undefined;
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

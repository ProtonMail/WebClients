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

export const getIsIcalPropertyAllDay = (property: VcalDateOrDateTimeProperty): property is VcalDateProperty => {
    return property.parameters?.type === 'date' ?? false;
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

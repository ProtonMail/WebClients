export enum VcalDays {
    SU,
    MO,
    TU,
    WE,
    TH,
    FR,
    SA
}

export type VcalDaysKeys = keyof typeof VcalDays;

export interface VcalDateValue {
    year: number;
    month: number;
    day: number;
}

export interface VcalDateTimeValue {
    year: number;
    month: number;
    day: number;
    hours: number;
    minutes: number;
    seconds: number;
    isUTC: boolean;
}

export type VcalDateOrDateTimeValue = VcalDateValue | VcalDateTimeValue;

export interface VcalDateTimeProperty {
    parameters?: {
        type?: 'date-time';
        tzid?: string;
    };
    value: VcalDateTimeValue;
}

export interface VcalDateProperty {
    parameters: {
        type: 'date';
    };
    value: VcalDateValue;
}

export interface VcalFloatingDateTimeProperty {
    parameters?: {
        type?: 'date-time';
    };
    value: VcalDateTimeValue;
}

export type VcalDateOrDateTimeProperty = VcalDateProperty | VcalDateTimeProperty;

export type VcalRruleFreqValue = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | undefined | string;
export interface VcalRrulePropertyValue {
    freq: VcalRruleFreqValue;
    count?: number;
    interval?: number;
    until?: VcalDateOrDateTimeValue;
    bysetpos?: number | number[];
    byday?: string | string[];
    bymonthday?: number | number[];
    bymonth?: number | number[];
    bysecond?: number | number[];
    byminute?: number | number[];
    byhour?: number | number[];
    byyearday?: number | number[];
    byweekno?: number | number[];
    wkst?: VcalDaysKeys;
}

export interface VcalRruleProperty {
    value: VcalRrulePropertyValue;
}

export interface VcalTriggerValue {
    weeks: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isNegative: boolean;
}

export interface VcalUidProperty {
    value: string;
}

export interface VcalGeoProperty {
    value: number[];
}

export interface VcalValarmComponent {
    component: 'valarm';
    uid?: VcalUidProperty;
    trigger?: {
        value: VcalTriggerValue;
    };
    action?: {
        value?: string;
    };
}

export interface VcalStringProperty {
    value: string;
}

export interface VcalStringArrayProperty {
    value: string[];
}

export interface VcalStringWithParamsProperty {
    value: string;
    params?: { [key: string]: string };
}

// todo
export type VcalAttendeeProperty = any;

export interface VcalVeventComponent {
    component: 'vevent';
    components?: VcalValarmComponent[]; // Not complete. Can be other components.
    uid: VcalUidProperty;
    dtstamp: VcalDateTimeProperty;
    dtstart: VcalDateOrDateTimeProperty;
    dtend: VcalDateOrDateTimeProperty;
    rrule?: VcalRruleProperty;
    'recurrence-id'?: VcalDateTimeProperty;
    exdate?: VcalDateOrDateTimeProperty[];
    organizer?: VcalStringWithParamsProperty;
    attendee?: VcalAttendeeProperty[];
    description?: VcalStringProperty;
    summary?: VcalStringProperty;
    location?: VcalStringProperty;
    geo?: VcalGeoProperty;
    class?: VcalStringProperty;
    priority?: VcalStringProperty;
    sequence?: VcalStringProperty;
    status?: VcalStringProperty;
    created?: VcalDateTimeProperty;
    'last-modified'?: VcalDateTimeProperty;
    transp?: VcalStringProperty;
    url?: VcalStringProperty;
    attach?: VcalStringWithParamsProperty[];
    categories?: VcalStringWithParamsProperty[];
    comment?: VcalStringWithParamsProperty[];
    contact?: VcalStringWithParamsProperty[];
    'request-status'?: VcalStringArrayProperty[];
    'related-to'?: VcalStringWithParamsProperty[];
    resources?: VcalStringWithParamsProperty[];
    rdate?: VcalDateTimeProperty[];
}

export interface VcalVtodoComponent {
    component: 'vtodo';
    components?: VcalValarmComponent[]; // Not complete. Can be other components.
    uid: VcalUidProperty;
}

export interface VcalVjournalComponent {
    component: 'vjournal';
    components?: VcalValarmComponent[]; // Not complete. Can be other components.
    uid: VcalUidProperty;
}

export interface VcalVfreebusyComponent {
    component: 'vfreebusy';
    components?: VcalValarmComponent[]; // Not complete. Can be other components.
    uid: VcalUidProperty;
}

export interface VcalVtimezoneComponent {
    component: 'vtimezone';
    tzid: VcalStringProperty[];
}

export type VcalCalendarComponent =
    | VcalVeventComponent
    | VcalVtodoComponent
    | VcalVjournalComponent
    | VcalVfreebusyComponent
    | VcalVtimezoneComponent;

export interface VcalVcalendar {
    component: string;
    components?: VcalCalendarComponent[];
    prodid: VcalStringProperty;
    version: VcalStringProperty;
    calscale?: VcalStringProperty;
    method?: VcalStringProperty;
    'x-wr-timezone'?: VcalStringProperty;
}

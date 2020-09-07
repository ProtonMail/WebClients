import { ATTENDEE_PERMISSIONS, ICAL_EVENT_STATUS } from '../../calendar/constants';

export enum VcalDays {
    SU,
    MO,
    TU,
    WE,
    TH,
    FR,
    SA,
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

export interface VcalDurationValue {
    weeks: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isNegative: boolean;
}

export interface VcalTriggerRelativeProperty {
    value: VcalDurationValue;
    parameters?: {
        type?: 'duration';
        related?: string;
    };
}

export type VcalTriggerProperty = VcalTriggerRelativeProperty | VcalDateTimeProperty;

export interface VcalUidProperty {
    value: string;
}

export interface VcalStringProperty {
    value: string;
}

export interface VcalNumberProperty {
    value: number;
}

export interface VcalStringArrayProperty {
    value: string[];
}

export interface VcalNumberArrayProperty {
    value: number[];
}

interface VcalDurationProperty {
    value: VcalDurationValue;
}

export interface VcalValarmComponent {
    component: 'valarm';
    action: VcalStringProperty;
    trigger: VcalTriggerProperty;
    duration?: VcalDurationProperty;
    repeat?: VcalStringProperty;
    description?: VcalStringProperty;
    summary?: VcalStringProperty;
    attendee?: VcalAttendeeProperty[];
    attach?: VcalStringProperty;
}

export interface VcalStringWithParamsProperty {
    value: string;
    params?: { [key: string]: string };
}

export interface VcalOrganizerPropertyParameters {
    cn?: string;
    dir?: string;
    language?: string;
    'sent-by'?: string;
}

export interface VcalOrganizerProperty {
    value: string;
    parameters?: VcalOrganizerPropertyParameters;
}

export interface VcalStatusProperty {
    value: ICAL_EVENT_STATUS;
}

export interface VcalAttendeePropertyParameters extends VcalOrganizerPropertyParameters {
    cutype?: string;
    member?: string;
    role?: string;
    partstat?: string;
    rsvp?: string;
    'delegated-from'?: string;
    'delegated-to'?: string;
    'x-pm-permissions'?: ATTENDEE_PERMISSIONS;
    'x-pm-token'?: string;
}

export interface VcalAttendeeProperty {
    value: string;
    parameters?: VcalAttendeePropertyParameters;
}

export interface VcalAttendeePropertyWithPartstat extends VcalAttendeeProperty {
    parameters: VcalAttendeePropertyParameters & Required<Pick<VcalAttendeePropertyParameters, 'partstat'>>;
}

export interface VcalAttendeePropertyWithRole extends VcalAttendeeProperty {
    parameters: VcalAttendeePropertyParameters & Required<Pick<VcalAttendeePropertyParameters, 'role'>>;
}

export interface VcalVeventComponent {
    component: 'vevent';
    components?: VcalValarmComponent[]; // Not complete. Can be other components.
    uid: VcalUidProperty;
    dtstamp: VcalDateTimeProperty;
    dtstart: VcalDateOrDateTimeProperty;
    dtend?: VcalDateOrDateTimeProperty;
    rrule?: VcalRruleProperty;
    'recurrence-id'?: VcalDateOrDateTimeProperty;
    exdate?: VcalDateOrDateTimeProperty[];
    organizer?: VcalOrganizerProperty;
    attendee?: VcalAttendeeProperty[];
    description?: VcalStringProperty;
    summary?: VcalStringProperty;
    duration?: VcalDurationValue;
    location?: VcalStringProperty;
    geo?: VcalNumberArrayProperty;
    class?: VcalStringProperty;
    priority?: VcalStringProperty;
    sequence?: VcalNumberProperty;
    status?: VcalStatusProperty;
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
    tzid: VcalStringProperty;
}

export interface VcalXOrIanaComponent {
    component: string;
}

export type VcalCalendarComponent =
    | VcalVeventComponent
    | VcalVtodoComponent
    | VcalVjournalComponent
    | VcalVfreebusyComponent
    | VcalVtimezoneComponent
    | VcalXOrIanaComponent
    | VcalVcalendar;

export interface VcalVcalendar {
    component: string;
    components?: VcalCalendarComponent[];
    prodid: VcalStringProperty;
    version: VcalStringProperty;
    calscale?: VcalStringProperty;
    method?: VcalStringProperty;
    'x-wr-timezone'?: VcalStringProperty;
}

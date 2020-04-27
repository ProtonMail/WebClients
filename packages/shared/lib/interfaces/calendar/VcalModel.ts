export type VcalByDayValues = 'SU' | 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA';

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

export type VcalDateOrDateTimeProperty = VcalDateProperty | VcalDateTimeProperty;

export type VcalRruleFreqValue = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | undefined | string;
export interface VcalRrulePropertyValue {
    freq: VcalRruleFreqValue;
    count?: number;
    interval?: number;
    until?: VcalDateOrDateTimeValue;
    bysetpos?: number;
    byday?: VcalByDayValues | VcalByDayValues[];
    bymonthday?: number | number[];
    bymonth?: number | number[];
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

// todo
export type VcalAttendeeProperty = any;

export interface VcalVeventComponent {
    component: 'vevent';
    components?: VcalValarmComponent[]; // Not complete. Can be other components.
    uid: VcalUidProperty;
    'recurrence-id'?: VcalDateTimeProperty;
    location?: VcalStringProperty;
    description?: VcalStringProperty;
    summary?: VcalStringProperty;
    dtstart: VcalDateOrDateTimeProperty;
    dtend: VcalDateOrDateTimeProperty;
    rrule?: VcalRruleProperty;
    attendee?: VcalAttendeeProperty[];
    exdate?: VcalDateOrDateTimeProperty[];
}

import { FREQUENCY } from '../constants';

export type VcalByDayValue = 'SU' | 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA';

export interface VcalDateTimeValue {
    year: number;
    month: number;
    day: number;
    hours: number;
    minutes: number;
    seconds: number;
    isUTC: boolean;
}

export interface VcalDateProperty {
    parameters: {
        type: 'date';
    };
    value: VcalDateTimeValue;
}

export interface VcalDateTimeProperty {
    parameters: {
        type?: 'date-time';
        tzid?: string;
    };
    value: VcalDateTimeValue;
}

export type VcalDateOrDateTimeProperty = VcalDateProperty | VcalDateTimeProperty;

export interface VcalFrequencyValue {
    freq: FREQUENCY;
    count?: number;
    interval?: number;
    until?: VcalDateTimeValue;
    bysetpos?: number;
    byday?: VcalByDayValue | VcalByDayValue[];
    bymonthday?: number | number[];
    bymonth?: number | number[];
}

export interface VcalFrequencyProperty {
    value: VcalFrequencyValue;
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
export type VcalRruleProperty = any;
export type VcalAttendeeProperty = any;

export interface VcalVeventComponent {
    component: 'vevent';
    uid: VcalUidProperty;
    location: VcalStringProperty;
    description: VcalStringProperty;
    summary: VcalStringProperty;
    dtstart: VcalDateOrDateTimeProperty;
    dtend: VcalDateOrDateTimeProperty;
    rrule: VcalRruleProperty;
    attendee: VcalAttendeeProperty[];
}

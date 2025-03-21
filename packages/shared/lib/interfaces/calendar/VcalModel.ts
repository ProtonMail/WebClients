import type {
    ICAL_ATTENDEE_ROLE,
    ICAL_ATTENDEE_RSVP,
    ICAL_ATTENDEE_STATUS,
    ICAL_EVENT_STATUS,
} from '../../calendar/constants';

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

export interface IcalJSDateOrDateTimeProperty {
    parameters?: {
        type?: 'date' | 'date-time';
        tzid?: string;
    };
    value: VcalDateValue | VcalDateTimeValue;
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

export interface VcalStringProperyWithParams {
    value: string;
    parameters: { [key: string]: string };
}

export interface VcalNumberProperty {
    value: number;
}

export interface VcalBooleanProperty {
    value: 'true' | 'false';
    parameters: { type: 'boolean' };
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

interface VcalURIProperty {
    value: string;
    params: { type: 'uri' };
}

interface VcalBinaryProperty {
    value: string;
    params: {
        type: 'binary';
        encoding: 'base64';
    };
}

type VcalImageProperty = VcalURIProperty | VcalBinaryProperty;

export interface VcalValarmComponent<T = VcalTriggerProperty> {
    component: 'valarm';
    action: VcalStringProperty;
    trigger: T;
    duration?: VcalDurationProperty;
    repeat?: VcalStringProperty;
    description?: VcalStringProperty;
    summary?: VcalStringProperty;
    attendee?: VcalAttendeeProperty[];
    attach?: VcalStringProperty;
}

export type VcalValarmRelativeComponent = VcalValarmComponent<VcalTriggerRelativeProperty>;

export type VcalValarmAbsoluteComponent = VcalValarmComponent<VcalDateTimeProperty>;

export interface VcalStringWithParamsProperty {
    value: string;
    params?: { [key: string]: string };
}

export interface VcalOrganizerPropertyParameters {
    cn?: string;
    dir?: string;
    language?: string;
    'sent-by'?: string;
    email?: string;
}

export interface VcalOrganizerProperty {
    value: string;
    parameters?: VcalOrganizerPropertyParameters;
}

export interface VcalStatusProperty {
    value: ICAL_EVENT_STATUS | string;
}

export interface VcalDescriptionPropertyParameters {
    language?: string;
    altrep?: string;
}

export interface VcalDescriptionProperty {
    value: string;
    parameters?: VcalDescriptionPropertyParameters;
}

export interface VcalAttendeePropertyParameters extends VcalOrganizerPropertyParameters {
    cn?: string;
    cutype?: string;
    member?: string;
    role?: ICAL_ATTENDEE_ROLE | string;
    partstat?: ICAL_ATTENDEE_STATUS | string;
    rsvp?: ICAL_ATTENDEE_RSVP | string;
    'delegated-from'?: string;
    'delegated-to'?: string;
    'x-pm-token'?: string;
    /**
     * According to ICS SPEC `comment` can't be added to `ATTENDEE` property.
     * It should be in "VEVENT" calendar components.
     *
     * Source: https://www.kanzaki.com/docs/ical/comment.html
     *
     * Adding a custom `comment` entry named `x-pm-comment` to compensate
     * Gmail uses `x-response-comment` on his side for example.
     */
    'x-pm-comment'?: string;
}

export interface VcalAttendeeProperty {
    value: string;
    parameters?: VcalAttendeePropertyParameters;
}

export interface VcalAttendeePropertyWithCn extends VcalAttendeeProperty {
    parameters: VcalAttendeePropertyParameters & Required<Pick<VcalAttendeePropertyParameters, 'cn'>>;
}

export interface VcalAttendeePropertyWithPartstat extends VcalAttendeeProperty {
    parameters: VcalAttendeePropertyParameters & Required<Pick<VcalAttendeePropertyParameters, 'partstat'>>;
}

export interface VcalAttendeePropertyWithRole extends VcalAttendeeProperty {
    parameters: VcalAttendeePropertyParameters & Required<Pick<VcalAttendeePropertyParameters, 'role'>>;
}

export interface VcalAttendeePropertyWithToken extends VcalAttendeeProperty {
    parameters: VcalAttendeePropertyParameters & Required<Pick<VcalAttendeePropertyParameters, 'x-pm-token'>>;
}

export type VcalPmAttendee = VcalAttendeePropertyWithCn & VcalAttendeePropertyWithToken;

export interface VcalCategoryProperty {
    value: string[];
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
    description?: VcalDescriptionProperty;
    summary?: VcalStringProperty;
    duration?: VcalDurationProperty;
    location?: VcalDescriptionProperty;
    geo?: VcalNumberArrayProperty;
    class?: VcalStringProperty;
    priority?: VcalNumberProperty;
    sequence?: VcalNumberProperty;
    status?: VcalStatusProperty;
    created?: VcalDateTimeProperty;
    'last-modified'?: VcalDateTimeProperty;
    transp?: VcalStringProperty;
    url?: VcalStringProperty;
    attach?: VcalStringWithParamsProperty[];
    categories?: VcalCategoryProperty[];
    comment?: VcalStringWithParamsProperty[];
    contact?: VcalStringWithParamsProperty[];
    'request-status'?: VcalStringArrayProperty[];
    'related-to'?: VcalStringWithParamsProperty[];
    resources?: VcalStringWithParamsProperty[];
    rdate?: VcalDateTimeProperty[];
    'x-pm-proton-reply'?: VcalBooleanProperty;
    'x-pm-session-key'?: VcalStringProperty;
    'x-pm-shared-event-id'?: VcalStringProperty;
    'x-yahoo-yid'?: VcalStringProperty;
    'x-yahoo-user-status'?: VcalStringProperty;
    'x-pm-conference-id'?: VcalStringProperyWithParams;
    'x-pm-conference-url'?: VcalStringProperyWithParams;
    color?: VcalStringProperty;
}

export type VcalComponentKeys = keyof VcalVeventComponent;

export interface VcalPmVeventComponent extends Omit<VcalVeventComponent, 'attendee'> {
    attendee?: VcalAttendeePropertyWithToken[];
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

export interface VcalFreeBusyStartEndValue {
    start: VcalDateTimeValue;
    end: VcalDateTimeValue;
}

export interface VcalFreeBusyStartDurationValue {
    start: VcalDateTimeValue;
    duration: VcalDurationValue;
}

type VcalFreeBusyValue = VcalFreeBusyStartEndValue | VcalFreeBusyStartDurationValue;

export interface VcalFreeBusyProperty {
    value: VcalFreeBusyValue[];
}

export interface VcalVfreebusyComponent {
    component: 'vfreebusy';
    components?: VcalValarmComponent[]; // Not complete. Can be other components.
    uid: VcalUidProperty;
    dtstamp: VcalDateTimeProperty;
    dtstart?: VcalDateOrDateTimeProperty;
    dtend?: VcalDateOrDateTimeProperty;
    organizer?: VcalOrganizerProperty;
    attendee?: VcalAttendeeProperty[];
    freebusy?: VcalFreeBusyProperty[];
    url?: VcalStringProperty;
    comment?: VcalStringProperty[];
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

export interface VcalErrorComponent {
    error: Error;
    icalComponent: any;
}

export interface VcalVcalendar {
    component: string;
    components?: (
        | VcalVeventComponent
        | VcalVtodoComponent
        | VcalVjournalComponent
        | VcalVfreebusyComponent
        | VcalVtimezoneComponent
        | VcalXOrIanaComponent
    )[];
    prodid: VcalStringProperty;
    version: VcalStringProperty;
    calscale?: VcalStringProperty;
    method?: VcalStringProperty;
    'x-wr-timezone'?: VcalStringProperty;
    'x-wr-calname'?: VcalStringProperty;
    // RFC 7986
    name?: VcalStringProperty;
    description?: VcalStringProperty;
    uid?: VcalStringProperty;
    url?: VcalStringProperty;
    'last-modified'?: VcalDateTimeProperty;
    categories?: VcalStringWithParamsProperty[];
    'refresh-interval'?: VcalDurationProperty;
    source?: VcalURIProperty;
    color?: VcalStringProperty;
    image?: VcalImageProperty;
    conference?: VcalURIProperty;
}

export interface VcalVeventComponentWithMaybeErrors extends Omit<VcalVeventComponent, 'components'> {
    components?: (VcalErrorComponent | VcalValarmComponent)[];
}

export interface VcalVtodoComponentWithMaybeErrors extends Omit<VcalVtodoComponent, 'components'> {
    components?: (VcalErrorComponent | VcalValarmComponent)[];
}

export interface VcalVjournalComponentWithMaybeErrors extends Omit<VcalVjournalComponent, 'components'> {
    components?: (VcalErrorComponent | VcalValarmComponent)[];
}

export interface VcalVfreebusyComponentWithMaybeErrors extends Omit<VcalVfreebusyComponent, 'components'> {
    components?: (VcalErrorComponent | VcalValarmComponent)[];
}

export type VcalCalendarComponentWithMaybeErrors =
    | VcalVeventComponentWithMaybeErrors
    | VcalVtodoComponentWithMaybeErrors
    | VcalVjournalComponentWithMaybeErrors
    | VcalVfreebusyComponentWithMaybeErrors
    | VcalVtimezoneComponent
    | VcalXOrIanaComponent;

export interface VcalVcalendarWithMaybeErrors extends Omit<VcalVcalendar, 'components'> {
    components?: (VcalCalendarComponentWithMaybeErrors | VcalErrorComponent)[];
}

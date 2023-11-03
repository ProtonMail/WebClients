import { CalendarNotificationSettings } from '@proton/shared/lib/interfaces/calendar/Calendar';

import {
    ATTENDEE_STATUS_API,
    CALENDAR_CARD_TYPE,
    DAILY_TYPE,
    END_TYPE,
    EVENT_VERIFICATION_STATUS,
    FREQUENCY,
    ICAL_ATTENDEE_ROLE,
    ICAL_ATTENDEE_RSVP,
    ICAL_ATTENDEE_STATUS,
    ICAL_EVENT_STATUS,
    MONTHLY_TYPE,
    SHARED_SIGNED_FIELDS,
    WEEKLY_TYPE,
    YEARLY_TYPE,
} from '../../calendar/constants';
import { API_CODES } from '../../constants';
import { pick } from '../../helpers/object';
import { Address } from '../Address';
import { Nullable } from '../utils';
import { NotificationModel } from './Notification';
import { VcalRrulePropertyValue, VcalVeventComponent } from './VcalModel';

export interface CalendarEventData {
    Type: CALENDAR_CARD_TYPE;
    Data: string;
    Signature: string | null;
    Author: string;
}

export interface CalendarPersonalEventData extends CalendarEventData {
    MemberID: string;
}

export interface Attendee {
    ID: string;
    Token: string;
    Status: ATTENDEE_STATUS_API;
    UpdateTime: Nullable<number>;
}

export interface CalendarEventBlobData {
    CalendarKeyPacket: Nullable<string>;
    CalendarEvents: CalendarEventData[];
    SharedKeyPacket: Nullable<string>;
    AddressKeyPacket: Nullable<string>;
    AddressID: Nullable<string>;
    SharedEvents: CalendarEventData[];
    Notifications?: Nullable<CalendarNotificationSettings[]>;
    AttendeesEvents: CalendarEventData[];
    Attendees: Attendee[];
}

export type CalendarEventBlobDataWithNotifications = Required<CalendarEventBlobData>;

export interface CalendarEventSharedData {
    ID: string;
    SharedEventID: string;
    CalendarID: string;
    CreateTime: number;
    ModifyTime: number;
    Permissions: number;
    IsOrganizer: 1 | 0;
    IsProtonProtonInvite: 1 | 0;
    Author: string;
}

export interface CalendarEventMetadata {
    StartTime: number;
    StartTimezone: string;
    EndTime: number;
    EndTimezone: string;
    FullDay: number;
    RRule: Nullable<string>;
    UID: string;
    RecurrenceID: Nullable<number>;
    Exdates: number[];
}

export interface CalendarEvent extends CalendarEventSharedData, CalendarEventBlobData, CalendarEventMetadata {}

export interface CalendarEventWithoutBlob extends CalendarEventSharedData, CalendarEventMetadata {}

export interface SyncMultipleApiSuccessResponses {
    Index: number;
    Response: {
        Code: API_CODES.SINGLE_SUCCESS;
        Event: CalendarEvent;
    };
}

export interface FrequencyModel {
    type: FREQUENCY;
    frequency: FREQUENCY;
    interval?: number;
    daily: {
        type: DAILY_TYPE;
    };
    weekly: {
        type: WEEKLY_TYPE;
        days: number[];
    };
    monthly: {
        type: MONTHLY_TYPE;
    };
    yearly: {
        type: YEARLY_TYPE;
    };
    ends: {
        type: END_TYPE;
        count?: number;
        until?: Date;
    };
    vcalRruleValue?: VcalRrulePropertyValue;
}

export interface DateTimeModel {
    date: Date;
    time: Date;
    tzid: string;
}

export interface OrganizerModel {
    email: string;
    cn: string;
}

export interface AttendeeModel {
    email: string;
    cn: string;
    rsvp: ICAL_ATTENDEE_RSVP;
    role: ICAL_ATTENDEE_ROLE;
    partstat: ICAL_ATTENDEE_STATUS;
    token?: string;
}

export interface CalendarViewModel {
    id: string;
    color: string;
    permissions: number;
    isSubscribed: boolean;
    isOwned: boolean;
    isWritable: boolean;
    isUnknown: boolean;
}

export interface CalendarsModel {
    text: string;
    value: string;
    color: string;
    permissions: number;
    isSubscribed: boolean;
    isOwned: boolean;
    isWritable: boolean;
    isUnknown: boolean;
}

export interface EventModelView {
    uid?: string;
    frequencyModel: FrequencyModel;
    title: string;
    location: string;
    description: string;
    sequence?: number;
    start: DateTimeModel;
    end: DateTimeModel;
    attendees: AttendeeModel[];
    organizer?: OrganizerModel;
    isOrganizer: boolean; // this property only takes into account the event ICS content. It does not care if the event is in a shared or subscribed calendar
    isAttendee: boolean; // this property only takes into account the event ICS content. It does not care if the event is in a shared or subscribed calendar
    isProtonProtonInvite: boolean;
    hasDefaultNotifications: boolean;
    selfAttendeeIndex?: number;
    selfAddress?: Address;
    status: ICAL_EVENT_STATUS;
    verificationStatus: EVENT_VERIFICATION_STATUS;
    rest?: any;
}

export interface EventModel extends EventModelView {
    // these types will be used in the future, for now only event is used
    type: 'event' | 'alarm' | 'task';
    calendar: CalendarViewModel;
    calendars: CalendarsModel[];
    member: {
        memberID: string;
        addressID: string;
    };
    isAllDay: boolean;
    defaultPartDayNotification: NotificationModel;
    defaultFullDayNotification: NotificationModel;
    fullDayNotifications: NotificationModel[];
    partDayNotifications: NotificationModel[];
    initialDate: Date;
    initialTzid: string;
    defaultEventDuration: number;
    hasTouchedRrule: boolean;
    hasPartDayDefaultNotifications: boolean;
    hasFullDayDefaultNotifications: boolean;
}

export interface EventModelErrors {
    title?: string;
    end?: string;
    interval?: string;
    until?: string;
    count?: string;
    notifications?: {
        fields: number[];
        text: string;
    };
    participantError?: boolean;
}

export interface EventModelReadView extends EventModelView {
    notifications?: NotificationModel[];
    isAllDay: boolean;
}

const sharedPick = (x: VcalVeventComponent) => pick(x, [...SHARED_SIGNED_FIELDS, 'component']);
export type SharedVcalVeventComponent = ReturnType<typeof sharedPick>;

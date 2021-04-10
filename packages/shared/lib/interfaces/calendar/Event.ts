import {
    ATTENDEE_STATUS_API,
    CALENDAR_CARD_TYPE,
    ICAL_ATTENDEE_ROLE,
    DAILY_TYPE,
    END_TYPE,
    FREQUENCY,
    MONTHLY_TYPE,
    WEEKLY_TYPE,
    YEARLY_TYPE,
    ICAL_ATTENDEE_STATUS,
    ICAL_ATTENDEE_RSVP,
    ICAL_EVENT_STATUS,
    SHARED_SIGNED_FIELDS,
    EVENT_VERIFICATION_STATUS,
} from '../../calendar/constants';
import { Address } from '../Address';
import { VcalRrulePropertyValue, VcalVeventComponent } from './VcalModel';
import { NotificationModel } from './Notification';
import { pick } from '../../helpers/object';
import type { CalendarEventBlobData as ApiCalendarEventBlobData } from '../../api/calendars';
import { RequireSome } from '../utils';

export interface CalendarEventData {
    Type: CALENDAR_CARD_TYPE;
    Data: string;
    Signature: string | null;
    Author: string;
}

export type CalendarEventDataMap = { [key in CALENDAR_CARD_TYPE]?: CalendarEventData };

export interface CalendarPersonalEventData extends CalendarEventData {
    MemberID: string;
}

export interface Attendee {
    ID: string;
    Token: string;
    Status: ATTENDEE_STATUS_API;
    UpdateTime: number;
}

export interface CalendarEventBlobData {
    CalendarKeyPacket: string;
    CalendarEvents: CalendarEventData[];
    SharedKeyPacket: string;
    SharedEvents: CalendarEventData[];
    PersonalEvent: CalendarPersonalEventData[];
    AttendeesEvents: CalendarEventData[];
    Attendees: Attendee[];
}

export interface CalendarEventSharedData {
    ID: string;
    SharedEventID: string;
    CalendarID: string;
    CreateTime: number;
    ModifyTime: number;
    Permissions: number;
    IsOrganizer: 1 | 0;
    Author: string;
}

export interface CalendarEventMetadata {
    StartTime: number;
    StartTimezone: string;
    EndTime: number;
    EndTimezone: string;
    FullDay: number;
    RRule: string;
    UID: string;
    RecurrenceID: number;
    Exdates: number[];
}

export interface CalendarEvent extends CalendarEventSharedData, CalendarEventBlobData {}

export interface CalendarEventWithMetadata extends CalendarEvent, CalendarEventMetadata {}

export interface CalendarEventWithoutBlob extends CalendarEventSharedData, CalendarEventMetadata {}

export interface SyncMultipleApiResponses {
    Index: number;
    Response: {
        Code: number;
        Event?: CalendarEvent;
        Error?: string;
    };
}

export interface SyncMultipleApiResponse {
    Code: number;
    Responses: SyncMultipleApiResponses[];
}

export interface UpdatePersonalPartApiResponse {
    Code: number;
    Event: CalendarEvent;
}

export interface UpdatePartstatApiResponse {
    Code: number;
    Attendee: Attendee;
}

export interface GetCanonicalAddressesApiResponses {
    Email: string;
    Response: {
        Code: number;
        CanonicalEmail: string;
    };
}

export interface GetCanonicalAddressesApiResponse {
    Code: number;
    Responses: GetCanonicalAddressesApiResponses[];
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
    rruleValue?: VcalRrulePropertyValue;
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
}

export interface CalendarsModel {
    text: string;
    value: string;
    color: string;
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
    isOrganizer: boolean;
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
    isOrganizer: boolean;
    defaultPartDayNotification: NotificationModel;
    defaultFullDayNotification: NotificationModel;
    fullDayNotifications: NotificationModel[];
    partDayNotifications: NotificationModel[];
    initialDate: Date;
    initialTzid: string;
    defaultEventDuration: number;
    hasTouchedRrule: boolean;
    hasTouchedNotifications: {
        partDay: boolean;
        fullDay: boolean;
    };
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
    notifications: NotificationModel[];
    isAllDay: boolean;
}

const sharedPick = (x: VcalVeventComponent) => pick(x, [...SHARED_SIGNED_FIELDS, 'component']);
export type SharedVcalVeventComponent = ReturnType<typeof sharedPick>;

export interface EncryptedEvent {
    component: VcalVeventComponent;
    data: RequireSome<ApiCalendarEventBlobData, 'SharedEventContent' | 'SharedKeyPacket'>;
}

export interface StoredEncryptedEvent extends EncryptedEvent {
    response: SyncMultipleApiResponses;
}

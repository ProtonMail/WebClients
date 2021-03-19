import { ATTENDEE_STATUS_API, CALENDAR_CARD_TYPE } from '../../calendar/constants';

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

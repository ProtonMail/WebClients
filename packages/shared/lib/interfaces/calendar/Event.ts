import { ATTENDEE_STATUS_API } from '../../calendar/constants';

export type CalendarEventDataType = 1 | 2 | 3;

export interface CalendarEventData {
    Type: CalendarEventDataType;
    Data: string;
    Signature: string;
    Author: string;
}

export type CalendarEventDataMap = { [key in CalendarEventDataType]?: CalendarEventData };

export interface CalendarPersonalEventData extends CalendarEventData {
    MemberID: string;
}

export interface Attendee {
    Token: string;
    Permissions: number;
    Status: ATTENDEE_STATUS_API;
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

export interface GetCanonicalAddressesResponses {
    Email: string;
    Response: {
        Code: number;
        CanonicalEmail: string;
    };
}

export interface GetCanonicalAddressesResponse {
    Code: number;
    Responses: GetCanonicalAddressesResponses[];
}

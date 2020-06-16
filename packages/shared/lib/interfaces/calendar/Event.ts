export type CalendarEventDataType = 1 | 2 | 3;

export interface CalendarEventData {
    Type: CalendarEventDataType;
    Data: string;
    Signature: string;
}

export type CalendarEventDataMap = { [key in CalendarEventDataType]?: CalendarEventData };

export interface CalendarPersonalEventData extends CalendarEventData {
    MemberID: string;
    Author: string;
    Data: string;
    Signature: string;
    Type: CalendarEventDataType;
}

export interface Attendee {
    Token: string;
    Permissions: number;
}

export interface CalendarEventBlobData {
    CalendarKeyPacket: string;
    CalendarEvents: CalendarEventData[];
    SharedKeyPacket: string;
    SharedEvents: CalendarEventData[];
    PersonalEvent: CalendarPersonalEventData[];
    AttendeesEvent: CalendarEventData;
    Attendees: Attendee[];
}

export interface CalendarEventSharedData {
    ID: string;
    SharedEventID: string;
    CalendarID: string;
    CreateTime: number;
    LastEditTime: number;
    Author: string;
    Permissions: number;
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

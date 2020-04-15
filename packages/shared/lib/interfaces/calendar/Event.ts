export type CalendarEventDataType = 1 | 2 | 3;

export interface CalendarEventData {
    Type: CalendarEventDataType;
    Data: string;
    Signature: string;
}

export interface CalendarPersonalEventData extends CalendarEventData {
    MemberID: string;
}

export interface Attendee {
    Token: string;
    Permissions: number;
}

export interface CalendarEvent {
    ID: string;
    CalendarID: string;
    CreateTime: number;
    LastEditTime: number;
    Author: string;
    Permissions: number;
    CalendarKeyPacket: string;
    CalendarEvents: CalendarEventData[];
    SharedKeyPacket: string;
    SharedEvents: CalendarEventData[];
    PersonalEvents: CalendarPersonalEventData;
    AttendeesEvent: CalendarEventData;
    Attendees: Attendee[];
}

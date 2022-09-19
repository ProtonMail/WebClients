import { CALENDAR_DISPLAY } from './Calendar';

export enum MEMBER_INVITATION_STATUS {
    PENDING = 0,
    ACCEPTED = 1,
    REJECTED = 2,
}

export interface CalendarOwner {
    Email: string;
}

export interface CalendarMember {
    ID: string;
    CalendarID: string;
    AddressID: string;
    Flags: number;
    Name: string;
    Description: string;
    Email: string;
    Permissions: number;
    Color: string;
    Display: CALENDAR_DISPLAY;
}

export interface CalendarMemberInvitation {
    Calendar: {
        Color: string;
        Name: string;
        SenderEmail: string;
    };
    CalendarID: string;
    CalendarInvitationID: string;
    CreateTime: number;
    Email: string;
    ExpirationTime: number;
    Passphrase: string;
    PassphraseID: string;
    Permissions: number;
    Status: MEMBER_INVITATION_STATUS;
    Signature: string;
}

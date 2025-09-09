export enum CustomPasswordState {
    NO_PASSWORD = 0,
    PASSWORD_SET = 1,
}

export enum ProtonCalendarState {
    NOT_FROM_PROTON_CALENDAR = 0,
    FROM_PROTON_CALENDAR = 1,
}

export interface MeetingInfoResponse {
    MeetingInfo: {
        Salt: string;
        SessionKey: string;
        MeetingName: string;
        CustomPassword: CustomPasswordState;
    };
    Code: 1000;
}

export interface AccessTokenResponse {
    AccessToken: string;
    WebsocketUrl: string;
    Code: 1000;
}

export enum MeetingState {
    DELETED = 0,
    ACTIVE = 1,
}

export enum MeetingType {
    INSTANT = 0,
    PERSONAL = 1,
    SCHEDULED = 2,
    RECURRING = 3,
}

export enum RecurringType {
    RECURRING = 'recurring',
    SCHEDULED = 'scheduled',
}

export interface MeetingPayload {
    AddressID: string | null;
    Name?: string;
    Password: string | null;
    Salt: string;
    SessionKey: string;
    SRPModulusID: string;
    SRPSalt: string;
    SRPVerifier: string;
    StartTime: string | null;
    EndTime: string | null;
    RRule: RecurringType | null;
    Timezone: string | null;
    State?: MeetingState;
    Type: MeetingType;
    CustomPassword: CustomPasswordState;
    ProtonCalendar?: ProtonCalendarState;
}

export interface Meeting extends Omit<MeetingPayload, 'Name'> {
    ID: string;
    MeetingName: string;
    MeetingLinkName: string;
    CalendarEventID?: string;
    CalendarID?: string;
}

export interface UserSettings {
    MeetingID: string;
    AddressID: string;
}

export interface CreateMeetingResponse {
    Meeting: Meeting;
    Code: 1000;
}

export interface MeetingInfo {
    Salt: string;
    SessionKey: string;
    MeetingName: string;
    MeetingLinkName: string;
}

export type UpdateMeetingPasswordData = {
    Password: string;
    SessionKey: string;
    SRPSalt: string;
    SRPVerifier: string;
    SRPModulusID: string;
    CustomPassword: CustomPasswordState;
};

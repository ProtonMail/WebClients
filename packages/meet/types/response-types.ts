export enum CustomPasswordState {
    NO_PASSWORD = 0,
    PASSWORD_SET = 1,
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

export interface Meeting {
    ID: string;
    AddressID: string;
    MeetingLinkName: string;
    MeetingName: string;
    Password: string;
    Salt: string;
    SessionKey: string;
    SRPModulusID: string;
    SRPSalt: string;
    SRPVerifier: string;
    StartTime: string;
    EndTime: string;
    RRule: RecurringType;
    TimeZone: string;
    State: MeetingState;
    Type: MeetingType;
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

export interface CreateMeetingParams {
    meetingName: string;
    startTime?: string | null;
    endTime?: string | null;
    recurrence?: string | null;
    timeZone?: string | null;
    customPassword?: string;
    type?: MeetingType;
}
